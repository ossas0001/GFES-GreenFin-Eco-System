import { AuthError, requireAuth } from "../../../../db/auth";
import { ensurePlatformSchema, getPlatformDb } from "../../../../db/platform";
import { greenFinAuditStatement } from "../../../../worker/greenfin/audit";
import { isGreenFinDataDomain, isGreenFinSourceLevel, type GreenFinDataDomain } from "../../../../worker/greenfin/domain";
import { inspectGreenFinFile, safeGreenFinFilename, validateGreenFinFile } from "../../../../worker/greenfin/services/documents/file";
import { normalizeGreenFinValue, recordTypeForDomain } from "../../../../worker/greenfin/services/documents/normalization";
import { getOcrProvider } from "../../../../worker/greenfin/services/ocr/provider";

async function uploadsBucket() {
  const { env } = await import("cloudflare:workers");
  const bucket = (env as unknown as { UPLOADS?: R2Bucket }).UPLOADS;
  if (!bucket) throw new Error("GreenFin 文件儲存服務尚未啟用");
  return bucket;
}

function errorResponse(error: unknown, fallback: string) {
  return Response.json({ error: error instanceof Error ? error.message : fallback }, { status: error instanceof AuthError ? error.status : 400 });
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth(request, ["farmer"], true);
    const form = await request.formData();
    const fileValue = form.get("file");
    const fileError = validateGreenFinFile(fileValue);
    if (fileError) return Response.json({ error: fileError }, { status: 400 });
    const file = fileValue as File;
    const domainValue = String(form.get("domain") ?? "");
    const sourceLevelValue = String(form.get("sourceLevel") ?? "V1");
    const uploadNote = String(form.get("uploadNote") ?? "").trim().slice(0, 1000);
    if (!isGreenFinDataDomain(domainValue)) return Response.json({ error: "無效的 GreenFin 資料領域" }, { status: 400 });
    const sourceLevel = isGreenFinSourceLevel(sourceLevelValue) ? sourceLevelValue : "V1";
    const { bytes, sha256 } = await inspectGreenFinFile(file);
    const db = await getPlatformDb();
    await ensurePlatformSchema(db);
    const duplicate = await db.prepare("SELECT id, status FROM greenfin_documents WHERE farmer_id = ? AND file_sha256 = ?")
      .bind(session.profileId, sha256).first<{ id: string; status: string }>();
    if (duplicate) return Response.json({ ok: true, duplicate: true, documentId: duplicate.id, status: duplicate.status });

    const documentId = `GFD-${crypto.randomUUID()}`;
    const storageKey = `greenfin/${session.profileId}/${documentId}/${safeGreenFinFilename(file.name)}`;
    const bucket = await uploadsBucket();
    await bucket.put(storageKey, bytes, {
      httpMetadata: { contentType: file.type },
      customMetadata: { farmerId: session.profileId, documentId, domain: domainValue, sha256 },
    });
    try {
      const ocr = await getOcrProvider().extract({ bytes, filename: file.name, mimeType: file.type, domain: domainValue });
      const statements = [
        db.prepare(`INSERT INTO greenfin_documents
          (id, farmer_id, original_name, file_sha256, storage_key, mime_type, file_size, domain, source_level, status, upload_note)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'OCR_COMPLETED', ?)`)
          .bind(documentId, session.profileId, file.name, sha256, storageKey, file.type, file.size, domainValue, sourceLevel, uploadNote),
        ...ocr.fields.map((field) => db.prepare(`INSERT INTO greenfin_document_fields
          (id, document_id, field_name, raw_value, confidence, source) VALUES (?, ?, ?, ?, ?, 'ocr')`)
          .bind(`GFF-${crypto.randomUUID()}`, documentId, field.fieldName, field.rawValue, field.confidence)),
        greenFinAuditStatement(db, "DOCUMENT_UPLOADED", session.profileId, "greenfin_document", documentId, { filename: file.name, domain: domainValue, sourceLevel }, request.headers.get("cf-connecting-ip")),
        greenFinAuditStatement(db, "OCR_COMPLETED", session.profileId, "greenfin_document", documentId, { provider: ocr.provider, fieldCount: ocr.fields.length, mode: "SIMULATED" }, request.headers.get("cf-connecting-ip")),
      ];
      await db.batch(statements);
      return Response.json({ ok: true, documentId, status: "OCR_COMPLETED", ocrMode: "SIMULATED", fields: ocr.fields });
    } catch (error) {
      await bucket.delete(storageKey);
      throw error;
    }
  } catch (error) {
    return errorResponse(error, "GreenFin 文件上傳失敗");
  }
}

