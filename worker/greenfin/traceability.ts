type TraceResult = {
  id: string;
  resultType: "EXPERIENCE" | "INDICATOR" | "DATA_HEALTH";
  resultKey: string;
  ruleVersion: string;
  calculatedAt: string;
  calculationTrace: unknown;
  evidenceIds: string[];
};

function parseJson<T>(value: unknown, fallback: T): T {
  try { return value ? JSON.parse(String(value)) as T : fallback; } catch { return fallback; }
}

function placeholders(values: string[]) {
  return values.map(() => "?").join(", ");
}

export async function buildGreenFinTracePackage(db: D1Database, farmerId: string, scopes: string[]) {
  const results: TraceResult[] = [];
  if (scopes.includes("EXPERIENCE")) {
    const rows = await db.prepare("SELECT * FROM greenfin_experience_transactions WHERE farmer_id = ? ORDER BY calculated_at DESC").bind(farmerId).all<Record<string, unknown>>();
    results.push(...(rows.results ?? []).map((row) => ({ id: String(row.id), resultType: "EXPERIENCE" as const, resultKey: String(row.dimension), ruleVersion: String(row.rule_version), calculatedAt: String(row.calculated_at), calculationTrace: parseJson(row.calculation_trace_json, {}), evidenceIds: parseJson(row.input_evidence_ids_json, []) })));
  }
  if (scopes.includes("INDICATORS")) {
    const rows = await db.prepare("SELECT * FROM greenfin_indicator_results WHERE farmer_id = ? ORDER BY calculated_at DESC").bind(farmerId).all<Record<string, unknown>>();
    results.push(...(rows.results ?? []).map((row) => ({ id: String(row.id), resultType: "INDICATOR" as const, resultKey: String(row.indicator_type), ruleVersion: String(row.rule_version), calculatedAt: String(row.calculated_at), calculationTrace: parseJson(row.calculation_trace_json, {}), evidenceIds: parseJson(row.input_evidence_ids_json, []) })));
  }
  if (scopes.includes("DATA_HEALTH")) {
    const rows = await db.prepare("SELECT * FROM greenfin_data_health_results WHERE farmer_id = ? ORDER BY calculated_at DESC").bind(farmerId).all<Record<string, unknown>>();
    results.push(...(rows.results ?? []).map((row) => ({ id: String(row.id), resultType: "DATA_HEALTH" as const, resultKey: String(row.domain), ruleVersion: String(row.rule_version), calculatedAt: String(row.calculated_at), calculationTrace: { status: row.status, reasons: parseJson(row.reasons_json, []), actions: parseJson(row.actions_json, []) }, evidenceIds: parseJson(row.affected_evidence_ids_json, []) })));
  }

  const ruleVersions = [...new Set(results.map((result) => result.ruleVersion))];
  const evidenceIds = [...new Set(results.flatMap((result) => result.evidenceIds))];
  const rules = ruleVersions.length
    ? (await db.prepare(`SELECT version, name, description, config_json, created_at FROM greenfin_rule_sets WHERE version IN (${placeholders(ruleVersions)})`).bind(...ruleVersions).all()).results ?? []
    : [];
  const records = evidenceIds.length
    ? (await db.prepare(`SELECT * FROM greenfin_standardized_records WHERE farmer_id = ? AND id IN (${placeholders(evidenceIds)})`).bind(farmerId, ...evidenceIds).all<Record<string, unknown>>()).results ?? []
    : [];
  const documentIds = [...new Set(records.map((record) => String(record.document_id)).filter(Boolean))];
  const [documentsResult, fieldsResult, verificationsResult, anomaliesResult] = documentIds.length ? await Promise.all([
    db.prepare(`SELECT id, original_name, file_sha256, mime_type, file_size, domain, source_level, status, created_at FROM greenfin_documents WHERE farmer_id = ? AND id IN (${placeholders(documentIds)})`).bind(farmerId, ...documentIds).all(),
    db.prepare(`SELECT f.* FROM greenfin_document_fields f JOIN greenfin_documents d ON d.id = f.document_id WHERE d.farmer_id = ? AND f.document_id IN (${placeholders(documentIds)}) ORDER BY f.document_id, f.field_name`).bind(farmerId, ...documentIds).all(),
    db.prepare(`SELECT v.* FROM greenfin_verification_results v JOIN greenfin_standardized_records r ON r.id = v.record_id WHERE r.farmer_id = ? AND r.id IN (${placeholders(evidenceIds)}) ORDER BY v.created_at DESC`).bind(farmerId, ...evidenceIds).all(),
    db.prepare(`SELECT a.* FROM greenfin_anomalies a JOIN greenfin_standardized_records r ON r.id = a.record_id WHERE r.farmer_id = ? AND r.id IN (${placeholders(evidenceIds)}) ORDER BY a.created_at DESC`).bind(farmerId, ...evidenceIds).all(),
  ]) : [{ results: [] }, { results: [] }, { results: [] }, { results: [] }];

  const fields = fieldsResult.results ?? [];
  const verifications = verificationsResult.results ?? [];
  const anomalies = anomaliesResult.results ?? [];
  const recordPackages = records.map((record) => ({
    ...record,
    id: String(record.id),
    document_id: String(record.document_id),
    data: parseJson(record.data_json, {}),
    fields: fields.filter((field) => String(field.document_id) === String(record.document_id)),
    verification: verifications.filter((verification) => String(verification.record_id) === String(record.id)),
    anomalies: anomalies.filter((anomaly) => String(anomaly.record_id) === String(record.id)),
    originalDocument: (documentsResult.results ?? []).find((document) => String(document.id) === String(record.document_id)) ?? null,
  }));

  return {
    lineage: "Result → Calculation Trace → Rule Version → Standardized Record → Document Field → Original Document",
    results: results.map((result) => ({ ...result, evidence: result.evidenceIds.map((id) => recordPackages.find((record) => String(record.id) === id) ?? { id, missing: true }) })),
    rules: rules.map((rule) => ({ ...rule, config: parseJson((rule as Record<string, unknown>).config_json, {}) })),
    evidenceSummary: { requested: evidenceIds.length, resolved: recordPackages.length, missing: evidenceIds.filter((id) => !recordPackages.some((record) => String(record.id) === id)) },
  };
}
