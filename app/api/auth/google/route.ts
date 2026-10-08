import { hashOpaqueToken } from "../../../../db/credentials";
import { PlatformRole } from "../../../../db/auth";
import { getPlatformDb } from "../../../../db/platform";

function randomUrlSafeToken(byteLength = 32) {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function pkceChallenge(verifier: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  const binary = String.fromCharCode(...new Uint8Array(digest));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function returnWithError(request: Request, message: string, role?: PlatformRole | null) {
  void request;
  const params = new URLSearchParams({ authError: message });
  if (role) params.set("authRole", role);
  const portalPath = role === "consumer" ? "/" : role && ["farmer", "institution", "admin"].includes(role) ? `/${role}` : "/";
  return new Response(null, { status: 302, headers: { Location: `${portalPath}?${params}`, "Cache-Control": "no-store" } });
}

function validRedirectUri(value: string) {
  try {
    const url = new URL(value);
    const secure = url.protocol === "https:" || (url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname));
    return secure && url.pathname === "/api/auth/google/callback" && !url.username && !url.password && !url.search && !url.hash;
  } catch {
    return false;
  }
}

function oauthStateCookie(stateHash: string, request: Request) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `gfes_oauth_state=${stateHash}; Path=/api/auth/google/callback; HttpOnly; SameSite=Lax; Max-Age=600${secure}`;
}

async function oauthAttemptKey(request: Request) {
  const forwarded = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
  return hashOpaqueToken(`google-oauth:${forwarded.trim().slice(0, 64)}`);
}

export async function GET(request: Request) {
  const role = new URL(request.url).searchParams.get("role") as PlatformRole | null;
  if (role !== "consumer") return returnWithError(request, "Google 登入僅提供消費者使用，其他角色請使用帳號密碼登入。", role);

  const { env } = await import("cloudflare:workers");
  const configured = env as unknown as { GOOGLE_CLIENT_ID?: string; GOOGLE_CLIENT_SECRET?: string; GOOGLE_REDIRECT_URI?: string };
  const secrets = {
    GOOGLE_CLIENT_ID: configured.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: configured.GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI: configured.GOOGLE_REDIRECT_URI,
  };
  if (!secrets.GOOGLE_CLIENT_ID || !secrets.GOOGLE_CLIENT_SECRET || !secrets.GOOGLE_REDIRECT_URI) {
    return returnWithError(request, "Google 註冊尚未完成 Client ID、Client Secret 與回呼網址設定。", role);
  }
  if (!validRedirectUri(secrets.GOOGLE_REDIRECT_URI)) return returnWithError(request, "Google 註冊回呼網址設定不符合安全規則。", role);

  const state = randomUrlSafeToken();
  const verifier = randomUrlSafeToken(48);
  const challenge = await pkceChallenge(verifier);
  const redirectUri = secrets.GOOGLE_REDIRECT_URI;
  const db = await getPlatformDb();
  const attemptKey = await oauthAttemptKey(request);
  await db.prepare("DELETE FROM oauth_states WHERE expires_at <= CURRENT_TIMESTAMP").run();
  const recentAttempts = await db.prepare(`SELECT COUNT(*) AS count FROM oauth_states
      WHERE attempt_key = ? AND created_at >= datetime('now', '-10 minutes')`)
    .bind(attemptKey).first<{ count: number }>();
  if (Number(recentAttempts?.count ?? 0) >= 10) {
    return returnWithError(request, "Google 註冊操作過於頻繁，請十分鐘後再試。", role);
  }
  await db.batch([
    db.prepare("INSERT INTO oauth_states (state_hash, role, code_verifier, redirect_uri, attempt_key, expires_at) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(await hashOpaqueToken(state), role, verifier, redirectUri, attemptKey, new Date(Date.now() + 10 * 60 * 1000).toISOString()),
  ]);

  const authorizationUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorizationUrl.searchParams.set("client_id", secrets.GOOGLE_CLIENT_ID);
  authorizationUrl.searchParams.set("redirect_uri", redirectUri);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("scope", "openid email profile");
  authorizationUrl.searchParams.set("state", state);
  authorizationUrl.searchParams.set("code_challenge", challenge);
  authorizationUrl.searchParams.set("code_challenge_method", "S256");
  authorizationUrl.searchParams.set("prompt", "select_account");
  return new Response(null, {
    status: 302,
    headers: {
      Location: authorizationUrl.toString(),
      "Set-Cookie": oauthStateCookie(await hashOpaqueToken(state), request),
      "Cache-Control": "no-store",
    },
  });
}
