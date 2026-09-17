import assert from "node:assert/strict";
import test from "node:test";

import { defaultGreenFinRuleEngine } from "../worker/greenfin/rules/engine.ts";
import { buildGreenFinProgress, greenFinExperienceLevel, summarizeGreenFinExperience } from "../worker/greenfin/services/progress.ts";

const engine = defaultGreenFinRuleEngine();

test("maps GreenFin experience totals to the rule-defined L0-L5 levels", () => {
  assert.equal(greenFinExperienceLevel(engine, 0), "L0");
  assert.equal(greenFinExperienceLevel(engine, 1), "L1");
  assert.equal(greenFinExperienceLevel(engine, 201), "L2");
  assert.equal(greenFinExperienceLevel(engine, 401), "L3");
  assert.equal(greenFinExperienceLevel(engine, 601), "L4");
  assert.equal(greenFinExperienceLevel(engine, 801), "L5");
});

test("summarizes GreenFin experience on the backend without combining analysis indicators", () => {
  const summary = summarizeGreenFinExperience(engine, [
    { dimension: "減量", effectiveValue: 100 },
    { dimension: "循環", effectiveValue: 150 },
  ]);
  assert.equal(summary.total, 250);
  assert.equal(summary.level, "L2");
  assert.equal(summary.dimensions["減量"], 100);
  assert.equal(summary.dimensions["循環"], 150);
  assert.equal(summary.ruleVersion, "GREENFIN_DEMO_V1");
  assert.equal("combinedScore" in summary, false);
});

test("tracks the five GreenFin workflow stages and identifies the next action", () => {
  const progress = buildGreenFinProgress({
    documentCount: 2,
    processedDocumentCount: 1,
    verifiedDocumentCount: 0,
    actionCount: 0,
    experienceTransactionCount: 0,
    indicatorCount: 0,
    dataHealthCount: 0,
    unresolvedAnomalyCount: 0,
  });
  assert.equal(progress.progressPercent, 40);
  assert.equal(progress.completedStageCount, 2);
  assert.match(progress.nextAction, /來源強度與異常檢查/);
});
