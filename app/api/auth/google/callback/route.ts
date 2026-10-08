import { createAuthSession, PlatformRole, sessionCookie } from "../../../../../db/auth";
import { hashOpaqueToken } from "../../../../../db/credentials";
import { getPlatformDb } from "../../../../../db/platform";
import { CONSUMER_WELCOME_POINTS, consumerWelcomeGrant } from "../../../../../db/welcome";

type GoogleUser = { sub?: string; email?: string; email_verified?: boolean; name?: string };

function returnWithError(request: Request, message: string, role?: PlatformRole) {
  const params = new URLSearchParams({ authError: message });
  const portalPath = role === "consumer" ? "/" : role && role !== "admin" ? `/${role}` : "/";
  return new Response(null, { status: 302, headers: { Location: `${portalPath}?${params}`, "Set-Cookie": expiredOAuthStateCookie(request), "Cache-Control": "no-store" } });
}

function returnPending(request: Request, role: Exclude<PlatformRole, "admin">) {
  const params = new URLSearchParams({ approval: "pending", authRole: role });
  const portalPath = role === "consumer" ? "/" : `/${role}`;
  return new Response(null, { status: 302, headers: { Location: `${portalPath}?${params}`, "Set-Cookie": expiredOAuthStateCookie(request), "Cache-Control": "no-store" } });
}

function oauthStateFromCookie(request: Request) {
  const cookies = request.headers.get("cookie") ?? "";
  for (const item of cookies.split(";")) {
    const [key, ...value] = item.trim().split("=");
    if (key === "gfes_oauth_state") return value.join("=");
  }
  return "";
}

