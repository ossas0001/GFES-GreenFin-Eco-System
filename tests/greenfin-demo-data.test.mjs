import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const route = await readFile(new URL("../app/api/greenfin/demo/route.ts", import.meta.url), "utf8");

test("the GreenFin demo fixture is farmer-only, CSRF-protected, and explicitly simulated", () => {
  assert.match(route, /requireAuth\(request, \["farmer"\], true\)/);
  assert.match(route, /DEMO[／_]SIMULATED/);
  assert.match(route, /mode: "SIMULATED"/);
});

test("the demo fixture creates both pending and verified document paths", () => {
  assert.match(route, /'OCR_COMPLETED'/);
  assert.match(route, /'VERIFIED'/);
  assert.match(route, /greenfin_document_fields/);
  assert.match(route, /greenfin_standardized_records/);
  assert.match(route, /greenfin_verification_results/);
  assert.match(route, /bucket\.put/);
});

test("the demo fixture is idempotent and creates traceable audit events", () => {
  assert.match(route, /INSERT OR IGNORE/);
  assert.match(route, /DOCUMENT_UPLOADED/);
  assert.match(route, /OCR_COMPLETED/);
  assert.match(route, /VERIFICATION_UPDATED/);
  assert.match(route, /greenFinAuditStatement/);
});
