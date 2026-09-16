import { AuthError, requireAuth } from "../../../../db/auth";
import { ensurePlatformSchema, getPlatformDb } from "../../../../db/platform";
import { requireActiveGreenFinAuthorization } from "../../../../worker/greenfin/authorization";
import { greenFinAuditStatement } from "../../../../worker/greenfin/audit";
import { buildGreenFinTracePackage } from "../../../../worker/greenfin/traceability";

function errorResponse(error: unknown, fallback: string) {
  const status = error instanceof AuthError ? error.status : error instanceof Error && error.message.startsWith("找不到有效授權") ? 403 : 400;
  return Response.json({ error: error instanceof Error ? error.message : fallback }, { status });
}

function requestIp(request: Request) {
  return request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth(request, ["institution"], true);
    const body = await request.json() as { authorizationId?: string };
    const authorizationId = String(body.authorizationId ?? "");
    const db = await getPlatformDb(); await ensurePlatformSchema(db);
    const { authorization, scopes } = await requireActiveGreenFinAuthorization(db, authorizationId, session.profileId);
    const traceability = await buildGreenFinTracePackage(db, authorization.farmer_id, scopes);
    const generatedAt = new Date().toISOString();
    const reportId = `GFREPORT-${crypto.randomUUID()}`;
    await db.batch([
      greenFinAuditStatement(db, "BANK_DATA_ACCESSED", session.profileId, "greenfin_authorization", authorizationId, { farmerId: authorization.farmer_id, scopes, purpose: "TRACEABLE_REPORT" }, requestIp(request)),
      greenFinAuditStatement(db, "REPORT_GENERATED", session.profileId, "greenfin_report", reportId, { authorizationId, farmerId: authorization.farmer_id, scopes, generatedAt }, requestIp(request)),
    ]);
    return Response.json({ reportId, generatedAt, authorization: { id: authorization.id, farmerId: authorization.farmer_id, institutionId: authorization.institution_id, purpose: authorization.purpose, scopes, startAt: authorization.start_at, expireAt: authorization.expire_at }, traceability, notice: "本資料包僅提供可解釋的授信補充資訊；三類結果彼此獨立。" });
  } catch (error) { return errorResponse(error, "產生 GreenFin 可追溯資料包失敗"); }
}
