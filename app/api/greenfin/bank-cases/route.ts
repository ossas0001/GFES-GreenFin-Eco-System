import { AuthError, requireAuth } from "../../../../db/auth";
import { ensurePlatformSchema, getPlatformDb } from "../../../../db/platform";
import { requireActiveGreenFinAuthorization } from "../../../../worker/greenfin/authorization";
import { greenFinAuditStatement } from "../../../../worker/greenfin/audit";

function errorResponse(error: unknown, fallback: string) {
  const status = error instanceof AuthError ? error.status : error instanceof Error && error.message.startsWith("找不到有效授權") ? 403 : 400;
  return Response.json({ error: error instanceof Error ? error.message : fallback }, { status });
}

function requestIp(request: Request) {
  return request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}

export async function GET(request: Request) {
  try {
    const session = await requireAuth(request, ["institution"]);
    const db = await getPlatformDb(); await ensurePlatformSchema(db);
    const authorizationId = new URL(request.url).searchParams.get("authorizationId");
    if (!authorizationId) {
      const result = await db.prepare(`SELECT a.id AS authorization_id, a.farmer_id, p.display_name AS farmer_name,
          a.purpose, a.data_scope_json, a.start_at, a.expire_at, a.status, a.revoked_at,
          c.id AS case_id, c.case_number, c.status AS case_status, c.notes
        FROM greenfin_authorizations a
        JOIN profiles p ON p.id = a.farmer_id AND p.role = 'farmer'
        LEFT JOIN greenfin_bank_cases c ON c.authorization_id = a.id AND c.institution_id = a.institution_id
        WHERE a.institution_id = ? ORDER BY a.created_at DESC`).bind(session.profileId).all();
      return Response.json({ cases: result.results ?? [] });
    }

    const { authorization, scopes } = await requireActiveGreenFinAuthorization(db, authorizationId, session.profileId);
    const [farmer, experience, indicators, dataHealth, bankCase] = await Promise.all([
      db.prepare("SELECT id, display_name, city, district FROM profiles WHERE id = ? AND role = 'farmer'").bind(authorization.farmer_id).first(),
      scopes.includes("EXPERIENCE") ? db.prepare("SELECT * FROM greenfin_experience_transactions WHERE farmer_id = ? ORDER BY calculated_at DESC").bind(authorization.farmer_id).all() : Promise.resolve({ results: [] }),
      scopes.includes("INDICATORS") ? db.prepare("SELECT * FROM greenfin_indicator_results WHERE farmer_id = ? ORDER BY calculated_at DESC").bind(authorization.farmer_id).all() : Promise.resolve({ results: [] }),
      scopes.includes("DATA_HEALTH") ? db.prepare("SELECT * FROM greenfin_data_health_results WHERE farmer_id = ? ORDER BY calculated_at DESC").bind(authorization.farmer_id).all() : Promise.resolve({ results: [] }),
      db.prepare("SELECT * FROM greenfin_bank_cases WHERE authorization_id = ? AND institution_id = ?").bind(authorizationId, session.profileId).first(),
    ]);
    await greenFinAuditStatement(db, "BANK_DATA_ACCESSED", session.profileId, "greenfin_authorization", authorizationId, { farmerId: authorization.farmer_id, scopes }, requestIp(request)).run();
    return Response.json({ authorization: { ...authorization, scopes }, farmer, bankCase, experience: experience.results ?? [], indicators: indicators.results ?? [], dataHealth: dataHealth.results ?? [], notice: "GreenFin 僅提供可解釋的授信補充資訊，不是信用評分或自動核貸。" });
  } catch (error) { return errorResponse(error, "讀取 GreenFin 銀行案件失敗"); }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth(request, ["institution"], true);
    const body = await request.json() as { authorizationId?: string; caseNumber?: string; notes?: string };
    const authorizationId = String(body.authorizationId ?? "");
    const caseNumber = String(body.caseNumber ?? "").trim().slice(0, 100);
    const notes = String(body.notes ?? "").trim().slice(0, 1000);
    const db = await getPlatformDb(); await ensurePlatformSchema(db);
    const { authorization } = await requireActiveGreenFinAuthorization(db, authorizationId, session.profileId);
    const existing = await db.prepare("SELECT id FROM greenfin_bank_cases WHERE authorization_id = ? AND institution_id = ?").bind(authorizationId, session.profileId).first<{ id: string }>();
    if (existing) return Response.json({ ok: true, caseId: existing.id, status: "open" });
    const caseId = `GFCASE-${crypto.randomUUID()}`;
    await db.prepare(`INSERT INTO greenfin_bank_cases
      (id, authorization_id, institution_id, farmer_id, case_number, status, notes)
      VALUES (?, ?, ?, ?, ?, 'open', ?)`)
      .bind(caseId, authorizationId, session.profileId, authorization.farmer_id, caseNumber || caseId, notes).run();
    return Response.json({ ok: true, caseId, status: "open" });
  } catch (error) { return errorResponse(error, "建立 GreenFin 銀行案件失敗"); }
}
