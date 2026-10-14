import assert from "node:assert/strict";

const baseUrl = process.env.GFES_TEST_URL ?? "http://localhost:4310";

async function login(role, email, password) {
  const response = await fetch(`${baseUrl}/api/auth`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ role, email, password }),
  });
  const data = await response.json();
  assert.equal(response.status, 200, `${role} login failed: ${JSON.stringify(data)}`);
  const cookie = response.headers.get("set-cookie")?.split(";")[0];
  assert.ok(cookie);
  assert.ok(data.csrfToken);
  return { role, cookie, csrf: data.csrfToken };
}

async function action(session, actionName, payload = {}, csrf = session.csrf) {
  const response = await fetch(`${baseUrl}/api/platform`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie: session.cookie, "x-gfes-csrf": csrf },
    body: JSON.stringify({ ...payload, action: actionName }),
  });
  const data = await response.json();
  return { response, data };
}

const unauthorized = await fetch(`${baseUrl}/api/platform`);
assert.equal(unauthorized.status, 401, "anonymous snapshot access must be blocked");

const badLogin = await fetch(`${baseUrl}/api/auth`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ role: "admin", email: "admin@gfes.tw", password: "wrong-password" }),
});
assert.equal(badLogin.status, 401, "invalid password must be rejected");

const [consumer, farmer, institution, admin] = await Promise.all([
  login("consumer", "consumer@gfes.tw", "12345678"),
  login("farmer", "farmer@gfes.tw", "12345678"),
  login("institution", "institution@gfes.tw", "12345678"),
  login("admin", "admin001", "13245678"),
]);

const roleAttacks = await Promise.all([
  action(consumer, "admin_update_parameter", { parameterKey: "platform_fee_percent", value: "0" }),
  action(farmer, "support_project", { projectId: "water" }),
  action(institution, "create_product", { title: "越權商品", points: 1, stock: 1, description: "不可建立" }),
  action(consumer, "simulate_integration", { serviceKey: "government_task", input: { task: "forged" } }),
  action(farmer, "advance_resource_redemption", { redemptionId: "forged-resource" }),
  action(institution, "advance_order", { orderId: "forged-order" }),
  action(institution, "update_integration_setting", { serviceKey: "invoice", enabled: false, rewardPoints: 0, endpointLabel: "forged", sampleResponse: "{}" }),
  action(institution, "simulate_integration", { serviceKey: "government_task", input: { task: "forged" } }),
]);
for (const result of roleAttacks) assert.ok([401, 403].includes(result.response.status), `role escalation was not blocked: ${JSON.stringify(result.data)}`);

const farmerSnapshotResponse = await fetch(`${baseUrl}/api/platform`, { headers: { cookie: farmer.cookie } });
assert.equal(farmerSnapshotResponse.status, 200);
const farmerSnapshot = await farmerSnapshotResponse.json();
assert.ok(farmerSnapshot.projects.every((item) => item.farmerId === "farmer-001"), "farmer dashboard must only include owned projects");
assert.ok(farmerSnapshot.products.every((item) => item.farmerId === "farmer-001"), "farmer dashboard must only include owned products");
assert.ok(farmerSnapshot.orders.every((item) => item.farmerId === "farmer-001"), "farmer dashboard must only include orders for owned products");
assert.equal(farmerSnapshot.projects.some((item) => item.id === "solar-cold"), false, "foreign project must not appear in farmer dashboard");
assert.deepEqual(farmerSnapshot.integrationSettings, [], "farmer must not receive API system settings");

const institutionSnapshotResponse = await fetch(`${baseUrl}/api/platform`, { headers: { cookie: institution.cookie } });
assert.equal(institutionSnapshotResponse.status, 200);
const institutionSnapshot = await institutionSnapshotResponse.json();
assert.deepEqual(institutionSnapshot.integrationSettings, [], "institution must not receive API system settings");
assert.deepEqual(institutionSnapshot.verificationRuns, [], "institution must not receive API verification history");
assert.ok(Array.isArray(institutionSnapshot.resourceRedemptions), "institution must receive agricultural resource fulfillment records");

