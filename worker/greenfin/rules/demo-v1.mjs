export const GREENFIN_RULE_VERSION = "GREENFIN_DEMO_V1";

export const GREENFIN_DEMO_RULE_CONFIG = {
  experience: {
    dimensions: ["減量", "增匯", "循環", "綠色治理"],
    annualLimitPerDimension: 250,
    totalLimit: 1000,
    baseValues: { BASIC: 20, SUSTAINED: 50, CERTIFIED: 100 },
    sourceRatios: { V3: 1, V2: 1, V1: 0.5, V0: 0 },
    levels: { L0: [0, 0], L1: [1, 200], L2: [201, 400], L3: [401, 600], L4: [601, 800], L5: [801, 1000] },
  },
  indicators: {
    completeness: {
      tierWeights: { coreRequired: 3, importantSupporting: 2, supplementary: 1 },
      domainTiers: {
        IDENTITY: "coreRequired", LAND_CROP: "coreRequired", TRANSACTION: "importantSupporting",
        CERTIFICATION: "importantSupporting", GREEN_ACTION: "importantSupporting",
        INPUT_EQUIPMENT: "supplementary", LOAN_PURPOSE: "supplementary",
      },
    },
    credibility: { sourceLevelScores: { V0: 0, V1: 33, V2: 67, V3: 100 }, anomalyPenaltyPer: 5, anomalyPenaltyMax: 30, traceabilityBonusMax: 10 },
    businessMaturity: { varietyMax: 40, volumeMax: 30, volumeSaturationRecords: 20, documentMax: 20, documentSaturationCount: 10, transactionBonus: 10 },
    greenMaturity: { experienceMax: 40, breadthPerDimension: 10, qualityMax: 20 },
    levelThresholds: {
      completeness: [[0, 39], [40, 59], [60, 79], [80, 94], [95, 100]],
      credibility: [[0, 19], [20, 39], [40, 59], [60, 79], [80, 100]],
      businessMaturity: [[0, 19], [20, 39], [40, 59], [60, 79], [80, 100]],
      greenMaturity: [[0, 19], [20, 39], [40, 59], [60, 79], [80, 100]],
    },
  },
  dataHealth: {
    priorityOrder: ["GRAY", "RED", "YELLOW", "GREEN"],
    domainRequiredFields: {
      IDENTITY: ["姓名", "身分證字號"], LAND_CROP: ["地段", "面積"],
      TRANSACTION: ["交易對象", "交易金額", "交易日期"], INPUT_EQUIPMENT: ["設備名稱", "購入日期", "金額"],
      GREEN_ACTION: ["活動名稱", "執行日期"], CERTIFICATION: ["認證機構", "有效期限"],
      LOAN_PURPOSE: ["申貸用途", "預估金額"],
    },
    expiryWarningDays: 90,
    criticalAnomalyTypes: ["EXPIRED", "VERIFICATION_FAILED", "MISSING_REQUIRED_FIELD"],
  },
};
