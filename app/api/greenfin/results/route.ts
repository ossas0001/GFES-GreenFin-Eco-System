import { AuthError, requireAuth } from "../../../../db/auth";
import { ensurePlatformSchema, getPlatformDb } from "../../../../db/platform";
import { greenFinAuditStatement } from "../../../../worker/greenfin/audit";
import { isGreenFinDataDomain, isGreenFinSourceLevel } from "../../../../worker/greenfin/domain";
import { loadGreenFinRuleEngine } from "../../../../worker/greenfin/rules/engine";
import { calculateDataHealthResults, calculateExperienceResults, calculateIndicatorResults, type CalculationAction, type CalculationAnomaly, type CalculationRecord } from "../../../../worker/greenfin/services/calculation/results";
import { buildGreenFinProgress, summarizeGreenFinExperience } from "../../../../worker/greenfin/services/progress";

function parseJson<T>(value: unknown, fallback: T): T { try { return value ? JSON.parse(String(value)) as T : fallback; } catch { return fallback; } }
function errorResponse(error: unknown, fallback: string) { return Response.json({ error: error instanceof Error ? error.message : fallback }, { status: error instanceof AuthError ? error.status : 400 }); }

async function loadInputs(db: D1Database, farmerId: string) {
  const [recordRows, anomalyRows, actionRows, documentCount] = await Promise.all([
    db.prepare("SELECT * FROM greenfin_standardized_records WHERE farmer_id = ?").bind(farmerId).all<Record<string, unknown>>(),
    db.prepare(`SELECT anomaly.* FROM greenfin_anomalies anomaly JOIN greenfin_standardized_records record ON record.id = anomaly.record_id WHERE record.farmer_id = ?`).bind(farmerId).all<Record<string, unknown>>(),
    db.prepare("SELECT * FROM greenfin_actions WHERE farmer_id = ? AND is_active = 1 ORDER BY action_date").bind(farmerId).all<Record<string, unknown>>(),
    db.prepare("SELECT COUNT(*) AS count FROM greenfin_documents WHERE farmer_id = ?").bind(farmerId).first<{ count: number }>(),
  ]);
  const records = (recordRows.results ?? []).flatMap((row): CalculationRecord[] => {
    const domain = String(row.domain); const sourceLevel = String(row.source_level);
    return isGreenFinDataDomain(domain) && isGreenFinSourceLevel(sourceLevel) ? [{ id: String(row.id), documentId: String(row.document_id), domain, data: parseJson(row.data_json, {}), sourceLevel, isValid: Boolean(row.is_valid) }] : [];
  });
  const anomalies = (anomalyRows.results ?? []).map((row): CalculationAnomaly => ({ recordId: String(row.record_id), severity: String(row.severity) as CalculationAnomaly["severity"], isResolved: Boolean(row.is_resolved) }));
  const actions = (actionRows.results ?? []).map((row): CalculationAction => ({ id: String(row.id), dimension: String(row.dimension), actionLevel: String(row.action_level) as CalculationAction["actionLevel"], evidenceRecordIds: parseJson(row.evidence_record_ids_json, []), actionDate: String(row.action_date) }));
  return { records, anomalies, actions, documentCount: Number(documentCount?.count ?? 0) };
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth(request, ["farmer", "admin"], true);
    const body = await request.json().catch(() => ({})) as { farmerId?: string; ruleVersion?: string };
    const farmerId = session.role === "farmer" ? session.profileId : String(body.farmerId ?? "");
    if (!farmerId) return Response.json({ error: "缺少小農識別碼" }, { status: 400 });
    const db = await getPlatformDb(); await ensurePlatformSchema(db);
    const engine = await loadGreenFinRuleEngine(db, body.ruleVersion);
    const inputs = await loadInputs(db, farmerId);
    const experience = calculateExperienceResults(engine, inputs.actions, inputs.records);
    const indicators = calculateIndicatorResults(engine, inputs.records, inputs.anomalies, experience, inputs.documentCount);
    const dataHealth = calculateDataHealthResults(engine, inputs.records, inputs.anomalies);
    const calculatedAt = new Date().toISOString();
    const statements = experience.transactions.map((transaction) => db.prepare(`INSERT INTO greenfin_experience_transactions
      (id, farmer_id, green_action_id, dimension, base_value, source_recognition_ratio, effective_value, rule_version, calculated_at, input_evidence_ids_json, calculation_trace_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(green_action_id, rule_version) DO UPDATE SET effective_value=excluded.effective_value, calculated_at=excluded.calculated_at, input_evidence_ids_json=excluded.input_evidence_ids_json, calculation_trace_json=excluded.calculation_trace_json`)
      .bind(`GFX-${crypto.randomUUID()}`, farmerId, transaction.actionId, transaction.dimension, transaction.baseValue, transaction.sourceRecognitionRatio, transaction.effectiveValue, engine.version, calculatedAt, JSON.stringify(transaction.evidenceIds), JSON.stringify(transaction.trace.calculationTrace)));
    statements.push(...indicators.map((result) => db.prepare(`INSERT INTO greenfin_indicator_results
      (id, farmer_id, indicator_type, score, level, details_json, rule_version, calculated_at, input_evidence_ids_json, calculation_trace_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(`GFI-${crypto.randomUUID()}`, farmerId, result.type, result.score, result.level, JSON.stringify(result.details), engine.version, calculatedAt, JSON.stringify(result.trace.inputEvidenceIds), JSON.stringify(result.trace.calculationTrace))));
    statements.push(...dataHealth.map((result) => db.prepare(`INSERT INTO greenfin_data_health_results
      (id, farmer_id, domain, status, reasons_json, actions_json, affected_evidence_ids_json, rule_version, calculated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(`GFH-${crypto.randomUUID()}`, farmerId, result.domain, result.status, JSON.stringify(result.reasons), JSON.stringify(result.actions), JSON.stringify(result.evidenceIds), engine.version, calculatedAt)));
    statements.push(
      greenFinAuditStatement(db, "EXPERIENCE_RECALCULATED", session.profileId, "farmer", farmerId, { total: experience.total, ruleVersion: engine.version }),
      greenFinAuditStatement(db, "INDICATOR_RECALCULATED", session.profileId, "farmer", farmerId, { scores: Object.fromEntries(indicators.map((result) => [result.type, result.score])), ruleVersion: engine.version }),
      greenFinAuditStatement(db, "DATA_HEALTH_UPDATED", session.profileId, "farmer", farmerId, { summary: Object.fromEntries(["GREEN", "YELLOW", "RED", "GRAY"].map((status) => [status, dataHealth.filter((result) => result.status === status).length])), ruleVersion: engine.version }),
    );
    await db.batch(statements);
    return Response.json({ farmerId, ruleVersion: engine.version, calculatedAt, experience, indicators, dataHealth, notice: "三類輸出彼此獨立，均非信用評分或自動核貸結果。" });
  } catch (error) { return errorResponse(error, "GreenFin 結果計算失敗"); }
}

export async function GET(request: Request) {
  try {
    const session = await requireAuth(request, ["farmer", "admin"]);
    const requested = new URL(request.url).searchParams.get("farmerId") ?? "";
    const farmerId = session.role === "farmer" ? session.profileId : requested;
    if (!farmerId) return Response.json({ error: "缺少小農識別碼" }, { status: 400 });
    const db = await getPlatformDb(); await ensurePlatformSchema(db);
    const engine = await loadGreenFinRuleEngine(db);
    const [experience, indicators, health, documentStats, actionCount, unresolvedAnomalyCount] = await Promise.all([
      db.prepare("SELECT * FROM greenfin_experience_transactions WHERE farmer_id = ? AND rule_version = ? ORDER BY calculated_at DESC").bind(farmerId, engine.version).all<Record<string, unknown>>(),
      db.prepare("SELECT * FROM greenfin_indicator_results WHERE farmer_id = ? AND rule_version = ? ORDER BY calculated_at DESC").bind(farmerId, engine.version).all<Record<string, unknown>>(),
      db.prepare("SELECT * FROM greenfin_data_health_results WHERE farmer_id = ? AND rule_version = ? ORDER BY calculated_at DESC").bind(farmerId, engine.version).all<Record<string, unknown>>(),
      db.prepare(`SELECT COUNT(*) AS document_count,
        COALESCE(SUM(CASE WHEN status IN ('NORMALIZED', 'VERIFIED') THEN 1 ELSE 0 END), 0) AS processed_document_count,
        COALESCE(SUM(CASE WHEN status = 'VERIFIED' THEN 1 ELSE 0 END), 0) AS verified_document_count
        FROM greenfin_documents WHERE farmer_id = ?`).bind(farmerId).first<Record<string, number>>(),
      db.prepare("SELECT COUNT(*) AS count FROM greenfin_actions WHERE farmer_id = ? AND is_active = 1").bind(farmerId).first<{ count: number }>(),
      db.prepare(`SELECT COUNT(*) AS count FROM greenfin_anomalies anomaly
        JOIN greenfin_standardized_records record ON record.id = anomaly.record_id
        WHERE record.farmer_id = ? AND anomaly.is_resolved = 0`).bind(farmerId).first<{ count: number }>(),
    ]);
    const experienceRows = experience.results ?? [];
    const indicatorRows = indicators.results ?? [];
    const healthRows = health.results ?? [];
    const experienceSummary = summarizeGreenFinExperience(engine, experienceRows.map((row) => ({
      dimension: String(row.dimension),
      effectiveValue: Number(row.effective_value ?? 0),
    })));
    const progress = buildGreenFinProgress({
      documentCount: Number(documentStats?.document_count ?? 0),
      processedDocumentCount: Number(documentStats?.processed_document_count ?? 0),
      verifiedDocumentCount: Number(documentStats?.verified_document_count ?? 0),
      actionCount: Number(actionCount?.count ?? 0),
      experienceTransactionCount: experienceRows.length,
      indicatorCount: new Set(indicatorRows.map((row) => String(row.indicator_type))).size,
      dataHealthCount: new Set(healthRows.map((row) => String(row.domain))).size,
      unresolvedAnomalyCount: Number(unresolvedAnomalyCount?.count ?? 0),
    });
    return Response.json({
      farmerId,
      summary: { ...experienceSummary, ...progress },
      experience: experienceRows,
      indicators: indicatorRows,
      dataHealth: healthRows,
      notice: "三類輸出彼此獨立，均非信用評分或自動核貸結果。",
    });
  } catch (error) { return errorResponse(error, "讀取 GreenFin 結果失敗"); }
}
