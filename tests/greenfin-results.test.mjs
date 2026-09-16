import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { defaultGreenFinRuleEngine } from "../worker/greenfin/rules/engine.ts";
import { calculateDataHealthResults, calculateExperienceResults, calculateIndicatorResults } from "../worker/greenfin/services/calculation/results.ts";

const engine = defaultGreenFinRuleEngine();
const route = await readFile(new URL("../app/api/greenfin/results/route.ts", import.meta.url), "utf8");
const record = (id, domain, data, sourceLevel = "V2") => ({ id, documentId: `doc-${id}`, domain, data, sourceLevel, isValid: true });

test("calculates experience using base value, source ratio and caps", () => {
  const records = [record("r1", "GREEN_ACTION", { 活動名稱: "測試", 執行日期: "2026-01-01" }, "V1")];
  const actions = Array.from({ length: 20 }, (_, index) => ({ id: `a${index}`, dimension: "減量", actionLevel: "CERTIFIED", evidenceRecordIds: ["r1"], actionDate: `2026-01-${String(index + 1).padStart(2, "0")}` }));
  const result = calculateExperienceResults(engine, actions, records);
  assert.equal(result.dimensions["減量"], 250);
  assert.equal(result.total, 250);
  assert.equal(result.transactions[0].baseValue, 100);
  assert.equal(result.transactions[0].sourceRecognitionRatio, 0.5);
  assert.ok(result.transactions.some((transaction) => transaction.trace.calculationTrace.capped === true));
});

test("returns four independent indicators with traceable inputs", () => {
  const records = [
    record("identity", "IDENTITY", { 姓名: "DEMO", 身分證字號: "DEMO" }, "V3"),
    record("transaction", "TRANSACTION", { 交易對象: "DEMO", 交易金額: "1000", 交易日期: "2026-01-01" }, "V2"),
    record("green", "GREEN_ACTION", { 活動名稱: "DEMO", 執行日期: "2026-01-02" }, "V2"),
  ];
  const experience = calculateExperienceResults(engine, [{ id: "a1", dimension: "循環", actionLevel: "BASIC", evidenceRecordIds: ["green"], actionDate: "2026-01-02" }], records);
  const results = calculateIndicatorResults(engine, records, [], experience, 3);
  assert.deepEqual(results.map((result) => result.type), ["completeness", "credibility", "businessMaturity", "greenMaturity"]);
  assert.ok(results.every((result) => result.score >= 0 && result.score <= 100));
  assert.ok(results.every((result) => result.trace.ruleVersion === "GREENFIN_DEMO_V1"));
});

test("assigns Data Health using GRAY RED YELLOW GREEN priority", () => {
  const records = [
    record("red", "CERTIFICATION", { 認證機構: "DEMO" }, "V0"),
    record("yellow", "IDENTITY", { 姓名: "DEMO", 身分證字號: "DEMO" }, "V1"),
    record("green", "TRANSACTION", { 交易對象: "DEMO", 交易金額: "1000", 交易日期: "2026-01-01" }, "V2"),
  ];
  const results = calculateDataHealthResults(engine, records, [], new Date("2026-09-16T00:00:00Z"));
  assert.equal(results.find((result) => result.domain === "CERTIFICATION").status, "RED");
  assert.equal(results.find((result) => result.domain === "IDENTITY").status, "YELLOW");
  assert.equal(results.find((result) => result.domain === "TRANSACTION").status, "GREEN");
  assert.equal(results.find((result) => result.domain === "LAND_CROP").status, "GRAY");
  assert.ok(results.every((result) => result.reasons.length > 0));
});

test("API persists three outputs separately and forbids a combined credit score", () => {
  assert.match(route, /greenfin_experience_transactions/);
  assert.match(route, /greenfin_indicator_results/);
  assert.match(route, /greenfin_data_health_results/);
  assert.match(route, /三類輸出彼此獨立/);
  assert.doesNotMatch(route, /creditScore|combinedScore|totalScore/);
  assert.match(route, /requireAuth\(request, \["farmer", "admin"\], true\)/);
});
