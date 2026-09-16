import { GREENFIN_DEMO_RULE_CONFIG } from "./demo-v1.mjs";

/** @type {Record<import("../domain.ts").GreenFinDataDomain, string[]>} */
export const GREENFIN_REQUIRED_FIELDS = GREENFIN_DEMO_RULE_CONFIG.dataHealth.domainRequiredFields;
