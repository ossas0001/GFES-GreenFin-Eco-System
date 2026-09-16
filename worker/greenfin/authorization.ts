export const GREENFIN_AUTHORIZATION_SCOPES = ["EXPERIENCE", "INDICATORS", "DATA_HEALTH"] as const;
export type GreenFinAuthorizationScope = (typeof GREENFIN_AUTHORIZATION_SCOPES)[number];

export type ActiveGreenFinAuthorization = {
  id: string;
  farmer_id: string;
  institution_id: string;
  purpose: string;
  data_scope_json: string;
  start_at: string;
  expire_at: string;
};

export function parseAuthorizationScopes(value: string): GreenFinAuthorizationScope[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((scope): scope is GreenFinAuthorizationScope =>
      GREENFIN_AUTHORIZATION_SCOPES.includes(scope as GreenFinAuthorizationScope));
  } catch {
    return [];
  }
}

export async function requireActiveGreenFinAuthorization(
  db: D1Database,
  authorizationId: string,
  institutionId: string,
) {
  const authorization = await db.prepare(`SELECT id, farmer_id, institution_id, purpose,
      data_scope_json, start_at, expire_at
    FROM greenfin_authorizations
    WHERE id = ? AND institution_id = ? AND status = 'ACTIVE' AND revoked_at IS NULL
      AND julianday(start_at) <= julianday('now') AND julianday(expire_at) > julianday('now')`)
    .bind(authorizationId, institutionId).first<ActiveGreenFinAuthorization>();
  if (!authorization) throw new Error("找不到有效授權，授權可能尚未生效、已到期或已撤銷");
  return { authorization, scopes: parseAuthorizationScopes(authorization.data_scope_json) };
}
