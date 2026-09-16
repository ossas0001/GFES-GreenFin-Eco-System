import { AuthError, requireAuth } from "../../../../db/auth";
import { ensurePlatformSchema, getPlatformDb } from "../../../../db/platform";
import { GREENFIN_AUTHORIZATION_SCOPES } from "../../../../worker/greenfin/authorization";
import { greenFinAuditStatement } from "../../../../worker/greenfin/audit";

function errorResponse(error: unknown, fallback: string) {
  const status = error instanceof AuthError ? error.status : 400;
  return Response.json({ error: error instanceof Error ? error.message : fallback }, { status });
}

function sqlDate(value: Date) {
  return value.toISOString().slice(0, 19).replace("T", " ");
}

function requestIp(request: Request) {
  return request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}

export async function GET(request: Request) {
  try {
    const session = await requireAuth(request, ["farmer"]);
    const db = await getPlatformDb(); await ensurePlatformSchema(db);
    const [authorizations, institutions] = await Promise.all([
      db.prepare(`SELECT a.*, p.display_name AS institution_name
        FROM greenfin_authorizations a
        JOIN profiles p ON p.id = a.institution_id AND p.role = 'institution'
        WHERE a.farmer_id = ? ORDER BY a.created_at DESC`).bind(session.profileId).all(),
      db.prepare(`SELECT p.id, p.display_name
        FROM profiles p JOIN account_controls ac ON ac.profile_id = p.id
        WHERE p.role = 'institution' AND ac.status = 'active' ORDER BY p.display_name`).all(),
    ]);
    return Response.json({ authorizations: authorizations.results ?? [], institutions: institutions.results ?? [], allowedScopes: GREENFIN_AUTHORIZATION_SCOPES });
  } catch (error) { return errorResponse(error, "讀取 GreenFin 授權失敗"); }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth(request, ["farmer"], true);
    const body = await request.json() as { institutionId?: string; purpose?: string; dataScope?: string[]; startAt?: string; expireAt?: string };
    const institutionId = String(body.institutionId ?? "").trim();
    const purpose = String(body.purpose ?? "").trim();
    const scopes = [...new Set((body.dataScope ?? []).map(String))];
    const startAt = new Date(body.startAt ?? Date.now());
    const expireAt = new Date(body.expireAt ?? 0);
    if (!institutionId || !purpose || purpose.length > 500) return Response.json({ error: "請選擇機構並填寫 1 至 500 字授權目的" }, { status: 400 });
    if (!scopes.length || scopes.some((scope) => !GREENFIN_AUTHORIZATION_SCOPES.includes(scope as never))) return Response.json({ error: "授權資料範圍無效" }, { status: 400 });
    if (!Number.isFinite(startAt.valueOf()) || !Number.isFinite(expireAt.valueOf()) || expireAt <= startAt) return Response.json({ error: "授權起訖時間無效" }, { status: 400 });
    if (expireAt.valueOf() - startAt.valueOf() > 366 * 24 * 60 * 60 * 1000) return Response.json({ error: "單次授權期間不得超過 366 天" }, { status: 400 });
    const db = await getPlatformDb(); await ensurePlatformSchema(db);
    const institution = await db.prepare(`SELECT p.id FROM profiles p JOIN account_controls ac ON ac.profile_id = p.id
      WHERE p.id = ? AND p.role = 'institution' AND ac.status = 'active'`).bind(institutionId).first();
    if (!institution) return Response.json({ error: "找不到可授權的有效機構帳號" }, { status: 404 });
    const authorizationId = `GFAUTH-${crypto.randomUUID()}`;
    await db.batch([
      db.prepare(`INSERT INTO greenfin_authorizations
        (id, farmer_id, institution_id, purpose, data_scope_json, start_at, expire_at, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`)
        .bind(authorizationId, session.profileId, institutionId, purpose, JSON.stringify(scopes), sqlDate(startAt), sqlDate(expireAt)),
      greenFinAuditStatement(db, "AUTHORIZATION_GRANTED", session.profileId, "greenfin_authorization", authorizationId, { institutionId, purpose, scopes, startAt: sqlDate(startAt), expireAt: sqlDate(expireAt) }, requestIp(request)),
    ]);
    return Response.json({ ok: true, authorizationId, status: "ACTIVE" });
  } catch (error) { return errorResponse(error, "建立 GreenFin 授權失敗"); }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireAuth(request, ["farmer"], true);
    const authorizationId = new URL(request.url).searchParams.get("authorizationId") ?? "";
    const db = await getPlatformDb(); await ensurePlatformSchema(db);
    const result = await db.prepare(`UPDATE greenfin_authorizations
      SET status = 'REVOKED', revoked_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND farmer_id = ? AND status = 'ACTIVE' AND revoked_at IS NULL`)
      .bind(authorizationId, session.profileId).run();
    if (!result.meta.changes) return Response.json({ error: "找不到可撤銷的有效授權" }, { status: 404 });
    await greenFinAuditStatement(db, "AUTHORIZATION_REVOKED", session.profileId, "greenfin_authorization", authorizationId, {}, requestIp(request)).run();
    return Response.json({ ok: true, authorizationId, status: "REVOKED" });
  } catch (error) { return errorResponse(error, "撤銷 GreenFin 授權失敗"); }
}
