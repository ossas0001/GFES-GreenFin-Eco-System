import { GREENFIN_DATA_DOMAINS, type GreenFinDataDomain, type GreenFinSourceLevel } from "../../domain.ts";
import type { GreenFinRuleEngine } from "../../rules/engine";

export type CalculationRecord = {
  id: string;
  documentId: string;
  domain: GreenFinDataDomain;
  data: Record<string, string>;
  sourceLevel: GreenFinSourceLevel;
  isValid: boolean;
};

export type CalculationAnomaly = { recordId: string; severity: "INFO" | "WARNING" | "CRITICAL"; isResolved: boolean };
export type CalculationAction = { id: string; dimension: string; actionLevel: "BASIC" | "SUSTAINED" | "CERTIFIED"; evidenceRecordIds: string[]; actionDate: string };

export function calculateExperienceResults(engine: GreenFinRuleEngine, actions: CalculationAction[], records: CalculationRecord[]) {
  const recordMap = new Map(records.map((record) => [record.id, record]));
  const dimensions = Object.fromEntries(engine.experience.dimensions.map((dimension) => [dimension, 0])) as Record<string, number>;
  let total = 0;
  const transactions = actions.sort((a, b) => a.actionDate.localeCompare(b.actionDate)).map((action) => {
    const baseValue = engine.experience.baseValues[action.actionLevel];
    const evidence = action.evidenceRecordIds.map((id) => recordMap.get(id)).filter(Boolean) as CalculationRecord[];
    const levelOrder = { V0: 0, V1: 1, V2: 2, V3: 3 };
    const sourceLevel = evidence.length
      ? evidence.reduce<GreenFinSourceLevel>((lowest, record) => levelOrder[record.sourceLevel] < levelOrder[lowest] ? record.sourceLevel : lowest, "V3")
      : "V1";
    const ratio = engine.experience.sourceRatios[sourceLevel];
    const rawValue = baseValue * ratio;
    const dimensionRemaining = Math.max(0, engine.experience.annualLimitPerDimension - (dimensions[action.dimension] ?? 0));
    const totalRemaining = Math.max(0, engine.experience.totalLimit - total);
    const effectiveValue = Math.min(rawValue, dimensionRemaining, totalRemaining);
    dimensions[action.dimension] = (dimensions[action.dimension] ?? 0) + effectiveValue;
    total += effectiveValue;
    return {
      actionId: action.id, dimension: action.dimension, baseValue, sourceLevel, sourceRecognitionRatio: ratio, effectiveValue,
      evidenceIds: evidence.map((record) => record.id),
      trace: engine.createTrace(evidence.map((record) => record.id), { formula: `${action.actionLevel}(${baseValue}) × ${sourceLevel}(${ratio})`, rawValue, effectiveValue, capped: effectiveValue < rawValue }),
    };
  });
  const levelEntry = Object.entries(engine.experience.levels).find(([, [minimum, maximum]]) => total >= minimum && total <= maximum);
  return { total, level: levelEntry?.[0] ?? "L0", dimensions, transactions };
}

function indicatorResult(engine: GreenFinRuleEngine, type: "completeness" | "credibility" | "businessMaturity" | "greenMaturity", score: number, details: Record<string, unknown>, evidenceIds: string[]) {
  const bounded = Math.round(Math.max(0, Math.min(100, score)) * 10) / 10;
  return { type, score: bounded, level: engine.levelFor(type, bounded), details, trace: engine.createTrace(evidenceIds, { type, score: bounded, details }) };
}

