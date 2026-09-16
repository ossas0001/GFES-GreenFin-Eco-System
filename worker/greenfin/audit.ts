export type GreenFinAuditEvent =
  | "DOCUMENT_UPLOADED"
  | "OCR_COMPLETED"
  | "FIELD_CORRECTED"
  | "VERIFICATION_UPDATED"
  | "ANOMALY_DETECTED"
  | "EXPERIENCE_RECALCULATED"
  | "INDICATOR_RECALCULATED"
  | "DATA_HEALTH_UPDATED"
  | "AUTHORIZATION_GRANTED"
  | "AUTHORIZATION_REVOKED"
  | "BANK_DATA_ACCESSED"
  | "REPORT_GENERATED";

export function greenFinAuditStatement(
  db: D1Database,
  eventType: GreenFinAuditEvent,
  actorId: string | null,
  targetType: string,
  targetId: string,
  details: Record<string, unknown>,
  ipAddress?: string | null,
) {
  return db.prepare(`INSERT INTO greenfin_audit_logs
    (event_type, actor_id, target_type, target_id, details_json, ip_address)
    VALUES (?, ?, ?, ?, ?, ?)`)
    .bind(eventType, actorId, targetType, targetId, JSON.stringify(details), ipAddress ?? null);
}
