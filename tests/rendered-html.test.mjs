import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the green consumption platform", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>綠色消費平台<\/title>/i);
  assert.match(html, /讓每一次綠色行動/);
  assert.match(html, /都成為在地小農的力量/);
  assert.match(html, /看見每一份綠色選擇背後的行動/);
  assert.match(html, /登入平台/);
  assert.match(html, /綠色消費循環/);
  assert.doesNotMatch(html, /綠色信用|信用評分|融資|授信/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|Building your site/i);
});

test("keeps the completed platform and consumer journeys wired", async () => {
  const [page, layout, demo, css, packageJson, uploadRoute, platformRoute, platformBackend, schema, registerRoute, authRoute, googleCallbackRoute] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/GreenPlatformDemo.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../app/api/uploads/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/platform/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/platform.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/register/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/auth/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/auth/google/callback/route.ts", import.meta.url), "utf8"),
  ]);

  assert.match(page, /<GreenPlatformApp initialPortal="consumer" initialSessionExpected=\{initialSessionExpected\} \/>/);
  assert.match(page, /cookieStore\.has\("gfes_session_consumer"\)/);
  assert.match(layout, /default:\s*"綠色消費平台"/);
  assert.match(layout, /把消費、低碳交通與電子帳單化為綠點/);
  assert.match(demo, /function ConsumerOrdersPage/);
  assert.doesNotMatch(demo, /previewPasswords|previewEmails|passwordHint/);
  assert.match(demo, /註冊帳號/);
  assert.match(demo, /電子信箱或使用者名稱/);
  assert.match(demo, /pattern="\[a-z0-9_\]\{4,24\}"/);
  assert.match(demo, /使用 Google 登入/);
  assert.doesNotMatch(demo, /使用 Google 註冊/);
  assert.match(demo, /role === "consumer" \? username : displayName/);
  assert.match(demo, /role !== "consumer" && <label>/);
  assert.doesNotMatch(demo, /本機預覽帳號/);
  assert.match(demo, /真實註冊帳號/);
  assert.match(demo, /測試資料帳號/);
  assert.match(demo, /發送綠點/);
  assert.match(demo, /admin_send_points/);
  assert.match(platformRoute, /admin_send_points: \["admin"\]/);
  assert.match(platformBackend, /case "admin_send_points"/);
  assert.match(platformBackend, /account\.account_kind !== "test"/);
  assert.match(platformBackend, /integer\(body\.points, "發送綠點", \{ min: 1, max: 100_000 \}\)/);
  assert.match(platformBackend, /'admin_grant'/);
  assert.match(demo, /accountKind === "real"/);
  assert.match(platformBackend, /account_kind/);
  assert.match(registerRoute, /account_kind, status/);
  assert.match(registerRoute, /const requiresApproval = role === "farmer" \|\| role === "institution"/);
  assert.match(registerRoute, /const accountStatus = requiresApproval \? "pending" : "active"/);
  assert.match(registerRoute, /pendingApproval: true/);
  assert.match(registerRoute, /1～3 個工作天/);
  assert.match(authRoute, /account\?\.status === "pending"/);
  assert.match(authRoute, /管理員審核通過後才能登入/);
  assert.match(googleCallbackRoute, /account_kind, status/);
  assert.match(googleCallbackRoute, /accountStatus = savedState\.role === "consumer" \? "active" : "pending"/);
  assert.match(googleCallbackRoute, /returnPending\(request, savedState\.role\)/);
  assert.match(demo, /registration-approval-notice/);
  assert.match(demo, /申請已送出，等待管理員審核/);
  assert.match(demo, /合作小農與銀行／政府／企業需經管理員審核通過後才能登入/);
  assert.match(demo, /兌換訂單/);
  assert.match(demo, /帳戶設定/);
  assert.match(demo, /個人資料/);
  assert.match(demo, /預設配送地址/);
  assert.match(demo, /活動所在地（居住地址）/);
  assert.match(demo, /update_consumer_settings/);
  assert.match(demo, /consumerSettings\.deliveryRecipientName/);
  assert.match(demo, /defaultPhone=\{backendState\?\.consumerSettings\.phone/);
  assert.match(platformRoute, /update_consumer_settings: \["consumer"\]/);
  assert.match(platformBackend, /case "update_consumer_settings"/);
  assert.match(platformBackend, /INSERT INTO consumer_settings/);
  assert.match(schema, /export const consumerSettings/);
  assert.match(schema, /deliveryAddress: text\("delivery_address"\)/);
  assert.match(css, /\.consumer-settings-page/);
  assert.match(css, /\.mobile-nav-consumer \{ grid-template-columns: repeat\(7/);
  assert.match(demo, /receiptItems/);
  assert.match(demo, /了解更多完整故事/);
  assert.match(demo, /銀行／政府／企業/);
  assert.match(demo, /提升企業形象/);
  assert.doesNotMatch(demo, /持續優化政策與企業激勵方案/);
  assert.match(demo, /附近小農/);
  assert.match(demo, /自備環保杯、餐具或購物袋等減塑行動/);
  assert.match(demo, /initialImprovementProjects/);
  assert.match(demo, /farmer-project-greenhouse/);
  assert.match(demo, /requiredScore: 15000/);
  assert.match(demo, /使用環保杯/);
  assert.match(demo, /\u9084\u5dee \{gap\.toLocaleString\(\)\} \u9ede/);
  assert.match(demo, /台北市大安區/);
  assert.match(demo, /距離你約/);
  assert.match(demo, /包裹收件資料/);
  assert.match(demo, /recipientPhone/);
  assert.match(demo, /package-information/);
  assert.match(demo, /nearbyOpportunities/);
  assert.match(demo, /填寫資料並報名/);
  assert.match(demo, /活動時間：/);
  assert.match(demo, /填寫綠色行動報名資料/);
  assert.match(demo, /緊急聯絡電話/);
  assert.match(demo, /確認資料並完成報名/);
  assert.match(demo, /前往優惠地點/);
  assert.match(demo, /item\.actualDistance/);
  assert.match(platformBackend, /register_local_action/);
  assert.match(platformBackend, /recipient_name/);
  assert.match(platformBackend, /local_action_registrations/);
  assert.match(platformBackend, /attendee_name/);
  assert.match(platformBackend, /event_start/);
  assert.match(schema, /shippingAddress: text\("shipping_address"\)/);
  assert.match(schema, /export const localActionRegistrations/);
  assert.match(schema, /eventStart: text\("event_start"\)/);
  assert.match(schema, /attendeeName: text\("attendee_name"\)/);
  assert.match(demo, /商品管理/);
  assert.match(demo, /商品數量與點數/);
  assert.match(demo, /小農改善專案/);
  assert.match(demo, /企業後台專屬管理/);
  assert.match(demo, /section === "content"/);
  assert.match(demo, /統一管理入口/);
  assert.match(demo, /admin_update_procurement/);
  assert.match(platformBackend, /case "admin_update_procurement"/);
  assert.match(platformRoute, /admin_update_procurement: \["admin"\]/);
  assert.match(demo, /function saveFarmerProduct/);
  assert.match(demo, /"create_product"/);
  assert.match(demo, /sendAction\("support_project"/);
  assert.match(demo, /function OutcomeReportModal/);
  assert.doesNotMatch(demo, /redeem_merchant/);
  assert.match(demo, /function InstitutionResourceFulfillmentPage/);
  assert.match(demo, /function AdminApiSystemPage/);
  assert.match(demo, /API 測試與系統後台/);
  assert.match(demo, /待處理訂單與出貨回報/);
  assert.match(demo, /回報：已交寄並開始配送/);
  assert.match(demo, /workflowConfirmationMessages/);
  assert.match(demo, /confirmWorkflowAction/);
  assert.match(demo, /流程最終確認/);
  assert.match(demo, /流程步驟確認/);
  assert.match(demo, /confirmedByCheckbox/);
  assert.match(demo, /物流追蹤單號/);
  assert.match(demo, /履約進度由銀行／政府／企業承辦端更新/);
  assert.match(platformRoute, /advance_resource_redemption: \["institution", "admin"\]/);
  assert.match(platformRoute, /update_integration_setting: \["admin"\]/);
  assert.match(schema, /trackingNumber: text\("tracking_number"\)/);
  assert.match(schema, /packedAt: text\("packed_at"\)/);
  assert.match(schema, /shippedAt: text\("shipped_at"\)/);
  assert.match(schema, /completedAt: text\("completed_at"\)/);
  assert.match(demo, /模擬驗證/);
  assert.match(demo, /update_integration_setting/);
  assert.match(demo, /simulate_integration/);
  assert.match(demo, /function ProgramModal/);
  assert.match(demo, /function ImprovementProjectModal/);
  assert.match(demo, /function RoleCycleExplorer/);
  assert.match(demo, /cycle-direction-arrow-top-right[^>]*>↖/);
  assert.match(demo, /查看三方綠點循環/);
  assert.match(demo, /onMouseEnter=\{\(\) => setHoveredRole/);
  assert.match(demo, /function saveFarmerProject/);
  assert.match(demo, /FarmerProjectsPage/);
  assert.match(demo, /projects=\{availableLocalProjects\}/);
  assert.match(demo, /確認公開募資/);
  assert.match(demo, /function saveIncentivePlan/);
  assert.match(demo, /activityDescription/);
  assert.doesNotMatch(platformBackend, /body\.programAction \?\? body\.action/);
  assert.match(demo, /已送出發票/);
  assert.match(demo, /submittedFrom: "consumer"/);
  assert.match(demo, /送出資料：\$\{invoiceNumber\}/);
  assert.match(demo, /GFES_green_consumption_impact_summary_2026H1\.pdf/);
  assert.match(demo, /下載正式版 PDF/);
  assert.match(demo, /setIncentivePlans/);
  assert.match(demo, /programs\.length/);
  assert.match(demo, /儲存商品變更/);
  assert.match(demo, /確認上架新品/);
  assert.match(demo, /農業資源兌換/);
  assert.match(demo, /兌換紀錄、收據與履約進度/);
  assert.match(demo, /預約農會服務／審查/);
  assert.match(demo, /確認兌換並建立收據/);
  assert.match(demo, /function ResourceReceiptModal/);
  assert.match(demo, /列印或另存 PDF/);
  assert.match(platformBackend, /resource_redemptions/);
  assert.match(platformBackend, /advance_resource_redemption/);
  assert.match(schema, /export const resourceRedemptions/);
  assert.match(demo, /綠點激勵計畫/);
  assert.match(demo, /節能家電汰舊換新/);
  assert.match(demo, /上傳行動證明/);
  assert.match(demo, /最終確認｜送出行動證明/);
  assert.match(demo, /我已確認上述資料及附件正確/);
  assert.match(demo, /確認送出並進入審核/);
  assert.match(demo, /送出後由管理員審核，核准才會發放綠點/);
  assert.match(demo, /查看正式繳交文件範例/);
  assert.match(demo, /不接受無關的一般照片/);
  assert.match(demo, /FarmerGreenFinPage/);
  assert.match(demo, /選擇 PDF、圖片或 XLSX/);
  assert.match(demo, /上傳並執行 SIMULATED OCR/);
  assert.match(uploadRoute, /submissionType === "farmer_evidence"/);
  assert.match(uploadRoute, /farmer-evidence\//);
  assert.match(schema, /fileKey: text\("file_key"\)/);
  assert.match(demo, /GFES_電子帳單行動證明_正式範例\.pdf/);
  assert.match(demo, /下載完整 PDF/);
  assert.match(demo, /GFES_小農改善專案計畫書_完整範例\.pdf/);
  assert.doesNotMatch(demo, />下載 JSON</);
  assert.match(demo, /消費者行動證明審核/);
  assert.match(demo, /const adminSections: AdminSection\[\]/);
  assert.match(demo, /readAdminSection\(window\.location\.search\)/);
  assert.match(demo, /url\.searchParams\.set\("section", nextSection\)/);
  assert.match(demo, /window\.history\.replaceState/);
  assert.match(demo, /admin_review_action_submission/);
  assert.match(demo, /admin_mark_action_submission_viewed/);
  assert.match(demo, /查看並記錄/);
  assert.match(demo, /即將開啟「\$\{submission\.title\}」的證明文件/);
  assert.match(demo, /confirmedByCheckbox: true/);
  assert.match(platformBackend, /view_action_submission/);
  assert.match(platformBackend, /proof_viewed_at IS NULL/);
  assert.match(demo, /流程不可省略/);
  assert.match(demo, /busy \|\| !viewed \|\| !noteReady/);
  assert.match(demo, /每件 600 點/);
  assert.match(demo, /成果透明度/);
  assert.match(demo, /不等同信用評分或自動核貸/);
  assert.doesNotMatch(demo, /信用總分|核貸建議|建議額度|建議利率/);
  assert.match(css, /\.order-layout/);
  assert.match(css, /\.role-cycle-node\.dimmed/);
  assert.match(css, /@keyframes role-cycle-spin-counterclockwise \{ to \{ transform: rotate\(-360deg\); \} \}/);
  assert.match(css, /\.cycle-section-heading h2 \{ white-space: nowrap/);
  assert.match(css, /\.role-cycle-node strong \{[^}]*font-size: 21px/);
  assert.match(css, /\.role-cycle-detail-grid li \{[^}]*font-size: 16px/);
  assert.match(css, /\.device-preview-mobile \.cycle-section-heading h2 \{[^}]*white-space: normal/);
  assert.match(css, /\.device-preview-mobile \.role-cycle-stage \{[^}]*display: grid/);
  assert.match(css, /\.device-preview-mobile \.role-cycle-node,[\s\S]*?width: 100%/);
  assert.match(css, /\.device-preview-mobile \.role-cycle-detail-grid \{ grid-template-columns: 1fr; \}/);
  assert.match(css, /content: "\\7DA0\\9EDE\\6D41\\5411"/);
  assert.match(css, /\.cycle-link-support \{ left: 50%; bottom: 74px/);
  assert.match(css, /\.cycle-direction-arrow \{ display: none; \}/);
  assert.match(css, /content: "\\2193"/);
  assert.doesNotMatch(css, /content: "\?+/);
  assert.match(css, /\.receipt-more-button/);
  assert.match(demo, /dashboard-device-preview/);
  assert.match(demo, /dashboard-device-toggle/);
  assert.match(demo, /mobile-nav-institution/);
  assert.match(css, /\.dashboard-shell \.mobile-nav-institution \{ grid-template-columns: repeat\(5/);
  assert.match(css, /\.dashboard-shell \.mobile-nav \{[^}]*background: linear-gradient\(145deg, #12382a, #08251b\)/);
  assert.match(css, /\.dashboard-device-preview \.mobile-nav \{ position: fixed/);
  assert.match(demo, /mobile-card-table orders-table/);
  assert.match(css, /@container dashboard-shell \(max-width: 780px\)/);
  assert.match(css, /\.mobile-card-table td::before \{ content: none; \}/);
  assert.match(css, /\.dashboard-shell \.metrics \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.action-proof-uploader/);
  assert.match(css, /\.action-review-card/);
  assert.match(uploadRoute, /UPLOADS/);
  assert.match(uploadRoute, /action_submissions/);
  assert.match(platformBackend, /approved_green_action/);
  assert.match(platformBackend, /action-submission:/);
  assert.match(platformBackend, /pendingActionSeeds/);
  assert.equal((platformBackend.match(/SAMPLE-ACTION-/g) ?? []).length, 8);
  assert.match(platformBackend, /請先查看證明文件/);
  assert.match(platformBackend, /審核流程不可省略/);
  assert.match(schema, /proofViewedAt: text\("proof_viewed_at"\)/);
  assert.match(packageJson, /vinext dev --port 4310 --strictPort/);

  await access(new URL("../public/reports/GFES_green_consumption_impact_summary_2026H1.pdf", import.meta.url));
  await access(new URL("../public/documents/GFES_環保杯行動證明_正式範例.pdf", import.meta.url));
  await access(new URL("../public/documents/GFES_大眾運輸行動證明_正式範例.pdf", import.meta.url));
  await access(new URL("../public/documents/GFES_電子帳單行動證明_正式範例.pdf", import.meta.url));
  await access(new URL("../public/documents/GFES_節能家電行動證明_正式範例.pdf", import.meta.url));
  await access(new URL("../drizzle/0006_wide_red_wolf.sql", import.meta.url));
  await access(new URL("../drizzle/0022_cute_blue_marvel.sql", import.meta.url));
  await access(new URL("../drizzle/0023_messy_lethal_legion.sql", import.meta.url));
  await access(new URL("../public/documents/GFES_綠色消費證明_完整範例.pdf", import.meta.url));
  await access(new URL("../public/documents/GFES_農產履歷批次資料_完整範例.pdf", import.meta.url));
  await access(new URL("../public/documents/GFES_無農藥檢測報告_完整範例.pdf", import.meta.url));
  await access(new URL("../public/documents/GFES_友善耕作紀錄_完整範例.pdf", import.meta.url));
  await access(new URL("../public/documents/GFES_低碳設備使用證明_完整範例.pdf", import.meta.url));
  await access(new URL("../public/documents/GFES_小農改善專案計畫書_完整範例.pdf", import.meta.url));
  await access(new URL("../public/documents/GFES_改善專案成果回報_完整範例.pdf", import.meta.url));
  await access(new URL("../public/documents/GFES_綠點激勵計畫_完整範例.pdf", import.meta.url));
  await access(new URL("../public/documents/GFES_永續採購需求_完整範例.pdf", import.meta.url));
  await assert.rejects(access(new URL("../app/_sites-preview", import.meta.url)));
  await assert.rejects(access(new URL("public/_sites-preview", templateRoot)));
});

test("ships twenty coherent farmer image groups", async () => {
  const library = JSON.parse(await readFile(new URL("../app/data/farmerImageLibrary.json", import.meta.url), "utf8"));
  assert.equal(library.length, 20);

  const imagePaths = library.flatMap((group) => {
    assert.equal(group.cultivationImages.length, 2);
    assert.ok(group.farmerName);
    assert.ok(group.farmName);
    assert.ok(group.city);
    assert.ok(group.district);
    assert.ok(group.crop);
    assert.ok(group.productName);
    return [...group.cultivationImages, group.productImage];
  });

  assert.equal(imagePaths.length, 60);
  assert.equal(new Set(imagePaths).size, 60);
  await Promise.all(imagePaths.map((imagePath) => access(new URL(`../public${imagePath}`, import.meta.url))));
});

test("provides a root consumer portal and three locked backend URLs", async () => {
  const [homePage, portalPage, demo, googleRoute, googleCallback] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/[portal]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/GreenPlatformDemo.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/auth/google/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/auth/google/callback/route.ts", import.meta.url), "utf8"),
  ]);

  assert.match(homePage, /initialPortal="consumer"/);
  assert.match(demo, /consumer: "\/"/);
  assert.doesNotMatch(portalPage, /value === "consumer"/);
  for (const portal of ["farmer", "institution", "admin"]) {
    assert.match(portalPage, new RegExp(`\\b${portal}\\b`));
    assert.match(demo, new RegExp(`${portal}: "/${portal}"`));
  }
  assert.match(demo, /lockedRole=\{initialPortal\}/);
  assert.match(demo, /專屬角色入口/);
  assert.match(demo, /這是\$\{loginRoles\[initialPortal\]\.label\}專用入口/);
  assert.match(googleRoute, /Location: `\$\{portalPath\}\?\$\{params\}`/);
  assert.match(googleCallback, /Location: `\$\{portalPath\}\?auth=google`/);
});

test("keeps Google users on isolated real accounts", async () => {
  const [demo, callback, platformRoute, platformBackend, schema] = await Promise.all([
    readFile(new URL("../app/GreenPlatformDemo.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/auth/google/callback/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/platform/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/platform.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
  ]);

  assert.match(callback, /auth_provider, provider_subject/);
  assert.match(callback, /'real', \?, 'google'/);
  assert.match(callback, /ac\.profile_id, ac\.status, p\.role/);
  assert.match(callback, /if \(accountStatus === "pending"\) return returnPending/);
  assert.match(platformBackend, /viewer\?\.role === "consumer" \? viewer\.profileId/);
  assert.match(platformBackend, /viewer\?\.role === "farmer" \? viewer\.profileId/);
  assert.match(platformBackend, /viewer\?\.role === "institution" \? viewer\.profileId/);
  assert.match(platformBackend, /viewer \? "__no_consumer__" : CONSUMER_ID/);
  assert.match(platformBackend, /WHERE p\.farmer_id = \? ORDER BY o\.created_at/);
  assert.match(platformBackend, /WHERE institution_id = \? ORDER BY created_at DESC/);
  assert.match(platformBackend, /rr\.institution_id AS resource_institution_id/);
  assert.match(platformBackend, /您沒有權限更新其他機構的履約進度/);
  assert.match(platformRoute, /item\.institutionId === profileId/);
  assert.match(schema, /institutionId: text\("institution_id"\)/);
  assert.match(demo, /正在載入您的專屬帳戶/);
  assert.match(demo, /useState\(initialSessionExpected \|\| \(Boolean\(initialPortal\)/, "session restoration must gate the public home screen during refresh");
  assert.match(demo, /系統不會因此將您登出/, "temporary restore failures must not be presented as logout");
  assert.match(demo, /openRoleWorkspace\(session\.role, true\)/, "refresh must restore the signed-in role workspace and section");
  assert.match(demo, /const loaded = await refreshBackend\(session\.role\);[\s\S]{0,320}openRoleWorkspace\(session\.role, true\)/);
  assert.doesNotMatch(demo, /本月取得<b>510 點<\/b>/);
  assert.doesNotMatch(demo, /value="3 款"/);
  assert.doesNotMatch(demo, /<strong>46<\/strong><small>本月訂單/);
  assert.match(demo, /signedInDisplayName/);
  assert.match(demo, /目前登入角色/);
});
