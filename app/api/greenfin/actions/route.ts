import { AuthError, requireAuth } from "../../../../db/auth";
import { ensurePlatformSchema, getPlatformDb } from "../../../../db/platform";

const dimensions = new Set(["減量", "增匯", "循環", "綠色治理"]);
const levels = new Set(["BASIC", "SUSTAINED", "CERTIFIED"]);
function errorResponse(error: unknown, fallback: string) { return Response.json({ error: error instanceof Error ? error.message : fallback }, { status: error instanceof AuthError ? error.status : 400 }); }

export async function GET(request: Request) {
  try {
    const session = await requireAuth(request, ["farmer"]);
    const db = await getPlatformDb(); await ensurePlatformSchema(db);
    const result = await db.prepare("SELECT * FROM greenfin_actions WHERE farmer_id = ? ORDER BY action_date DESC, created_at DESC").bind(session.profileId).all();
    return Response.json({ actions: result.results ?? [] });
  } catch (error) { return errorResponse(error, "讀取綠色行動失敗"); }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth(request, ["farmer"], true);
    const body = await request.json() as { dimension?: string; actionLevel?: string; description?: string; actionDate?: string; evidenceRecordIds?: string[] };
    const dimension = String(body.dimension ?? ""); const actionLevel = String(body.actionLevel ?? "");
    const description = String(body.description ?? "").trim(); const actionDate = String(body.actionDate ?? "");
    const evidenceRecordIds = [...new Set((body.evidenceRecordIds ?? []).map(String))];
    if (!dimensions.has(dimension) || !levels.has(actionLevel)) return Response.json({ error: "綠色行動構面或等級無效" }, { status: 400 });
    if (!description || description.length > 500) return Response.json({ error: "行動說明須為 1 至 500 字" }, { status: 400 });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(actionDate) || new Date(`${actionDate}T00:00:00Z`).valueOf() > Date.now()) return Response.json({ error: "行動日期無效或不可晚於今天" }, { status: 400 });
    const db = await getPlatformDb(); await ensurePlatformSchema(db);
    for (const recordId of evidenceRecordIds) {
      const owned = await db.prepare("SELECT id FROM greenfin_standardized_records WHERE id = ? AND farmer_id = ?").bind(recordId, session.profileId).first();
      if (!owned) return Response.json({ error: `佐證紀錄不屬於目前小農：${recordId}` }, { status: 403 });
    }
    const actionId = `GFACTION-${crypto.randomUUID()}`;
    await db.prepare(`INSERT INTO greenfin_actions (id, farmer_id, dimension, action_level, description, action_date, evidence_record_ids_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)`).bind(actionId, session.profileId, dimension, actionLevel, description, actionDate, JSON.stringify(evidenceRecordIds)).run();
    return Response.json({ ok: true, actionId, status: "active" });
  } catch (error) { return errorResponse(error, "建立綠色行動失敗"); }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireAuth(request, ["farmer"], true);
    const actionId = new URL(request.url).searchParams.get("actionId") ?? "";
    const db = await getPlatformDb();
    const result = await db.prepare("UPDATE greenfin_actions SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND farmer_id = ?").bind(actionId, session.profileId).run();
    if (!result.meta.changes) return Response.json({ error: "找不到綠色行動" }, { status: 404 });
    return Response.json({ ok: true, actionId, status: "inactive" });
  } catch (error) { return errorResponse(error, "停用綠色行動失敗"); }
}
