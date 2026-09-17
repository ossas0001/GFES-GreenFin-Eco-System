import { AuthError, requireAuth } from "../../../../db/auth";
import { ensurePlatformSchema, getPlatformDb } from "../../../../db/platform";
import { greenFinAuditStatement } from "../../../../worker/greenfin/audit";

function errorResponse(error: unknown, fallback: string) {
  return Response.json({ error: error instanceof Error ? error.message : fallback }, { status: error instanceof AuthError ? error.status : 400 });
}

async function uploadsBucket() {
  const { env } = await import("cloudflare:workers");
  const bucket = (env as unknown as { UPLOADS?: R2Bucket }).UPLOADS;
  if (!bucket) throw new Error("GreenFin 文件儲存服務尚未啟用");
  return bucket;
}

async function sha256(bytes: Uint8Array) {
  const digest = await crypto.subtle.digest("SHA-256", Uint8Array.from(bytes));
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join("");
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth(request, ["farmer"], true);
    const db = await getPlatformDb();
    await ensurePlatformSchema(db);
    const bucket = await uploadsBucket();
    const verifiedDocumentId = `GFD-DEMO-VERIFIED-${session.profileId}`;
    const pendingDocumentId = `GFD-DEMO-PENDING-${session.profileId}`;
    const verifiedRecordId = `GFR-${verifiedDocumentId}`;
    const existing = await db.prepare("SELECT id FROM greenfin_documents WHERE id IN (?, ?)")
      .bind(verifiedDocumentId, pendingDocumentId).all<{ id: string }>();
    const existingIds = new Set((existing.results ?? []).map((row) => row.id));

    const verifiedBytes = new TextEncoder().encode("%PDF-1.7\nDEMO SIMULATED GreenFin certification evidence\n%%EOF");
    const pendingBytes = new TextEncoder().encode("%PDF-1.7\nDEMO SIMULATED GreenFin pending irrigation record\n%%EOF");
    const verifiedStorageKey = `greenfin/${session.profileId}/${verifiedDocumentId}/DEMO_SIMULATED_verified_certification.pdf`;
    const pendingStorageKey = `greenfin/${session.profileId}/${pendingDocumentId}/DEMO_SIMULATED_pending_irrigation.pdf`;
    const [verifiedHash, pendingHash] = await Promise.all([sha256(verifiedBytes), sha256(pendingBytes)]);
    await Promise.all([
      bucket.put(verifiedStorageKey, verifiedBytes, { httpMetadata: { contentType: "application/pdf" }, customMetadata: { farmerId: session.profileId, documentId: verifiedDocumentId, demo: "SIMULATED" } }),
      bucket.put(pendingStorageKey, pendingBytes, { httpMetadata: { contentType: "application/pdf" }, customMetadata: { farmerId: session.profileId, documentId: pendingDocumentId, demo: "SIMULATED" } }),
    ]);

    const statements = [
      db.prepare(`INSERT OR IGNORE INTO greenfin_documents
        (id, farmer_id, original_name, file_sha256, storage_key, mime_type, file_size, domain, source_level, status, upload_note)
        VALUES (?, ?, 'DEMO_SIMULATED_已核驗有機認證.pdf', ?, ?, 'application/pdf', ?, 'CERTIFICATION', 'V2', 'VERIFIED', 'DEMO／SIMULATED 假資料：示範已完成來源核驗的第三方認證文件。')`)
        .bind(verifiedDocumentId, session.profileId, verifiedHash, verifiedStorageKey, verifiedBytes.byteLength),
      db.prepare(`INSERT OR IGNORE INTO greenfin_documents
        (id, farmer_id, original_name, file_sha256, storage_key, mime_type, file_size, domain, source_level, status, upload_note)
        VALUES (?, ?, 'DEMO_SIMULATED_待補件節水紀錄.pdf', ?, ?, 'application/pdf', ?, 'GREEN_ACTION', 'V1', 'OCR_COMPLETED', 'DEMO／SIMULATED 假資料：執行日期尚未辨識，請在補件畫面確認。')`)
        .bind(pendingDocumentId, session.profileId, pendingHash, pendingStorageKey, pendingBytes.byteLength),
      db.prepare(`INSERT OR IGNORE INTO greenfin_document_fields
        (id, document_id, field_name, raw_value, normalized_value, confidence, source)
        VALUES (?, ?, '認證機構', 'DEMO 第三方驗證單位（SIMULATED）', 'DEMO 第三方驗證單位（SIMULATED）', 0.96, 'demo')`)
        .bind(`GFF-DEMO-CERT-ORG-${session.profileId}`, verifiedDocumentId),
      db.prepare(`INSERT OR IGNORE INTO greenfin_document_fields
        (id, document_id, field_name, raw_value, normalized_value, confidence, source)
        VALUES (?, ?, '認證類型', '友善耕作驗證（SIMULATED）', '友善耕作驗證（SIMULATED）', 0.94, 'demo')`)
        .bind(`GFF-DEMO-CERT-TYPE-${session.profileId}`, verifiedDocumentId),
      db.prepare(`INSERT OR IGNORE INTO greenfin_document_fields
        (id, document_id, field_name, raw_value, normalized_value, confidence, source)
        VALUES (?, ?, '有效期限', '2027/12/31', '2027-12-31', 0.92, 'demo')`)
        .bind(`GFF-DEMO-CERT-EXPIRY-${session.profileId}`, verifiedDocumentId),
      db.prepare(`INSERT OR IGNORE INTO greenfin_document_fields
        (id, document_id, field_name, raw_value, confidence, source)
        VALUES (?, ?, '活動名稱', '節水灌溉操作紀錄（DEMO SIMULATED）', 0.93, 'demo')`)
        .bind(`GFF-DEMO-ACTION-NAME-${session.profileId}`, pendingDocumentId),
      db.prepare(`INSERT OR IGNORE INTO greenfin_document_fields
        (id, document_id, field_name, raw_value, confidence, source)
        VALUES (?, ?, '執行日期', '', 0.28, 'demo')`)
        .bind(`GFF-DEMO-ACTION-DATE-${session.profileId}`, pendingDocumentId),
      db.prepare(`INSERT OR IGNORE INTO greenfin_document_fields
        (id, document_id, field_name, raw_value, confidence, source)
        VALUES (?, ?, '施用面積', '0.8 公頃', 0.78, 'demo')`)
        .bind(`GFF-DEMO-ACTION-AREA-${session.profileId}`, pendingDocumentId),
      db.prepare(`INSERT OR IGNORE INTO greenfin_standardized_records
        (id, document_id, farmer_id, domain, record_type, data_json, source_level, is_valid)
        VALUES (?, ?, ?, 'CERTIFICATION', 'certification_record', ?, 'V2', 1)`)
        .bind(verifiedRecordId, verifiedDocumentId, session.profileId, JSON.stringify({ 認證機構: "DEMO 第三方驗證單位（SIMULATED）", 認證類型: "友善耕作驗證（SIMULATED）", 有效期限: "2027-12-31" })),
      db.prepare(`INSERT OR IGNORE INTO greenfin_verification_results
        (id, record_id, source_level, reason, verified_by, evidence_ids_json)
        VALUES (?, ?, 'V2', '可查核第三方文件（DEMO SIMULATED）', 'demo-seed', ?)`)
        .bind(`GFV-DEMO-${session.profileId}`, verifiedRecordId, JSON.stringify([verifiedDocumentId])),
      db.prepare(`INSERT OR IGNORE INTO greenfin_actions
        (id, farmer_id, dimension, action_level, description, action_date, evidence_record_ids_json, is_active)
        VALUES (?, ?, '綠色治理', 'CERTIFIED', 'DEMO／SIMULATED 友善耕作驗證', '2026-06-01', ?, 1)`)
        .bind(`GFACT-DEMO-${session.profileId}`, session.profileId, JSON.stringify([verifiedRecordId])),
    ];

    if (!existingIds.has(verifiedDocumentId)) {
      statements.push(
        greenFinAuditStatement(db, "DOCUMENT_UPLOADED", session.profileId, "greenfin_document", verifiedDocumentId, { filename: "DEMO_SIMULATED_已核驗有機認證.pdf", mode: "SIMULATED" }),
        greenFinAuditStatement(db, "OCR_COMPLETED", session.profileId, "greenfin_document", verifiedDocumentId, { provider: "DemoSeed", fieldCount: 3, mode: "SIMULATED" }),
        greenFinAuditStatement(db, "VERIFICATION_UPDATED", session.profileId, "greenfin_record", verifiedRecordId, { sourceLevel: "V2", reason: "可查核第三方文件（DEMO SIMULATED）" }),
      );
    }
    if (!existingIds.has(pendingDocumentId)) {
      statements.push(
        greenFinAuditStatement(db, "DOCUMENT_UPLOADED", session.profileId, "greenfin_document", pendingDocumentId, { filename: "DEMO_SIMULATED_待補件節水紀錄.pdf", mode: "SIMULATED" }),
        greenFinAuditStatement(db, "OCR_COMPLETED", session.profileId, "greenfin_document", pendingDocumentId, { provider: "DemoSeed", fieldCount: 3, mode: "SIMULATED" }),
      );
    }
    await db.batch(statements);

    return Response.json({
      ok: true,
      demo: true,
      pendingDocumentId,
      verifiedDocumentId,
      disclaimer: "DEMO／SIMULATED 假資料，僅供介面與核驗流程測試，不代表真實採用或正式驗證。",
    });
  } catch (error) {
    return errorResponse(error, "建立 GreenFin DEMO 核驗資料失敗");
  }
}
