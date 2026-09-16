import { GREENFIN_DEMO_RULE_CONFIG, GREENFIN_RULE_VERSION } from "../worker/greenfin/rules/demo-v1.mjs";

/** GreenFin D1 schema bootstrap used by local/demo environments.
 * Production deployments apply the equivalent versioned Drizzle migration.
 */
export async function ensureGreenFinSchema(db: D1Database) {
  const statements = [
    `CREATE TABLE IF NOT EXISTS greenfin_farms (id TEXT PRIMARY KEY, farmer_id TEXT NOT NULL, name TEXT NOT NULL, city TEXT NOT NULL, district TEXT NOT NULL, area_hectares REAL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS greenfin_crops (id TEXT PRIMARY KEY, farm_id TEXT NOT NULL, name TEXT NOT NULL, variety TEXT NOT NULL DEFAULT '', cultivation_area_hectares REAL, planting_date TEXT, harvest_date TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS greenfin_documents (id TEXT PRIMARY KEY, farmer_id TEXT NOT NULL, original_name TEXT NOT NULL, file_sha256 TEXT, storage_key TEXT NOT NULL, mime_type TEXT, file_size INTEGER, domain TEXT NOT NULL, source_level TEXT NOT NULL DEFAULT 'V1', status TEXT NOT NULL DEFAULT 'UPLOADED', upload_note TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS greenfin_document_fields (id TEXT PRIMARY KEY, document_id TEXT NOT NULL, field_name TEXT NOT NULL, raw_value TEXT, normalized_value TEXT, confidence REAL, source TEXT NOT NULL DEFAULT 'ocr', manually_corrected INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS greenfin_standardized_records (id TEXT PRIMARY KEY, document_id TEXT NOT NULL, farmer_id TEXT NOT NULL, domain TEXT NOT NULL, record_type TEXT NOT NULL, data_json TEXT NOT NULL DEFAULT '{}', source_level TEXT NOT NULL DEFAULT 'V1', is_valid INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS greenfin_verification_results (id TEXT PRIMARY KEY, record_id TEXT NOT NULL, source_level TEXT NOT NULL, reason TEXT NOT NULL, verified_by TEXT NOT NULL DEFAULT 'system', evidence_ids_json TEXT NOT NULL DEFAULT '[]', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS greenfin_anomalies (id TEXT PRIMARY KEY, record_id TEXT NOT NULL, document_id TEXT, anomaly_type TEXT NOT NULL, severity TEXT NOT NULL DEFAULT 'WARNING', description TEXT NOT NULL, is_resolved INTEGER NOT NULL DEFAULT 0, resolved_by TEXT, resolved_at TEXT, resolution_note TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS greenfin_rule_sets (version TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', config_json TEXT NOT NULL, is_active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS greenfin_actions (id TEXT PRIMARY KEY, farmer_id TEXT NOT NULL, dimension TEXT NOT NULL, action_level TEXT NOT NULL, description TEXT NOT NULL, action_date TEXT NOT NULL, evidence_record_ids_json TEXT NOT NULL DEFAULT '[]', is_active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS greenfin_experience_transactions (id TEXT PRIMARY KEY, farmer_id TEXT NOT NULL, green_action_id TEXT NOT NULL, dimension TEXT NOT NULL, base_value INTEGER NOT NULL, source_recognition_ratio REAL NOT NULL, effective_value REAL NOT NULL, rule_version TEXT NOT NULL, calculated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, input_evidence_ids_json TEXT NOT NULL DEFAULT '[]', calculation_trace_json TEXT NOT NULL DEFAULT '{}')`,
    `CREATE TABLE IF NOT EXISTS greenfin_indicator_results (id TEXT PRIMARY KEY, farmer_id TEXT NOT NULL, indicator_type TEXT NOT NULL, score REAL NOT NULL, level TEXT NOT NULL, details_json TEXT NOT NULL DEFAULT '{}', rule_version TEXT NOT NULL, calculated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, input_evidence_ids_json TEXT NOT NULL DEFAULT '[]', calculation_trace_json TEXT NOT NULL DEFAULT '{}')`,
    `CREATE TABLE IF NOT EXISTS greenfin_data_health_results (id TEXT PRIMARY KEY, farmer_id TEXT NOT NULL, domain TEXT NOT NULL, status TEXT NOT NULL, reasons_json TEXT NOT NULL DEFAULT '[]', actions_json TEXT NOT NULL DEFAULT '[]', affected_evidence_ids_json TEXT NOT NULL DEFAULT '[]', rule_version TEXT NOT NULL, calculated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS greenfin_authorizations (id TEXT PRIMARY KEY, farmer_id TEXT NOT NULL, institution_id TEXT NOT NULL, purpose TEXT NOT NULL, data_scope_json TEXT NOT NULL DEFAULT '[]', start_at TEXT NOT NULL, expire_at TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'ACTIVE', revoked_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS greenfin_bank_cases (id TEXT PRIMARY KEY, authorization_id TEXT NOT NULL, institution_id TEXT NOT NULL, farmer_id TEXT NOT NULL, case_number TEXT, status TEXT NOT NULL DEFAULT 'open', notes TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS greenfin_audit_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, event_type TEXT NOT NULL, actor_id TEXT, target_id TEXT, target_type TEXT, details_json TEXT NOT NULL DEFAULT '{}', ip_address TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE INDEX IF NOT EXISTS idx_greenfin_farms_farmer ON greenfin_farms(farmer_id)`,
    `CREATE INDEX IF NOT EXISTS idx_greenfin_crops_farm ON greenfin_crops(farm_id)`,
    `CREATE INDEX IF NOT EXISTS idx_greenfin_documents_farmer_created ON greenfin_documents(farmer_id, created_at DESC)`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_greenfin_documents_farmer_hash ON greenfin_documents(farmer_id, file_sha256) WHERE file_sha256 IS NOT NULL`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_greenfin_document_fields_name ON greenfin_document_fields(document_id, field_name)`,
    `CREATE INDEX IF NOT EXISTS idx_greenfin_records_farmer_domain ON greenfin_standardized_records(farmer_id, domain)`,
    `CREATE INDEX IF NOT EXISTS idx_greenfin_verifications_record ON greenfin_verification_results(record_id, created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_greenfin_anomalies_unresolved ON greenfin_anomalies(is_resolved, severity)`,
    `CREATE INDEX IF NOT EXISTS idx_greenfin_actions_farmer_date ON greenfin_actions(farmer_id, action_date DESC)`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_greenfin_experience_action_rule ON greenfin_experience_transactions(green_action_id, rule_version)`,
    `CREATE INDEX IF NOT EXISTS idx_greenfin_indicators_farmer_type ON greenfin_indicator_results(farmer_id, indicator_type, calculated_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_greenfin_health_farmer_domain ON greenfin_data_health_results(farmer_id, domain, calculated_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_greenfin_authorizations_institution ON greenfin_authorizations(institution_id, status, expire_at)`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_greenfin_bank_cases_authorization ON greenfin_bank_cases(authorization_id)`,
    `CREATE INDEX IF NOT EXISTS idx_greenfin_audit_target ON greenfin_audit_logs(target_type, target_id, created_at DESC)`,
  ];

  await db.batch(statements.map((statement) => db.prepare(statement)));
  await db.prepare(`INSERT OR IGNORE INTO greenfin_rule_sets
    (version, name, description, config_json, is_active)
    VALUES (?, 'Demo Rule Set V1', 'Initial versioned demo rules for GreenFin calculations.', ?, 1)`)
    .bind(GREENFIN_RULE_VERSION, JSON.stringify(GREENFIN_DEMO_RULE_CONFIG)).run();
}
