import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";

const baseUrl = process.env.GFES_TEST_URL ?? "http://localhost:4310";

async function login(role, username) {
  const response = await fetch(`${baseUrl}/api/auth`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ role, email: username, password: "12345678" }) });
  const body = await response.json();
  assert.equal(response.status, 200, JSON.stringify(body));
  return { role, cookie: response.headers.get("set-cookie")?.split(";")[0], csrf: body.csrfToken };
}

function headers(session, write = false) {
  return { cookie: session.cookie, "x-gfes-role": session.role, ...(write ? { "x-gfes-csrf": session.csrf } : {}) };
}

async function jsonResponse(path, session, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, { headers: { ...headers(session, options.method && options.method !== "GET"), ...(options.body ? { "content-type": "application/json" } : {}) }, ...options });
  return { response, body: await response.json() };
}

const farmer = await login("farmer", "farmer001");
const institution = await login("institution", "institution001");
const pdf = await readFile(new URL("../public/documents/GFES_GreenFin_DEMO_已核驗友善耕作行動證明.pdf", import.meta.url));
const uniquePdf = new Uint8Array([...pdf, ...new TextEncoder().encode(`\n% DEMO local review ${randomUUID()}\n`)]);
const form = new FormData();
form.set("domain", "CERTIFICATION");
form.set("sourceLevel", "V1");
form.set("uploadNote", "DEMO／SIMULATED 本機政府審批測試");
form.set("file", new File([uniquePdf], "GFES_GreenFin_DEMO_已核驗友善耕作行動證明.pdf", { type: "application/pdf" }));
const uploadResponse = await fetch(`${baseUrl}/api/greenfin/documents`, { method: "POST", headers: headers(farmer, true), body: form });
const upload = await uploadResponse.json();
assert.equal(uploadResponse.status, 200, JSON.stringify(upload));
assert.equal(upload.status, "OCR_COMPLETED");
const documentId = upload.documentId;

const before = await jsonResponse(`/api/greenfin/documents?documentId=${encodeURIComponent(documentId)}`, institution);
assert.equal(before.response.status, 404, "government account must not see an unsubmitted OCR draft");

async function submitReview() {
  const result = await jsonResponse("/api/greenfin/documents", farmer, { method: "PATCH", body: JSON.stringify({ documentId, reviewRequest: true }) });
  assert.equal(result.response.status, 200, JSON.stringify(result.body));
  assert.equal(result.body.reviewState, "PENDING");
}

async function review(decision, reviewNote) {
  const result = await jsonResponse("/api/greenfin/documents", institution, { method: "PUT", body: JSON.stringify({ documentId, decision, reviewNote }) });
  assert.equal(result.response.status, 200, JSON.stringify(result.body));
}

await submitReview();
const listed = await jsonResponse("/api/greenfin/documents", institution);
assert.equal(listed.response.status, 200);
assert.equal(listed.body.documents.find((item) => item.id === documentId)?.review_decision, "PENDING");

await review("REJECTED", "DEMO／SIMULATED 請補執行日期");
const rejected = await jsonResponse(`/api/greenfin/documents?documentId=${encodeURIComponent(documentId)}`, farmer);
assert.equal(rejected.body.review?.decision, "REJECTED");
assert.equal(rejected.body.reviewState, "REJECTED");

await submitReview();
const pendingAgain = await jsonResponse(`/api/greenfin/documents?documentId=${encodeURIComponent(documentId)}`, institution);
assert.equal(pendingAgain.body.reviewState, "PENDING");
await review("APPROVED", "DEMO／SIMULATED 欄位已確認");
const approved = await jsonResponse(`/api/greenfin/documents?documentId=${encodeURIComponent(documentId)}`, farmer);
assert.equal(approved.body.review?.decision, "APPROVED");
assert.equal(approved.body.reviewState, "APPROVED");

const download = await fetch(`${baseUrl}/api/greenfin/documents?documentId=${encodeURIComponent(documentId)}&download=1`, { headers: headers(institution) });
assert.equal(download.status, 200);
assert.equal((await download.arrayBuffer()).byteLength, uniquePdf.byteLength);
console.log(JSON.stringify({ passed: true, documentId, checks: ["draft hidden", "explicit submission", "institution review", "farmer feedback", "resubmission", "original download"] }));
