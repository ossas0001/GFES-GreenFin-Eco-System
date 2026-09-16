import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const authorization = await readFile(new URL("../worker/greenfin/authorization.ts", import.meta.url), "utf8");
const authorizationRoute = await readFile(new URL("../app/api/greenfin/authorizations/route.ts", import.meta.url), "utf8");
const bankRoute = await readFile(new URL("../app/api/greenfin/bank-cases/route.ts", import.meta.url), "utf8");
const ui = await readFile(new URL("../app/GreenPlatformDemo.tsx", import.meta.url), "utf8");

test("farmer controls scoped and time-bounded GreenFin authorizations", () => {
  assert.match(authorizationRoute, /requireAuth\(request, \["farmer"\], true\)/);
  assert.match(authorizationRoute, /p\.role = 'institution'/);
  assert.match(authorizationRoute, /ac\.status = 'active'/);
  assert.match(authorizationRoute, /366/);
  assert.match(authorizationRoute, /AUTHORIZATION_GRANTED/);
  assert.match(authorizationRoute, /AUTHORIZATION_REVOKED/);
  assert.match(authorizationRoute, /status = 'REVOKED'/);
});

test("institution access is enforced by the backend", () => {
  assert.match(authorization, /institution_id = \?/);
  assert.match(authorization, /status = 'ACTIVE'/);
  assert.match(authorization, /revoked_at IS NULL/);
  assert.match(authorization, /julianday\(start_at\) <= julianday\('now'\)/);
  assert.match(authorization, /julianday\(expire_at\) > julianday\('now'\)/);
  assert.match(bankRoute, /requireAuth\(request, \["institution"\]/);
  assert.match(bankRoute, /requireActiveGreenFinAuthorization/);
  assert.match(bankRoute, /scopes\.includes\("EXPERIENCE"\)/);
  assert.match(bankRoute, /scopes\.includes\("INDICATORS"\)/);
  assert.match(bankRoute, /scopes\.includes\("DATA_HEALTH"\)/);
  assert.match(bankRoute, /BANK_DATA_ACCESSED/);
});

test("farmer and institution interfaces expose authorization workflows without lending decisions", () => {
  assert.match(ui, /銀行授權/);
  assert.match(ui, /GreenFin 授權案件/);
  assert.match(ui, /建立限期授權/);
  assert.match(ui, /建立並開啟案件/);
  assert.match(ui, /不提供任何授信決策、風險機率、融資條件或單一綜合分數/);
});
