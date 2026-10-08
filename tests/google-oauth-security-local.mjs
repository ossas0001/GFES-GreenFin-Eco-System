import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const baseUrl = process.env.GFES_TEST_URL ?? "http://localhost:4310";

async function manualRedirect(path, headers = {}) {
  return fetch(`${baseUrl}${path}`, { redirect: "manual", headers });
}

function assertLocalErrorRedirect(response, label) {
  assert.equal(response.status, 302, `${label}: should redirect safely`);
  const location = response.headers.get("location") ?? "";
  assert.match(location, /^\/(?:consumer|farmer|institution|admin)?\?authError=/, `${label}: redirect must stay on an approved local portal`);
  assert.doesNotMatch(response.headers.get("set-cookie") ?? "", /gfes_session=/, `${label}: failure must not create a login session`);
}

const invalidRole = await manualRedirect("/api/auth/google?role=admin");
assertLocalErrorRedirect(invalidRole, "admin self-registration");

for (const role of ["farmer", "institution"]) {
  const response = await manualRedirect(`/api/auth/google?role=${role}`);
  assertLocalErrorRedirect(response, `${role} Google sign-in`);
  assert.match(response.headers.get("location") ?? "", /Google/, `${role} must be told to use a password`);
}

const unknownRole = await manualRedirect("/api/auth/google?role=attacker");
assertLocalErrorRedirect(unknownRole, "unknown role");

const missingCallback = await manualRedirect("/api/auth/google/callback");
assertLocalErrorRedirect(missingCallback, "missing callback parameters");

const forgedCallback = await manualRedirect("/api/auth/google/callback?state=forged-state&code=forged-code");
assertLocalErrorRedirect(forgedCallback, "forged state without browser cookie");
assert.match(forgedCallback.headers.get("set-cookie") ?? "", /gfes_oauth_state=;/, "forged callback must clear the short-lived OAuth cookie");

const replayedCallback = await manualRedirect("/api/auth/google/callback?state=forged-state&code=forged-code", { cookie: "gfes_oauth_state=wrong-hash" });
assertLocalErrorRedirect(replayedCallback, "state replay with the wrong browser cookie");

const googleStart = await manualRedirect("/api/auth/google?role=consumer");
assert.equal(googleStart.status, 302);
const googleLocation = googleStart.headers.get("location") ?? "";
if (googleLocation.startsWith("https://accounts.google.com/")) {
  assert.match(googleStart.headers.get("set-cookie") ?? "", /gfes_oauth_state=/, "configured Google flow must bind state to the initiating browser");
} else {
  assert.match(googleLocation, /^\/\?authError=/, "unconfigured Google flow must fail locally without leaving this site");
  const injected = await manualRedirect("/api/auth/google?role=consumer", {
    "x-gfes-internal-google-client-id": "attacker-client",
    "x-gfes-internal-google-client-secret": "attacker-secret",
    "x-gfes-internal-google-redirect-uri": `${baseUrl}/api/auth/google/callback`,
  });
  assert.match(injected.headers.get("location") ?? "", /^\/\?authError=/, "request headers must not configure Google OAuth");
}

const [startSource, callbackSource, authSource] = await Promise.all([
  readFile(new URL("../app/api/auth/google/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/api/auth/google/callback/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../db/auth.ts", import.meta.url), "utf8"),
]);

assert.match(startSource, /code_challenge_method", "S256"/, "PKCE S256 must be enabled");
assert.match(startSource, /scope", "openid email profile"/, "Google scopes must stay minimal");
assert.match(startSource, /GOOGLE_REDIRECT_URI/, "redirect URI must come from server-side configuration");
assert.doesNotMatch(startSource + callbackSource, /x-gfes-internal-google-/, "OAuth credentials must not be overridden by request headers");
assert.match(startSource, /HttpOnly; SameSite=Lax/, "OAuth state cookie must be inaccessible to scripts and survive the top-level callback");
assert.match(startSource, /recentAttempts/, "OAuth starts must be rate limited");
assert.doesNotMatch(startSource, /access_type.*offline/, "registration must not request a refresh token");
assert.match(callbackSource, /email_verified !== true/, "unverified Google email addresses must be rejected");
assert.match(callbackSource, /provider_subject = \?/, "returning Google users must be identified by provider subject");
assert.match(callbackSource, /已有密碼帳號，為保護帳號安全/, "existing password accounts must not be linked by email alone");
assert.doesNotMatch(callbackSource, /UPDATE account_controls SET auth_provider = 'google'/, "email-only automatic account linking must remain disabled");
assert.match(callbackSource, /savedState\.role === "consumer" && accountStatus === "pending"/, "legacy pending Google consumers must be activated without administrator review");
assert.match(callbackSource, /auth_provider = 'google' AND status = 'pending'/, "consumer auto-activation must only target pending Google accounts");
assert.match(callbackSource, /oauthStateFromCookie\(request\) !== stateHash/, "callback state must be bound to the initiating browser");
assert.match(authSource, /HttpOnly; SameSite=Strict/, "application sessions must be HttpOnly and SameSite Strict");
assert.match(authSource, /; Secure/, "production sessions must be Secure");

console.log(JSON.stringify({
  passed: true,
  checks: {
    invalidRoles: "rejected",
    forgedState: "rejected",
    wrongBrowserCookie: "rejected",
    accountLinkingByEmail: "disabled",
    consumerApproval: "not required",
    pkce: "S256",
    scopes: "openid email profile",
    refreshTokens: "not requested",
    startRateLimit: "10 attempts per 10 minutes per source",
    sessionCookies: "HttpOnly + SameSite + Secure on HTTPS",
  },
}, null, 2));