const ownershipAttacks = await Promise.all([
  action(farmer, "submit_outcome", { projectId: "solar-cold", waterLiters: 1, carbonKg: 1, beneficiaries: 1, note: "越權成果測試" }),
  action(farmer, "submit_evidence", { projectId: "solar-cold", title: "越權證明", evidenceType: "友善耕作紀錄" }),
  action(farmer, "update_product", { id: "rice-pack", title: "越權修改", points: 1, stock: 1, unit: "件", proof: "測試", delivery: "測試", description: "不可修改" }),
]);
for (const result of ownershipAttacks) assert.equal(result.response.status, 400, `foreign farmer content was not blocked: ${JSON.stringify(result.data)}`);

const missingCsrf = await action(consumer, "set_location", { city: "台北市", district: "大安區" }, "invalid");
assert.equal(missingCsrf.response.status, 403, "invalid CSRF token must be rejected");

const invalidNumbers = await Promise.all([
  action(farmer, "create_product", { title: "負庫存", points: 10, stock: -1, description: "測試" }),
  action(farmer, "create_product", { title: "小數點數", points: 1.5, stock: 1, description: "測試" }),
  action(institution, "create_procurement", { title: "超額採購", category: "測試", quantity: 1, budgetPoints: 999999999999, deliveryRegion: "台北市" }),
  action(consumer, "redeem_product", { productId: "missing", quantity: 999999999, recipientName: "測試", recipientPhone: "0912345678", shippingCity: "台北市", shippingDistrict: "大安區", shippingAddress: "測試路 1 號" }),
  action(consumer, "register_local_action", { actionId: "farmer-visit" }),
]);
for (const result of invalidNumbers) assert.equal(result.response.status, 400, `extreme value was not rejected: ${JSON.stringify(result.data)}`);

const adminSnapshotResponse = await fetch(`${baseUrl}/api/platform`, { headers: { cookie: admin.cookie } });
assert.equal(adminSnapshotResponse.status, 200);
const before = await adminSnapshotResponse.json();
const consumerBefore = before.admin.accounts.find((item) => item.id === "consumer-001").points;
const farmerBefore = before.admin.accounts.find((item) => item.id === "farmer-001").points;
assert.ok(consumerBefore > 0 && consumerBefore <= 1_000_000, "test requires a bounded positive consumer balance");

const testProductId = `security-double-spend-${Date.now()}`;
const created = await action(farmer, "create_product", {
  id: testProductId,
  title: "安全測試｜雙花防護商品",
  points: consumerBefore,
  stock: 2,
  unit: "件",
  proof: "安全測試資料",
  delivery: "不實際配送",
  description: "自動安全測試建立，完成後隱藏",
  city: "台北市",
  district: "大安區",
  distanceKm: 0.1,
});
assert.equal(created.response.status, 200, JSON.stringify(created.data));

const orderPayload = {
  productId: testProductId,
  quantity: 1,
  recipientName: "安全測試",
  recipientPhone: "0912345678",
  postalCode: "106",
  shippingCity: "台北市",
  shippingDistrict: "大安區",
  shippingAddress: "安全測試路 1 號",
  deliveryNote: "自動雙花測試，不需出貨",
};
const doubleSpend = await Promise.all([action(consumer, "redeem_product", orderPayload), action(consumer, "redeem_product", orderPayload)]);
assert.equal(doubleSpend.filter((item) => item.response.status === 200).length, 1, "exactly one concurrent spend must succeed");
assert.equal(doubleSpend.filter((item) => item.response.status === 400).length, 1, "the competing spend must be rejected");

const createdOrder = doubleSpend.find((item) => item.response.status === 200)?.data.snapshot.orders.find((item) => item.productId === testProductId);
assert.ok(createdOrder, "successful redemption must create an order for shipment testing");
const packed = await action(farmer, "advance_order", { orderId: createdOrder.id, fulfillmentNote: "安全測試：完成備貨" });
assert.equal(packed.response.status, 200, JSON.stringify(packed.data));
const packedOrder = packed.data.snapshot.orders.find((item) => item.id === createdOrder.id);
assert.equal(packedOrder.stage, 1);
assert.ok(packedOrder.packedAt, "starting fulfillment must record packedAt");

