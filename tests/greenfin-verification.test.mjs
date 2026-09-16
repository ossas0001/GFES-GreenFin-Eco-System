import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { detectGreenFinAnomalies, GREENFIN_ANOMALY_TYPES } from "../worker/greenfin/services/anomaly/detect.ts";
import { verifyGreenFinRecord } from "../worker/greenfin/services/verification/verify.ts";

const fixedNow = new Date("2026-09-16T00:00:00.000Z");
const verificationRoute = await readFile(new URL("../app/api/greenfin/verification/route.ts", import.meta.url), "utf8");

test("preserves V3/V2/V1 and always explains the verification decision", () => {
  for (const level of ["V3", "V2", "V1"]) {
    const result = verifyGreenFinRecord({
      documentExists: true,
      declaredSourceLevel: level,
      data: { 有效期限: "2030-01-01" },
      isValid: true,
      fieldConfidences: [0.9],
      evidenceId: "doc-1",
      now: fixedNow,
    });
    assert.equal(result.sourceLevel, level);
    assert.ok(result.reason.length > 0);
    assert.deepEqual(result.evidenceIds, ["doc-1"]);
  }
});

test("downgrades low-confidence, expired, invalid and orphan records", () => {
  const low = verifyGreenFinRecord({ documentExists: true, declaredSourceLevel: "V3", data: {}, isValid: true, fieldConfidences: [0.3], now: fixedNow });
  assert.equal(low.sourceLevel, "V1");
  assert.match(low.reason, /信心度/);

  const expired = verifyGreenFinRecord({ documentExists: true, declaredSourceLevel: "V3", data: { 有效期限: "2020-01-01" }, isValid: true, fieldConfidences: [], now: fixedNow });
  assert.equal(expired.sourceLevel, "V0");
  assert.match(expired.reason, /過期/);

  const invalid = verifyGreenFinRecord({ documentExists: true, declaredSourceLevel: "V2", data: {}, isValid: false, fieldConfidences: [], now: fixedNow });
  assert.equal(invalid.sourceLevel, "V0");
  assert.match(invalid.reason, /無效/);

  const orphan = verifyGreenFinRecord({ documentExists: false, declaredSourceLevel: "V1", data: {}, isValid: true, fieldConfidences: [] });
  assert.equal(orphan.sourceLevel, "V0");
  assert.match(orphan.reason, /不存在/);
});

test("detects all eight mandatory anomaly categories", () => {
  const result = detectGreenFinAnomalies({
    domain: "CERTIFICATION",
    data: {
      有效期限: "2020-01-01",
      交易日期: "2035-01-01",
      登記日期: "not-a-date",
      面積: "100",
    },
    sourceLevel: "V0",
    fieldConfidences: [{ name: "證書編號", confidence: 0.2 }],
    duplicateDocumentIds: ["doc-duplicate"],
    peerRecords: [{ 面積: "10" }],
    now: fixedNow,
  });
  const types = new Set(result.map((item) => item.type));
  for (const type of GREENFIN_ANOMALY_TYPES) assert.ok(types.has(type), `missing anomaly: ${type}`);
  assert.equal(result.find((item) => item.type === "EXPIRED")?.severity, "CRITICAL");
});

test("keeps anomalies in a review queue and resolves them without deletion", () => {
  assert.match(verificationRoute, /JOIN greenfin_standardized_records/);
  assert.match(verificationRoute, /ORDER BY anomaly\.is_resolved/);
  assert.match(verificationRoute, /UPDATE greenfin_anomalies SET is_resolved = 1/);
  assert.doesNotMatch(verificationRoute, /DELETE FROM greenfin_anomalies/);
  assert.match(verificationRoute, /WHERE id = \? AND farmer_id = \?/);
  assert.match(verificationRoute, /VERIFICATION_UPDATED/);
  assert.match(verificationRoute, /ANOMALY_DETECTED/);
});