export function calculateIndicatorResults(engine: GreenFinRuleEngine, records: CalculationRecord[], anomalies: CalculationAnomaly[], experience: ReturnType<typeof calculateExperienceResults>, documentCount: number) {
  const valid = records.filter((record) => record.isValid);
  const covered = new Set(valid.map((record) => record.domain));
  const tiers = engine.indicators.completeness.domainTiers;
  const weights = engine.indicators.completeness.tierWeights as Record<string, number>;
  const totalWeight = Object.values(tiers).reduce((sum, tier) => sum + weights[tier], 0);
  const achieved = Object.entries(tiers).reduce((sum, [domain, tier]) => sum + (covered.has(domain as GreenFinDataDomain) ? weights[tier] : 0), 0);
  const completeness = indicatorResult(engine, "completeness", totalWeight ? achieved / totalWeight * 100 : 0, { coveredDomains: [...covered], achievedWeight: achieved, totalWeight }, valid.map((record) => record.id));

  const sourceScores = engine.indicators.credibility.sourceLevelScores;
  const sourceAverage = records.length ? records.reduce((sum, record) => sum + sourceScores[record.sourceLevel], 0) / records.length : 0;
  const unresolved = anomalies.filter((anomaly) => !anomaly.isResolved && records.some((record) => record.id === anomaly.recordId));
  const penalty = Math.min(unresolved.length * engine.indicators.credibility.anomalyPenaltyPer, engine.indicators.credibility.anomalyPenaltyMax);
  const traceabilityBonus = records.length ? records.filter((record) => record.documentId).length / records.length * engine.indicators.credibility.traceabilityBonusMax : 0;
  const credibility = indicatorResult(engine, "credibility", sourceAverage - penalty + traceabilityBonus, { sourceAverage, anomalyPenalty: penalty, traceabilityBonus }, records.map((record) => record.id));

  const maturityRules = engine.indicators.businessMaturity;
  const variety = covered.size / GREENFIN_DATA_DOMAINS.length * maturityRules.varietyMax;
  const volume = Math.min(Math.log2(records.length + 1) / Math.log2(Math.max(2, maturityRules.volumeSaturationRecords)) * maturityRules.volumeMax, maturityRules.volumeMax);
  const documentScore = Math.min(documentCount / Math.max(1, maturityRules.documentSaturationCount) * maturityRules.documentMax, maturityRules.documentMax);
  const transactionBonus = covered.has("TRANSACTION") ? maturityRules.transactionBonus : 0;
  const businessMaturity = indicatorResult(engine, "businessMaturity", variety + volume + documentScore + transactionBonus, { variety, volume, documentScore, transactionBonus }, records.map((record) => record.id));

  const greenRules = engine.indicators.greenMaturity;
  const experienceScore = experience.total / engine.experience.totalLimit * greenRules.experienceMax;
  const activeDimensions = Object.values(experience.dimensions).filter((value) => value > 0).length;
  const breadthScore = activeDimensions * greenRules.breadthPerDimension;
  const greenRecords = records.filter((record) => record.domain === "GREEN_ACTION");
  const qualityRatio = greenRecords.length ? greenRecords.filter((record) => record.sourceLevel === "V2" || record.sourceLevel === "V3").length / greenRecords.length : 0;
  const qualityScore = qualityRatio * greenRules.qualityMax;
  const greenMaturity = indicatorResult(engine, "greenMaturity", experienceScore + breadthScore + qualityScore, { experienceScore, activeDimensions, breadthScore, qualityRatio, qualityScore }, experience.transactions.flatMap((transaction) => transaction.evidenceIds));
  return [completeness, credibility, businessMaturity, greenMaturity];
}

const DOMAIN_LABELS: Record<GreenFinDataDomain, string> = {
  IDENTITY: "身分與資格", LAND_CROP: "土地與作物", TRANSACTION: "經營與交易", INPUT_EQUIPMENT: "投入與設備",
  GREEN_ACTION: "綠色行動", CERTIFICATION: "認證與治理", LOAN_PURPOSE: "申貸用途",
};

export function calculateDataHealthResults(engine: GreenFinRuleEngine, records: CalculationRecord[], anomalies: CalculationAnomaly[], now = new Date()) {
  return GREENFIN_DATA_DOMAINS.map((domain) => {
    const domainRecords = records.filter((record) => record.domain === domain);
    const evidenceIds = domainRecords.map((record) => record.id);
    if (!domainRecords.length) return { domain, status: "GRAY", reasons: ["此領域尚未提供任何資料"], actions: [`建議上傳${DOMAIN_LABELS[domain]}相關文件`], evidenceIds };
    const domainAnomalies = anomalies.filter((anomaly) => !anomaly.isResolved && domainRecords.some((record) => record.id === anomaly.recordId));
    const required = engine.dataHealth.domainRequiredFields[domain];
    const fields = new Set(domainRecords.flatMap((record) => Object.keys(record.data)));
    const missing = required.filter((field) => !fields.has(field));
    const critical = domainAnomalies.filter((anomaly) => anomaly.severity === "CRITICAL");
    const invalid = domainRecords.filter((record) => !record.isValid || record.sourceLevel === "V0");
    if (critical.length || missing.length || invalid.length) return { domain, status: "RED", reasons: [`重大異常 ${critical.length} 筆`, ...(missing.length ? [`缺少必要欄位：${missing.join("、")}`] : []), ...(invalid.length ? [`無法使用紀錄 ${invalid.length} 筆`] : [])], actions: ["請檢視異常並補充有效佐證"], evidenceIds };
    const warning = domainAnomalies.filter((anomaly) => anomaly.severity === "WARNING");
    const expiringSoon = domainRecords.some((record) => {
      const value = record.data["有效期限"];
      if (!value) return false;
      const delta = new Date(`${value}T00:00:00Z`).valueOf() - now.valueOf();
      return delta >= 0 && delta <= engine.dataHealth.expiryWarningDays * 86400000;
    });
    const onlyV1 = domainRecords.every((record) => record.sourceLevel === "V1");
    if (warning.length || expiringSoon || onlyV1) return { domain, status: "YELLOW", reasons: [...(warning.length ? [`一般異常 ${warning.length} 筆`] : []), ...(expiringSoon ? ["部分資料即將到期"] : []), ...(onlyV1 ? ["資料僅為自行提交（V1）"] : [])], actions: ["建議完成覆核或取得第三方佐證"], evidenceIds };
    return { domain, status: "GREEN", reasons: ["資料完整且經核驗，目前可供參考"], actions: [], evidenceIds };
  });
}
