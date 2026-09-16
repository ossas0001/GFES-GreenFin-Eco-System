import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";

const migration = await readFile(new URL("../drizzle/0024_late_retro_girl.sql", import.meta.url), "utf8");
const schemaSource = await readFile(new URL("../db/schema.ts", import.meta.url), "utf8");
const bootstrapSource = await readFile(new URL("../db/greenfin.ts", import.meta.url), "utf8");

function migratedDatabase() {
  const database = new DatabaseSync(":memory:");
  database.exec(migration.replaceAll("--> statement-breakpoint", ""));
  return database;
}

test("creates every GreenFin core table in an isolated SQLite database", () => {
  const database = migratedDatabase();
  const tables = database.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((row) => row.name);
  const expected = [
    "greenfin_farms",
    "greenfin_crops",
    "greenfin_documents",
    "greenfin_document_fields",
    "greenfin_standardized_records",
    "greenfin_verification_results",
    "greenfin_anomalies",
    "greenfin_rule_sets",
    "greenfin_actions",
    "greenfin_experience_transactions",
    "greenfin_indicator_results",
    "greenfin_data_health_results",
    "greenfin_authorizations",
    "greenfin_bank_cases",
    "greenfin_audit_logs",
  ];
  for (const table of expected) assert.ok(tables.includes(table), `missing table: ${table}`);
  assert.ok(!tables.includes("greenfin_users"), "GFES profiles must remain the single identity source");
});

test("preserves evidence lineage and independent result models", () => {
  for (const requiredColumn of ["rule_version", "calculated_at", "input_evidence_ids_json", "calculation_trace_json"]) {
    assert.match(schemaSource, new RegExp(requiredColumn.replaceAll("_", "[A-Z_a-z]*"), "i"));
  }
  assert.match(schemaSource, /greenfinExperienceTransactions/);
  assert.match(schemaSource, /greenfinIndicatorResults/);
  assert.match(schemaSource, /greenfinDataHealthResults/);
});

test("enforces per-farmer document deduplication when a hash is available", () => {
  const database = migratedDatabase();
  const insert = database.prepare(`INSERT INTO greenfin_documents
    (id, farmer_id, original_name, file_sha256, storage_key, domain)
    VALUES (?, ?, ?, ?, ?, ?)`);
  insert.run("doc-1", "farmer-1", "first.pdf", "same-hash", "greenfin/farmer-1/first.pdf", "CERTIFICATION");
  assert.throws(
    () => insert.run("doc-2", "farmer-1", "second.pdf", "same-hash", "greenfin/farmer-1/second.pdf", "CERTIFICATION"),
    /UNIQUE constraint failed/,
  );
  insert.run("doc-3", "farmer-2", "third.pdf", "same-hash", "greenfin/farmer-2/third.pdf", "CERTIFICATION");
});

test("keeps migration and runtime D1 bootstrap aligned", () => {
  const migrationTables = [...migration.matchAll(/CREATE TABLE `([^`]+)`/g)].map((match) => match[1]);
  for (const table of migrationTables) assert.ok(bootstrapSource.includes(`CREATE TABLE IF NOT EXISTS ${table}`), `bootstrap missing ${table}`);
  assert.match(bootstrapSource, /ensureGreenFinSchema/);
});
