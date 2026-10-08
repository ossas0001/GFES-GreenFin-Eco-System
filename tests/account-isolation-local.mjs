import assert from "node:assert/strict";

const baseUrl = process.env.GFES_TEST_URL ?? "http://localhost:4310";
const suffix = Date.now().toString().slice(-10);

async function register(role, label) {
  const username = `${label}${suffix}`.slice(0, 24);
  const email = `${username}@isolation.gfes.test`;
  const response = await fetch(`${baseUrl}/api/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ role, displayName: `${label} 專屬帳戶`, username, email, password: "12345678" }),
  });
  const data = await response.json();
  assert.equal(response.status, 201, JSON.stringify(data));
  return { role, username, email, data, cookie: response.headers.get("set-cookie")?.split(";")[0] ?? "" };
}

async function login(role, email, password = "12345678") {
  const response = await fetch(`${baseUrl}/api/auth`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ role, email, password }),
  });
  const data = await response.json();
  assert.equal(response.status, 200, `${role} login failed: ${JSON.stringify(data)}`);
  return { role, cookie: response.headers.get("set-cookie")?.split(";")[0] ?? "", csrf: data.csrfToken };
}

async function snapshot(session) {
  const response = await fetch(`${baseUrl}/api/platform`, { headers: { cookie: session.cookie } });
  const data = await response.json();
  assert.equal(response.status, 200, JSON.stringify(data));
  return data;
}

async function action(session, name, payload) {
  const response = await fetch(`${baseUrl}/api/platform`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie: session.cookie, "x-gfes-csrf": session.csrf },
    body: JSON.stringify({ action: name, ...payload }),
  });
  const data = await response.json();
  assert.equal(response.status, 200, JSON.stringify(data));
  return data;
}

async function activate(admin, account) {
  const adminData = await snapshot(admin);
  const row = adminData.admin.accounts.find((item) => item.username === account.username);
  assert.ok(row, `pending ${account.role} account not found`);
  await action(admin, "admin_update_account", {
    profileId: row.id,
    displayName: row.displayName,
    email: row.email,
    username: row.username,
    city: row.city,
    district: row.district,
    status: "active",
    pointAdjustment: 0,
    reason: "帳戶隔離測試核准",
  });
}

const firstConsumer = await register("consumer", "isoa");
const secondConsumer = await register("consumer", "isob");
assert.ok(firstConsumer.cookie && secondConsumer.cookie);
const firstSession = { role: "consumer", cookie: firstConsumer.cookie, csrf: firstConsumer.data.csrfToken };
const secondSession = { role: "consumer", cookie: secondConsumer.cookie, csrf: secondConsumer.data.csrfToken };
const firstSnapshot = await snapshot(firstSession);
const secondSnapshot = await snapshot(secondSession);
for (const data of [firstSnapshot, secondSnapshot]) {
  assert.equal(data.consumer.points, 500);
  assert.deepEqual(data.orders, []);
  assert.equal(data.ledger.length, 1);
  assert.equal(data.ledger[0].deltaPoints, 500);
  assert.equal(data.ledger[0].sourceType, "platform_reward");
  assert.deepEqual(data.supportedProjectIds, []);
  assert.deepEqual(data.redeemedProductIds, []);
  assert.deepEqual(data.actionSubmissions, []);
  assert.deepEqual(data.registeredActionIds, []);
}
assert.notEqual(firstSnapshot.consumer.id, secondSnapshot.consumer.id);
const emailSession = await login("consumer", firstConsumer.email);
const emailSnapshot = await snapshot(emailSession);
assert.equal(emailSnapshot.consumer.id, firstSnapshot.consumer.id);
assert.equal(emailSnapshot.consumer.points, 500);
assert.equal(emailSnapshot.ledger.length, 1);

const admin = await login("admin", "admin001", "13245678");
const farmerAccount = await register("farmer", "isof");
const institutionAccount = await register("institution", "isoi");
assert.equal(farmerAccount.data.pendingApproval, true);
assert.equal(institutionAccount.data.pendingApproval, true);
await activate(admin, farmerAccount);
await activate(admin, institutionAccount);

const farmerSnapshot = await snapshot(await login("farmer", farmerAccount.username));
assert.deepEqual(farmerSnapshot.products, []);
assert.deepEqual(farmerSnapshot.projects, []);
assert.deepEqual(farmerSnapshot.orders, []);
assert.deepEqual(farmerSnapshot.evidence, []);
assert.deepEqual(farmerSnapshot.outcomeReports, []);
assert.deepEqual(farmerSnapshot.resourceRedemptions, []);

const institutionSnapshot = await snapshot(await login("institution", institutionAccount.username));
assert.deepEqual(institutionSnapshot.incentives, []);
assert.deepEqual(institutionSnapshot.procurements, []);
assert.deepEqual(institutionSnapshot.resourceRedemptions, []);
assert.deepEqual(institutionSnapshot.outcomeReports, []);
assert.deepEqual(institutionSnapshot.projects, []);

console.log(JSON.stringify({
  consumers: [firstSnapshot.consumer.id, secondSnapshot.consumer.id],
  farmer: farmerSnapshot.farmer.id,
  institution: institutionSnapshot.institution.id,
  personalCollectionsAreEmpty: true,
}, null, 2));
