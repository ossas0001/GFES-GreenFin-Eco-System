import { AuthError, requireAuth } from "../../../../db/auth";
import { ensurePlatformSchema, getPlatformDb } from "../../../../db/platform";
import { greenFinAuditStatement } from "../../../../worker/greenfin/audit";
import { isGreenFinDataDomain, isGreenFinSourceLevel } from "../../../../worker/greenfin/domain";
import { detectGreenFinAnomalies } from "../../../../worker/greenfin/services/anomaly/detect";
import { verifyGreenFinRecord } from "../../../../worker/greenfin/services/verification/verify";

function errorResponse(error: unknown, fallback: string) {
  return Response.json({ error: error instanceof Error ? error.message : fallback }, { status: error instanceof AuthError ? error.status : 400 });
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth(request, ["farmer", "admin"], true);
    const body = await request.json() as { documentId?: string };
    const documentId = String(body.documentId ?? "");
    const db = await getPlatformDb();
    await ensurePlatformSchema(db);
    const document = session.role === "admin"
      ? await db.prepare("SELECT * FROM greenfin_documents WHERE id = ?").bind(documentId).first<Record<string, unknown>>()
      : await db.prepare("SELECT * FROM greenfin_documents WHERE id = ? AND farmer_id = ?").bind(documentId, session.profileId).first<Record<string, unknown>>();
    if (!document) return Response.json({ error: "找不到 GreenFin 文件" }, { status: 404 });
    if (document.status !== "NORMALIZED" && document.status !== "VERIFIED") return Response.json({ error: "文件尚未完成標準化" }, { status: 409 });
    const record = await db.prepare("SELECT * FROM greenfin_standardized_records WHERE document_id = ? ORDER BY created_at DESC LIMIT 1")
      .bind(documentId).first<Record<string, unknown>>();
    if (!record) return Response.json({ error: "找不到標準化紀錄" }, { status: 404 });
    const domain = String(record.domain);
    const declaredSourceLevel = String(document.source_level);
    if (!isGreenFinDataDomain(domain) || !isGreenFinSourceLevel(declaredSourceLevel)) return Response.json({ error: "GreenFin 文件欄位無效" }, { status: 500 });
    const data = JSON.parse(String(record.data_json || "{}")) as Record<string, string>;
    const fieldsResult = await db.prepare("SELECT field_name, confidence FROM greenfin_document_fields WHERE document_id = ?").bind(documentId).all<{ field_name: string; confidence: number | null }>();
    const fields = fieldsResult.results ?? [];
    const verification = verifyGreenFinRecord({
      documentExists: true,
      declaredSourceLevel,
      data,
      isValid: Boolean(record.is_valid),
      fieldConfidences: fields.map((field) => field.confidence),
      evidenceId: documentId,
    });
    const duplicateRows = document.file_sha256
      ? await db.prepare("SELECT id FROM greenfin_documents WHERE farmer_id = ? AND file_sha256 = ? AND id <> ?").bind(document.farmer_id, document.file_sha256, documentId).all<{ id: string }>()
      : { results: [] as { id: string }[] };
    const peerRows = await db.prepare("SELECT data_json FROM greenfin_standardized_records WHERE farmer_id = ? AND domain = ? AND id <> ?")
      .bind(document.farmer_id, domain, record.id).all<{ data_json: string }>();
    const anomalies = detectGreenFinAnomalies({
      domain,
      data,
      sourceLevel: verification.sourceLevel,
      fieldConfidences: fields.map((field) => ({ name: field.field_name, confidence: field.confidence })),
      duplicateDocumentIds: (duplicateRows.results ?? []).map((row) => row.id),
      peerRecords: (peerRows.results ?? []).map((row) => JSON.parse(row.data_json) as Record<string, string>),
    });

    const verificationId = `GFV-${crypto.randomUUID()}`;
    const statements = [
      db.prepare(`INSERT INTO greenfin_verification_results
        (id, record_id, source_level, reason, verified_by, evidence_ids_json) VALUES (?, ?, ?, ?, ?, ?)`)
        .bind(verificationId, record.id, verification.sourceLevel, verification.reason, session.profileId, JSON.stringify(verification.evidenceIds)),
      db.prepare("UPDATE greenfin_standardized_records SET source_level = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(verification.sourceLevel, record.id),
      db.prepare("UPDATE greenfin_documents SET source_level = ?, status = 'VERIFIED', updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(verification.sourceLevel, documentId),
      greenFinAuditStatement(db, "VERIFICATION_UPDATED", session.profileId, "greenfin_record", String(record.id), { sourceLevel: verification.sourceLevel, reason: verification.reason }),
      ...anomalies.flatMap((anomaly) => {
        const anomalyId = `GFA-${record.id}-${anomaly.type}`;
        return [
          db.prepare(`INSERT INTO greenfin_anomalies
            (id, record_id, document_id, anomaly_type, severity, description)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET severity = excluded.severity, description = excluded.description`)
            .bind(anomalyId, record.id, documentId, anomaly.type, anomaly.severity, anomaly.description),
          greenFinAuditStatement(db, "ANOMALY_DETECTED", session.profileId, "greenfin_anomaly", anomalyId, { recordId: record.id, type: anomaly.type, severity: anomaly.severity }),
        ];
      }),
    ];
    await db.batch(statements);
    return Response.json({ ok: true, documentId, status: "VERIFIED", verification: { id: verificationId, ...verification }, anomalies, anomalyCount: anomalies.length });
  } catch (error) {
    return errorResponse(error, "GreenFin 核驗失敗");
  }
}

export async function GET(request: Request) {
  try {
    const session = await requireAuth(request, ["farmer", "admin"]);
    const db = await getPlatformDb();
    await ensurePlatformSchema(db);
    const query = `SELECT anomaly.*, record.farmer_id
      FROM greenfin_anomalies anomaly
      JOIN greenfin_standardized_records record ON record.id = anomaly.record_id`;
    const result = session.role === "admin"
      ? await db.prepare(`${query} ORDER BY anomaly.is_resolved, anomaly.created_at DESC`).all()
      : await db.prepare(`${query} WHERE record.farmer_id = ? ORDER BY anomaly.is_resolved, anomaly.created_at DESC`).bind(session.profileId).all();
    const items = result.results ?? [];
    return Response.json({ total: items.length, unresolved: items.filter((item) => !item.is_resolved).length, items });
  } catch (error) {
    return errorResponse(error, "讀取 GreenFin 異常佇列失敗");
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requireAuth(request, ["farmer", "admin"], true);
    const body = await request.json() as { anomalyId?: string; resolutionNote?: string };
    const anomalyId = String(body.anomalyId ?? "");
    const resolutionNote = String(body.resolutionNote ?? "").trim().slice(0, 1000);
    if (!resolutionNote) return Response.json({ error: "請填寫人工覆核說明" }, { status: 400 });
    const db = await getPlatformDb();
    const anomaly = session.role === "admin"
      ? await db.prepare("SELECT * FROM greenfin_anomalies WHERE id = ?").bind(anomalyId).first<Record<string, unknown>>()
      : await db.prepare(`SELECT anomaly.* FROM greenfin_anomalies anomaly
          JOIN greenfin_standardized_records record ON record.id = anomaly.record_id
          WHERE anomaly.id = ? AND record.farmer_id = ?`).bind(anomalyId, session.profileId).first<Record<string, unknown>>();
    if (!anomaly) return Response.json({ error: "找不到異常紀錄" }, { status: 404 });
    if (anomaly.is_resolved) return Response.json({ error: "此異常已完成覆核" }, { status: 409 });
    await db.prepare(`UPDATE greenfin_anomalies SET is_resolved = 1, resolved_by = ?, resolved_at = CURRENT_TIMESTAMP, resolution_note = ? WHERE id = ?`)
      .bind(session.profileId, resolutionNote, anomalyId).run();
    return Response.json({ ok: true, anomalyId, status: "resolved" });
  } catch (error) {
    return errorResponse(error, "GreenFin 異常覆核失敗");
  }
}