export async function GET(request: Request) {
  try {
    const session = await requireAuth(request, ["farmer", "admin"]);
    const db = await getPlatformDb();
    await ensurePlatformSchema(db);
    const documentId = new URL(request.url).searchParams.get("documentId");
    if (!documentId) {
      const rows = session.role === "admin"
        ? await db.prepare("SELECT * FROM greenfin_documents ORDER BY created_at DESC").all()
        : await db.prepare("SELECT * FROM greenfin_documents WHERE farmer_id = ? ORDER BY created_at DESC").bind(session.profileId).all();
      return Response.json({ documents: rows.results ?? [] });
    }
    const document = session.role === "admin"
      ? await db.prepare("SELECT * FROM greenfin_documents WHERE id = ?").bind(documentId).first<Record<string, unknown>>()
      : await db.prepare("SELECT * FROM greenfin_documents WHERE id = ? AND farmer_id = ?").bind(documentId, session.profileId).first<Record<string, unknown>>();
    if (!document) return Response.json({ error: "找不到 GreenFin 文件" }, { status: 404 });
    const fields = await db.prepare("SELECT * FROM greenfin_document_fields WHERE document_id = ? ORDER BY created_at, id").bind(documentId).all();
    const record = await db.prepare("SELECT * FROM greenfin_standardized_records WHERE document_id = ? ORDER BY created_at DESC LIMIT 1").bind(documentId).first();
    return Response.json({ document, fields: fields.results ?? [], record });
  } catch (error) {
    return errorResponse(error, "讀取 GreenFin 文件失敗");
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requireAuth(request, ["farmer"], true);
    const body = await request.json() as { documentId?: string; corrections?: Record<string, string> };
    const documentId = String(body.documentId ?? "");
    const corrections = body.corrections ?? {};
    const db = await getPlatformDb();
    const document = await db.prepare("SELECT id, status FROM greenfin_documents WHERE id = ? AND farmer_id = ?")
      .bind(documentId, session.profileId).first<{ id: string; status: string }>();
    if (!document) return Response.json({ error: "找不到 GreenFin 文件" }, { status: 404 });
    if (!new Set(["OCR_COMPLETED", "FIELDS_CONFIRMED"]).has(document.status)) return Response.json({ error: "目前文件狀態不可修改 OCR 欄位" }, { status: 409 });

    const fieldIds = Object.keys(corrections);
    const statements = fieldIds.map((fieldId) => db.prepare(`UPDATE greenfin_document_fields
      SET raw_value = ?, manually_corrected = 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND document_id = ?`).bind(String(corrections[fieldId]).slice(0, 2000), fieldId, documentId));
    statements.push(db.prepare("UPDATE greenfin_documents SET status = 'FIELDS_CONFIRMED', updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(documentId));
    if (fieldIds.length) statements.push(greenFinAuditStatement(db, "FIELD_CORRECTED", session.profileId, "greenfin_document", documentId, { fieldIds }));
    await db.batch(statements);
    return Response.json({ ok: true, documentId, status: "FIELDS_CONFIRMED", correctedFieldIds: fieldIds });
  } catch (error) {
    return errorResponse(error, "GreenFin 欄位確認失敗");
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireAuth(request, ["farmer"], true);
    const body = await request.json() as { documentId?: string };
    const documentId = String(body.documentId ?? "");
    const db = await getPlatformDb();
    const document = await db.prepare("SELECT id, farmer_id, domain, source_level, status FROM greenfin_documents WHERE id = ? AND farmer_id = ?")
      .bind(documentId, session.profileId).first<{ id: string; farmer_id: string; domain: string; source_level: string; status: string }>();
    if (!document) return Response.json({ error: "找不到 GreenFin 文件" }, { status: 404 });
    if (document.status !== "FIELDS_CONFIRMED") return Response.json({ error: "請先完成 OCR 欄位確認" }, { status: 409 });
    if (!isGreenFinDataDomain(document.domain)) return Response.json({ error: "文件資料領域無效" }, { status: 500 });
    const fields = await db.prepare("SELECT id, field_name, raw_value FROM greenfin_document_fields WHERE document_id = ?").bind(documentId).all<{ id: string; field_name: string; raw_value: string | null }>();
    const normalized = Object.fromEntries((fields.results ?? []).map((field) => [field.field_name, normalizeGreenFinValue(field.raw_value ?? "")]));
    const recordId = `GFR-${documentId}`;
    const statements = (fields.results ?? []).map((field) => db.prepare("UPDATE greenfin_document_fields SET normalized_value = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .bind(normalized[field.field_name], field.id));
    statements.push(db.prepare(`INSERT INTO greenfin_standardized_records
      (id, document_id, farmer_id, domain, record_type, data_json, source_level, is_valid)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
      ON CONFLICT(id) DO UPDATE SET data_json = excluded.data_json, source_level = excluded.source_level, is_valid = 1, updated_at = CURRENT_TIMESTAMP`)
      .bind(recordId, documentId, document.farmer_id, document.domain, recordTypeForDomain(document.domain as GreenFinDataDomain), JSON.stringify(normalized), document.source_level));
    statements.push(db.prepare("UPDATE greenfin_documents SET status = 'NORMALIZED', updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(documentId));
    await db.batch(statements);
    return Response.json({ ok: true, documentId, status: "NORMALIZED", record: { id: recordId, data: normalized } });
  } catch (error) {
    return errorResponse(error, "GreenFin 文件標準化失敗");
  }
}
