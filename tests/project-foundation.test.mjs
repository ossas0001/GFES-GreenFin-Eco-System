import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function read(relativePath) {
  return readFile(new URL(relativePath, root), "utf8");
}

test("uses the merged GFES GreenFin project identity", async () => {
  const packageJson = JSON.parse(await read("package.json"));
  const packageLock = JSON.parse(await read("package-lock.json"));
  const readme = await read("README.md");

  assert.equal(packageJson.name, "gfes-greenfin-eco-system");
  assert.equal(packageLock.name, packageJson.name);
  assert.equal(packageLock.packages[""].name, packageJson.name);
  assert.match(packageJson.description, /GFES \(GreenFin Eco System\)/);
  assert.match(readme, /^# GFES \(GreenFin Eco System\)/m);
  assert.match(readme, /授信補充資訊/);
  assert.match(readme, /不是信用評分、自動核貸/);
});

test("ships the merged product, rules, architecture and stage documents", async () => {
  const requiredDocs = [
    "AGENTS.md",
    "docs/PRODUCT_SPEC.md",
    "docs/RULES.md",
    "docs/ARCHITECTURE.md",
    "docs/DECISIONS.md",
    "docs/CURRENT_STAGE.md",
  ];

  await Promise.all(requiredDocs.map((path) => access(new URL(path, root))));

  const agents = await read("AGENTS.md");
  const rules = await read("docs/RULES.md");
  const architecture = await read("docs/ARCHITECTURE.md");
  const decisions = await read("docs/DECISIONS.md");

  assert.match(agents, /Evidence → Structured Data → Verification → Rules → Calculation → Result/);
  assert.match(rules, /GREENFIN_DEMO_V1/);
  assert.match(rules, /不得產生核貸機率、違約機率、額度、利率或信用總分/);
  assert.match(architecture, /Cloudflare D1/);
  assert.match(architecture, /GFES session/);
  assert.match(decisions, /GreenFin replaces the farmer evidence experience/);
});

test("keeps both upstream repositories documented", async () => {
  const agents = await read("AGENTS.md");
  const readme = await read("README.md");

  for (const repository of [
    "https://github.com/yue806161/GFES-green_consumption",
    "https://github.com/stoy95536/GreenFin",
  ]) {
    assert.ok(agents.includes(repository), `${repository} must be documented in AGENTS.md`);
    assert.ok(readme.includes(repository), `${repository} must be documented in README.md`);
  }
});