function expiredOAuthStateCookie(request: Request) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `gfes_oauth_state=; Path=/api/auth/google/callback; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

const defaultLocation: Record<Exclude<PlatformRole, "admin">, { city: string; district: string }> = {
  consumer: { city: "台北市", district: "大安區" },
  farmer: { city: "雲林縣", district: "斗六市" },
  institution: { city: "台北市", district: "信義區" },
};

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const state = requestUrl.searchParams.get("state") ?? "";
  const code = requestUrl.searchParams.get("code") ?? "";
  const oauthError = requestUrl.searchParams.get("error");
  if (oauthError) return returnWithError(request, "Google 授權已取消，尚未建立帳號。");
  if (!state || !code) return returnWithError(request, "Google 授權資料不完整，請重新操作。");

  const db = await getPlatformDb();
  const stateHash = await hashOpaqueToken(state);
  if (oauthStateFromCookie(request) !== stateHash) {
    return returnWithError(request, "Google 註冊瀏覽器驗證失敗，請從本站重新操作。");
  }
  const savedState = await db.prepare(`SELECT role, code_verifier, redirect_uri, expires_at
      FROM oauth_states WHERE state_hash = ?`)
    .bind(stateHash).first<{ role: Exclude<PlatformRole, "admin">; code_verifier: string; redirect_uri: string; expires_at: string }>();
  await db.prepare("DELETE FROM oauth_states WHERE state_hash = ?").bind(stateHash).run();
  if (!savedState || Date.parse(savedState.expires_at) <= Date.now()) {
    return returnWithError(request, "Google 註冊驗證已逾時，請重新操作。");
  }
  if (savedState.role !== "consumer") {
    return returnWithError(request, "Google 登入僅提供消費者使用，其他角色請使用帳號密碼登入。", savedState.role);
  }

  const { env } = await import("cloudflare:workers");
  const configured = env as unknown as { GOOGLE_CLIENT_ID?: string; GOOGLE_CLIENT_SECRET?: string };
  const secrets = {
    GOOGLE_CLIENT_ID: configured.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: configured.GOOGLE_CLIENT_SECRET,
  };
  if (!secrets.GOOGLE_CLIENT_ID || !secrets.GOOGLE_CLIENT_SECRET) return returnWithError(request, "Google 註冊服務尚未完成設定。", savedState.role);

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: secrets.GOOGLE_CLIENT_ID,
      client_secret: secrets.GOOGLE_CLIENT_SECRET,
      code,
      code_verifier: savedState.code_verifier,
      grant_type: "authorization_code",
      redirect_uri: savedState.redirect_uri,
    }),
  });
  const token = await tokenResponse.json() as { access_token?: string };
  if (!tokenResponse.ok || !token.access_token) return returnWithError(request, "Google 身分驗證失敗，請重新操作。", savedState.role);

  const userResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { authorization: `Bearer ${token.access_token}` },
  });
  const googleUser = await userResponse.json() as GoogleUser;
  const email = String(googleUser.email ?? "").trim().toLowerCase();
  const subject = String(googleUser.sub ?? "").trim();
  if (!userResponse.ok || !subject || !email || googleUser.email_verified !== true) {
    return returnWithError(request, "Google 帳號未提供已驗證的電子信箱。", savedState.role);
  }

  const linked = await db.prepare(`SELECT ac.profile_id, ac.status, p.role FROM account_controls ac
      JOIN profiles p ON p.id = ac.profile_id
      WHERE ac.auth_provider = 'google' AND ac.provider_subject = ?`)
    .bind(subject).first<{ profile_id: string; status: string; role: PlatformRole }>();
  if (linked && linked.role !== savedState.role) return returnWithError(request, "此 Google 帳號已綁定其他角色，請改用原角色登入。", savedState.role);

  let profileId = linked?.profile_id;
  let accountStatus = linked?.status;
  let isNewConsumer = false;
  if (!profileId) {
    const emailAccount = await db.prepare(`SELECT ac.profile_id, p.role FROM account_controls ac
        JOIN profiles p ON p.id = ac.profile_id WHERE lower(ac.email) = ?`)
      .bind(email).first<{ profile_id: string; role: PlatformRole }>();
    if (emailAccount) {
      return returnWithError(request, emailAccount.role === savedState.role
        ? "此電子信箱已有密碼帳號，為保護帳號安全，請先使用原密碼登入。"
        : "此電子信箱已使用其他角色註冊。", savedState.role);
    }
    profileId = `${savedState.role}-${crypto.randomUUID()}`;
    isNewConsumer = savedState.role === "consumer";
    accountStatus = savedState.role === "consumer" ? "active" : "pending";
    const location = defaultLocation[savedState.role];
    const localPart = email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 15);
    const usernameBase = localPart.length >= 4 ? localPart : "googleuser";
    const subjectSuffix = subject.toLowerCase().replace(/[^a-z0-9]/g, "").slice(-6) || crypto.randomUUID().replace(/-/g, "").slice(0, 6);
    let username = `${usernameBase}_${subjectSuffix}`.slice(0, 24);
    while (await db.prepare("SELECT profile_id FROM account_controls WHERE lower(username) = ?").bind(username).first()) {
      username = `${usernameBase.slice(0, 15)}_${crypto.randomUUID().replace(/-/g, "").slice(0, 6)}`.slice(0, 24);
    }
    await db.batch([
      db.prepare("INSERT INTO profiles (id, role, display_name, city, district) VALUES (?, ?, ?, ?, ?)")
        .bind(profileId, savedState.role, String(googleUser.name ?? email.split("@")[0]).slice(0, 60), location.city, location.district),
      db.prepare(`INSERT INTO account_controls
        (profile_id, email, username, account_kind, status, auth_provider, provider_subject, updated_at)
        VALUES (?, ?, ?, 'real', ?, 'google', ?, CURRENT_TIMESTAMP)`)
        .bind(profileId, email, username, accountStatus, subject),
      ...(savedState.role === "consumer" ? [consumerWelcomeGrant(db, profileId)] : []),
    ]);
  }

  // Consumers do not require identity approval. Keep older Google consumer
  // accounts created under the previous approval policy compatible, while
  // preserving explicit suspension and other administrator-enforced states.
  if (savedState.role === "consumer" && accountStatus === "pending") {
    await db.prepare(`UPDATE account_controls
        SET status = 'active', updated_at = CURRENT_TIMESTAMP
        WHERE profile_id = ? AND auth_provider = 'google' AND status = 'pending'`)
      .bind(profileId).run();
    accountStatus = "active";
  }

  if (accountStatus === "pending") return returnPending(request, savedState.role);
  if (accountStatus !== "active") return returnWithError(request, "此帳號目前無法登入，請聯絡平台管理員。", savedState.role);

  const session = await createAuthSession(profileId, savedState.role);
  const portalPath = savedState.role === "consumer" ? "/" : `/${savedState.role}`;
  const headers = new Headers({ Location: `${portalPath}?auth=google${isNewConsumer ? `&welcomePoints=${CONSUMER_WELCOME_POINTS}` : ""}`, "Cache-Control": "no-store" });
  headers.append("Set-Cookie", sessionCookie(session.token, request, savedState.role));
  headers.append("Set-Cookie", expiredOAuthStateCookie(request));
  return new Response(null, {
    status: 302,
    headers,
  });
}
