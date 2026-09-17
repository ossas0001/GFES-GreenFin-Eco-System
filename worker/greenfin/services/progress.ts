import type { GreenFinRuleEngine } from "../rules/engine";

export type GreenFinExperienceLevel = "L0" | "L1" | "L2" | "L3" | "L4" | "L5";

export const GREENFIN_LEVEL_LABELS: Record<GreenFinExperienceLevel, string> = {
  L0: "尚未開始",
  L1: "綠色起步",
  L2: "穩定累積",
  L3: "多元實踐",
  L4: "成熟治理",
  L5: "示範領航",
};

export type GreenFinProgressInput = {
  documentCount: number;
  processedDocumentCount: number;
  verifiedDocumentCount: number;
  actionCount: number;
  experienceTransactionCount: number;
  indicatorCount: number;
  dataHealthCount: number;
  unresolvedAnomalyCount: number;
};

export type GreenFinProgressStage = {
  id: "documents" | "processing" | "verification" | "actions" | "results";
  label: string;
  detail: string;
  complete: boolean;
};

export function greenFinExperienceLevel(engine: GreenFinRuleEngine, total: number): GreenFinExperienceLevel {
  const boundedTotal = Math.max(0, Math.min(engine.experience.totalLimit, total));
  const match = Object.entries(engine.experience.levels)
    .find(([, [minimum, maximum]]) => boundedTotal >= minimum && boundedTotal <= maximum)?.[0];
  return (match ?? "L0") as GreenFinExperienceLevel;
}

export function summarizeGreenFinExperience(
  engine: GreenFinRuleEngine,
  transactions: Array<{ dimension: string; effectiveValue: number }>,
) {
  const dimensions = Object.fromEntries(engine.experience.dimensions.map((dimension) => [dimension, 0])) as Record<string, number>;
  for (const transaction of transactions) {
    if (!(transaction.dimension in dimensions)) continue;
    dimensions[transaction.dimension] += Number(transaction.effectiveValue) || 0;
  }
  const total = Math.min(engine.experience.totalLimit, Object.values(dimensions).reduce((sum, value) => sum + value, 0));
  const level = greenFinExperienceLevel(engine, total);
  const nextLevelEntry = Object.entries(engine.experience.levels)
    .find(([, [minimum]]) => minimum > total);
  return {
    total,
    level,
    levelLabel: GREENFIN_LEVEL_LABELS[level],
    dimensions,
    annualLimitPerDimension: engine.experience.annualLimitPerDimension,
    totalLimit: engine.experience.totalLimit,
    nextLevel: nextLevelEntry?.[0] as GreenFinExperienceLevel | undefined,
    pointsToNextLevel: nextLevelEntry ? Math.max(0, nextLevelEntry[1][0] - total) : 0,
    ruleVersion: engine.version,
  };
}

export function buildGreenFinProgress(input: GreenFinProgressInput) {
  const stages: GreenFinProgressStage[] = [
    {
      id: "documents",
      label: "文件蒐集",
      detail: input.documentCount ? `已上傳 ${input.documentCount} 份文件` : "上傳第一份原始文件",
      complete: input.documentCount > 0,
    },
    {
      id: "processing",
      label: "OCR 與標準化",
      detail: input.processedDocumentCount ? `${input.processedDocumentCount} 份完成欄位確認與標準化` : "確認 OCR 欄位並完成標準化",
      complete: input.processedDocumentCount > 0,
    },
    {
      id: "verification",
      label: "來源核驗",
      detail: input.verifiedDocumentCount ? `${input.verifiedDocumentCount} 份完成來源核驗` : "完成來源強度與異常檢查",
      complete: input.verifiedDocumentCount > 0,
    },
    {
      id: "actions",
      label: "綠色行動",
      detail: input.actionCount ? `已建立 ${input.actionCount} 筆有效行動` : "建立至少一筆綠色行動",
      complete: input.actionCount > 0,
    },
    {
      id: "results",
      label: "三類結果",
      detail: input.unresolvedAnomalyCount
        ? `尚有 ${input.unresolvedAnomalyCount} 筆異常待覆核`
        : "產出經驗值、四大指標與 Data Health",
      complete: input.experienceTransactionCount > 0 && input.indicatorCount >= 4 && input.dataHealthCount >= 7,
    },
  ];
  const completedStageCount = stages.filter((stage) => stage.complete).length;
  const nextStage = stages.find((stage) => !stage.complete) ?? null;
  return {
    progressPercent: Math.round(completedStageCount / stages.length * 100),
    completedStageCount,
    totalStageCount: stages.length,
    nextAction: nextStage?.detail ?? "GreenFin 履歷已完成目前所有階段",
    stages,
    unresolvedAnomalyCount: input.unresolvedAnomalyCount,
  };
}
