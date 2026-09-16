import type { GreenFinDataDomain } from "../../domain";

export function normalizeGreenFinValue(rawValue: string) {
  const value = rawValue.trim();
  const date = value.match(/^(\d{4})[/.\-](\d{1,2})[/.\-](\d{1,2})$/);
  if (date) return `${date[1]}-${date[2].padStart(2, "0")}-${date[3].padStart(2, "0")}`;

  const amount = value.match(/^(?:NT\$?|＄|\$)\s*([\d,]+(?:\.\d+)?)$/i);
  if (amount) return amount[1].replaceAll(",", "");

  const hectares = value.match(/^([\d.]+)\s*公頃$/);
  if (hectares) return hectares[1];
  return value;
}

export function recordTypeForDomain(domain: GreenFinDataDomain) {
  return {
    IDENTITY: "identity_record",
    LAND_CROP: "land_crop_record",
    TRANSACTION: "transaction_record",
    INPUT_EQUIPMENT: "equipment_record",
    GREEN_ACTION: "green_activity_record",
    CERTIFICATION: "certification_record",
    LOAN_PURPOSE: "loan_purpose_record",
  }[domain];
}
