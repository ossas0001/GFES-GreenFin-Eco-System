import { AuthError, requireAuth } from "../../../../db/auth";
import { ensurePlatformSchema, getPlatformDb } from "../../../../db/platform";
import { loadGreenFinRuleEngine, validateGreenFinRuleConfig, type GreenFinRuleConfig } from "../../../../worker/greenfin/rules/engine";

export async function GET(request: Request) {
  try {
    await requireAuth(request, ["farmer", "institution", "admin"]);
    const db = await getPlatformDb();
    await ensurePlatformSchema(db);
    const version = new URL(request.url).searchParams.get("version") ?? undefined;
    const engine = await loadGreenFinRuleEngine(db, version);
    return Response.json({
      version: engine.version,
      isValid: validateGreenFinRuleConfig(engine.config as GreenFinRuleConfig).length === 0,
      experience: engine.experience,
      indicators: engine.indicators,
      dataHealth: engine.dataHealth,
    });
  } catch (error) {
    const missing = error instanceof Error && error.message.startsWith("找不到規則版本");
    return Response.json({ error: error instanceof Error ? error.message : "讀取 GreenFin 規則失敗" }, { status: error instanceof AuthError ? error.status : missing ? 404 : 400 });
  }
}
