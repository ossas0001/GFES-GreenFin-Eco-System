import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { GREENFIN_DEMO_RULE_CONFIG, GREENFIN_RULE_VERSION } from "../worker/greenfin/rules/demo-v1.mjs";
import { GreenFinRuleEngine, defaultGreenFinRuleEngine, validateGreenFinRuleConfig } from "../worker/greenfin/rules/engine.ts";

const bootstrap = await readFile(new URL("../db/greenfin.ts", import.meta.url), "utf8");
const route = await readFile(new URL("../app/api/greenfin/rules/route.ts", import.meta.url), "utf8");

test("loads the immutable GREENFIN_DEMO_V1 defaults", () => {
  const engine = defaultGreenFinRuleEngine();
  assert.equal(engine.version, "GREENFIN_DEMO_V1");
  assert.deepEqual(engine.experience.dimensions, ["減量", "增匯", "循環", "綠色治理"]);
  assert.equal(engine.experience.annualLimitPerDimension, 250);
  assert.equal(engine.experience.totalLimit, 1000);
  assert.deepEqual(engine.experience.baseValues, { BASIC: 20, SUSTAINED: 50, CERTIFIED: 100 });
  assert.deepEqual(engine.experience.sourceRatios, { V3: 1, V2: 1, V1: 0.5, V0: 0 });
  assert.deepEqual(validateGreenFinRuleConfig(engine.config), []);
});

test("creates complete calculation traces", () => {
  const engine = defaultGreenFinRuleEngine();
  const trace = engine.createTrace(["doc-1", "doc-2"], { formula: "BASIC(20) × V2(1.0) = 20" }, "2026-09-16T00:00:00.000Z");
  assert.deepEqual(trace, {
    ruleVersion: GREENFIN_RULE_VERSION,
    calculatedAt: "2026-09-16T00:00:00.000Z",
    inputEvidenceIds: ["doc-1", "doc-2"],
    calculationTrace: { formula: "BASIC(20) × V2(1.0) = 20" },
  });
});

test("supports historical versions without changing their configuration", () => {
  const historicalConfig = structuredClone(GREENFIN_DEMO_RULE_CONFIG);
  historicalConfig.experience.totalLimit = 500;
  const v1 = new GreenFinRuleEngine("HISTORICAL_V1", historicalConfig);
  const current = defaultGreenFinRuleEngine();
  assert.equal(v1.experience.totalLimit, 500);
  assert.equal(current.experience.totalLimit, 1000);
  assert.equal(v1.levelFor("credibility", 85), "L5");
});

test("seeds rules once and exposes an authenticated read API", () => {
  assert.match(bootstrap, /INSERT OR IGNORE INTO greenfin_rule_sets/);
  assert.match(bootstrap, /GREENFIN_RULE_VERSION/);
  assert.match(route, /requireAuth\(request, \["farmer", "institution", "admin"\]\)/);
  assert.match(route, /loadGreenFinRuleEngine/);
});
