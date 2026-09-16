import type { GreenFinDataDomain, GreenFinSourceLevel } from "../../domain";
import { GREENFIN_REQUIRED_FIELDS } from "../../rules/required-fields.mjs";

export const GREENFIN_ANOMALY_TYPES = [
  "DUPLICATE",
  "EXPIRED",
  "FUTURE_DATE",
  "CONFLICT",
  "INVALID_FORMAT",
  "OCR_LOW_CONFIDENCE",
  "MISSING_REQUIRED_FIELD",
  "VERIFICATION_FAILED",
] as const;

export type GreenFinAnomalyType = (typeof GREENFIN_ANOMALY_TYPES)[number];
export type GreenFinAnomaly = { type: GreenFinAnomalyType; severity: "INFO" | "WARNING" | "CRITICAL"; description: string };

export type AnomalyInput = {
  domain: GreenFinDataDomain;
  data: Record<string, string>;
  sourceLevel: GreenFinSourceLevel;
  fieldConfidences: Array<{ name: string; confidence: number | null }>;
  duplicateDocumentIds?: string[];
  peerRecords?: Array<Record<string, string>>;
  now?: Date;
};

const EXPIRY_FIELDS = ["有效期限", "expiry", "到期日"];
const EVENT_DATE_FIELDS = ["交易日期", "執行日期", "購入日期", "登記日期", "action_date"];

function parseIsoDate(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.valueOf()) ? null : date;
}

export function detectGreenFinAnomalies(input: AnomalyInput): GreenFinAnomaly[] {
  const anomalies: GreenFinAnomaly[] = [];
  const today = input.now ?? new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());

  for (const name of EXPIRY_FIELDS) {
    const value = input.data[name];
    const date = parseIsoDate(value);
    if (date && date.valueOf() < todayUtc) {
      anomalies.push({ type: "EXPIRED", severity: "CRITICAL", description: `資料已過期：${name} = ${value}` });
      break;
    }
  }

  const futureLimit = new Date(todayUtc);
  futureLimit.setUTCFullYear(futureLimit.getUTCFullYear() + 5);
  for (const name of EVENT_DATE_FIELDS) {
    const value = input.data[name];
    const date = parseIsoDate(value);
    if (date && date.valueOf() > futureLimit.valueOf()) {
      anomalies.push({ type: "FUTURE_DATE", severity: "WARNING", description: `日期異常偏向未來：${name} = ${value}` });
      break;
    }
  }

  if (input.duplicateDocumentIds?.length) {
    anomalies.push({ type: "DUPLICATE", severity: "WARNING", description: `與其他文件雜湊相同：${input.duplicateDocumentIds.join(", ")}` });
  }

  const lowFields = input.fieldConfidences.filter((field) => field.confidence != null && field.confidence < 0.5).map((field) => field.name);
  if (lowFields.length) anomalies.push({ type: "OCR_LOW_CONFIDENCE", severity: "WARNING", description: `OCR 信心度過低（< 0.5）：${lowFields.join(", ")}` });

  const missing = GREENFIN_REQUIRED_FIELDS[input.domain].filter((field) => !input.data[field]);
  if (missing.length) anomalies.push({ type: "MISSING_REQUIRED_FIELD", severity: "CRITICAL", description: `缺少必要欄位：${missing.join(", ")}` });

  if (input.sourceLevel === "V0") anomalies.push({ type: "VERIFICATION_FAILED", severity: "CRITICAL", description: "來源核驗失敗（V0）：資料無法使用或確認異常" });

  for (const peer of input.peerRecords ?? []) {
    for (const key of ["面積", "交易金額"]) {
      const current = Number(input.data[key]);
      const other = Number(peer[key]);
      if (current > 0 && other > 0 && Math.abs(current - other) / Math.max(current, other) > 0.5) {
        anomalies.push({ type: "CONFLICT", severity: "WARNING", description: `與同領域其他紀錄矛盾：${key} 差異超過 50%` });
        break;
      }
    }
    if (anomalies.some((item) => item.type === "CONFLICT")) break;
  }

  for (const name of [...EXPIRY_FIELDS, ...EVENT_DATE_FIELDS]) {
    const value = input.data[name];
    if (value && !parseIsoDate(value)) {
      anomalies.push({ type: "INVALID_FORMAT", severity: "WARNING", description: `欄位格式無法解析：${name} = '${value}'` });
      break;
    }
  }
  return anomalies;
}
