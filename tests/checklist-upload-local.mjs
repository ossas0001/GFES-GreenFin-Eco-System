import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";

const baseUrl = process.env.GFES_TEST_URL ?? "http://localhost:4310";

async function registerConsumer() {
  const suffix = randomUUID().replaceAll("-", "").slice(0, 12);
  const response = await fetch(`${baseUrl}/api/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ role: "consumer", displayName: "本地驗收帳號", username: `audit_${suffix}`, email: `audit_${suffix}@example.test`, password: `Local${suffix}!` }),
  });
  assert.equal(response.status, 201);
  const body = await response.json();
  return { cookie: response.headers.get("set-cookie").split(";")[0], csrf: body.csrfToken };
}

async function upload(session, file) {
  const form = new FormData();
  form.set("actionType", "reusable_cup");
  form.set("file", file);
  return fetch(`${baseUrl}/api/uploads`, { method: "POST", headers: { cookie: session.cookie, "x-gfes-csrf": session.csrf }, body: form });
}

async function uploadWithType(session, file, submissionType) {
  const form = new FormData();
  form.set("submissionType", submissionType);
  form.set("actionType", "reusable_cup");
  form.set("file", file);
  return fetch(`${baseUrl}/api/uploads`, { method: "POST", headers: { cookie: session.cookie, "x-gfes-csrf": session.csrf }, body: form });
}

const first = await registerConsumer();
const second = await registerConsumer();
const webp = await upload(first, new File(["RIFFxxxxWEBP"], "proof.webp", { type: "image/webp" }));
assert.equal(webp.status, 400, "WebP must not be accepted as an action proof");
const unknownType = await uploadWithType(first, new File(["RIFFxxxxWEBP"], "proof.webp", { type: "image/webp" }), "unrecognized");
assert.equal(unknownType.status, 400, "unknown submission types must not bypass proof validation");

const wrongMime = await upload(first, new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], "proof.jpg", { type: "image/png" }));
assert.equal(wrongMime.status, 400, "extension and declared MIME must agree");
const truncatedPng = await upload(first, new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0])], "proof.png", { type: "image/png" }));
assert.equal(truncatedPng.status, 400, "the full PNG signature must be checked");

const oversized = await upload(first, new File([new Uint8Array(10 * 1024 * 1024 + 1)], "proof.pdf", { type: "application/pdf" }));
assert.ok([400, 413].includes(oversized.status), "files over 10 MB must be rejected by the route or request-size limit");

const pdfBytes = await readFile(new URL("../public/documents/GFES_環保杯行動證明_正式範例.pdf", import.meta.url));
const proofFile = new File([pdfBytes], "action-proof.pdf", { type: "application/pdf" });
const accepted = await upload(first, proofFile);
assert.equal(accepted.status, 200, "valid PDF proof must be accepted");
const acceptedData = await accepted.json();
assert.equal(acceptedData.status, "pending");

const duplicate = await upload(first, proofFile);
assert.equal(duplicate.status, 200);
assert.equal((await duplicate.json()).duplicate, true, "repeated proof must not create a second submission");

const replacementBytes = new Uint8Array([...pdfBytes, ...new TextEncoder().encode("\n% local replacement\n")]);
const replacementForm = new FormData();
replacementForm.set("submissionId", acceptedData.submissionId);
replacementForm.set("note", "Updated local proof");
replacementForm.set("file", new File([replacementBytes], "updated-proof.pdf", { type: "application/pdf" }));
const replaced = await fetch(`${baseUrl}/api/uploads`, {
  method: "PUT",
  headers: { cookie: first.cookie, "x-gfes-csrf": first.csrf },
  body: replacementForm,
});
assert.equal(replaced.status, 200, "owner must be able to replace a pending proof");
const replacementRead = await fetch(`${baseUrl}/api/uploads?submissionId=${encodeURIComponent(acceptedData.submissionId)}`, { headers: { cookie: first.cookie } });
assert.equal(replacementRead.status, 200);
assert.equal((await replacementRead.arrayBuffer()).byteLength, replacementBytes.byteLength, "read must return the replacement proof");

const crossAccountRead = await fetch(`${baseUrl}/api/uploads?submissionId=${encodeURIComponent(acceptedData.submissionId)}`, { headers: { cookie: second.cookie } });
assert.equal(crossAccountRead.status, 404, "another consumer must not read the proof");

console.log(JSON.stringify({ passed: true, checks: ["WebP rejected", "unknown type rejected", "MIME mismatch rejected", "PNG signature checked", "size limit enforced", "PDF accepted", "duplicate suppressed", "pending proof replaced", "cross-account read rejected"] }));
