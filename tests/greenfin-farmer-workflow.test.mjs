import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const ui = await readFile(new URL("../app/GreenPlatformDemo.tsx", import.meta.url), "utf8");
const actionsRoute = await readFile(new URL("../app/api/greenfin/actions/route.ts", import.meta.url), "utf8");

test("replaces the farmer evidence page with the GreenFin workflow", () => {
  assert.match(ui, /type FarmerPage = .*"greenfin"/);
  assert.match(ui, /GreenFin 綠色數位履歷/);
  assert.match(ui, /文件與 OCR/);
  assert.match(ui, /綠色行動/);
  assert.match(ui, /綠色經驗值/);
  assert.match(ui, /四大指標/);
  assert.match(ui, /Data Health/);
  assert.doesNotMatch(ui, /farmerPage === "evidence"/);
});

test("wires the complete farmer document lifecycle", () => {
  assert.match(ui, /\/api\/greenfin\/documents/);
  assert.match(ui, /確認欄位/);
  assert.match(ui, /正規化/);
  assert.match(ui, /\/api\/greenfin\/verification/);
  assert.match(ui, /\/api\/greenfin\/results/);
  assert.match(ui, /SIMULATED OCR/);
});

test("green actions enforce farmer ownership and accepted dimensions", () => {
  assert.match(actionsRoute, /requireAuth\(request, \["farmer"\], true\)/);
  assert.match(actionsRoute, /WHERE id = \? AND farmer_id = \?/);
  for (const dimension of ["減量", "增匯", "循環", "綠色治理"]) assert.match(actionsRoute, new RegExp(dimension));
  for (const level of ["BASIC", "SUSTAINED", "CERTIFIED"]) assert.match(actionsRoute, new RegExp(level));
  assert.match(actionsRoute, /is_active = 0/);
});
