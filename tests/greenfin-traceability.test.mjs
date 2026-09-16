import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const traceability = await readFile(new URL("../worker/greenfin/traceability.ts", import.meta.url), "utf8");
const reportRoute = await readFile(new URL("../app/api/greenfin/reports/route.ts", import.meta.url), "utf8");
const ui = await readFile(new URL("../app/GreenPlatformDemo.tsx", import.meta.url), "utf8");

test("builds the complete GreenFin evidence lineage", () => {
  assert.match(traceability, /Result → Calculation Trace → Rule Version → Standardized Record → Document Field → Original Document/);
  for (const table of [
    "greenfin_experience_transactions", "greenfin_indicator_results", "greenfin_data_health_results",
    "greenfin_rule_sets", "greenfin_standardized_records", "greenfin_document_fields", "greenfin_documents",
    "greenfin_verification_results", "greenfin_anomalies",
  ]) assert.match(traceability, new RegExp(table));
  assert.match(traceability, /WHERE farmer_id = \?/);
  assert.match(traceability, /evidenceSummary/);
});

test("report generation rechecks authorization and writes required audit events", () => {
  assert.match(reportRoute, /requireAuth\(request, \["institution"\], true\)/);
  assert.match(reportRoute, /requireActiveGreenFinAuthorization/);
  assert.match(reportRoute, /buildGreenFinTracePackage/);
  assert.match(reportRoute, /BANK_DATA_ACCESSED/);
  assert.match(reportRoute, /REPORT_GENERATED/);
  assert.match(reportRoute, /三類結果彼此獨立/);
});

test("institution workspace can generate the traceable package", () => {
  assert.match(ui, /\/api\/greenfin\/reports/);
  assert.match(ui, /產生可追溯資料包/);
  assert.match(ui, /application\/json/);
});
