import type { GreenFinSourceLevel } from "../../domain";

export type VerificationInput = {
  documentExists: boolean;
  declaredSourceLevel: GreenFinSourceLevel;
  data: Record<string, string>;
  isValid: boolean;
  fieldConfidences: Array<number | null>;
  evidenceId?: string;
  now?: Date;
};

export type VerificationDecision = {
  sourceLevel: GreenFinSourceLevel;
  reason: string;
  evidenceIds: string[];
};

function validIsoDate(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.valueOf()) ? null : date;
}

export function verifyGreenFinRecord(input: VerificationInput): VerificationDecision {
  if (!input.documentExists) {
    return { sourceLevel: "V0", reason: "來源文件不存在，無法核驗", evidenceIds: [] };
  }

  let sourceLevel = input.declaredSourceLevel;
  const reasons: string[] = [];
  const lowConfidenceCount = input.fieldConfidences.filter((confidence) => confidence != null && confidence < 0.5).length;
  if (lowConfidenceCount) {
    if (sourceLevel === "V2" || sourceLevel === "V3") sourceLevel = "V1";
    reasons.push(`OCR 信心度不足的欄位：${lowConfidenceCount} 個（< 0.5）`);
  }

  const expiryValue = input.data["有效期限"] ?? input.data.expiry ?? input.data["到期日"];
  const expiry = validIsoDate(expiryValue);
  const today = input.now ?? new Date();
  if (expiry && expiry.valueOf() < Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())) {
    sourceLevel = "V0";
    reasons.push(`文件已過期：${expiryValue}`);
  }
  if (!input.isValid) {
    sourceLevel = "V0";
    reasons.push("紀錄已標記為無效");
  }

  if (!reasons.length) {
    reasons.push({
      V3: "官方／合作系統直接核驗（DEMO SIMULATED）",
      V2: "可查核第三方文件（DEMO SIMULATED）",
      V1: "自行提交且部分佐證（DEMO SIMULATED）",
      V0: "無法使用或確認異常（DEMO SIMULATED）",
    }[sourceLevel]);
  }
  return { sourceLevel, reason: reasons.join("；"), evidenceIds: input.evidenceId ? [input.evidenceId] : [] };
}
