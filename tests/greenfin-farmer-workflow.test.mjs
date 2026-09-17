import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const ui = await readFile(new URL("../app/GreenPlatformDemo.tsx", import.meta.url), "utf8");
const actionsRoute = await readFile(new URL("../app/api/greenfin/actions/route.ts", import.meta.url), "utf8");
const resultsRoute = await readFile(new URL("../app/api/greenfin/results/route.ts", import.meta.url), "utf8");
const platformBackend = await readFile(new URL("../db/platform.ts", import.meta.url), "utf8");

test("replaces the farmer evidence page with the GreenFin workflow", () => {
  assert.match(ui, /type FarmerPage = .*"greenfin"/);
  assert.match(ui, /GreenFin 綠色數位履歷/);
  assert.match(ui, /文件與 OCR/);
  assert.match(ui, /綠色行動/);
  assert.match(ui, /綠色經驗值/);
  assert.match(ui, /四大指標/);
  assert.match(ui, /Data Health/);
  assert.match(ui, /進入 GreenFin 完整工作台/);
  assert.match(ui, /數位履歷建置進度/);
  assert.doesNotMatch(ui, /farmerPage === "evidence"/);
});

test("keeps GreenFin progress and public farmer levels backend-derived", () => {
  assert.match(resultsRoute, /summarizeGreenFinExperience/);
  assert.match(resultsRoute, /buildGreenFinProgress/);
  assert.match(platformBackend, /greenFinExperienceLevel/);
  assert.match(platformBackend, /greenFinPublicLevel/);
  assert.match(platformBackend, /greenFinExperienceByFarmer/);
  assert.match(ui, /GreenFin 建置進度/);
  assert.match(ui, /GreenFin 綠色經驗等級/);
  assert.match(ui, /GreenFinLevelBadge/);
  assert.match(ui, /item\.greenFinPublicLevel/);
  assert.doesNotMatch(ui, /results\.experience\.reduce/);
});

test("wires the complete farmer document lifecycle", () => {
  assert.match(ui, /\/api\/greenfin\/documents/);
  assert.match(ui, /確認欄位/);
  assert.match(ui, /標準化/);
  assert.match(ui, /\/api\/greenfin\/verification/);
  assert.match(ui, /\/api\/greenfin\/results/);
  assert.match(ui, /SIMULATED OCR/);
  assert.match(ui, /查看與補件/);
  assert.match(ui, /確認欄位並送出補件/);
  assert.match(ui, /載入 DEMO 核驗資料/);
  assert.match(ui, /\/api\/greenfin\/demo/);
  assert.match(ui, /const seen = new Set<string>/);
});

test("green actions enforce farmer ownership and accepted dimensions", () => {
  assert.match(actionsRoute, /requireAuth\(request, \["farmer"\], true\)/);
  assert.match(actionsRoute, /WHERE id = \? AND farmer_id = \?/);
  for (const dimension of ["減量", "增匯", "循環", "綠色治理"]) assert.match(actionsRoute, new RegExp(dimension));
  for (const level of ["BASIC", "SUSTAINED", "CERTIFIED"]) assert.match(actionsRoute, new RegExp(level));
  assert.match(actionsRoute, /is_active = 0/);
});
