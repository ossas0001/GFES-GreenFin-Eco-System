import { applyPlatformAction, getPlatformDb, getPlatformSnapshot } from "../../../db/platform";
import { AuthError, PlatformRole, requireAuth } from "../../../db/auth";

const actionRoles: Record<string, PlatformRole[]> = {
  update_consumer_settings: ["consumer"],
  set_location: ["consumer"],
  register_local_action: ["consumer"],
  support_project: ["consumer"],
  redeem_product: ["consumer"],
  request_order_change: ["consumer"],
  review_order_change: ["farmer", "admin"],
  redeem_merchant: ["consumer"],
  simulate_integration: ["consumer", "admin"],
  update_farmer_story: ["farmer"],
  create_farmer_news: ["farmer"],
  update_farmer_news: ["farmer"],
  create_product: ["farmer"],
  update_product: ["farmer"],
  create_project: ["farmer"],
  submit_evidence: ["farmer"],
  submit_outcome: ["farmer"],
  redeem_resource: ["farmer"],
  request_resource_change: ["farmer"],
  review_resource_change: ["institution", "admin"],
  advance_order: ["farmer"],
  advance_resource_redemption: ["institution", "admin"],
  create_incentive: ["institution"],
  create_procurement: ["institution"],
  update_integration_setting: ["admin"],
  verify_outcome: ["institution", "admin"],
  admin_mark_action_submission_viewed: ["admin"],
  admin_review_action_submission: ["admin"],
  admin_update_account: ["admin"],
  admin_send_points: ["admin"],
  admin_update_product: ["admin"],
  admin_update_project: ["admin"],
  admin_update_incentive: ["admin"],
  admin_update_procurement: ["admin"],
  admin_update_data_template: ["admin"],
  admin_generate_data_template: ["admin"],
  admin_update_parameter: ["admin"],
};

type PlatformSnapshot = Awaited<ReturnType<typeof getPlatformSnapshot>>;

function errorMessage(error: unknown) {
  if (!(error instanceof Error)) return "後端處理失敗";
  if (error.message.includes("no such table")) return "資料庫尚未完成初始化，請先執行資料庫 migration";
  return error.message;
}

function errorStatus(error: unknown, fallback = 400) {
  return error instanceof AuthError ? error.status : fallback;
}

function snapshotForRole(snapshot: PlatformSnapshot, role: PlatformRole, profileId: string) {
  if (role === "admin") return snapshot;
  const emptyAdmin = { summary: { totalAccounts: 0, activeAccounts: 0, totalPoints: 0, activeProducts: 0, fundingProjects: 0, pendingReviews: 0 }, accounts: [], products: [], projects: [], incentives: [], procurements: [], parameters: [], dataTemplates: [], actionSubmissions: [], auditLogs: [] };
  const secured = { ...snapshot, admin: emptyAdmin };
  if (role === "consumer") return {
    ...secured,
    projectSupporters: {},
    farmerStory: null,
    farmerNews: [],
    projects: secured.projects.filter((item) => item.status !== "hidden"),
    catalog: secured.catalog.filter((item) => item.kind !== "support" || item.status !== "hidden"),
    evidence: [],
    outcomeReports: [],
    procurements: [],
    integrationSettings: [],
    verificationRuns: [],
    resourceRedemptions: [],
    changeRequests: secured.changeRequests.filter((item) => item.requestType === "order" && item.requesterId === profileId),
  };
  if (role === "farmer") {
    const products = secured.products.filter((item) => item.farmerId === profileId);
    const projects = secured.projects.filter((item) => item.farmerId === profileId);
    const ownIds = new Set([...products.map((item) => String(item.id)), ...projects.map((item) => String(item.id))]);
    return {
      ...secured,
      products,
      productsForConsumer: secured.productsForConsumer.filter((item) => item.farmerId === profileId),
      projects,
      catalog: secured.catalog.filter((item) => ownIds.has(String(item.id))),
      orders: secured.orders.filter((item) => item.farmerId === profileId),
      resourceRedemptions: secured.resourceRedemptions.filter((item) => item.farmerId === profileId),
      changeRequests: secured.changeRequests.filter((item) => (item.requestType === "resource" && item.requesterId === profileId) || (item.requestType === "order" && item.ownerId === profileId)),
      ledger: [],
      actionSubmissions: [],
      procurements: [],
      integrationSettings: [],
      verificationRuns: [],
      consumerNews: [],
    };
  }
  return {
    ...secured,
    projectSupporters: {},
    farmerStory: null,
    farmerNews: [],
    consumerNews: [],
    products: [],
    productsForConsumer: [],
    catalog: secured.projects,
    ledger: [],
    actionSubmissions: [],
    evidence: [],
    orders: [],
    incentives: secured.incentives.filter((item) => item.institutionId === profileId),
    resourceRedemptions: secured.resourceRedemptions.filter((item) => item.institutionId === profileId),
    outcomeReports: secured.outcomeReports.filter((item) => item.institutionId === profileId),
    procurements: secured.procurements,
    integrationSettings: [],
    verificationRuns: [],
    changeRequests: secured.changeRequests.filter((item) => item.requestType === "resource" && item.institutionId === profileId),
  };
}

export async function GET(request: Request) {
  try {
    const session = await requireAuth(request);
    const db = await getPlatformDb();
    const snapshot = await getPlatformSnapshot(db, { role: session.role, profileId: session.profileId });
    return Response.json(snapshotForRole(snapshot, session.role, session.profileId), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return Response.json({ error: errorMessage(error) }, { status: errorStatus(error, 503) });
  }
}

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > 128 * 1024) return Response.json({ error: "請求內容過大" }, { status: 413 });
    if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) return Response.json({ error: "僅接受 JSON 請求" }, { status: 415 });
    const body = (await request.json()) as Record<string, unknown>;
    const action = typeof body.action === "string" ? body.action : "";
    if (!action) return Response.json({ error: "action is required" }, { status: 400 });
    const allowedRoles = actionRoles[action];
    if (!allowedRoles) return Response.json({ error: "不支援的後端操作" }, { status: 400 });
    const session = await requireAuth(request, allowedRoles, true);
    if (action === "simulate_integration" && session.role === "consumer" && body.serviceKey !== "invoice") {
      return Response.json({ error: "消費者只能送出消費證明驗證" }, { status: 403 });
    }

    const db = await getPlatformDb();
    const result = await applyPlatformAction(db, action, body, { profileId: session.profileId, role: session.role });
    const snapshot = await getPlatformSnapshot(db, { role: session.role, profileId: session.profileId });
    return Response.json({ ...result, snapshot: snapshotForRole(snapshot, session.role, session.profileId) }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return Response.json({ error: errorMessage(error) }, { status: errorStatus(error) });
  }
}
