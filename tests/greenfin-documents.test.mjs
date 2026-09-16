import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { normalizeGreenFinValue, recordTypeForDomain } from "../worker/greenfin/services/documents/normalization.ts";
import { inspectGreenFinFile, validateGreenFinFile } from "../worker/greenfin/services/documents/file.ts";
import { MockOcrProvider } from "../worker/greenfin/services/ocr/provider.ts";

const routeSource = await readFile(new URL("../app/api/greenfin/documents/route.ts", import.meta.url), "utf8");

test("normalizes GreenFin dates, amounts, hectares and text", () => {
  assert.equal(normalizeGreenFinValue("2026/3/5"), "2026-03-05");
  assert.equal(normalizeGreenFinValue("NT$85,000"), "85000");
  assert.equal(normalizeGreenFinValue("0.8 公頃"), "0.8");
  assert.equal(normalizeGreenFinValue("  示範文字  "), "示範文字");
  assert.equal(recordTypeForDomain("CERTIFICATION"), "certification_record");
});

test("mock OCR is explicitly simulated and returns domain fields", async () => {
  const result = await new MockOcrProvider().extract({
    bytes: new Uint8Array([1, 2, 3]),
    filename: "demo.pdf",
    mimeType: "application/pdf",
    domain: "CERTIFICATION",
  });
  assert.equal(result.success, true);
  assert.equal(result.provider, "MockOcrProvider");
  assert.match(result.rawText, /DEMO SIMULATED OCR/);
  assert.ok(result.fields.length >= 4);
  assert.ok(result.fields.every((field) => field.confidence >= 0 && field.confidence <= 1));
});

test("validates file MIME type, size and magic bytes", async () => {
  const pdf = new File([new TextEncoder().encode("%PDF-1.7\nDEMO")], "demo.pdf", { type: "application/pdf" });
  assert.equal(validateGreenFinFile(pdf), "");
  const inspected = await inspectGreenFinFile(pdf);
  assert.equal(inspected.bytes.length, pdf.size);
  assert.equal(inspected.sha256.length, 64);

  const disguised = new File(["not a pdf"], "fake.pdf", { type: "application/pdf" });
  await assert.rejects(() => inspectGreenFinFile(disguised), /檔案內容與格式不符/);
  const unsupported = new File(["demo"], "demo.txt", { type: "text/plain" });
  assert.match(validateGreenFinFile(unsupported), /僅支援/);
});

test("document route enforces GFES farmer sessions, CSRF and ownership", () => {
  assert.match(routeSource, /requireAuth\(request, \["farmer"\], true\)/);
  assert.match(routeSource, /WHERE id = \? AND farmer_id = \?/);
  assert.match(routeSource, /greenfin\/\$\{session\.profileId\}/);
  assert.match(routeSource, /DOCUMENT_UPLOADED/);
  assert.match(routeSource, /OCR_COMPLETED/);
  assert.match(routeSource, /FIELD_CORRECTED/);
});
