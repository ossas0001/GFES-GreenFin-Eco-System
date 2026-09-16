import { GREENFIN_DEMO_RULE_CONFIG, GREENFIN_RULE_VERSION } from "./demo-v1.mjs";

export type GreenFinRuleConfig = typeof GREENFIN_DEMO_RULE_CONFIG;

export type GreenFinCalculationTrace = {
  ruleVersion: string;
  calculatedAt: string;
  inputEvidenceIds: string[];
  calculationTrace: Record<string, unknown>;
};

export function validateGreenFinRuleConfig(config: GreenFinRuleConfig) {
  const errors: string[] = [];
  if (config.experience.totalLimit <= 0) errors.push("experience.totalLimit must be positive");
  if (config.experience.annualLimitPerDimension <= 0) errors.push("experience.annualLimitPerDimension must be positive");
  for (const level of ["BASIC", "SUSTAINED", "CERTIFIED"] as const) {
    if (!Number.isFinite(config.experience.baseValues[level])) errors.push(`missing experience.baseValues.${level}`);
  }
  for (const source of ["V0", "V1", "V2", "V3"] as const) {
    const ratio = config.experience.sourceRatios[source];
    if (!Number.isFinite(ratio) || ratio < 0 || ratio > 1) errors.push(`invalid experience.sourceRatios.${source}`);
  }
  if (config.experience.dimensions.length !== 4) errors.push("experience.dimensions must contain four dimensions");
  return errors;
}

export class GreenFinRuleEngine {
  readonly version: string;
  readonly config: GreenFinRuleConfig;

  constructor(version: string, config: GreenFinRuleConfig) {
    const errors = validateGreenFinRuleConfig(config);
    if (errors.length) throw new Error(`Invalid GreenFin rule config: ${errors.join("; ")}`);
    this.version = version;
    this.config = config;
  }

  get experience() { return this.config.experience; }
  get indicators() { return this.config.indicators; }
  get dataHealth() { return this.config.dataHealth; }

  levelFor(indicator: keyof GreenFinRuleConfig["indicators"]["levelThresholds"], score: number) {
    const bands = this.config.indicators.levelThresholds[indicator];
    let level = "L1";
    bands.forEach(([minimum], index) => { if (score >= minimum) level = `L${index + 1}`; });
    return level;
  }

  createTrace(inputEvidenceIds: string[], calculationTrace: Record<string, unknown>, calculatedAt = new Date().toISOString()): GreenFinCalculationTrace {
    return { ruleVersion: this.version, calculatedAt, inputEvidenceIds: [...inputEvidenceIds], calculationTrace };
  }
}

export function defaultGreenFinRuleEngine() {
  return new GreenFinRuleEngine(GREENFIN_RULE_VERSION, GREENFIN_DEMO_RULE_CONFIG);
}

export async function loadGreenFinRuleEngine(db: D1Database, version?: string) {
  const row = version
    ? await db.prepare("SELECT version, config_json FROM greenfin_rule_sets WHERE version = ?").bind(version).first<{ version: string; config_json: string }>()
    : await db.prepare("SELECT version, config_json FROM greenfin_rule_sets WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1").first<{ version: string; config_json: string }>();
  if (!row) throw new Error(version ? `找不到規則版本：${version}` : "找不到啟用中的 GreenFin 規則");
  return new GreenFinRuleEngine(row.version, JSON.parse(row.config_json) as GreenFinRuleConfig);
}
