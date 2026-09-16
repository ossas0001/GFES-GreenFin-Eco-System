export const GREENFIN_DATA_DOMAINS = [
  "IDENTITY",
  "LAND_CROP",
  "TRANSACTION",
  "INPUT_EQUIPMENT",
  "GREEN_ACTION",
  "CERTIFICATION",
  "LOAN_PURPOSE",
] as const;

export type GreenFinDataDomain = (typeof GREENFIN_DATA_DOMAINS)[number];

export const GREENFIN_SOURCE_LEVELS = ["V0", "V1", "V2", "V3"] as const;
export type GreenFinSourceLevel = (typeof GREENFIN_SOURCE_LEVELS)[number];

export function isGreenFinDataDomain(value: string): value is GreenFinDataDomain {
  return GREENFIN_DATA_DOMAINS.includes(value as GreenFinDataDomain);
}

export function isGreenFinSourceLevel(value: string): value is GreenFinSourceLevel {
  return GREENFIN_SOURCE_LEVELS.includes(value as GreenFinSourceLevel);
}