const shipped = await action(farmer, "advance_order", { orderId: createdOrder.id, carrier: "測試物流", trackingNumber: `TEST-${Date.now()}`, fulfillmentNote: "安全測試：完成交寄" });
assert.equal(shipped.response.status, 200, JSON.stringify(shipped.data));
const shippedOrder = shipped.data.snapshot.orders.find((item) => item.id === createdOrder.id);
assert.equal(shippedOrder.stage, 2);
assert.equal(shippedOrder.carrier, "測試物流");
assert.ok(shippedOrder.trackingNumber);
assert.ok(shippedOrder.shippedAt, "shipping must record shippedAt");

const completed = await action(farmer, "advance_order", { orderId: createdOrder.id, fulfillmentNote: "安全測試：配送完成" });
assert.equal(completed.response.status, 200, JSON.stringify(completed.data));
const completedOrder = completed.data.snapshot.orders.find((item) => item.id === createdOrder.id);
assert.equal(completedOrder.stage, 3);
assert.ok(completedOrder.completedAt, "completion must record completedAt");

const invoiceInput = { invoiceNumber: `ZZ${String(Date.now()).slice(-8)}`, amount: 1, transactionDate: "2026-08-10", randomCode: "0001", mode: "security-test" };
const duplicateReward = await Promise.all([
  action(consumer, "simulate_integration", { serviceKey: "invoice", input: invoiceInput }),
  action(consumer, "simulate_integration", { serviceKey: "invoice", input: invoiceInput }),
]);
assert.equal(duplicateReward.filter((item) => item.response.status === 200).length, 1, "only one duplicate verification should create a reward");
assert.equal(duplicateReward.filter((item) => item.response.status === 400).length, 1, "concurrent duplicate verification must be rejected atomically");
const pendingInvoice = duplicateReward.find((item) => item.response.status === 200);
assert.equal(pendingInvoice.data.pendingReview, true, "consumer invoices must wait for admin review instead of granting points");

await action(admin, "admin_update_product", { productId: testProductId, points: consumerBefore, stock: 1, status: "hidden" });
await action(admin, "admin_update_account", { profileId: "consumer-001", displayName: "林子晴", username: "consumer001", email: "consumer@gfes.tw", city: "台北市", district: "大安區", status: "active", pointAdjustment: consumerBefore, reason: "安全測試後恢復原始綠點" });
await action(admin, "admin_update_account", { profileId: "farmer-001", displayName: "禾日友善農園", username: "farmer001", email: "farmer@gfes.tw", city: "雲林縣", district: "斗六市", status: "active", pointAdjustment: -consumerBefore, reason: "安全測試後恢復原始綠點" });

const finalSnapshotResponse = await fetch(`${baseUrl}/api/platform`, { headers: { cookie: admin.cookie } });
const after = await finalSnapshotResponse.json();
assert.equal(after.admin.accounts.find((item) => item.id === "consumer-001").points, consumerBefore, "consumer balance must be restored after the test");
assert.equal(after.admin.accounts.find((item) => item.id === "farmer-001").points, farmerBefore, "farmer balance must be restored after the test");

console.log(JSON.stringify({
  passed: true,
  checks: {
    anonymousAccess: "blocked",
    invalidLogin: "blocked",
    roleEscalation: "blocked",
    farmerOwnership: "dashboard filtered / forged writes blocked",
    csrf: "blocked",
    extremeValues: "blocked",
    concurrentDoubleSpend: "1 accepted / 1 rejected",
    farmerShipmentTimeline: "packed / shipped / completed timestamps recorded",
    duplicateReward: "1 accepted / 1 rejected",
    balancesRestored: true,
  },
}, null, 2));
