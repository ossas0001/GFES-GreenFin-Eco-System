import { createAuthSession, PlatformRole, sessionCookie } from "../../../db/auth";
import { createPasswordCredential } from "../../../db/credentials";
import { getPlatformDb } from "../../../db/platform";
import { consumerWelcomeGrant } from "../../../db/welcome";

const registrationRoles = new Set<PlatformRole>(["consumer", "farmer", "institution"]);
const defaultLocation: Record<Exclude<PlatformRole, "admin">, { city: string; district: string }> = {
  consumer: { city: "台北市", district: "大安區" },
  farmer: { city: "雲林縣", district: "斗六市" },
  institution: { city: "台北市", district: "信義區" },
};

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const role = String(body.role ?? "") as PlatformRole;
    const displayName = String(body.displayName ?? "").trim();
    const username = String(body.username ?? "").trim().toLowerCase();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    if (!registrationRoles.has(role) || displayName.length < 2 || displayName.length > 60) {
      return Response.json({ error: "請選擇可註冊的角色，並輸入 2 至 60 字的名稱。" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160) {
      return Response.json({ error: "請輸入有效的電子信箱。" }, { status: 400 });
    }
    if (!/^[a-z0-9_]{4,24}$/.test(username)) {
      return Response.json({ error: "使用者名稱只能使用 4 至 24 個英文字母、數字或底線。" }, { status: 400 });
    }
    if (password.length < 8 || password.length > 72) {
      return Response.json({ error: "密碼長度需為 8 至 72 個字元。" }, { status: 400 });
    }

    const db = await getPlatformDb();
    const existing = await db.prepare("SELECT profile_id, email, username FROM account_controls WHERE lower(email) = ? OR lower(username) = ?").bind(email, username).first<{ profile_id: string; email: string; username: string | null }>();
    if (existing) return Response.json({ error: existing.email.toLowerCase() === email ? "此電子信箱已註冊，請直接登入。" : "此使用者名稱已被使用，請更換名稱。" }, { status: 409 });

    const profileId = `${role}-${crypto.randomUUID()}`;
    const location = defaultLocation[role as Exclude<PlatformRole, "admin">];
    const credential = await createPasswordCredential(password);
    const requiresApproval = role === "farmer" || role === "institution";
    const accountStatus = requiresApproval ? "pending" : "active";
    await db.batch([
      db.prepare("INSERT INTO profiles (id, role, display_name, city, district) VALUES (?, ?, ?, ?, ?)")
        .bind(profileId, role, displayName, location.city, location.district),
      db.prepare(`INSERT INTO account_controls
        (profile_id, email, username, account_kind, status, password_hash, password_salt, auth_provider, updated_at)
        VALUES (?, ?, ?, 'real', ?, ?, ?, 'password', CURRENT_TIMESTAMP)`)
        .bind(profileId, email, username, accountStatus, credential.passwordHash, credential.passwordSalt),
      ...(role === "consumer" ? [consumerWelcomeGrant(db, profileId)] : []),
    ]);

    if (requiresApproval) {
      return Response.json({
        authenticated: false,
        pendingApproval: true,
        role,
        username,
        estimatedReviewTime: "1～3 個工作天",
        message: "註冊申請已送出，需經平台管理員審核通過後才能登入，預計需要 1～3 個工作天。",
      }, { status: 201, headers: { "Cache-Control": "no-store" } });
    }

    const session = await createAuthSession(profileId, role);
    return Response.json({ authenticated: true, role, username, csrfToken: session.csrfToken, expiresAt: session.expiresAt }, {
      status: 201,
      headers: { "Set-Cookie": sessionCookie(session.token, request, role), "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message = error instanceof Error && error.message.includes("UNIQUE")
      ? "此電子信箱已註冊，請直接登入。"
      : "目前無法建立帳號，請稍後再試。";
    return Response.json({ error: message }, { status: message.includes("已註冊") ? 409 : 400 });
  }
}
