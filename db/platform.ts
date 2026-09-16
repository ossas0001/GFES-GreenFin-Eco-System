import { getDb } from "./index";
import { createPasswordCredential } from "./credentials";
import { ensureGreenFinSchema } from "./greenfin";

export const CONSUMER_ID = "consumer-001";
export const FARMER_ID = "farmer-001";
export const INSTITUTION_ID = "institution-001";

type DbBinding = D1Database;
const platformSchemaReady = new WeakMap<object, Promise<void>>();

const json = (value: unknown) => JSON.stringify(value ?? {});
const parse = <T>(value: string | null | undefined, fallback: T): T => {
  try {
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
};

async function queryAll<T>(db: DbBinding, statement: string, ...values: unknown[]) {
  const result = await db.prepare(statement).bind(...values).all<T>();
  return result.results ?? [];
}

async function queryOne<T>(db: DbBinding, statement: string, ...values: unknown[]) {
  return db.prepare(statement).bind(...values).first<T>();
}

async function initializePlatformSchema(db: DbBinding) {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL,
      display_name TEXT NOT NULL,
      city TEXT NOT NULL,
      district TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS consumer_settings (
      consumer_id TEXT PRIMARY KEY,
      contact_email TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      delivery_recipient_name TEXT NOT NULL DEFAULT '',
      delivery_phone TEXT NOT NULL DEFAULT '',
      delivery_postal_code TEXT NOT NULL DEFAULT '',
      delivery_city TEXT NOT NULL DEFAULT '',
      delivery_district TEXT NOT NULL DEFAULT '',
      delivery_address TEXT NOT NULL DEFAULT '',
      delivery_note TEXT NOT NULL DEFAULT '',
      residence_postal_code TEXT NOT NULL DEFAULT '',
      residence_city TEXT NOT NULL DEFAULT '',
      residence_district TEXT NOT NULL DEFAULT '',
      residence_address TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      farmer_id TEXT NOT NULL,
      title TEXT NOT NULL,
      points INTEGER NOT NULL,
      stock INTEGER NOT NULL,
      unit TEXT NOT NULL,
      proof TEXT NOT NULL,
      delivery TEXT NOT NULL,
      description TEXT NOT NULL,
      image TEXT NOT NULL,
      city TEXT NOT NULL,
      district TEXT NOT NULL,
      distance_km REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      farmer_id TEXT NOT NULL,
      title TEXT NOT NULL,
      note TEXT NOT NULL,
      purpose TEXT NOT NULL,
      points INTEGER NOT NULL,
      target_points INTEGER NOT NULL,
      raised_points INTEGER NOT NULL DEFAULT 0,
      supporters INTEGER NOT NULL DEFAULT 0,
      progress INTEGER NOT NULL DEFAULT 0,
      impact TEXT NOT NULL,
      city TEXT NOT NULL,
      district TEXT NOT NULL,
      distance_km REAL NOT NULL,
      completion_date TEXT NOT NULL,
      proof TEXT NOT NULL,
      allocations_json TEXT NOT NULL,
      story_json TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'funding',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS farmer_stories (
      farmer_id TEXT PRIMARY KEY,
      headline TEXT NOT NULL,
      summary TEXT NOT NULL,
      body TEXT NOT NULL,
      quote TEXT NOT NULL DEFAULT '',
      image_key TEXT,
      image_url TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft',
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      published_at TEXT
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS farmer_news (
      id TEXT PRIMARY KEY,
      farmer_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT '農場近況',
      image_key TEXT,
      image_url TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      published_at TEXT
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS point_ledger (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      delta_points INTEGER NOT NULL,
      source_type TEXT NOT NULL,
      source_id TEXT,
      description TEXT NOT NULL,
      metadata_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      consumer_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      points INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      stage INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'created',
      recipient_name TEXT NOT NULL DEFAULT '',
      recipient_phone TEXT NOT NULL DEFAULT '',
      postal_code TEXT NOT NULL DEFAULT '',
      shipping_city TEXT NOT NULL,
      shipping_district TEXT NOT NULL,
      shipping_address TEXT NOT NULL DEFAULT '',
      delivery_note TEXT NOT NULL DEFAULT '',
      carrier TEXT NOT NULL DEFAULT '',
      tracking_number TEXT NOT NULL DEFAULT '',
      fulfillment_note TEXT NOT NULL DEFAULT '',
      packed_at TEXT NOT NULL DEFAULT '',
      shipped_at TEXT NOT NULL DEFAULT '',
      completed_at TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS project_supports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      consumer_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      points INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS incentive_programs (
      id TEXT PRIMARY KEY,
      institution_id TEXT NOT NULL DEFAULT 'institution-001',
      name TEXT NOT NULL,
      sponsor TEXT NOT NULL,
      action TEXT NOT NULL,
      reward TEXT NOT NULL,
      budget_points INTEGER NOT NULL,
      participants TEXT NOT NULL,
      progress INTEGER NOT NULL DEFAULT 0,
      esg TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS resource_offers (
      id TEXT PRIMARY KEY,
      institution_id TEXT NOT NULL DEFAULT 'institution-001',
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      required_points INTEGER NOT NULL,
      term TEXT NOT NULL,
      rate TEXT NOT NULL,
      description TEXT NOT NULL,
      purpose TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'available'
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS resource_redemptions (
      id TEXT PRIMARY KEY,
      institution_id TEXT NOT NULL DEFAULT 'institution-001',
      farmer_id TEXT NOT NULL,
      offer_id TEXT NOT NULL,
      resource_name TEXT NOT NULL,
      points INTEGER NOT NULL,
      cooperative TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      contact_phone TEXT NOT NULL,
      fulfillment_type TEXT NOT NULL,
      delivery_address TEXT NOT NULL DEFAULT '',
      appointment_date TEXT NOT NULL DEFAULT '',
      appointment_slot TEXT NOT NULL DEFAULT '',
      note TEXT NOT NULL DEFAULT '',
      stage INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'submitted',
      tracking_number TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS change_requests (
      id TEXT PRIMARY KEY,
      request_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      requester_id TEXT NOT NULL,
      reason_code TEXT NOT NULL,
      reason_detail TEXT NOT NULL DEFAULT '',
      requested_json TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      reviewer_id TEXT NOT NULL DEFAULT '',
      review_note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS local_actions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      organizer TEXT NOT NULL,
      description TEXT NOT NULL,
      reward_points INTEGER NOT NULL,
      city TEXT NOT NULL,
      district TEXT NOT NULL,
      address TEXT NOT NULL DEFAULT '',
      details TEXT NOT NULL DEFAULT '',
      event_start TEXT NOT NULL DEFAULT '',
      event_end TEXT NOT NULL DEFAULT '',
      distance_km REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'open'
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS merchant_offers (
      id TEXT PRIMARY KEY,
      merchant TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      required_points INTEGER NOT NULL,
      city TEXT NOT NULL,
      district TEXT NOT NULL,
      address TEXT NOT NULL DEFAULT '',
      details TEXT NOT NULL DEFAULT '',
      distance_km REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'active'
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS local_action_registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      consumer_id TEXT NOT NULL,
      action_id TEXT NOT NULL,
      attendee_name TEXT NOT NULL DEFAULT '',
      attendee_phone TEXT NOT NULL DEFAULT '',
      attendee_email TEXT NOT NULL DEFAULT '',
      participant_count INTEGER NOT NULL DEFAULT 1,
      emergency_contact_name TEXT NOT NULL DEFAULT '',
      emergency_contact_phone TEXT NOT NULL DEFAULT '',
      note TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'registered',
      registered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS evidence (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farmer_id TEXT NOT NULL,
      project_id TEXT,
      product_id TEXT,
      title TEXT NOT NULL,
      evidence_type TEXT NOT NULL,
      file_key TEXT,
      file_name TEXT,
      content_type TEXT,
      file_size INTEGER,
      status TEXT NOT NULL DEFAULT 'submitted',
      submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      verified_at TEXT
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS outcome_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      institution_id TEXT NOT NULL DEFAULT 'institution-001',
      project_id TEXT NOT NULL,
      farmer_id TEXT NOT NULL,
      water_liters INTEGER,
      carbon_kg INTEGER,
      beneficiaries INTEGER,
      note TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'submitted',
      submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      verified_at TEXT
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS procurement_requests (
      id TEXT PRIMARY KEY,
      institution_id TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      budget_points INTEGER NOT NULL,
      delivery_region TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS integration_settings (
      service_key TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      mode TEXT NOT NULL DEFAULT 'simulation',
      enabled INTEGER NOT NULL DEFAULT 1,
      reward_points INTEGER NOT NULL DEFAULT 0,
      endpoint_label TEXT NOT NULL,
      sample_response_json TEXT NOT NULL DEFAULT '{}',
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS verification_runs (
      id TEXT PRIMARY KEY,
      service_key TEXT NOT NULL,
      input_json TEXT NOT NULL DEFAULT '{}',
      response_json TEXT NOT NULL DEFAULT '{}',
      status TEXT NOT NULL,
      reward_points INTEGER NOT NULL DEFAULT 0,
      input_fingerprint TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS account_controls (
      profile_id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      username TEXT,
      account_kind TEXT NOT NULL DEFAULT 'test',
      status TEXT NOT NULL DEFAULT 'active',
      password_hash TEXT,
      password_salt TEXT,
      auth_provider TEXT NOT NULL DEFAULT 'password',
      provider_subject TEXT,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS system_parameters (
      parameter_key TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      value TEXT NOT NULL,
      unit TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS admin_audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      detail_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS data_templates (
      template_key TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      target_role TEXT NOT NULL,
      upload_area TEXT NOT NULL,
      document_type TEXT NOT NULL,
      file_name TEXT NOT NULL,
      schema_version TEXT NOT NULL DEFAULT '1.0',
      description TEXT NOT NULL,
      sample_data_json TEXT NOT NULL DEFAULT '{}',
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS action_submissions (
      id TEXT PRIMARY KEY,
      consumer_id TEXT NOT NULL,
      action_type TEXT NOT NULL,
      title TEXT NOT NULL,
      note TEXT NOT NULL,
      reward_points INTEGER NOT NULL,
      file_key TEXT NOT NULL,
      file_name TEXT NOT NULL,
      content_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      file_sha256 TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      review_note TEXT,
      proof_viewed_at TEXT,
      submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      reviewed_at TEXT
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS auth_sessions (
      token TEXT PRIMARY KEY,
      csrf_token TEXT NOT NULL,
      profile_id TEXT NOT NULL,
      role TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS auth_login_attempts (
      attempt_key TEXT PRIMARY KEY,
      failures INTEGER NOT NULL DEFAULT 0,
      window_started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      blocked_until TEXT
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS oauth_states (
      state_hash TEXT PRIMARY KEY,
      role TEXT NOT NULL,
      code_verifier TEXT NOT NULL,
      redirect_uri TEXT NOT NULL,
      attempt_key TEXT NOT NULL DEFAULT '',
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_point_ledger_user_created ON point_ledger(user_id, created_at DESC)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_change_requests_target_created ON change_requests(request_type, target_id, created_at DESC)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_change_requests_status_created ON change_requests(status, created_at DESC)"),
    db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_change_requests_one_pending ON change_requests(request_type, target_id) WHERE status = 'pending'"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_products_farmer_status ON products(farmer_id, status)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_orders_consumer_created ON orders(consumer_id, created_at DESC)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_farmer_stories_status_published ON farmer_stories(status, published_at DESC)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_farmer_news_farmer_status_created ON farmer_news(farmer_id, status, created_at DESC)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_farmer_news_status_published ON farmer_news(status, published_at DESC)"),
    db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_project_support_once ON project_supports(consumer_id, project_id)"),
    db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_point_ledger_source_once ON point_ledger(user_id, source_id) WHERE source_id IS NOT NULL"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_verification_runs_service_created ON verification_runs(service_key, created_at DESC)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_account_controls_status ON account_controls(status)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit_logs(created_at DESC)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_data_templates_role ON data_templates(target_role)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_action_submissions_status_submitted ON action_submissions(status, submitted_at DESC)"),
    db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_local_action_registration_once ON local_action_registrations(consumer_id, action_id)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_resource_redemptions_farmer_created ON resource_redemptions(farmer_id, created_at DESC)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_auth_sessions_expiry ON auth_sessions(expires_at)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_oauth_states_expiry ON oauth_states(expires_at)"),
  ]);

  await ensureGreenFinSchema(db);

  const actionSubmissionColumns = await queryAll<{ name: string }>(db, "PRAGMA table_info(action_submissions)");
  if (!actionSubmissionColumns.some((column) => column.name === "proof_viewed_at")) {
    await db.prepare("ALTER TABLE action_submissions ADD COLUMN proof_viewed_at TEXT").run();
  }
  if (!actionSubmissionColumns.some((column) => column.name === "file_sha256")) {
    await db.prepare("ALTER TABLE action_submissions ADD COLUMN file_sha256 TEXT").run();
  }

  const verificationColumns = await queryAll<{ name: string }>(db, "PRAGMA table_info(verification_runs)");
  if (!verificationColumns.some((column) => column.name === "input_fingerprint")) {
    await db.prepare("ALTER TABLE verification_runs ADD COLUMN input_fingerprint TEXT").run();
  }

  await db.batch([
    db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_verification_once ON verification_runs(service_key, input_fingerprint) WHERE input_fingerprint IS NOT NULL"),
    db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_action_submission_file_once ON action_submissions(consumer_id, action_type, file_sha256) WHERE file_sha256 IS NOT NULL"),
    db.prepare(`CREATE TRIGGER IF NOT EXISTS trg_point_ledger_integer_guard
      BEFORE INSERT ON point_ledger
      WHEN typeof(NEW.delta_points) != 'integer' OR NEW.delta_points = 0 OR ABS(NEW.delta_points) > 1000000
      BEGIN SELECT RAISE(ABORT, '綠點異動必須是 1 至 1,000,000 的整數'); END`),
    db.prepare(`CREATE TRIGGER IF NOT EXISTS trg_point_ledger_nonnegative_balance
      BEFORE INSERT ON point_ledger
      WHEN NEW.delta_points < 0 AND COALESCE((SELECT SUM(delta_points) FROM point_ledger WHERE user_id = NEW.user_id), 0) + NEW.delta_points < 0
      BEGIN SELECT RAISE(ABORT, '綠點餘額不足，交易已拒絕'); END`),
    db.prepare(`CREATE TRIGGER IF NOT EXISTS trg_products_nonnegative_stock_insert
      BEFORE INSERT ON products WHEN typeof(NEW.stock) != 'integer' OR NEW.stock < 0
      BEGIN SELECT RAISE(ABORT, '商品庫存不可為負數或小數'); END`),
    db.prepare(`CREATE TRIGGER IF NOT EXISTS trg_products_nonnegative_stock_update
      BEFORE UPDATE OF stock ON products WHEN typeof(NEW.stock) != 'integer' OR NEW.stock < 0
      BEGIN SELECT RAISE(ABORT, '商品庫存不足，交易已拒絕'); END`),
  ]);

  const evidenceColumns = await queryAll<{ name: string }>(db, "PRAGMA table_info(evidence)");
  const evidenceColumnMigrations = [
    ["file_key", "ALTER TABLE evidence ADD COLUMN file_key TEXT"],
    ["file_name", "ALTER TABLE evidence ADD COLUMN file_name TEXT"],
    ["content_type", "ALTER TABLE evidence ADD COLUMN content_type TEXT"],
    ["file_size", "ALTER TABLE evidence ADD COLUMN file_size INTEGER"],
  ] as const;
  for (const [columnName, statement] of evidenceColumnMigrations) {
    if (!evidenceColumns.some((column) => column.name === columnName)) await db.prepare(statement).run();
  }

  const legacyColumnMigrations = [
    ["orders", "recipient_name", "ALTER TABLE orders ADD COLUMN recipient_name TEXT NOT NULL DEFAULT ''"],
    ["orders", "recipient_phone", "ALTER TABLE orders ADD COLUMN recipient_phone TEXT NOT NULL DEFAULT ''"],
    ["orders", "postal_code", "ALTER TABLE orders ADD COLUMN postal_code TEXT NOT NULL DEFAULT ''"],
    ["orders", "shipping_address", "ALTER TABLE orders ADD COLUMN shipping_address TEXT NOT NULL DEFAULT ''"],
    ["orders", "delivery_note", "ALTER TABLE orders ADD COLUMN delivery_note TEXT NOT NULL DEFAULT ''"],
    ["orders", "carrier", "ALTER TABLE orders ADD COLUMN carrier TEXT NOT NULL DEFAULT ''"],
    ["orders", "tracking_number", "ALTER TABLE orders ADD COLUMN tracking_number TEXT NOT NULL DEFAULT ''"],
    ["orders", "fulfillment_note", "ALTER TABLE orders ADD COLUMN fulfillment_note TEXT NOT NULL DEFAULT ''"],
    ["orders", "packed_at", "ALTER TABLE orders ADD COLUMN packed_at TEXT NOT NULL DEFAULT ''"],
    ["orders", "shipped_at", "ALTER TABLE orders ADD COLUMN shipped_at TEXT NOT NULL DEFAULT ''"],
    ["orders", "completed_at", "ALTER TABLE orders ADD COLUMN completed_at TEXT NOT NULL DEFAULT ''"],
    ["orders", "updated_at", "ALTER TABLE orders ADD COLUMN updated_at TEXT NOT NULL DEFAULT ''"],
    ["local_actions", "address", "ALTER TABLE local_actions ADD COLUMN address TEXT NOT NULL DEFAULT ''"],
    ["local_actions", "details", "ALTER TABLE local_actions ADD COLUMN details TEXT NOT NULL DEFAULT ''"],
    ["local_actions", "event_start", "ALTER TABLE local_actions ADD COLUMN event_start TEXT NOT NULL DEFAULT ''"],
    ["local_actions", "event_end", "ALTER TABLE local_actions ADD COLUMN event_end TEXT NOT NULL DEFAULT ''"],
    ["local_action_registrations", "attendee_name", "ALTER TABLE local_action_registrations ADD COLUMN attendee_name TEXT NOT NULL DEFAULT ''"],
    ["local_action_registrations", "attendee_phone", "ALTER TABLE local_action_registrations ADD COLUMN attendee_phone TEXT NOT NULL DEFAULT ''"],
    ["local_action_registrations", "attendee_email", "ALTER TABLE local_action_registrations ADD COLUMN attendee_email TEXT NOT NULL DEFAULT ''"],
    ["local_action_registrations", "participant_count", "ALTER TABLE local_action_registrations ADD COLUMN participant_count INTEGER NOT NULL DEFAULT 1"],
    ["local_action_registrations", "emergency_contact_name", "ALTER TABLE local_action_registrations ADD COLUMN emergency_contact_name TEXT NOT NULL DEFAULT ''"],
    ["local_action_registrations", "emergency_contact_phone", "ALTER TABLE local_action_registrations ADD COLUMN emergency_contact_phone TEXT NOT NULL DEFAULT ''"],
    ["local_action_registrations", "note", "ALTER TABLE local_action_registrations ADD COLUMN note TEXT NOT NULL DEFAULT ''"],
    ["merchant_offers", "address", "ALTER TABLE merchant_offers ADD COLUMN address TEXT NOT NULL DEFAULT ''"],
    ["merchant_offers", "details", "ALTER TABLE merchant_offers ADD COLUMN details TEXT NOT NULL DEFAULT ''"],
  ] as const;
  for (const tableName of ["orders", "local_actions", "local_action_registrations", "merchant_offers"] as const) {
    const columns = await queryAll<{ name: string }>(db, `PRAGMA table_info(${tableName})`);
    for (const [, columnName, statement] of legacyColumnMigrations.filter(([table]) => table === tableName)) {
      if (!columns.some((column) => column.name === columnName)) await db.prepare(statement).run();
    }
  }

  const accountControlColumns = await queryAll<{ name: string }>(db, "PRAGMA table_info(account_controls)");
  const accountControlMigrations = [
    ["username", "ALTER TABLE account_controls ADD COLUMN username TEXT"],
    ["password_hash", "ALTER TABLE account_controls ADD COLUMN password_hash TEXT"],
    ["password_salt", "ALTER TABLE account_controls ADD COLUMN password_salt TEXT"],
    ["auth_provider", "ALTER TABLE account_controls ADD COLUMN auth_provider TEXT NOT NULL DEFAULT 'password'"],
    ["provider_subject", "ALTER TABLE account_controls ADD COLUMN provider_subject TEXT"],
    ["account_kind", "ALTER TABLE account_controls ADD COLUMN account_kind TEXT NOT NULL DEFAULT 'test'"],
  ] as const;
  for (const [columnName, statement] of accountControlMigrations) {
    if (!accountControlColumns.some((column) => column.name === columnName)) await db.prepare(statement).run();
  }
  await db.batch([
    db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_account_controls_email_unique ON account_controls(lower(email))"),
    db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_account_controls_provider_unique ON account_controls(auth_provider, provider_subject) WHERE provider_subject IS NOT NULL"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_account_controls_kind_status ON account_controls(account_kind, status)"),
  ]);

  const oauthStateColumns = await queryAll<{ name: string }>(db, "PRAGMA table_info(oauth_states)");
  if (!oauthStateColumns.some((column) => column.name === "attempt_key")) {
    await db.prepare("ALTER TABLE oauth_states ADD COLUMN attempt_key TEXT NOT NULL DEFAULT ''").run();
  }
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_oauth_states_attempt_created ON oauth_states(attempt_key, created_at DESC)").run();

  const incentiveProgramColumns = await queryAll<{ name: string }>(db, "PRAGMA table_info(incentive_programs)");
  if (!incentiveProgramColumns.some((column) => column.name === "institution_id")) {
    await db.prepare("ALTER TABLE incentive_programs ADD COLUMN institution_id TEXT NOT NULL DEFAULT 'institution-001'").run();
  }
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_incentive_programs_institution ON incentive_programs(institution_id, created_at DESC)").run();

  const ownershipColumnMigrations = [
    ["resource_offers", "institution_id", "ALTER TABLE resource_offers ADD COLUMN institution_id TEXT NOT NULL DEFAULT 'institution-001'"],
    ["resource_redemptions", "institution_id", "ALTER TABLE resource_redemptions ADD COLUMN institution_id TEXT NOT NULL DEFAULT 'institution-001'"],
    ["outcome_reports", "institution_id", "ALTER TABLE outcome_reports ADD COLUMN institution_id TEXT NOT NULL DEFAULT 'institution-001'"],
  ] as const;
  for (const tableName of ["resource_offers", "resource_redemptions", "outcome_reports"] as const) {
    const columns = await queryAll<{ name: string }>(db, `PRAGMA table_info(${tableName})`);
    for (const [, columnName, statement] of ownershipColumnMigrations.filter(([table]) => table === tableName)) {
      if (!columns.some((column) => column.name === columnName)) await db.prepare(statement).run();
    }
  }
  await db.batch([
    db.prepare("CREATE INDEX IF NOT EXISTS idx_resource_offers_institution_status ON resource_offers(institution_id, status)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_resource_redemptions_institution_created ON resource_redemptions(institution_id, created_at DESC)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_outcome_reports_institution_submitted ON outcome_reports(institution_id, submitted_at DESC)"),
  ]);

  await seedPlatform(db);
  await ensureAccountKinds(db);
  await ensureAccountUsernames(db);
  await ensureDefaultAccountCredentials(db);
  await db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_account_controls_username_unique ON account_controls(lower(username)) WHERE username IS NOT NULL").run();
}

export async function ensurePlatformSchema(db: DbBinding) {
  const key = db as unknown as object;
  let ready = platformSchemaReady.get(key);
  if (!ready) {
    ready = initializePlatformSchema(db).catch((error) => {
      platformSchemaReady.delete(key);
      throw error;
    });
    platformSchemaReady.set(key, ready);
  }
  await ready;
}

async function ensureAccountKinds(db: DbBinding) {
  const testProfileIds = [
    "consumer-001", "consumer-002", "consumer-003", "consumer-004", "consumer-005", "consumer-006", "consumer-007",
    "farmer-001", "farmer-002", "farmer-003", "farmer-004",
    "institution-001", "platform-admin",
  ];
  const placeholders = testProfileIds.map(() => "?").join(", ");
  await db.batch([
    db.prepare(`UPDATE account_controls SET account_kind = 'test' WHERE profile_id IN (${placeholders})`).bind(...testProfileIds),
    db.prepare(`UPDATE account_controls SET account_kind = 'real' WHERE profile_id NOT IN (${placeholders})`).bind(...testProfileIds),
  ]);
}

async function ensureAccountUsernames(db: DbBinding) {
  const rows = await queryAll<{ profile_id: string; username: string | null }>(db, "SELECT profile_id, username FROM account_controls ORDER BY profile_id");
  const used = new Set(rows.map((row) => row.username?.toLowerCase()).filter((value): value is string => Boolean(value)));
  const preferred: Record<string, string> = {
    [CONSUMER_ID]: "consumer001",
    [FARMER_ID]: "farmer001",
    [INSTITUTION_ID]: "institution001",
    "platform-admin": "admin001",
  };
  for (const row of rows) {
    if (row.username) continue;
    const raw = preferred[row.profile_id] ?? row.profile_id.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 24);
    const base = raw.length >= 4 ? raw : `user_${raw || "account"}`;
    let username = base.slice(0, 24);
    let suffix = 2;
    while (used.has(username)) {
      username = `${base.slice(0, 20)}${suffix}`.slice(0, 24);
      suffix += 1;
    }
    await db.prepare("UPDATE account_controls SET username = ?, updated_at = CURRENT_TIMESTAMP WHERE profile_id = ? AND username IS NULL")
      .bind(username, row.profile_id).run();
    used.add(username);
  }
}

async function ensureDefaultAccountCredentials(db: DbBinding) {
  const defaultAccounts = [CONSUMER_ID, FARMER_ID, INSTITUTION_ID];
  const missing = await queryAll<{ profile_id: string }>(db, `SELECT profile_id FROM account_controls
    WHERE profile_id IN (?, ?, ?) AND (password_hash IS NULL OR password_salt IS NULL)`, ...defaultAccounts);
  const statements = [];
  for (const account of missing) {
    const credential = await createPasswordCredential("12345678");
    statements.push(db.prepare(`UPDATE account_controls
      SET password_hash = ?, password_salt = ?, auth_provider = 'password', updated_at = CURRENT_TIMESTAMP
      WHERE profile_id = ?`).bind(credential.passwordHash, credential.passwordSalt, account.profile_id));
  }
  if (statements.length > 0) await db.batch(statements);

  const admin = await queryOne<{ email: string; username: string | null; password_hash: string | null; password_salt: string | null; auth_provider: string }>(db,
    "SELECT email, username, password_hash, password_salt, auth_provider FROM account_controls WHERE profile_id = 'platform-admin'");
  if (!admin || admin.email !== "admin001" || admin.username !== "admin001" || !admin.password_hash || !admin.password_salt || admin.auth_provider !== "password-admin-v2") {
    const credential = await createPasswordCredential("13245678");
    await db.prepare(`INSERT INTO account_controls
      (profile_id, email, username, status, password_hash, password_salt, auth_provider, updated_at)
      VALUES ('platform-admin', 'admin001', 'admin001', 'active', ?, ?, 'password-admin-v2', CURRENT_TIMESTAMP)
      ON CONFLICT(profile_id) DO UPDATE SET email = 'admin001', username = 'admin001', status = 'active', password_hash = excluded.password_hash,
        password_salt = excluded.password_salt, auth_provider = 'password-admin-v2', provider_subject = NULL, updated_at = CURRENT_TIMESTAMP`)
      .bind(credential.passwordHash, credential.passwordSalt).run();
  }
}

async function seedPlatform(db: DbBinding) {
  await db.batch([
    db.prepare("INSERT OR IGNORE INTO profiles (id, role, display_name, city, district) VALUES (?, ?, ?, ?, ?)").bind(CONSUMER_ID, "consumer", "林子晴", "台北市", "大安區"),
    db.prepare("INSERT OR IGNORE INTO profiles (id, role, display_name, city, district) VALUES (?, ?, ?, ?, ?)").bind("consumer-002", "consumer", "王怡婷", "新北市", "板橋區"),
    db.prepare("INSERT OR IGNORE INTO profiles (id, role, display_name, city, district) VALUES (?, ?, ?, ?, ?)").bind("consumer-003", "consumer", "陳冠廷", "台中市", "西屯區"),
    db.prepare("INSERT OR IGNORE INTO profiles (id, role, display_name, city, district) VALUES (?, ?, ?, ?, ?)").bind("consumer-004", "consumer", "黃詩涵", "高雄市", "左營區"),
    db.prepare("INSERT OR IGNORE INTO profiles (id, role, display_name, city, district) VALUES (?, ?, ?, ?, ?)").bind("consumer-005", "consumer", "張家豪", "桃園市", "中壢區"),
    db.prepare("INSERT OR IGNORE INTO profiles (id, role, display_name, city, district) VALUES (?, ?, ?, ?, ?)").bind("consumer-006", "consumer", "李欣蓉", "台南市", "東區"),
    db.prepare("INSERT OR IGNORE INTO profiles (id, role, display_name, city, district) VALUES (?, ?, ?, ?, ?)").bind("consumer-007", "consumer", "周柏宇", "新竹市", "東區"),
    db.prepare("INSERT OR IGNORE INTO profiles (id, role, display_name, city, district) VALUES (?, ?, ?, ?, ?)").bind(FARMER_ID, "farmer", "禾日友善農園", "雲林縣", "斗六市"),
    db.prepare("INSERT OR IGNORE INTO profiles (id, role, display_name, city, district) VALUES (?, ?, ?, ?, ?)").bind("farmer-002", "farmer", "青谷稻作", "嘉義縣", "民雄鄉"),
    db.prepare("INSERT OR IGNORE INTO profiles (id, role, display_name, city, district) VALUES (?, ?, ?, ?, ?)").bind("farmer-003", "farmer", "山里果園", "花蓮縣", "壽豐鄉"),
    db.prepare("INSERT OR IGNORE INTO profiles (id, role, display_name, city, district) VALUES (?, ?, ?, ?, ?)").bind("farmer-004", "farmer", "暖田蔬果", "彰化縣", "溪州鄉"),
    db.prepare("INSERT OR IGNORE INTO profiles (id, role, display_name, city, district) VALUES (?, ?, ?, ?, ?)").bind(INSTITUTION_ID, "institution", "永續共好計畫辦公室", "台北市", "信義區"),
    db.prepare("INSERT OR IGNORE INTO point_ledger (user_id, delta_points, source_type, source_id, description) VALUES (?, ?, ?, ?, ?)").bind(CONSUMER_ID, 180, "merchant_purchase", "seed-merchant", "合作通路消費回饋"),
    db.prepare("INSERT OR IGNORE INTO point_ledger (user_id, delta_points, source_type, source_id, description) VALUES (?, ?, ?, ?, ?)").bind(CONSUMER_ID, 10, "reusable_cup", "seed-cup", "使用環保杯"),
    db.prepare("INSERT OR IGNORE INTO point_ledger (user_id, delta_points, source_type, source_id, description) VALUES (?, ?, ?, ?, ?)").bind(CONSUMER_ID, 80, "public_transport", "seed-transit", "低碳交通行動"),
    db.prepare("INSERT OR IGNORE INTO point_ledger (user_id, delta_points, source_type, source_id, description) VALUES (?, ?, ?, ?, ?)").bind(CONSUMER_ID, 600, "energy_appliance", "seed-appliance", "節能家電汰舊換新"),
    db.prepare("INSERT OR IGNORE INTO point_ledger (user_id, delta_points, source_type, source_id, description) VALUES (?, ?, ?, ?, ?)").bind(CONSUMER_ID, 50, "ebill", "seed-ebill", "改用電子帳單"),
    db.prepare("INSERT OR IGNORE INTO point_ledger (user_id, delta_points, source_type, source_id, description) VALUES (?, ?, ?, ?, ?)").bind(CONSUMER_ID, 200, "institution_task", "seed-enterprise", "企業綠色行動加碼"),
    db.prepare("INSERT OR IGNORE INTO point_ledger (user_id, delta_points, source_type, source_id, description) VALUES (?, ?, ?, ?, ?)").bind(CONSUMER_ID, 160, "platform_reward", "seed-welcome", "平台綠色行動啟動回饋"),
    db.prepare("INSERT OR IGNORE INTO point_ledger (user_id, delta_points, source_type, source_id, description) VALUES (?, ?, ?, ?, ?)").bind(FARMER_ID, 3680, "platform_balance", "seed-farmer", "合作小農既有綠點餘額"),
  ]);

  await db.batch([
    db.prepare("INSERT OR IGNORE INTO account_controls (profile_id, email, status) VALUES (?, ?, 'active')").bind(CONSUMER_ID, "consumer@gfes.tw"),
    db.prepare("INSERT OR IGNORE INTO account_controls (profile_id, email, status) VALUES (?, ?, 'active')").bind("consumer-002", "consumer02@gfes.tw"),
    db.prepare("INSERT OR IGNORE INTO account_controls (profile_id, email, status) VALUES (?, ?, 'active')").bind("consumer-003", "consumer03@gfes.tw"),
    db.prepare("INSERT OR IGNORE INTO account_controls (profile_id, email, status) VALUES (?, ?, 'active')").bind("consumer-004", "consumer04@gfes.tw"),
    db.prepare("INSERT OR IGNORE INTO account_controls (profile_id, email, status) VALUES (?, ?, 'active')").bind("consumer-005", "consumer05@gfes.tw"),
    db.prepare("INSERT OR IGNORE INTO account_controls (profile_id, email, status) VALUES (?, ?, 'active')").bind("consumer-006", "consumer06@gfes.tw"),
    db.prepare("INSERT OR IGNORE INTO account_controls (profile_id, email, status) VALUES (?, ?, 'active')").bind("consumer-007", "consumer07@gfes.tw"),
    db.prepare("INSERT OR IGNORE INTO account_controls (profile_id, email, status) VALUES (?, ?, 'active')").bind(FARMER_ID, "farmer@gfes.tw"),
    db.prepare("INSERT OR IGNORE INTO account_controls (profile_id, email, status) VALUES (?, ?, 'active')").bind("farmer-002", "farmer02@gfes.tw"),
    db.prepare("INSERT OR IGNORE INTO account_controls (profile_id, email, status) VALUES (?, ?, 'active')").bind("farmer-003", "farmer03@gfes.tw"),
    db.prepare("INSERT OR IGNORE INTO account_controls (profile_id, email, status) VALUES (?, ?, 'active')").bind("farmer-004", "farmer04@gfes.tw"),
    db.prepare("INSERT OR IGNORE INTO account_controls (profile_id, email, status) VALUES (?, ?, 'active')").bind(INSTITUTION_ID, "institution@gfes.tw"),
    db.prepare("INSERT OR IGNORE INTO account_controls (profile_id, email, status) VALUES ('platform-admin', 'admin001', 'active')"),
    db.prepare("INSERT OR IGNORE INTO system_parameters (parameter_key, display_name, value, unit, description) VALUES ('nearby_radius_km', '附近小農推薦半徑', '50', '公里', '消費者所在地附近的小農優先推薦範圍')"),
    db.prepare("INSERT OR IGNORE INTO system_parameters (parameter_key, display_name, value, unit, description) VALUES ('minimum_support_points', '專案最低支持點數', '100', '綠點', '消費者單次支持改善專案的最低點數')"),
    db.prepare("INSERT OR IGNORE INTO system_parameters (parameter_key, display_name, value, unit, description) VALUES ('platform_fee_percent', '平台維運比例', '3', '%', '用於平台維運與成果查核的比例')"),
    db.prepare("INSERT OR IGNORE INTO system_parameters (parameter_key, display_name, value, unit, description) VALUES ('low_stock_threshold', '低庫存警示門檻', '10', '件', '商品庫存低於此數值時顯示警示')"),
    db.prepare("INSERT OR IGNORE INTO resource_redemptions (id, farmer_id, offer_id, resource_name, points, cooperative, contact_name, contact_phone, fulfillment_type, delivery_address, note, stage, status, tracking_number, created_at, updated_at) VALUES ('GFES-RES-20260725-001', ?, 'harvest-crates', '循環收成籃 10 入組', 600, '雲林縣斗六市農會', '林禾日', '0912-345-678', 'delivery', '雲林縣斗六市禾日友善農園（產地收貨區）', '用於葉菜採收與合作通路循環配送。', 2, 'shipping', 'COOP-26072835', '2026-07-25 10:20:00', '2026-07-28 14:30:00')").bind(FARMER_ID),
    db.prepare("INSERT OR IGNORE INTO resource_redemptions (id, farmer_id, offer_id, resource_name, points, cooperative, contact_name, contact_phone, fulfillment_type, appointment_date, appointment_slot, note, stage, status, created_at, updated_at) VALUES ('GFES-RES-20260801-002', ?, 'soil-test', '土壤健康檢測補助', 450, '雲林縣斗六市農會', '林禾日', '0912-345-678', 'appointment', '2026-08-18', '上午 09:00–12:00', '本季土壤採樣與施肥建議。', 1, 'confirmed', '2026-08-01 09:10:00', '2026-08-02 11:40:00')").bind(FARMER_ID),
    db.prepare("INSERT OR IGNORE INTO evidence (id, farmer_id, title, evidence_type, file_key, file_name, content_type, file_size, status, submitted_at, verified_at) VALUES (900001, ?, '產銷履歷與批次資訊', '產銷履歷佐證', 'sample-documents/GFES_農產履歷批次資料_完整範例.pdf', 'GFES_農產履歷批次資料_完整範例.pdf', 'application/pdf', 118420, 'verified', '2026-07-22 09:30:00', '2026-07-22 14:10:00')").bind(FARMER_ID),
    db.prepare("INSERT OR IGNORE INTO evidence (id, farmer_id, title, evidence_type, file_key, file_name, content_type, file_size, status, submitted_at, verified_at) VALUES (900002, ?, '無農藥殘留檢測', '無農藥檢測', 'sample-documents/GFES_無農藥檢測報告_完整範例.pdf', 'GFES_無農藥檢測報告_完整範例.pdf', 'application/pdf', 121760, 'verified', '2026-07-18 10:20:00', '2026-07-18 16:45:00')").bind(FARMER_ID),
    db.prepare("INSERT OR IGNORE INTO farmer_stories (farmer_id, headline, summary, body, quote, image_url, status, published_at) VALUES (?, ?, ?, ?, ?, ?, 'published', ?)").bind(FARMER_ID, "把友善耕作變成每天都看得見的選擇", "禾日友善農園用減藥、節水與田間紀錄，讓每箱蔬菜都有清楚的產地故事。", "我們從土壤開始改善，記錄每次灌溉、施肥與巡田，也讓消費者知道手上的綠點如何支持設備與耕作調整。\n每一次訂購與支持，都是農園持續投入友善生產的重要力量。", "照顧土地，是希望下一季還能種出安心的菜。", "/farmer-library/heri-leafy/cultivation-1.webp", "2026-08-09 08:30:00"),
    db.prepare("INSERT OR IGNORE INTO farmer_stories (farmer_id, headline, summary, body, quote, image_url, status, published_at) VALUES ('farmer-002', ?, ?, ?, ?, ?, 'published', ?)").bind("一碗米背後，是一整季的田間選擇", "青谷稻作以節水栽培與生態田埂，兼顧稻米品質與田區生物多樣性。", "我們保留田埂植被、減少不必要用藥，並記錄每一批稻米的耕作與收穫日期。\n消費者的支持讓友善稻作不只被看見，也能持續做下去。", "讓稻田不只生產稻米，也成為許多生命的家。", "/farmer-library/qinggu-rice/cultivation-1.webp", "2026-08-08 14:00:00"),
    db.prepare("INSERT OR IGNORE INTO farmer_stories (farmer_id, headline, summary, body, quote, image_url, status, published_at) VALUES ('farmer-003', ?, ?, ?, ?, ?, 'published', ?)").bind("讓鮮果在更低碳的方式裡抵達你手中", "山里果園改善採後保鮮與冷藏設備，降低耗能與水果損耗。", "果實採收後的保鮮，是品質也是能源議題。我們逐步導入節能冷藏與太陽能設備，並公開使用成果。", "減少一箱損耗，就多留下一份農村的收入。", "/farmer-library/shanli-pomelo/cultivation-1.webp", "2026-08-07 10:20:00"),
    db.prepare("INSERT OR IGNORE INTO farmer_stories (farmer_id, headline, summary, body, quote, image_url, status, published_at) VALUES ('farmer-004', ?, ?, ?, ?, ?, 'published', ?)").bind("從一只循環箱開始減少產地包材", "暖田蔬果把循環周轉箱導入採收與配送流程，減少一次性紙箱與塑膠。", "從採收到配送，我們和合作通路一起建立周轉箱回收與清洗流程，讓包材能重複使用。", "每只箱子多用一次，土地就少一份負擔。", "/farmer-library/nuantian-tomato/cultivation-1.webp", "2026-08-06 16:40:00"),
    db.prepare("INSERT OR IGNORE INTO farmer_news (id, farmer_id, title, content, category, image_url, status, published_at) VALUES ('NEWS-HERI-001', ?, ?, ?, ?, ?, 'published', ?)").bind(FARMER_ID, "本週友善葉菜箱開始採收", "小白菜、青江菜與地瓜葉已進入採收期，本週訂單將依成熟度分批出貨，謝謝大家支持產地。", "採收與出貨", "/farmer-library/heri-leafy/product.webp", "2026-08-10 08:30:00"),
    db.prepare("INSERT OR IGNORE INTO farmer_news (id, farmer_id, title, content, category, image_url, status, published_at) VALUES ('NEWS-QINGGU-001', 'farmer-002', ?, ?, ?, ?, 'published', ?)").bind("友善稻田生態復育進入第二階段", "新的蜜源植物已完成栽植，近期將持續記錄昆蟲與鳥類出現情形，成果會同步回報給支持者。", "改善專案進度", "/farmer-library/qinggu-rice/cultivation-2.webp", "2026-08-09 15:10:00"),
    db.prepare("INSERT OR IGNORE INTO farmer_news (id, farmer_id, title, content, category, image_url, status, published_at) VALUES ('NEWS-SHANLI-001', 'farmer-003', ?, ?, ?, ?, 'published', ?)").bind("文旦採收與低碳冷藏排程公告", "今年文旦預計月底開始採收，支持者將優先收到批次與配送通知，果園也會公開冷藏耗能改善紀錄。", "產地公告", "/farmer-library/shanli-pomelo/product.webp", "2026-08-08 11:45:00"),
    db.prepare("INSERT OR IGNORE INTO farmer_news (id, farmer_id, title, content, category, image_url, status, published_at) VALUES ('NEWS-NUANTIAN-001', 'farmer-004', ?, ?, ?, ?, 'published', ?)").bind("循環周轉箱回收點新增一處", "彰化合作通路新增周轉箱回收點，購買暖田蔬果商品的消費者可於下次配送時一併歸還。", "循環包材", "/farmer-library/nuantian-tomato/product.webp", "2026-08-07 09:20:00"),
  ]);

  const pendingActionSeeds = [
    ["SAMPLE-ACTION-CUP-001", "consumer-002", "reusable_cup", "使用環保杯", "合作咖啡店消費，附交易明細與店家確認欄。", 10, "GFES_環保杯行動證明_正式範例.pdf", 111349, "2026-08-10 09:18:00"],
    ["SAMPLE-ACTION-TRANSIT-001", "consumer-003", "public_transport", "搭乘大眾運輸", "捷運與公車轉乘紀錄，申請低碳通勤綠點。", 80, "GFES_大眾運輸行動證明_正式範例.pdf", 108404, "2026-08-10 09:42:00"],
    ["SAMPLE-ACTION-EBILL-001", "consumer-004", "ebill", "改用電子帳單", "已完成紙本帳單轉電子帳單，附公用事業通知。", 50, "GFES_電子帳單行動證明_正式範例.pdf", 109839, "2026-08-10 10:05:00"],
    ["SAMPLE-ACTION-APPLIANCE-001", "consumer-005", "energy_appliance", "購買節能家電", "購買一級能效冰箱，附發票、型號與能源效率資料。", 600, "GFES_節能家電行動證明_正式範例.pdf", 114673, "2026-08-10 10:26:00"],
    ["SAMPLE-ACTION-CUP-002", "consumer-006", "reusable_cup", "使用環保杯", "自備環保杯完成減塑消費，附正式行動證明。", 10, "GFES_環保杯行動證明_正式範例.pdf", 111349, "2026-08-10 10:47:00"],
    ["SAMPLE-ACTION-TRANSIT-002", "consumer-007", "public_transport", "搭乘大眾運輸", "高鐵轉乘捷運的低碳交通紀錄，請確認日期與票證。", 80, "GFES_大眾運輸行動證明_正式範例.pdf", 108404, "2026-08-10 11:09:00"],
    ["SAMPLE-ACTION-EBILL-002", "consumer-002", "ebill", "改用電子帳單", "銀行信用卡帳單改為電子寄送，附設定完成通知。", 50, "GFES_電子帳單行動證明_正式範例.pdf", 109839, "2026-08-10 11:32:00"],
    ["SAMPLE-ACTION-APPLIANCE-002", "consumer-004", "energy_appliance", "購買節能家電", "購買一級能效除濕機，附交易與能源標示證明。", 600, "GFES_節能家電行動證明_正式範例.pdf", 114673, "2026-08-10 11:58:00"],
  ] as const;
  for (const [id, consumerId, actionType, title, note, rewardPoints, fileName, fileSize, submittedAt] of pendingActionSeeds) {
    await db.prepare("INSERT OR IGNORE INTO action_submissions (id, consumer_id, action_type, title, note, reward_points, file_key, file_name, content_type, file_size, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'application/pdf', ?, ?)")
      .bind(id, consumerId, actionType, title, note, rewardPoints, `sample-documents/${fileName}`, fileName, fileSize, submittedAt)
      .run();
  }

  const dataTemplateSeeds = [
    ["consumer_action_proof", "消費者綠色行動證明繳交表", "consumer", "消費者前台／綠點來源／上傳行動證明", "綠色行動佐證", "GFES_消費者綠色行動證明_正式範例.pdf", "正式 PDF 範例包含文件編號、申請人、行動明細、附件檢核、聲明與管理員審核欄", { meta: { documentNumber: "GFES-CA-20260810-001", schemaVersion: "1.0", issuingUnit: "GFES 綠色消費循環平台", generatedAt: "2026-08-10T10:00:00+08:00" }, applicant: { accountId: "consumer-001", name: "林子晴", city: "台北市", district: "大安區" }, action: { actionType: "reusable_cup", title: "使用環保杯", actionDate: "2026-08-10T09:18:00+08:00", merchant: "綠田生活咖啡", transactionReference: "GT-20260810-0918", rewardPoints: 10 }, requiredEvidence: [{ document: "電子發票／交易明細", required: true }, { document: "合作店家行動確認", required: true }], sampleFiles: ["GFES_環保杯行動證明_正式範例.pdf", "GFES_大眾運輸行動證明_正式範例.pdf", "GFES_電子帳單行動證明_正式範例.pdf", "GFES_節能家電行動證明_正式範例.pdf"], declaration: { confirmed: true, statement: "本人確認資料與所附正式證明文件均屬實。" } }],
    ["consumer_invoice", "綠色消費證明（電子／傳統發票）", "consumer", "消費者前台／回傳消費證明", "消費證明", "GFES_綠色消費證明_範例.json", "供發票掃描或手動登錄時比對欄位與附件格式", { meta: { documentNumber: "GFES-CI-202608-001", schemaVersion: "1.0", issuingUnit: "GFES 綠色消費循環平台", generatedAt: "2026-08-10T10:00:00+08:00" }, applicant: { accountId: "consumer-001", name: "林子晴", city: "台北市", district: "大安區" }, transaction: { invoiceType: "electronic", invoiceNumber: "AB12345678", randomCode: "4827", transactionDate: "2026-08-08", amountTwd: 680, merchantName: "大安友善雜貨店", greenCategory: "在地友善農產" }, attachment: { fileName: "AB12345678.jpg", contentType: "image/jpeg", required: true }, declaration: { confirmed: true, statement: "本人確認所填資料與附件相符。" } }],
    ["farm_trace", "農產履歷與批次資料表", "farmer", "小農後台／商品管理、永續證明", "產銷履歷佐證", "GFES_農產履歷批次資料_範例.json", "商品上架及可信來源揭露使用", { meta: { documentNumber: "GFES-FT-202608-001", schemaVersion: "1.0", issuingUnit: "GFES 綠色消費循環平台", generatedAt: "2026-08-10T10:00:00+08:00" }, producer: { farmerId: "farmer-001", farmName: "禾日友善農園", responsiblePerson: "林美惠", location: "雲林縣斗六市" }, cropBatch: { cropName: "小白菜", traceCode: "TAP-26-0718", plantingDate: "2026-05-12", harvestDate: "2026-07-18", quantityKg: 320 }, verification: { traceabilityValid: true, verifier: "合作農會產銷履歷窗口", verifiedDate: "2026-07-20" }, attachments: ["產銷履歷證明.pdf", "批次採收照片.jpg"] }],
    ["pesticide_test", "無農藥殘留檢測報告摘要", "farmer", "小農後台／永續證明", "檢測報告", "GFES_無農藥檢測報告_範例.json", "呈現檢測單位、樣本、方法與判定結果", { meta: { documentNumber: "GFES-PT-202607-018", schemaVersion: "1.0", issuingUnit: "GFES 綠色消費循環平台", generatedAt: "2026-08-10T10:00:00+08:00" }, laboratory: { name: "農業部認證檢驗單位（範例）", reportNumber: "LAB-2026-0718-028", accreditation: "ISO/IEC 17025" }, sample: { farmName: "禾日友善農園", cropName: "小白菜", batchNumber: "TAP-26-0718", sampledAt: "2026-07-18" }, test: { method: "公告農藥多重殘留分析方法", testedItems: 410, result: "未檢出", conclusion: "符合公告容許量標準" }, attachment: { fileName: "LAB-2026-0718-028.pdf", required: true } }],
    ["cultivation_log", "友善耕作與資材使用紀錄", "farmer", "小農後台／永續證明", "耕作紀錄", "GFES_友善耕作紀錄_範例.json", "記錄田間作業、用水、肥培與病蟲害管理", { meta: { documentNumber: "GFES-CL-2026Q2-006", schemaVersion: "1.0", issuingUnit: "GFES 綠色消費循環平台", generatedAt: "2026-08-10T10:00:00+08:00" }, farm: { farmerId: "farmer-001", farmName: "禾日友善農園", fieldCode: "YL-DL-03", areaHa: 0.8 }, period: { startDate: "2026-04-01", endDate: "2026-06-30" }, records: [{ date: "2026-04-05", activity: "整地與堆肥施用", material: "腐熟有機堆肥", quantity: "240 公斤" }, { date: "2026-05-18", activity: "病蟲害巡田", material: "黏蟲板", quantity: "20 片" }, { date: "2026-06-12", activity: "滴灌", waterM3: 18 }], declaration: { recorder: "林美惠", signedDate: "2026-07-02" } }],
    ["equipment_evidence", "低碳／節水設備使用證明", "farmer", "小農後台／永續證明", "設備使用證明", "GFES_低碳設備使用證明_範例.json", "供設備補助、節水與低碳作業驗證使用", { meta: { documentNumber: "GFES-EQ-202607-011", schemaVersion: "1.0", issuingUnit: "GFES 綠色消費循環平台", generatedAt: "2026-08-10T10:00:00+08:00" }, equipment: { name: "智慧滴灌控制器", model: "WATER-SMART-02", installedAt: "2026-04-01", location: "雲林縣斗六市 YL-DL-03" }, usage: { periodStart: "2026-04-01", periodEnd: "2026-07-31", operatingHours: 486, baselineWaterM3: 420, actualWaterM3: 344, estimatedSavingPercent: 18.1 }, evidence: { meterPhotos: ["meter_before.jpg", "meter_after.jpg"], purchaseReceipt: "equipment_receipt.pdf", installerCertificate: "installation_record.pdf" }, declaration: { farmerName: "林美惠", confirmed: true } }],
    ["improvement_plan", "小農永續改善專案計畫書", "farmer", "小農後台／改善專案計畫", "專案計畫書", "GFES_小農改善專案計畫書_範例.json", "公開募資用途、里程碑、預算及預期地方效益", { meta: { documentNumber: "GFES-IP-202608-003", schemaVersion: "1.0", issuingUnit: "GFES 綠色消費循環平台", generatedAt: "2026-08-10T10:00:00+08:00" }, applicant: { farmerId: "farmer-001", farmName: "禾日友善農園", contact: "林美惠", location: "雲林縣斗六市" }, project: { title: "節水灌溉改善計畫", problem: "旱季用水量偏高且灌溉分區控制不足", objective: "汰換滴灌管線並導入分區控制器", startDate: "2026-09-01", completionDate: "2026-12-31", targetPoints: 96000, minimumSupportPoints: 300 }, budget: [{ item: "設備與材料", points: 57600, percent: 60 }, { item: "安裝與改善", points: 24000, percent: 25 }, { item: "成果追蹤", points: 14400, percent: 15 }], expectedImpact: { waterSavingPercent: 18, beneficiaries: 3, disclosure: "每月回報用水與設備運轉紀錄" }, attachments: ["設備估價單.pdf", "農產履歷.pdf"] }],
    ["outcome_report", "改善專案成果回報書", "farmer", "小農後台／改善專案成果回報", "成果報告", "GFES_改善專案成果回報_範例.json", "完成專案後回報節水、減碳、受益人數與佐證", { meta: { documentNumber: "GFES-OR-202612-003", schemaVersion: "1.0", issuingUnit: "GFES 綠色消費循環平台", generatedAt: "2026-12-31T16:00:00+08:00" }, project: { projectId: "water", title: "節水灌溉改善計畫", reportingPeriod: "2026-09-01 至 2026-12-31", status: "completed" }, outcomes: { waterSavedLiters: 76000, carbonReducedKg: 315, beneficiaries: 3, completionRatePercent: 100 }, indicators: [{ name: "農業用水", baseline: "420 m³", result: "344 m³", method: "水表前後期比較" }, { name: "設備運轉", baseline: "人工灌溉", result: "分區自動控制", method: "控制器紀錄" }], attachments: ["完工照片.pdf", "水表紀錄.xlsx", "設備發票.pdf"], declaration: { reporter: "林美惠", submittedAt: "2026-12-31" } }],
    ["institution_program", "綠點激勵計畫與預算申請書", "institution", "銀行／政府／企業後台／綠點激勵計畫", "激勵計畫申請", "GFES_綠點激勵計畫_範例.json", "建立發點條件、預算、對象與 ESG 成果指標", { meta: { documentNumber: "GFES-GI-2026-012", schemaVersion: "1.0", issuingUnit: "GFES 綠色消費循環平台", generatedAt: "2026-08-10T10:00:00+08:00" }, sponsor: { institutionId: "institution-001", name: "永續共好計畫辦公室", contactDepartment: "ESG 推動組" }, program: { name: "低碳通勤綠點", action: "搭乘大眾運輸或使用共享單車", rewardPoints: 20, budgetPoints: 96400, startDate: "2026-09-01", endDate: "2026-12-31", targetParticipants: 4820 }, governance: { eligibilityRule: "完成交通紀錄驗證", duplicatePolicy: "同日同帳號最多一次", reviewFrequency: "每月" }, esgIndicators: [{ name: "參與人次", target: 4820 }, { name: "估算減碳量", unit: "kg CO2e", methodology: "依公開運具排放係數估算" }] }],
    ["procurement_request", "永續採購需求規格書", "institution", "銀行／政府／企業後台／永續採購", "採購需求", "GFES_永續採購需求_範例.json", "建立採購數量、預算、履歷條件與配送驗收規格", { meta: { documentNumber: "GFES-PR-202608-005", schemaVersion: "1.0", issuingUnit: "GFES 綠色消費循環平台", generatedAt: "2026-08-10T10:00:00+08:00" }, purchaser: { institutionId: "institution-001", organization: "永續共好計畫辦公室", contactDepartment: "採購與員工福利組" }, requirement: { title: "員工永續福利小農箱", category: "友善農產箱", quantity: 200, budgetPoints: 120000, deliveryRegion: "台北市", expectedDeliveryDate: "2026-09-30" }, qualification: { traceabilityRequired: true, pesticideTestRequired: true, localDistancePriorityKm: 50 }, acceptance: { requiredDocuments: ["產銷履歷", "出貨批次清單", "配送簽收紀錄"], inspectionMethod: "抽樣核對批次與數量" } }],
  ] as const;
  for (const [templateKey, displayName, targetRole, uploadArea, documentType, fileName, description, sampleData] of dataTemplateSeeds) {
    await db.prepare("INSERT OR IGNORE INTO data_templates (template_key, display_name, target_role, upload_area, document_type, file_name, description, sample_data_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(templateKey, displayName, targetRole, uploadArea, documentType, fileName, description, json(sampleData)).run();
  }

  const integrationSeeds = [
    ["invoice", "電子發票驗證", 120, "財政部電子發票 API", { valid: true, invoiceNumber: "AB12345678", amount: 680, greenCategory: "友善農產", message: "發票格式與綠色消費資格通過" }],
    ["location", "所在地與距離服務", 0, "地理定位／距離 API", { city: "台北市", district: "大安區", latitude: 25.0268, longitude: 121.5434, message: "已取得使用者授權位置" }],
    ["logistics", "物流配送追蹤", 0, "合作物流追蹤 API", { stage: 2, status: "shipping", carrier: "產地低碳配送", estimatedDelivery: "2026-08-12", message: "商品已由產地出貨" }],
    ["farm_trace", "農產履歷查驗", 0, "產銷履歷／農業資料 API", { valid: true, traceCode: "TAP-26-0718", pesticideFree: true, farm: "禾日友善農園", message: "履歷與無農藥資料查驗通過" }],
    ["government_task", "政府／企業任務驗證", 200, "政策與企業任務 API", { valid: true, task: "完成節能與電子帳單行動", sponsor: "永續共好計畫", message: "任務條件已完成" }],
  ] as const;
  for (const [serviceKey, displayName, rewardPoints, endpointLabel, response] of integrationSeeds) {
    await db.prepare("INSERT OR IGNORE INTO integration_settings (service_key, display_name, reward_points, endpoint_label, sample_response_json) VALUES (?, ?, ?, ?, ?)").bind(serviceKey, displayName, rewardPoints, endpointLabel, json(response)).run();
  }

  const productSeeds = [
    ["leafy-box", FARMER_ID, "友善葉菜箱", 480, 24, "箱", "產銷履歷 TAP-26-0718", "雲林縣與鄰近 40 公里", "六種當季友善葉菜，以循環箱低溫配送。", "/farmer-library/heri-leafy/product.webp", "雲林縣", "斗六市", 205],
    ["rice-pack", "farmer-002", "節水栽培米 2 公斤", 360, 38, "包", "無農藥檢測合格", "全台常溫配送", "友善稻作與節水栽培紀錄完整，採減塑包裝。", "/farmer-library/qinggu-rice/product.webp", "嘉義縣", "民雄鄉", 244],
    ["herb-tea", "farmer-004", "減塑香草茶", 260, 17, "組", "友善耕作紀錄", "全台常溫配送", "自然乾燥香草茶包，附採收批次與沖泡說明。", "/farmer-library/xipan-herb/product.webp", "彰化縣", "溪州鄉", 184],
  ];
  for (const p of productSeeds) {
    await db.prepare("INSERT OR IGNORE INTO products (id, farmer_id, title, points, stock, unit, proof, delivery, description, image, city, district, distance_km) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(...p).run();
    await db.prepare("UPDATE products SET image = ? WHERE id = ?").bind(p[9], p[0]).run();
  }

  const projectSeeds = [
    ["water", FARMER_ID, "禾日友善農園｜節水灌溉改善", "更換滴灌管線與智慧控制器，預估降低 18% 農業用水。", "灌溉管線與節水控制器", 300, 96000, 74880, 116, 78, "用水效率提升 18%", "雲林縣", "古坑鄉", 205, "2026-12-31", "產銷履歷與友善耕作紀錄", json([{label:"設備與材料",percent:60},{label:"安裝與改善",percent:25},{label:"成果追蹤",percent:15}]), json({location:"雲林・古坑",headline:"讓每一滴水都能留下改善紀錄",quote:"希望把灌溉做得更精準。",paragraphs:["分區滴灌並留下每日用水紀錄。"]})],
    ["rice", "farmer-002", "青谷稻作｜友善稻田生態復育", "建立田埂棲地與減藥示範區，讓稻田兼顧生產與生物多樣性。", "生態田埂與減藥資材", 220, 68000, 41480, 61, 61, "新增 1.2 公頃友善棲地", "嘉義縣", "民雄鄉", 244, "2026-12-31", "無農藥檢測報告", json([{label:"生態資材",percent:55},{label:"田間施工",percent:30},{label:"成果追蹤",percent:15}]), json({location:"嘉義・民雄",headline:"讓稻田成為生物多樣性的家",quote:"減少用藥也要讓產量穩定。",paragraphs:["保留田埂植被並建立紀錄。"]})],
    ["solar-cold", "farmer-003", "山里果園｜太陽能冷藏設備", "汰換高耗能冷藏櫃並導入太陽能，降低鮮果損耗與用電成本。", "節能冷藏櫃與太陽能設備", 360, 78000, 35880, 46, 46, "採後損耗預估降低 22%", "花蓮縣", "壽豐鄉", 172, "2027-01-31", "農會輔導與設備估價單", json([{label:"設備採購",percent:60},{label:"安裝施工",percent:25},{label:"能源追蹤",percent:15}]), json({location:"花蓮・壽豐",headline:"讓鮮果在更低碳的冷藏裡保鮮",quote:"降低損耗就能同時照顧收入與環境。",paragraphs:["導入太陽能並記錄用電變化。"]})],
    ["circular-pack", "farmer-004", "暖田蔬果｜循環包材導入", "導入可重複使用的產地周轉箱，減少一次性紙箱與塑膠緩衝材。", "循環周轉箱與回收清洗", 180, 64000, 44160, 69, 69, "每年減少約 1,800 個紙箱", "彰化縣", "溪州鄉", 184, "2026-11-30", "友善耕作紀錄", json([{label:"周轉箱",percent:50},{label:"回收清洗",percent:35},{label:"使用追蹤",percent:15}]), json({location:"彰化・溪州",headline:"讓每一只箱子多服務一季",quote:"循環包材需要通路一起參與。",paragraphs:["從採收、配送到回收建立週期。"]})],
    ["pollinator", FARMER_ID, "禾日友善農園｜授粉棲地營造", "在田區邊界種植蜜源植物，建立友善蜂類與昆蟲的微型棲地。", "原生蜜源植物與棲地維護", 160, 52000, 27040, 82, 52, "新增 600 平方公尺授粉棲地", "雲林縣", "斗六市", 205, "2027-02-28", "有機驗證資料", json([{label:"植栽",percent:50},{label:"棲地維護",percent:35},{label:"生態觀測",percent:15}]), json({location:"雲林・斗六",headline:"在田邊留一塊給授粉昆蟲的家",quote:"產量之外，也要留下土地的生機。",paragraphs:["種植原生蜜源植物並做季節觀測。"]})],
  ];
  for (const p of projectSeeds) {
    await db.prepare("INSERT OR IGNORE INTO projects (id, farmer_id, title, note, purpose, points, target_points, raised_points, supporters, progress, impact, city, district, distance_km, completion_date, proof, allocations_json, story_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(...p).run();
  }

  const incentiveSeeds = [
    ["commute", "低碳通勤綠點", "企業員工方案", "搭乘大眾運輸或共享單車", "每次 20 點", 96400, "4,820 人", 78, "氣候行動"],
    ["ebill", "電子帳單轉換獎勵", "政府／公用事業", "改用電子帳單", "一次 80 點", 74800, "9,350 人", 64, "責任消費"],
    ["appliance", "節能家電汰舊換新", "政府／銀行／家電通路", "購買一級能效冷氣、冰箱或除濕機", "每件 600 點", 92000, "1,540 戶", 69, "能源效率"],
    ["local-shopping", "在地綠色消費加碼", "銀行卡友／企業會員", "指定在地小農通路消費", "消費 5% 點數", 128600, "6,240 人", 83, "地方共好"],
    ["farmer-match", "偏鄉小農支持配對", "企業 ESG 專案", "企業 1：1 配對消費者綠點", "等額配對", 86200, "128 戶", 71, "永續經濟"],
  ];
  for (const p of incentiveSeeds) {
    await db.prepare("INSERT OR IGNORE INTO incentive_programs (id, name, sponsor, action, reward, budget_points, participants, progress, esg) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(...p).run();
  }

  const resourceSeeds = [
    ["soil-test", "農會服務", "土壤健康檢測補助", 450, "7 個工作天", "合作農會採樣", "由合作農會安排土壤採樣，提供酸鹼值、有機質與肥力建議。", "土壤檢測與施肥建議"],
    ["harvest-crates", "農具兌換", "循環收成籃 10 入組", 600, "農會取貨", "剩餘 24 組", "耐用可堆疊的循環收成籃，降低一次性包材。", "採收、分級與循環運送"],
    ["irrigation-kit", "農具兌換", "節水滴灌器材券", 1200, "30 日內使用", "合作農會器材部", "兌換滴灌管、接頭與簡易控制器。", "節水灌溉器材"],
    ["organic-coaching", "轉型補助", "友善／有機轉型輔導", 1800, "輔導 6 個月", "政府與農會共同支持", "包含田間訪視、無農藥檢測、紀錄表與驗證準備。", "友善耕作與無農藥驗證"],
    ["low-carbon-machine", "設備補助", "低碳農機共購補助", 3000, "每季審查", "最高補助 30%", "以綠點提出低碳農機共購補助。", "節能農機與共同使用設備"],
    ["smart-greenhouse", "設備補助", "智慧溫室環控設備補助", 6800, "農會媒合安裝", "企業配對補助 20%", "包含感測器、循環風扇與自動控制。", "溫室環控與節能改善"],
    ["cold-chain-upgrade", "設備補助", "冷鏈預冷與節能冷藏補助", 9500, "專案審查後施作", "農會與企業共同補助", "協助建置產地預冷及高效率冷藏設備。", "產地預冷與節能冷藏"],
    ["electric-farm-machinery", "農機共購", "電動農機與共用充電設備", 12000, "農會共同採購", "最高配對 35%", "兌換電動農機及共用充電設備補助。", "低碳農機共同使用"],
    ["solar-irrigation-pump", "綠能設備", "太陽能灌溉泵浦系統", 15000, "每半年專案審查", "政府、農會與企業配對", "將傳統抽水設備改為太陽能泵浦。", "再生能源灌溉設備"],
    ["rainwater-tank", "設備補助", "雨水回收灌溉儲水槽", 9500, "農會評估施工", "企業配對補助 25%", "建置集水、過濾與儲水設備，降低乾季用水。", "雨水回收與灌溉"],
    ["solar-cold-chain", "設備補助", "太陽能冷藏與低碳冷鏈", 12000, "專案審查", "政府企業共同補助", "導入太陽能與高效率冷藏設備，降低採後損耗。", "低碳冷鏈設備"],
    ["soil-regeneration", "轉型補助", "土壤復育與有機質提升計畫", 15000, "年度審查", "農會長期輔導", "包含土壤檢測、堆肥與三年改善追蹤。", "土壤健康與減藥"],
  ];
  for (const p of resourceSeeds) {
    await db.prepare("INSERT OR IGNORE INTO resource_offers (id, category, name, required_points, term, rate, description, purpose) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(...p).run();
  }

  await db.batch([
    db.prepare("INSERT INTO local_actions (id, title, organizer, description, reward_points, city, district, address, details, event_start, event_end, distance_km) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET description = excluded.description, city = excluded.city, district = excluded.district, address = excluded.address, details = excluded.details, event_start = excluded.event_start, event_end = excluded.event_end, distance_km = excluded.distance_km").bind("local-market-day", "大安綠色市集志工行動", "台北市社區永續協會", "協助在地市集執行資源回收、循環容器整理與小農攤位導覽。", 40, "台北市", "大安區", "台北市大安區建國南路二段2號（大安森林公園信義路入口服務台）", "共需 30 名志工；報到後完成行前說明、兩小時服務及簽退，即可提交活動證明申請 40 綠點。", "2026-08-22T09:00:00+08:00", "2026-08-22T12:00:00+08:00", 1.2),
    db.prepare("INSERT INTO local_actions (id, title, organizer, description, reward_points, city, district, address, details, event_start, event_end, distance_km) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET description = excluded.description, city = excluded.city, district = excluded.district, address = excluded.address, details = excluded.details, event_start = excluded.event_start, event_end = excluded.event_end, distance_km = excluded.distance_km").bind("farmer-visit", "雲嘉南友善農田參訪", "斗六市農會產銷輔導組", "參與田間導覽，認識節水灌溉、減藥管理與農產履歷紀錄方式。", 120, "雲林縣", "斗六市", "雲林縣斗六市民生路273號（斗六市農會集合）", "含接駁、午餐與保險；名額 24 人，完成全程參訪及學習任務後可申請 120 綠點。", "2026-09-05T08:30:00+08:00", "2026-09-05T16:30:00+08:00", 205),
    db.prepare("INSERT INTO merchant_offers (id, merchant, title, description, required_points, city, district, address, details, distance_km) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET description = excluded.description, city = excluded.city, district = excluded.district, address = excluded.address, details = excluded.details, distance_km = excluded.distance_km").bind("green-cafe-cup", "綠田生活咖啡", "環保杯飲品優惠", "攜帶可重複使用環保杯，現場出示平台會員頁即可享指定飲品優惠。", 30, "台北市", "大安區", "台北市大安區和平東路二段96巷15弄18號1樓", "週一至週五 08:00–18:00；指定咖啡與茶飲折抵 15 元，每人每日限用一次，優惠依現場公告與供應狀況為準。", 0.8),
    db.prepare("INSERT INTO merchant_offers (id, merchant, title, description, required_points, city, district, address, details, distance_km) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET description = excluded.description, city = excluded.city, district = excluded.district, address = excluded.address, details = excluded.details, distance_km = excluded.distance_km").bind("local-grocery", "大安友善雜貨店", "在地小農採購優惠", "前往門市選購標示 GFES 的友善農產，結帳時出示平台頁面即可使用優惠。", 80, "台北市", "大安區", "台北市大安區瑞安街142巷3號", "每日 10:30–20:30；單筆購買指定在地農產滿 500 元，可享 50 元折抵，部分寄售與特價商品不併用。", 1.5),
  ]);
}

function number(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function integer(value: unknown, label: string, options: { min?: number; max?: number; fallback?: number } = {}) {
  const raw = value === undefined || value === null || value === "" ? options.fallback : Number(value);
  const min = options.min ?? 0;
  const max = options.max ?? 1_000_000;
  if (raw === undefined || !Number.isSafeInteger(raw) || raw < min || raw > max) {
    throw new Error(`${label}必須是 ${min.toLocaleString()} 至 ${max.toLocaleString()} 的整數`);
  }
  return raw;
}

function requiredText(value: unknown, label: string, maxLength = 200) {
  const text = String(value ?? "").trim();
  if (!text) throw new Error(`${label}不可留白`);
  if (text.length > maxLength) throw new Error(`${label}不可超過 ${maxLength} 個字`);
  return text;
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`).join(",")}}`;
  }
  return JSON.stringify(value ?? null);
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function id(value: unknown, prefix: string) {
  return typeof value === "string" && value.trim() ? value.trim() : `${prefix}-${crypto.randomUUID()}`;
}

async function balance(db: DbBinding, userId: string) {
  const row = await queryOne<{ balance: number | null }>(db, "SELECT COALESCE(SUM(delta_points), 0) AS balance FROM point_ledger WHERE user_id = ?", userId);
  return Number(row?.balance ?? 0);
}

async function hasLedgerSource(db: DbBinding, userId: string, sourceId: string) {
  return Boolean(await queryOne(db, "SELECT id FROM point_ledger WHERE user_id = ? AND source_id = ?", userId, sourceId));
}

export async function applyPlatformAction(db: DbBinding, action: string, body: Record<string, unknown>, actor?: { profileId: string; role: "consumer" | "farmer" | "institution" | "admin" }) {
  const consumerId = actor?.role === "consumer" ? actor.profileId : CONSUMER_ID;
  const farmerId = actor?.role === "farmer" ? actor.profileId : FARMER_ID;
  const institutionId = actor?.role === "institution" ? actor.profileId : INSTITUTION_ID;
  const isAdmin = actor?.role === "admin";
  switch (action) {
    case "update_consumer_settings": {
      const profile = await queryOne<{ role: string }>(db, "SELECT role FROM profiles WHERE id = ?", consumerId);
      if (profile?.role !== "consumer") throw new Error("只有消費者可以更新這份設定");
      const displayName = requiredText(body.displayName, "顯示名稱", 60);
      const contactEmail = requiredText(body.contactEmail, "聯絡信箱", 160).toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) throw new Error("請輸入有效的聯絡信箱");
      const phone = requiredText(body.phone, "聯絡電話", 24);
      const deliveryRecipientName = requiredText(body.deliveryRecipientName, "收件人", 60);
      const deliveryPhone = requiredText(body.deliveryPhone, "收件電話", 24);
      const deliveryPostalCode = requiredText(body.deliveryPostalCode, "配送郵遞區號", 10);
      const deliveryCity = requiredText(body.deliveryCity, "配送縣市", 20);
      const deliveryDistrict = requiredText(body.deliveryDistrict, "配送行政區", 20);
      const deliveryAddress = requiredText(body.deliveryAddress, "配送地址", 160);
      const deliveryNote = String(body.deliveryNote ?? "").trim().slice(0, 300);
      const residencePostalCode = requiredText(body.residencePostalCode, "居住地郵遞區號", 10);
      const residenceCity = requiredText(body.residenceCity, "居住縣市", 20);
      const residenceDistrict = requiredText(body.residenceDistrict, "居住行政區", 20);
      const residenceAddress = requiredText(body.residenceAddress, "居住地址", 160);
      await db.batch([
        db.prepare("UPDATE profiles SET display_name = ?, city = ?, district = ? WHERE id = ? AND role = 'consumer'").bind(displayName, residenceCity, residenceDistrict, consumerId),
        db.prepare(`INSERT INTO consumer_settings
          (consumer_id, contact_email, phone, delivery_recipient_name, delivery_phone, delivery_postal_code, delivery_city, delivery_district, delivery_address, delivery_note, residence_postal_code, residence_city, residence_district, residence_address, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(consumer_id) DO UPDATE SET contact_email = excluded.contact_email, phone = excluded.phone,
          delivery_recipient_name = excluded.delivery_recipient_name, delivery_phone = excluded.delivery_phone,
          delivery_postal_code = excluded.delivery_postal_code, delivery_city = excluded.delivery_city,
          delivery_district = excluded.delivery_district, delivery_address = excluded.delivery_address,
          delivery_note = excluded.delivery_note, residence_postal_code = excluded.residence_postal_code,
          residence_city = excluded.residence_city, residence_district = excluded.residence_district,
          residence_address = excluded.residence_address, updated_at = CURRENT_TIMESTAMP`)
          .bind(consumerId, contactEmail, phone, deliveryRecipientName, deliveryPhone, deliveryPostalCode, deliveryCity, deliveryDistrict, deliveryAddress, deliveryNote, residencePostalCode, residenceCity, residenceDistrict, residenceAddress),
      ]);
      return { ok: true };
    }
    case "admin_mark_action_submission_viewed": {
      const submissionId = String(body.submissionId ?? "").trim();
      const submission = await queryOne<{ id: string; status: string; proof_viewed_at: string | null }>(db, "SELECT id, status, proof_viewed_at FROM action_submissions WHERE id = ?", submissionId);
      if (!submission) throw new Error("找不到指定的行動證明");
      if (submission.status !== "pending") return { ok: true, duplicate: true };
      if (submission.proof_viewed_at) return { ok: true, duplicate: true, proofViewedAt: submission.proof_viewed_at };
      await db.batch([
        db.prepare("UPDATE action_submissions SET proof_viewed_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'pending' AND proof_viewed_at IS NULL").bind(submissionId),
        db.prepare("INSERT INTO admin_audit_logs (action, target_type, target_id, detail_json) VALUES ('view_action_submission', 'action_submission', ?, ?)").bind(submissionId, json({ viewedBy: actor?.profileId ?? "platform-admin" })),
      ]);
      const viewed = await queryOne<{ proof_viewed_at: string | null }>(db, "SELECT proof_viewed_at FROM action_submissions WHERE id = ?", submissionId);
      if (!viewed?.proof_viewed_at) throw new Error("查看紀錄寫入失敗，請重新操作");
      return { ok: true, proofViewedAt: viewed.proof_viewed_at };
    }
    case "admin_review_action_submission": {
      const submissionId = String(body.submissionId ?? "").trim();
      const decision = body.decision === "approved" ? "approved" : body.decision === "rejected" ? "rejected" : "";
      if (!decision) throw new Error("請選擇核准或退回");
      const submission = await queryOne<{ id: string; consumer_id: string; title: string; reward_points: number; status: string; proof_viewed_at: string | null }>(db, "SELECT id, consumer_id, title, reward_points, status, proof_viewed_at FROM action_submissions WHERE id = ?", submissionId);
      if (!submission) throw new Error("找不到指定的行動證明");
      const reviewNote = String(body.reviewNote ?? "").trim();
      if (!reviewNote) throw new Error("請填寫審核說明，審核流程不可省略");
      if (submission.status !== "pending") {
        if (submission.status === decision && String(body.reviewNote ?? "").trim()) {
          await db.prepare("UPDATE action_submissions SET review_note = ? WHERE id = ?").bind(reviewNote, submissionId).run();
        }
        return { ok: true, duplicate: true };
      }
      if (!submission.proof_viewed_at) throw new Error("請先查看證明文件，確認內容後再進行審核");
      const statements = [
        db.prepare("UPDATE action_submissions SET status = ?, review_note = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'pending'").bind(decision, reviewNote, submissionId),
        db.prepare("INSERT INTO admin_audit_logs (action, target_type, target_id, detail_json) VALUES ('review_action_submission', 'action_submission', ?, ?)").bind(submissionId, json({ decision, reviewNote, rewardPoints: submission.reward_points })),
      ];
      if (decision === "approved") {
        statements.push(db.prepare("INSERT OR IGNORE INTO point_ledger (user_id, delta_points, source_type, source_id, description, metadata_json) VALUES (?, ?, 'approved_green_action', ?, ?, ?)").bind(submission.consumer_id, submission.reward_points, `action-submission:${submissionId}`, `管理員核准：${submission.title}`, json({ submissionId, reviewedBy: "platform-admin" })));
      }
      await db.batch(statements);
      return { ok: true, status: decision };
    }
    case "admin_update_account": {
      const profileId = String(body.profileId ?? "").trim();
      const profile = await queryOne<{ id: string }>(db, "SELECT id FROM profiles WHERE id = ?", profileId);
      if (!profile) throw new Error("找不到指定帳號");
      const displayName = String(body.displayName ?? "").trim();
      const email = String(body.email ?? "").trim();
      const username = String(body.username ?? "").trim().toLowerCase();
      const city = String(body.city ?? "").trim();
      const district = String(body.district ?? "").trim();
      const status = ["active", "pending", "suspended"].includes(String(body.status)) ? String(body.status) : "active";
      if (!displayName || !email || !username || !city || !district) throw new Error("帳號資料不可留白");
      if (!/^[a-z0-9_]{4,24}$/.test(username)) throw new Error("使用者名稱只能使用 4 至 24 個英文字母、數字或底線");
      const adjustment = integer(Math.abs(number(body.pointAdjustment, 0)), "綠點調整數量", { min: 0, max: 100_000 }) * (number(body.pointAdjustment, 0) < 0 ? -1 : 1);
      const reason = String(body.reason ?? "").trim();
      if (adjustment !== 0 && reason.length < 4) throw new Error("調整綠點時請填寫至少 4 個字的原因");
      const statements = [
        db.prepare("UPDATE profiles SET display_name = ?, city = ?, district = ? WHERE id = ?").bind(displayName, city, district, profileId),
        db.prepare("INSERT INTO account_controls (profile_id, email, username, status, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(profile_id) DO UPDATE SET email = excluded.email, username = excluded.username, status = excluded.status, updated_at = CURRENT_TIMESTAMP").bind(profileId, email, username, status),
        db.prepare("INSERT INTO admin_audit_logs (action, target_type, target_id, detail_json) VALUES ('update_account', 'account', ?, ?)").bind(profileId, json({ displayName, email, username, city, district, status, pointAdjustment: adjustment })),
      ];
      if (adjustment !== 0) {
        statements.push(db.prepare("INSERT INTO point_ledger (user_id, delta_points, source_type, source_id, description, metadata_json) VALUES (?, ?, 'admin_adjustment', ?, '管理員調整綠點', ?)").bind(profileId, adjustment, `admin-${crypto.randomUUID()}`, json({ reason })));
      }
      await db.batch(statements);
      return { ok: true };
    }
    case "admin_send_points": {
      const profileId = String(body.profileId ?? "").trim();
      const account = await queryOne<{ id: string; display_name: string; account_kind: string }>(db, `SELECT p.id, p.display_name, COALESCE(ac.account_kind, 'test') AS account_kind
        FROM profiles p LEFT JOIN account_controls ac ON ac.profile_id = p.id
        WHERE p.id = ?`, profileId);
      if (!account) throw new Error("找不到指定帳號");
      if (account.account_kind !== "test") throw new Error("發送綠點功能僅供測試資料帳號使用");
      const points = integer(body.points, "發送綠點", { min: 1, max: 100_000 });
      const sourceId = `admin-grant-${crypto.randomUUID()}`;
      await db.batch([
        db.prepare("INSERT INTO point_ledger (user_id, delta_points, source_type, source_id, description, metadata_json) VALUES (?, ?, 'admin_grant', ?, '管理員發送綠點', ?)").bind(profileId, points, sourceId, json({ grantedBy: actor?.profileId ?? "platform-admin", points })),
        db.prepare("INSERT INTO admin_audit_logs (action, target_type, target_id, detail_json) VALUES ('send_points', 'account', ?, ?)").bind(profileId, json({ displayName: account.display_name, points, sourceId })),
      ]);
      return { ok: true, grantedPoints: points };
    }
    case "admin_update_product": {
      const productId = String(body.productId ?? "").trim();
      if (!await queryOne(db, "SELECT id FROM products WHERE id = ?", productId)) throw new Error("找不到指定商品");
      const status = ["active", "hidden", "sold_out"].includes(String(body.status)) ? String(body.status) : "active";
      const points = integer(body.points, "商品點數", { min: 1, max: 1_000_000 });
      const stock = integer(body.stock, "商品庫存", { min: 0, max: 100_000 });
      await db.batch([
        db.prepare("UPDATE products SET points = ?, stock = ?, status = ? WHERE id = ?").bind(points, stock, status, productId),
        db.prepare("INSERT INTO admin_audit_logs (action, target_type, target_id, detail_json) VALUES ('update_product', 'product', ?, ?)").bind(productId, json({ points: number(body.points), stock: number(body.stock), status })),
      ]);
      return { ok: true };
    }
    case "admin_update_project": {
      const projectId = String(body.projectId ?? "").trim();
      if (!await queryOne(db, "SELECT id FROM projects WHERE id = ?", projectId)) throw new Error("找不到指定專案");
      const status = ["funding", "review", "completed", "hidden"].includes(String(body.status)) ? String(body.status) : "funding";
      const points = integer(body.points, "單次支持點數", { min: 1, max: 1_000_000 });
      const targetPoints = integer(body.targetPoints, "目標點數", { min: points, max: 10_000_000 });
      await db.batch([
        db.prepare("UPDATE projects SET points = ?, target_points = ?, status = ? WHERE id = ?").bind(points, targetPoints, status, projectId),
        db.prepare("INSERT INTO admin_audit_logs (action, target_type, target_id, detail_json) VALUES ('update_project', 'project', ?, ?)").bind(projectId, json({ points: number(body.points), targetPoints: number(body.targetPoints), status })),
      ]);
      return { ok: true };
    }
    case "admin_update_incentive": {
      const programId = String(body.programId ?? "").trim();
      if (!await queryOne(db, "SELECT id FROM incentive_programs WHERE id = ?", programId)) throw new Error("找不到指定激勵計畫");
      const budgetPoints = integer(body.budgetPoints, "計畫預算", { min: 1, max: 100_000_000 });
      const progress = integer(body.progress, "執行進度", { min: 0, max: 100 });
      await db.batch([
        db.prepare("UPDATE incentive_programs SET budget_points = ?, progress = ? WHERE id = ?").bind(budgetPoints, progress, programId),
        db.prepare("INSERT INTO admin_audit_logs (action, target_type, target_id, detail_json) VALUES ('update_incentive', 'incentive', ?, ?)").bind(programId, json({ budgetPoints: number(body.budgetPoints), progress: number(body.progress) })),
      ]);
      return { ok: true };
    }
    case "admin_update_procurement": {
      const procurementId = String(body.procurementId ?? "").trim();
      if (!await queryOne(db, "SELECT id FROM procurement_requests WHERE id = ?", procurementId)) throw new Error("找不到指定採購需求");
      const quantity = integer(body.quantity, "採購數量", { min: 1, max: 1_000_000 });
      const budgetPoints = integer(body.budgetPoints, "採購預算", { min: 1, max: 100_000_000 });
      const deliveryRegion = requiredText(body.deliveryRegion, "配送地區", 100);
      const status = ["open", "matched", "completed", "paused"].includes(String(body.status)) ? String(body.status) : "open";
      await db.batch([
        db.prepare("UPDATE procurement_requests SET quantity = ?, budget_points = ?, delivery_region = ?, status = ? WHERE id = ?").bind(quantity, budgetPoints, deliveryRegion, status, procurementId),
        db.prepare("INSERT INTO admin_audit_logs (action, target_type, target_id, detail_json) VALUES ('update_procurement', 'procurement', ?, ?)").bind(procurementId, json({ quantity, budgetPoints, deliveryRegion, status })),
      ]);
      return { ok: true };
    }
    case "admin_update_data_template": {
      const templateKey = String(body.templateKey ?? "").trim();
      const existing = await queryOne<{ template_key: string }>(db, "SELECT template_key FROM data_templates WHERE template_key = ?", templateKey);
      if (!existing) throw new Error("找不到指定的範例資料");
      let sampleData: unknown = body.sampleData ?? {};
      if (typeof sampleData === "string") {
        try {
          sampleData = JSON.parse(sampleData);
        } catch {
          throw new Error("範例資料必須是有效的 JSON 格式");
        }
      }
      await db.batch([
        db.prepare("UPDATE data_templates SET sample_data_json = ?, updated_at = CURRENT_TIMESTAMP WHERE template_key = ?").bind(json(sampleData), templateKey),
        db.prepare("INSERT INTO admin_audit_logs (action, target_type, target_id, detail_json) VALUES ('update_data_template', 'data_template', ?, ?)").bind(templateKey, json({ schemaVersion: body.schemaVersion ?? "1.0" })),
      ]);
      return { ok: true };
    }
    case "admin_generate_data_template": {
      const templateKey = String(body.templateKey ?? "").trim();
      const existing = await queryOne<{ sample_data_json: string }>(db, "SELECT sample_data_json FROM data_templates WHERE template_key = ?", templateKey);
      if (!existing) throw new Error("找不到指定的範例資料");
      const sampleData = parse<Record<string, unknown>>(existing.sample_data_json, {});
      const now = new Date();
      const dateCode = now.toISOString().slice(0, 10).replaceAll("-", "");
      const serial = String(Math.floor(Math.random() * 900) + 100);
      const currentMeta = sampleData.meta && typeof sampleData.meta === "object" ? sampleData.meta as Record<string, unknown> : {};
      const generated = { ...sampleData, meta: { ...currentMeta, documentNumber: `GFES-${templateKey.toUpperCase().replaceAll("_", "-")}-${dateCode}-${serial}`, generatedAt: now.toISOString(), status: "sample" } };
      await db.batch([
        db.prepare("UPDATE data_templates SET sample_data_json = ?, updated_at = CURRENT_TIMESTAMP WHERE template_key = ?").bind(json(generated), templateKey),
        db.prepare("INSERT INTO admin_audit_logs (action, target_type, target_id, detail_json) VALUES ('generate_data_template', 'data_template', ?, ?)").bind(templateKey, json({ documentNumber: (generated.meta as Record<string, unknown>).documentNumber })),
      ]);
      return { ok: true };
    }
    case "admin_update_parameter": {
      const parameterKey = String(body.parameterKey ?? "").trim();
      const value = String(body.value ?? "").trim();
      if (!parameterKey || !value) throw new Error("參數值不可留白");
      await db.batch([
        db.prepare("UPDATE system_parameters SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE parameter_key = ?").bind(value, parameterKey),
        db.prepare("INSERT INTO admin_audit_logs (action, target_type, target_id, detail_json) VALUES ('update_parameter', 'parameter', ?, ?)").bind(parameterKey, json({ value })),
      ]);
      return { ok: true };
    }
    case "set_location": {
      const city = String(body.city ?? "台北市").trim();
      const district = String(body.district ?? "大安區").trim();
      if (!city || !district) throw new Error("請填寫完整所在地");
      await db.prepare("UPDATE profiles SET city = ?, district = ? WHERE id = ?").bind(city, district, consumerId).run();
      return { ok: true };
    }
    case "earn_points": {
      const points = Math.max(1, number(body.points));
      const sourceType = String(body.sourceType ?? "green_action");
      const description = String(body.description ?? "完成綠色行動");
      const sourceId = body.sourceId ? String(body.sourceId) : id(body.idempotencyKey, "action");
      if (await hasLedgerSource(db, consumerId, sourceId)) return { ok: true, duplicate: true, points: await balance(db, consumerId) };
      await db.prepare("INSERT OR IGNORE INTO point_ledger (user_id, delta_points, source_type, source_id, description, metadata_json) VALUES (?, ?, ?, ?, ?, ?)").bind(consumerId, points, sourceType, sourceId, description, json(body.metadata)).run();
      return { ok: true, points: await balance(db, consumerId) };
    }
    case "redeem_merchant": {
      const offerId = String(body.offerId ?? "");
      const offer = await queryOne<{ required_points: number; title: string }>(db, "SELECT required_points, title FROM merchant_offers WHERE id = ? AND status = 'active'", offerId);
      if (!offer) throw new Error("找不到商家優惠");
      if (await hasLedgerSource(db, consumerId, offerId)) return { ok: true, duplicate: true, points: await balance(db, consumerId) };
      const current = await balance(db, consumerId);
      if (current < offer.required_points) throw new Error(`綠點不足，還差 ${offer.required_points - current} 點`);
      await db.prepare("INSERT OR IGNORE INTO point_ledger (user_id, delta_points, source_type, source_id, description) VALUES (?, ?, ?, ?, ?)").bind(consumerId, -offer.required_points, "merchant_redeem", offerId, `兌換商家優惠：${offer.title}`).run();
      return { ok: true, points: await balance(db, consumerId) };
    }
    case "register_local_action": {
      const actionId = String(body.actionId ?? "").trim();
      const localAction = await queryOne<{ id: string; title: string }>(db, "SELECT id, title FROM local_actions WHERE id = ? AND status = 'open'", actionId);
      if (!localAction) throw new Error("找不到可報名的綠色行動");
      const attendeeName = requiredText(body.attendeeName, "參加人姓名", 80);
      const attendeePhone = requiredText(body.attendeePhone, "聯絡電話", 30);
      const attendeeEmail = requiredText(body.attendeeEmail, "電子信箱", 160).toLowerCase();
      const participantCount = integer(body.participantCount, "參加人數", { min: 1, max: 10 });
      const emergencyContactName = requiredText(body.emergencyContactName, "緊急聯絡人", 80);
      const emergencyContactPhone = requiredText(body.emergencyContactPhone, "緊急聯絡電話", 30);
      const note = String(body.note ?? "").trim().slice(0, 500);
      if (!/^[0-9+()\-\s]{8,30}$/.test(attendeePhone) || !/^[0-9+()\-\s]{8,30}$/.test(emergencyContactPhone)) throw new Error("請填寫有效的聯絡電話");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(attendeeEmail)) throw new Error("請填寫有效的電子信箱");
      const existing = await queryOne<{ id: number; attendee_name: string }>(db, "SELECT id, attendee_name FROM local_action_registrations WHERE consumer_id = ? AND action_id = ?", consumerId, actionId);
      if (existing?.attendee_name) return { ok: true, duplicate: true };
      if (existing) {
        await db.prepare("UPDATE local_action_registrations SET attendee_name = ?, attendee_phone = ?, attendee_email = ?, participant_count = ?, emergency_contact_name = ?, emergency_contact_phone = ?, note = ?, status = 'registered', registered_at = CURRENT_TIMESTAMP WHERE id = ?").bind(attendeeName, attendeePhone, attendeeEmail, participantCount, emergencyContactName, emergencyContactPhone, note, existing.id).run();
        return { ok: true, title: localAction.title, upgraded: true };
      }
      await db.prepare("INSERT INTO local_action_registrations (consumer_id, action_id, attendee_name, attendee_phone, attendee_email, participant_count, emergency_contact_name, emergency_contact_phone, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(consumerId, actionId, attendeeName, attendeePhone, attendeeEmail, participantCount, emergencyContactName, emergencyContactPhone, note).run();
      return { ok: true, title: localAction.title };
    }
    case "update_integration_setting": {
      const serviceKey = String(body.serviceKey ?? "").trim();
      const current = await queryOne<{ service_key: string }>(db, "SELECT service_key FROM integration_settings WHERE service_key = ?", serviceKey);
      if (!current) throw new Error("找不到 API 測試設定");
      let sampleResponse: unknown = body.sampleResponse ?? {};
      if (typeof body.sampleResponse === "string") {
        try {
          sampleResponse = JSON.parse(body.sampleResponse);
        } catch {
          throw new Error("模擬回傳資料必須是正確的 JSON 格式");
        }
      }
      const rewardPoints = integer(body.rewardPoints, "API 回饋點數", { min: 0, max: 10_000 });
      await db.prepare("UPDATE integration_settings SET enabled = ?, reward_points = ?, endpoint_label = ?, sample_response_json = ?, updated_at = CURRENT_TIMESTAMP WHERE service_key = ?").bind(
        body.enabled === false ? 0 : 1,
        rewardPoints,
        requiredText(body.endpointLabel ?? "外部 API", "API 名稱", 120),
        json(sampleResponse),
        serviceKey,
      ).run();
      return { ok: true };
    }
    case "simulate_integration": {
      const serviceKey = String(body.serviceKey ?? "").trim();
      const setting = await queryOne<{ display_name: string; enabled: number; reward_points: number; sample_response_json: string }>(db, "SELECT display_name, enabled, reward_points, sample_response_json FROM integration_settings WHERE service_key = ?", serviceKey);
      if (!setting) throw new Error("找不到 API 測試設定");
      if (!setting.enabled) throw new Error("此 API 測試服務目前已停用");
      const input = body.input ?? {};
      const fingerprint = await sha256(`${serviceKey}:${stableJson(input)}`);
      const existingRun = await queryOne<{ id: string; response_json: string }>(db, "SELECT id, response_json FROM verification_runs WHERE service_key = ? AND input_fingerprint = ?", serviceKey, fingerprint);
      if (existingRun) return { ok: true, duplicate: true, runId: existingRun.id, response: parse(existingRun.response_json, {}) };
      const runId = `VERIFY-${crypto.randomUUID()}`;
      const responsePayload = { ...parse<Record<string, unknown>>(setting.sample_response_json, {}), simulation: true, verifiedAt: new Date().toISOString() };
      const statements = [
        db.prepare("INSERT INTO verification_runs (id, service_key, input_json, response_json, status, reward_points, input_fingerprint) VALUES (?, ?, ?, ?, 'success', ?, ?)").bind(runId, serviceKey, json(input), json(responsePayload), setting.reward_points, fingerprint),
      ];
      if (setting.reward_points > 0) {
        statements.push(db.prepare("INSERT INTO point_ledger (user_id, delta_points, source_type, source_id, description, metadata_json) VALUES (?, ?, ?, ?, ?, ?)").bind(consumerId, setting.reward_points, `simulation_${serviceKey}`, `verification:${serviceKey}:${fingerprint}`, `${setting.display_name}測試回饋`, json({ simulation: true, serviceKey, runId })));
      }
      await db.batch(statements);
      return { ok: true, runId, response: responsePayload };
    }
    case "update_farmer_story": {
      const status = body.status === "published" ? "published" : "draft";
      const existing = await queryOne<{ image_key: string | null; image_url: string }>(db, "SELECT image_key, image_url FROM farmer_stories WHERE farmer_id = ?", farmerId);
      const requestedKey = String(body.imageKey ?? "").trim();
      if (requestedKey && !requestedKey.startsWith(`farmer-media/${farmerId}/story/`)) throw new Error("不可使用其他小農的故事圖片");
      const imageKey = requestedKey || existing?.image_key || null;
      const safeExistingUrl = existing?.image_url?.startsWith("/") ? existing.image_url : "";
      const imageUrl = imageKey ? `/api/farmer-media?key=${encodeURIComponent(imageKey)}` : safeExistingUrl;
      if (status === "published" && !imageUrl) throw new Error("發布農場故事前請先上傳封面圖片");
      await db.prepare(`INSERT INTO farmer_stories (farmer_id, headline, summary, body, quote, image_key, image_url, status, updated_at, published_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CASE WHEN ? = 'published' THEN CURRENT_TIMESTAMP ELSE NULL END)
        ON CONFLICT(farmer_id) DO UPDATE SET headline = excluded.headline, summary = excluded.summary, body = excluded.body,
          quote = excluded.quote, image_key = excluded.image_key, image_url = excluded.image_url, status = excluded.status,
          updated_at = CURRENT_TIMESTAMP, published_at = CASE WHEN excluded.status = 'published' THEN CURRENT_TIMESTAMP ELSE farmer_stories.published_at END`)
        .bind(farmerId, requiredText(body.headline, "故事標題", 100), requiredText(body.summary, "故事摘要", 240), requiredText(body.body, "完整故事", 5000), String(body.quote ?? "").trim().slice(0, 300), imageKey, imageUrl, status, status).run();
      return { ok: true, status };
    }
    case "create_farmer_news": {
      const newsId = `NEWS-${crypto.randomUUID()}`;
      const status = body.status === "published" ? "published" : "draft";
      const imageKey = String(body.imageKey ?? "").trim() || null;
      if (imageKey && !imageKey.startsWith(`farmer-media/${farmerId}/news/`)) throw new Error("不可使用其他小農的消息圖片");
      const imageUrl = imageKey ? `/api/farmer-media?key=${encodeURIComponent(imageKey)}` : "";
      await db.prepare(`INSERT INTO farmer_news (id, farmer_id, title, content, category, image_key, image_url, status, published_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CASE WHEN ? = 'published' THEN CURRENT_TIMESTAMP ELSE NULL END)`)
        .bind(newsId, farmerId, requiredText(body.title, "消息標題", 120), requiredText(body.content, "消息內容", 2000), requiredText(body.category ?? "農場近況", "消息分類", 40), imageKey, imageUrl, status, status).run();
      return { ok: true, id: newsId, status };
    }
    case "update_farmer_news": {
      const newsId = requiredText(body.id, "消息識別碼", 100);
      const existing = await queryOne<{ image_key: string | null; image_url: string }>(db, "SELECT image_key, image_url FROM farmer_news WHERE id = ? AND farmer_id = ?", newsId, farmerId);
      if (!existing) throw new Error("找不到您的消息");
      const status = body.status === "published" ? "published" : "draft";
      const requestedKey = String(body.imageKey ?? "").trim();
      if (requestedKey && !requestedKey.startsWith(`farmer-media/${farmerId}/news/`)) throw new Error("不可使用其他小農的消息圖片");
      const imageKey = requestedKey || existing.image_key || null;
      const imageUrl = imageKey ? `/api/farmer-media?key=${encodeURIComponent(imageKey)}` : existing.image_url;
      await db.prepare(`UPDATE farmer_news SET title = ?, content = ?, category = ?, image_key = ?, image_url = ?, status = ?,
        updated_at = CURRENT_TIMESTAMP, published_at = CASE WHEN ? = 'published' THEN CURRENT_TIMESTAMP ELSE published_at END
        WHERE id = ? AND farmer_id = ?`)
        .bind(requiredText(body.title, "消息標題", 120), requiredText(body.content, "消息內容", 2000), requiredText(body.category ?? "農場近況", "消息分類", 40), imageKey, imageUrl, status, status, newsId, farmerId).run();
      return { ok: true, id: newsId, status };
    }
    case "create_product": {
      const productId = id(body.id, "product");
      const points = integer(body.points, "商品點數", { min: 1, max: 1_000_000, fallback: 300 });
      const stock = integer(body.stock, "商品庫存", { min: 0, max: 100_000, fallback: 1 });
      await db.prepare("INSERT INTO products (id, farmer_id, title, points, stock, unit, proof, delivery, description, image, city, district, distance_km) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(productId, farmerId, requiredText(body.title ?? "新上架小農商品", "商品名稱", 120), points, stock, requiredText(body.unit ?? "件", "商品單位", 20), requiredText(body.proof ?? "待補充驗證資料", "驗證資料", 200), requiredText(body.delivery ?? "合作物流配送", "配送方式", 200), requiredText(body.description, "商品說明", 1000), String(body.image ?? "/farmer-library/heri-leafy/product.webp").slice(0, 500), requiredText(body.city ?? "雲林縣", "縣市", 20), requiredText(body.district ?? "斗六市", "行政區", 20), Math.max(0.1, Math.min(1000, number(body.distanceKm, 205)))).run();
      return { ok: true, id: productId };
    }
    case "update_product": {
      const productId = String(body.id ?? "");
      if (!productId) throw new Error("商品識別碼遺失");
      if (!await queryOne(db, "SELECT id FROM products WHERE id = ? AND farmer_id = ?", productId, farmerId)) throw new Error("找不到您的商品");
      await db.prepare("UPDATE products SET title = ?, points = ?, stock = ?, unit = ?, proof = ?, delivery = ?, description = ? WHERE id = ? AND farmer_id = ?").bind(requiredText(body.title, "商品名稱", 120), integer(body.points, "商品點數", { min: 1, max: 1_000_000 }), integer(body.stock, "商品庫存", { min: 0, max: 100_000 }), requiredText(body.unit ?? "件", "商品單位", 20), requiredText(body.proof ?? "待補充驗證資料", "驗證資料", 200), requiredText(body.delivery ?? "合作物流配送", "配送方式", 200), requiredText(body.description, "商品說明", 1000), productId, farmerId).run();
      return { ok: true, id: productId };
    }
    case "create_project": {
      const projectId = id(body.id, "project");
      const title = requiredText(body.title ?? "小農永續改善專案", "專案名稱", 160);
      const points = integer(body.points, "單次支持點數", { min: 1, max: 1_000_000, fallback: 200 });
      const targetPoints = integer(body.targetPoints, "目標點數", { min: points, max: 10_000_000, fallback: 20_000 });
      await db.prepare("INSERT INTO projects (id, farmer_id, title, note, purpose, points, target_points, impact, city, district, distance_km, completion_date, proof, allocations_json, story_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(projectId, farmerId, title, requiredText(body.note, "專案說明", 1000), requiredText(body.purpose, "點數用途", 1000), points, targetPoints, requiredText(body.impact ?? "持續追蹤改善成果", "預期成果", 500), requiredText(body.city ?? "雲林縣", "縣市", 20), requiredText(body.district ?? "斗六市", "行政區", 20), Math.max(0.1, Math.min(1000, number(body.distanceKm, 205))), requiredText(body.completionDate ?? "2026-12-31", "預計完成日", 20), requiredText(body.proof ?? "產銷履歷與友善耕作紀錄", "證明資料", 300), json(body.allocations ?? []), json(body.story ?? {})).run();
      return { ok: true, id: projectId };
    }
    case "support_project": {
      const projectId = String(body.projectId ?? "");
      const project = await queryOne<{ farmer_id: string; points: number; target_points: number; raised_points: number; status: string }>(db, "SELECT farmer_id, points, target_points, raised_points, status FROM projects WHERE id = ?", projectId);
      if (!project) throw new Error("找不到改善專案");
      if (project.status !== "funding") throw new Error("此專案目前不接受支持");
      const existing = await queryOne(db, "SELECT id FROM project_supports WHERE consumer_id = ? AND project_id = ?", consumerId, projectId);
      if (existing) return { ok: true, duplicate: true };
      const supportPoints = Math.min(project.points, project.target_points - project.raised_points);
      if (supportPoints <= 0) throw new Error("此專案已達成募集目標");
      const current = await balance(db, consumerId);
      if (current < supportPoints) throw new Error(`綠點不足，還差 ${supportPoints - current} 點`);
      await db.batch([
        db.prepare("INSERT INTO project_supports (consumer_id, project_id, points) VALUES (?, ?, ?)").bind(consumerId, projectId, supportPoints),
        db.prepare("INSERT INTO point_ledger (user_id, delta_points, source_type, source_id, description) VALUES (?, ?, ?, ?, ?)").bind(consumerId, -supportPoints, "project_support", `support:${projectId}`, "支持小農改善專案"),
        db.prepare("INSERT INTO point_ledger (user_id, delta_points, source_type, source_id, description) VALUES (?, ?, ?, ?, ?)").bind(project.farmer_id, supportPoints, "consumer_support", `support:${projectId}`, "收到消費者改善專案支持"),
        db.prepare("UPDATE projects SET raised_points = raised_points + ?, supporters = supporters + 1, progress = MIN(100, CAST((raised_points + ?) * 100.0 / target_points AS INTEGER)), status = CASE WHEN raised_points + ? >= target_points THEN 'review' ELSE status END WHERE id = ? AND status = 'funding' AND raised_points = ?").bind(supportPoints, supportPoints, supportPoints, projectId, project.raised_points),
      ]);
      return { ok: true };
    }
    case "redeem_product": {
      const productId = String(body.productId ?? "");
      const quantity = integer(body.quantity, "兌換數量", { min: 1, max: 100, fallback: 1 });
      const product = await queryOne<{ farmer_id: string; points: number; stock: number; title: string }>(db, "SELECT farmer_id, points, stock, title FROM products WHERE id = ? AND status = 'active'", productId);
      const recipientName = String(body.recipientName ?? "").trim();
      const recipientPhone = String(body.recipientPhone ?? "").trim();
      const postalCode = String(body.postalCode ?? "").trim();
      const shippingCity = String(body.shippingCity ?? "").trim();
      const shippingDistrict = String(body.shippingDistrict ?? "").trim();
      const shippingAddress = String(body.shippingAddress ?? "").trim();
      const deliveryNote = String(body.deliveryNote ?? "").trim();
      if (!product) throw new Error("找不到可兌換商品");
      if (!recipientName || !recipientPhone || !shippingCity || !shippingDistrict || !shippingAddress) throw new Error("請完整填寫收件人、電話及配送地址");
      if (!/^[0-9+()\-\s]{8,20}$/.test(recipientPhone)) throw new Error("請填寫有效的聯絡電話");
      if (product.stock < quantity) throw new Error(`庫存不足，目前只剩 ${product.stock} 件`);
      const total = product.points * quantity;
      if (!Number.isSafeInteger(total) || total > 1_000_000) throw new Error("本次兌換點數超過單筆上限 1,000,000 點");
      const current = await balance(db, consumerId);
      if (current < total) throw new Error(`綠點不足，還差 ${total - current} 點`);
      const orderId = `GFES-ORD-${crypto.randomUUID()}`;
      await db.batch([
        db.prepare("INSERT INTO orders (id, consumer_id, product_id, points, quantity, recipient_name, recipient_phone, postal_code, shipping_city, shipping_district, shipping_address, delivery_note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(orderId, consumerId, productId, total, quantity, recipientName, recipientPhone, postalCode, shippingCity, shippingDistrict, shippingAddress, deliveryNote),
        db.prepare("UPDATE products SET stock = stock - ? WHERE id = ? AND status = 'active'").bind(quantity, productId),
        db.prepare("INSERT INTO point_ledger (user_id, delta_points, source_type, source_id, description) VALUES (?, ?, ?, ?, ?)").bind(consumerId, -total, "product_redeem", orderId, `兌換小農商品：${product.title}`),
        db.prepare("INSERT INTO point_ledger (user_id, delta_points, source_type, source_id, description) VALUES (?, ?, ?, ?, ?)").bind(product.farmer_id, total, "product_order", orderId, `收到商品訂單：${product.title}`),
      ]);
      return { ok: true, orderId };
    }
    case "advance_order": {
      const orderId = String(body.orderId ?? "");
      const order = await queryOne<{ stage: number }>(db, "SELECT o.stage FROM orders o JOIN products p ON p.id = o.product_id WHERE o.id = ? AND p.farmer_id = ?", orderId, farmerId);
      if (!order) throw new Error("找不到訂單");
      if (await queryOne(db, "SELECT id FROM change_requests WHERE request_type = 'order' AND target_id = ? AND status = 'pending'", orderId)) throw new Error("此訂單有待確認的修改申請，請先完成審核");
      const next = Math.min(3, Number(order.stage) + 1);
      if (next === Number(order.stage)) return { ok: true, stage: next };
      const status = next === 3 ? "completed" : next === 2 ? "shipping" : next === 1 ? "packing" : "created";
      const carrier = next === 2 ? requiredText(body.carrier, "物流商", 80) : "";
      const trackingNumber = next === 2 ? requiredText(body.trackingNumber, "物流單號", 100) : "";
      const fulfillmentNote = String(body.fulfillmentNote ?? "").trim().slice(0, 500);
      await db.prepare(`UPDATE orders SET stage = ?, status = ?,
        carrier = CASE WHEN ? != '' THEN ? ELSE carrier END,
        tracking_number = CASE WHEN ? != '' THEN ? ELSE tracking_number END,
        fulfillment_note = CASE WHEN ? != '' THEN ? ELSE fulfillment_note END,
        packed_at = CASE WHEN ? = 1 AND packed_at = '' THEN CURRENT_TIMESTAMP ELSE packed_at END,
        shipped_at = CASE WHEN ? = 2 AND shipped_at = '' THEN CURRENT_TIMESTAMP ELSE shipped_at END,
        completed_at = CASE WHEN ? = 3 AND completed_at = '' THEN CURRENT_TIMESTAMP ELSE completed_at END,
        updated_at = CURRENT_TIMESTAMP WHERE id = ? AND stage = ?`).bind(next, status, carrier, carrier, trackingNumber, trackingNumber, fulfillmentNote, fulfillmentNote, next, next, next, orderId, Number(order.stage)).run();
      return { ok: true, stage: next };
    }
    case "request_order_change": {
      const orderId = String(body.orderId ?? "").trim();
      const order = await queryOne<{ id: string; stage: number }>(db, "SELECT id, stage FROM orders WHERE id = ? AND consumer_id = ?", orderId, consumerId);
      if (!order) throw new Error("找不到您的兌換訂單");
      if (Number(order.stage) >= 2) throw new Error("訂單已進入配送階段，請直接聯絡客服處理");
      if (await queryOne(db, "SELECT id FROM change_requests WHERE request_type = 'order' AND target_id = ? AND status = 'pending'", orderId)) throw new Error("此訂單已有待處理的修改申請");
      const requested = {
        recipientName: requiredText(body.recipientName, "收件人", 80),
        recipientPhone: requiredText(body.recipientPhone, "聯絡電話", 30),
        postalCode: String(body.postalCode ?? "").trim().slice(0, 10),
        shippingCity: requiredText(body.shippingCity, "縣市", 20),
        shippingDistrict: requiredText(body.shippingDistrict, "行政區", 20),
        shippingAddress: requiredText(body.shippingAddress, "詳細地址", 200),
        deliveryNote: String(body.deliveryNote ?? "").trim().slice(0, 500),
      };
      if (!/^[0-9+()\-\s]{8,20}$/.test(requested.recipientPhone)) throw new Error("請輸入有效的聯絡電話");
      const reasonCode = ["input_error", "accidental_order", "delivery_change", "other"].includes(String(body.reasonCode)) ? String(body.reasonCode) : "input_error";
      const requestId = `GFES-CHG-${crypto.randomUUID()}`;
      await db.prepare("INSERT INTO change_requests (id, request_type, target_id, requester_id, reason_code, reason_detail, requested_json) VALUES (?, 'order', ?, ?, ?, ?, ?)").bind(requestId, orderId, consumerId, reasonCode, String(body.reasonDetail ?? "").trim().slice(0, 500), json(requested)).run();
      return { ok: true, requestId };
    }
    case "review_order_change": {
      const requestId = String(body.requestId ?? "").trim();
      const decision = body.decision === "approved" ? "approved" : body.decision === "rejected" ? "rejected" : "";
      if (!decision) throw new Error("請選擇核准或退回");
      const request = await queryOne<Record<string, unknown>>(db, `SELECT cr.*, o.stage, p.farmer_id AS owner_id FROM change_requests cr JOIN orders o ON o.id = cr.target_id JOIN products p ON p.id = o.product_id WHERE cr.id = ? AND cr.request_type = 'order'`, requestId);
      if (!request || request.status !== "pending") throw new Error("找不到待處理的訂單修改申請");
      const actor = await queryOne<{ role: string }>(db, "SELECT role FROM profiles WHERE id = ?", farmerId);
      if (actor?.role !== "admin" && request.owner_id !== farmerId) throw new Error("您無權處理此訂單修改申請");
      if (decision === "approved" && Number(request.stage) >= 2) throw new Error("訂單已進入配送階段，無法套用修改");
      const reviewNote = String(body.reviewNote ?? "").trim().slice(0, 500);
      const statements = [db.prepare("UPDATE change_requests SET status = ?, reviewer_id = ?, review_note = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'pending'").bind(decision, farmerId, reviewNote, requestId)];
      if (decision === "approved") {
        const value = parse<Record<string, string>>(String(request.requested_json), {});
        statements.unshift(db.prepare("UPDATE orders SET recipient_name = ?, recipient_phone = ?, postal_code = ?, shipping_city = ?, shipping_district = ?, shipping_address = ?, delivery_note = ? WHERE id = ? AND stage < 2").bind(value.recipientName, value.recipientPhone, value.postalCode, value.shippingCity, value.shippingDistrict, value.shippingAddress, value.deliveryNote, request.target_id));
      }
      await db.batch(statements);
      return { ok: true, status: decision };
    }
    case "create_incentive": {
      const programId = id(body.id, "program");
      const activityDescription = body.activityDescription ?? body.actionDescription ?? body.programAction;
      await db.prepare("INSERT INTO incentive_programs (id, institution_id, name, sponsor, action, reward, budget_points, participants, progress, esg) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)").bind(programId, institutionId, requiredText(body.name ?? "新綠點激勵計畫", "計畫名稱", 160), requiredText(body.sponsor ?? "合作機構", "主辦單位", 160), requiredText(activityDescription ?? "完成綠色行動", "參與行動", 300), requiredText(body.reward ?? "依規則回饋", "回饋方式", 200), integer(body.budgetPoints, "計畫預算", { min: 1, max: 100_000_000, fallback: 10_000 }), `${integer(body.participantCount, "參與人數", { min: 0, max: 10_000_000, fallback: 0 })} ${requiredText(body.participantUnit ?? "人", "參與單位", 20)}`, requiredText(body.esg ?? "地方共好", "ESG 指標", 200)).run();
      return { ok: true, id: programId };
    }
    case "create_procurement": {
      const requestId = id(body.id, "procurement");
      await db.prepare("INSERT INTO procurement_requests (id, institution_id, title, category, quantity, budget_points, delivery_region) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(
        requestId,
        institutionId,
        requiredText(body.title ?? "在地小農永續採購", "採購名稱", 160),
        requiredText(body.category ?? "農產箱", "採購品類", 100),
        integer(body.quantity, "採購數量", { min: 1, max: 1_000_000, fallback: 1 }),
        integer(body.budgetPoints, "採購預算", { min: 1, max: 100_000_000, fallback: 1000 }),
        requiredText(body.deliveryRegion ?? "台北市", "配送地區", 100),
      ).run();
      return { ok: true, id: requestId };
    }
    case "submit_evidence": {
      const projectId = body.projectId ? String(body.projectId) : null;
      const productId = body.productId ? String(body.productId) : null;
      if (projectId && !await queryOne(db, "SELECT id FROM projects WHERE id = ? AND farmer_id = ?", projectId, farmerId)) throw new Error("找不到您的改善專案");
      if (productId && !await queryOne(db, "SELECT id FROM products WHERE id = ? AND farmer_id = ?", productId, farmerId)) throw new Error("找不到您的商品");
      await db.prepare("INSERT INTO evidence (farmer_id, project_id, product_id, title, evidence_type) VALUES (?, ?, ?, ?, ?)").bind(farmerId, projectId, productId, requiredText(body.title ?? "永續生產證明", "證明名稱", 160), requiredText(body.evidenceType ?? "產銷履歷", "證明類型", 80)).run();
      return { ok: true };
    }
    case "submit_outcome": {
      const projectId = String(body.projectId ?? "");
      const project = await queryOne<{ farmer_id: string; status: string }>(db, "SELECT farmer_id, status FROM projects WHERE id = ? AND farmer_id = ?", projectId, farmerId);
      if (!project) throw new Error("找不到您的改善專案，無法提交成果");
      if (project.status === "completed") throw new Error("此專案已完成查核，不可重複送出成果");
      if (await queryOne(db, "SELECT id FROM outcome_reports WHERE project_id = ? AND farmer_id = ? AND status = 'submitted'", projectId, farmerId)) return { ok: true, duplicate: true, status: "review" };
      const waterLiters = body.waterLiters == null ? null : integer(body.waterLiters, "節水量", { min: 0, max: 1_000_000_000 });
      const carbonKg = body.carbonKg == null ? null : integer(body.carbonKg, "減碳量", { min: 0, max: 100_000_000 });
      const beneficiaries = body.beneficiaries == null ? null : integer(body.beneficiaries, "受益人數", { min: 0, max: 10_000_000 });
      await db.prepare("INSERT INTO outcome_reports (institution_id, project_id, farmer_id, water_liters, carbon_kg, beneficiaries, note) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(INSTITUTION_ID, projectId, project.farmer_id, waterLiters, carbonKg, beneficiaries, requiredText(body.note ?? "已完成改善並提交成果紀錄", "成果說明", 2000)).run();
      await db.prepare("UPDATE projects SET status = 'review' WHERE id = ?").bind(projectId).run();
      return { ok: true, status: "review" };
    }
    case "verify_outcome": {
      const reportId = number(body.reportId);
      const report = await queryOne<{ project_id: string; status: string; institution_id: string }>(db, "SELECT project_id, status, institution_id FROM outcome_reports WHERE id = ?", reportId);
      if (!report) throw new Error("找不到成果回報");
      if (!isAdmin && report.institution_id !== institutionId) throw new Error("您沒有權限審核其他機構的成果報告");
      if (report.status === "verified") return { ok: true, duplicate: true, status: "verified" };
      if (report.status !== "submitted") throw new Error("此成果回報目前不可核准");
      await db.batch([
        db.prepare("UPDATE outcome_reports SET status = 'verified', verified_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'submitted'").bind(reportId),
        db.prepare("UPDATE projects SET status = 'completed', progress = 100 WHERE id = ?").bind(report.project_id),
      ]);
      return { ok: true, status: "verified" };
    }
    case "redeem_resource": {
      const offerId = String(body.offerId ?? "");
      const offer = await queryOne<{ required_points: number; name: string; institution_id: string }>(db, "SELECT required_points, name, institution_id FROM resource_offers WHERE id = ?", offerId);
      if (!offer) throw new Error("找不到農業資源");
      const cooperative = String(body.cooperative ?? "").trim();
      const contactName = String(body.contactName ?? "").trim();
      const contactPhone = String(body.contactPhone ?? "").trim();
      const fulfillmentType = body.fulfillmentType === "delivery" ? "delivery" : "appointment";
      const deliveryAddress = String(body.deliveryAddress ?? "").trim();
      const appointmentDate = String(body.appointmentDate ?? "").trim();
      const appointmentSlot = String(body.appointmentSlot ?? "").trim();
      const note = String(body.note ?? "").trim();
      if (!cooperative || !contactName || !contactPhone) throw new Error("請完整填寫農會、聯絡人與電話");
      if (!/^[0-9+()\-\s]{8,20}$/.test(contactPhone)) throw new Error("請填寫有效的聯絡電話");
      if (fulfillmentType === "delivery" && !deliveryAddress) throw new Error("請填寫資源配送地址");
      if (fulfillmentType === "appointment" && (!appointmentDate || !appointmentSlot)) throw new Error("請選擇預約日期與時段");
      const current = await balance(db, farmerId);
      if (current < offer.required_points) throw new Error(`綠點不足，還差 ${offer.required_points - current} 點`);
      const redemptionId = `GFES-RES-${crypto.randomUUID()}`;
      await db.batch([
        db.prepare("INSERT INTO resource_redemptions (id, institution_id, farmer_id, offer_id, resource_name, points, cooperative, contact_name, contact_phone, fulfillment_type, delivery_address, appointment_date, appointment_slot, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(redemptionId, offer.institution_id, farmerId, offerId, offer.name, offer.required_points, cooperative, contactName, contactPhone, fulfillmentType, deliveryAddress, appointmentDate, appointmentSlot, note),
        db.prepare("INSERT INTO point_ledger (user_id, delta_points, source_type, source_id, description) VALUES (?, ?, ?, ?, ?)").bind(farmerId, -offer.required_points, "resource_redeem", redemptionId, `農會資源兌換：${offer.name}`),
      ]);
      return { ok: true, redemptionId };
    }
    case "advance_resource_redemption": {
      const redemptionId = String(body.redemptionId ?? "").trim();
      const redemption = await queryOne<{ stage: number; fulfillment_type: string; institution_id: string }>(db, "SELECT stage, fulfillment_type, institution_id FROM resource_redemptions WHERE id = ?", redemptionId);
      if (!redemption) throw new Error("找不到資源兌換紀錄");
      if (!isAdmin && redemption.institution_id !== institutionId) throw new Error("您沒有權限更新其他機構的履約進度");
      const nextStage = Math.min(3, Number(redemption.stage) + 1);
      const status = nextStage === 3 ? "completed" : nextStage === 2 ? (redemption.fulfillment_type === "delivery" ? "shipping" : "scheduled") : nextStage === 1 ? "confirmed" : "submitted";
      const trackingNumber = nextStage >= 2 && redemption.fulfillment_type === "delivery" ? `COOP-${Date.now().toString().slice(-8)}` : "";
      await db.prepare("UPDATE resource_redemptions SET stage = ?, status = ?, tracking_number = CASE WHEN ? != '' THEN ? ELSE tracking_number END, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(nextStage, status, trackingNumber, trackingNumber, redemptionId).run();
      return { ok: true, stage: nextStage };
    }
    case "request_resource_change": {
      const redemptionId = String(body.redemptionId ?? "").trim();
      const redemption = await queryOne<{ id: string; stage: number }>(db, "SELECT id, stage FROM resource_redemptions WHERE id = ? AND farmer_id = ?", redemptionId, farmerId);
      if (!redemption) throw new Error("找不到您的農會資源兌換紀錄");
      if (Number(redemption.stage) >= 2) throw new Error("資源已進入配送或排程階段，請直接聯絡承辦農會");
      if (await queryOne(db, "SELECT id FROM change_requests WHERE request_type = 'resource' AND target_id = ? AND status = 'pending'", redemptionId)) throw new Error("此兌換已有待處理的修改申請");
      const fulfillmentType = body.fulfillmentType === "appointment" ? "appointment" : "delivery";
      const requested = {
        cooperative: requiredText(body.cooperative, "承辦農會", 120),
        contactName: requiredText(body.contactName, "聯絡人", 80),
        contactPhone: requiredText(body.contactPhone, "聯絡電話", 30),
        fulfillmentType,
        deliveryAddress: fulfillmentType === "delivery" ? requiredText(body.deliveryAddress, "配送地址", 200) : "",
        appointmentDate: fulfillmentType === "appointment" ? requiredText(body.appointmentDate, "預約日期", 20) : "",
        appointmentSlot: fulfillmentType === "appointment" ? requiredText(body.appointmentSlot, "預約時段", 50) : "",
        note: String(body.note ?? "").trim().slice(0, 500),
      };
      if (!/^[0-9+()\-\s]{8,20}$/.test(requested.contactPhone)) throw new Error("請輸入有效的聯絡電話");
      const reasonCode = ["input_error", "accidental_redemption", "delivery_change", "schedule_change", "other"].includes(String(body.reasonCode)) ? String(body.reasonCode) : "input_error";
      const requestId = `GFES-CHG-${crypto.randomUUID()}`;
      await db.prepare("INSERT INTO change_requests (id, request_type, target_id, requester_id, reason_code, reason_detail, requested_json) VALUES (?, 'resource', ?, ?, ?, ?, ?)").bind(requestId, redemptionId, farmerId, reasonCode, String(body.reasonDetail ?? "").trim().slice(0, 500), json(requested)).run();
      return { ok: true, requestId };
    }
    case "review_resource_change": {
      const requestId = String(body.requestId ?? "").trim();
      const decision = body.decision === "approved" ? "approved" : body.decision === "rejected" ? "rejected" : "";
      if (!decision) throw new Error("請選擇核准或退回");
      const request = await queryOne<Record<string, unknown>>(db, `SELECT cr.*, rr.stage, rr.institution_id FROM change_requests cr JOIN resource_redemptions rr ON rr.id = cr.target_id WHERE cr.id = ? AND cr.request_type = 'resource'`, requestId);
      if (!request || request.status !== "pending") throw new Error("找不到待處理的資源兌換修改申請");
      if (!isAdmin && request.institution_id !== institutionId) throw new Error("您沒有權限審核其他機構的修改申請");
      if (decision === "approved" && Number(request.stage) >= 2) throw new Error("資源已進入配送或排程階段，無法套用修改");
      const reviewNote = String(body.reviewNote ?? "").trim().slice(0, 500);
      const statements = [db.prepare("UPDATE change_requests SET status = ?, reviewer_id = ?, review_note = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'pending'").bind(decision, institutionId, reviewNote, requestId)];
      if (decision === "approved") {
        const value = parse<Record<string, string>>(String(request.requested_json), {});
        statements.unshift(db.prepare("UPDATE resource_redemptions SET cooperative = ?, contact_name = ?, contact_phone = ?, fulfillment_type = ?, delivery_address = ?, appointment_date = ?, appointment_slot = ?, note = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND stage < 2").bind(value.cooperative, value.contactName, value.contactPhone, value.fulfillmentType, value.deliveryAddress, value.appointmentDate, value.appointmentSlot, value.note, request.target_id));
      }
      await db.batch(statements);
      return { ok: true, status: decision };
    }
    default:
      throw new Error("不支援的後端操作");
  }
}

export async function getPlatformSnapshot(db: DbBinding, viewer?: { role: "consumer" | "farmer" | "institution" | "admin"; profileId: string }) {
  const consumerId = viewer?.role === "consumer" ? viewer.profileId : viewer ? "__no_consumer__" : CONSUMER_ID;
  const farmerId = viewer?.role === "farmer" ? viewer.profileId : viewer ? "__no_farmer__" : FARMER_ID;
  const institutionId = viewer?.role === "institution" ? viewer.profileId : viewer ? "__no_institution__" : INSTITUTION_ID;
  const consumer = await queryOne<{ id: string; display_name: string; city: string; district: string }>(db, "SELECT id, display_name, city, district FROM profiles WHERE id = ?", consumerId);
  const farmer = await queryOne<{ id: string; display_name: string; city: string; district: string }>(db, "SELECT id, display_name, city, district FROM profiles WHERE id = ?", farmerId);
  const institution = await queryOne<{ id: string; display_name: string; city: string; district: string }>(db, "SELECT id, display_name, city, district FROM profiles WHERE id = ?", institutionId);
  const consumerSettingsRow = await queryOne<Record<string, unknown>>(db, `SELECT cs.*, ac.email AS auth_email
    FROM profiles p
    LEFT JOIN consumer_settings cs ON cs.consumer_id = p.id
    LEFT JOIN account_controls ac ON ac.profile_id = p.id
    WHERE p.id = ?`, consumerId);
  const productsRows = viewer?.role === "farmer"
    ? await queryAll<Record<string, unknown>>(db, "SELECT p.*, f.display_name AS farmer_name FROM products p JOIN profiles f ON f.id = p.farmer_id WHERE p.farmer_id = ? ORDER BY p.created_at DESC, p.id", farmerId)
    : viewer?.role === "institution"
      ? []
      : await queryAll<Record<string, unknown>>(db, "SELECT p.*, f.display_name AS farmer_name FROM products p JOIN profiles f ON f.id = p.farmer_id WHERE p.status = 'active' ORDER BY p.created_at DESC, p.id");
  const projectRows = viewer?.role === "farmer"
    ? await queryAll<Record<string, unknown>>(db, "SELECT * FROM projects WHERE farmer_id = ? ORDER BY distance_km ASC, created_at DESC", farmerId)
    : viewer?.role === "institution"
      ? await queryAll<Record<string, unknown>>(db, "SELECT * FROM projects WHERE id IN (SELECT project_id FROM outcome_reports WHERE institution_id = ?) ORDER BY distance_km ASC, created_at DESC", institutionId)
      : await queryAll<Record<string, unknown>>(db, "SELECT * FROM projects ORDER BY distance_km ASC, created_at DESC");
  const orderBase = "SELECT o.*, p.title, p.image, p.description, p.farmer_id, f.display_name AS farmer_name FROM orders o JOIN products p ON p.id = o.product_id JOIN profiles f ON f.id = p.farmer_id";
  const orderRows = viewer?.role === "consumer"
    ? await queryAll<Record<string, unknown>>(db, `${orderBase} WHERE o.consumer_id = ? ORDER BY o.created_at DESC, o.id`, consumerId)
    : viewer?.role === "farmer"
      ? await queryAll<Record<string, unknown>>(db, `${orderBase} WHERE p.farmer_id = ? ORDER BY o.created_at DESC, o.id`, farmerId)
      : viewer?.role === "admin" || !viewer
        ? await queryAll<Record<string, unknown>>(db, `${orderBase} ORDER BY o.created_at DESC, o.id`)
        : [];
  const ledgerRows = await queryAll<Record<string, unknown>>(db, "SELECT * FROM point_ledger WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 80", consumerId);
  const supportRows = await queryAll<{ project_id: string }>(db, "SELECT project_id FROM project_supports WHERE consumer_id = ?", consumerId);
  const incentiveRows = await queryAll<Record<string, unknown>>(db, "SELECT * FROM incentive_programs ORDER BY created_at DESC, id");
  const resourceRows = await queryAll<Record<string, unknown>>(db, "SELECT * FROM resource_offers WHERE status = 'available' ORDER BY required_points");
  const resourceRedemptionRows = viewer?.role === "farmer"
    ? await queryAll<Record<string, unknown>>(db, "SELECT * FROM resource_redemptions WHERE farmer_id = ? ORDER BY created_at DESC, id DESC", farmerId)
    : viewer?.role === "institution"
      ? await queryAll<Record<string, unknown>>(db, "SELECT * FROM resource_redemptions WHERE institution_id = ? ORDER BY created_at DESC, id DESC", institutionId)
      : viewer?.role === "admin" || !viewer
        ? await queryAll<Record<string, unknown>>(db, "SELECT * FROM resource_redemptions ORDER BY created_at DESC, id DESC")
        : [];
  const changeRequestRows = await queryAll<Record<string, unknown>>(db, `SELECT cr.*, p.farmer_id AS order_owner_id, rr.farmer_id AS resource_owner_id, rr.institution_id AS resource_institution_id
    FROM change_requests cr
    LEFT JOIN orders o ON cr.request_type = 'order' AND o.id = cr.target_id
    LEFT JOIN products p ON p.id = o.product_id
    LEFT JOIN resource_redemptions rr ON cr.request_type = 'resource' AND rr.id = cr.target_id
    ORDER BY cr.created_at DESC, cr.id DESC`);
  const actionRows = await queryAll<Record<string, unknown>>(db, "SELECT * FROM local_actions WHERE status = 'open' ORDER BY distance_km");
  const merchantRows = await queryAll<Record<string, unknown>>(db, "SELECT * FROM merchant_offers WHERE status = 'active' ORDER BY distance_km");
  const registrationRows = await queryAll<{ action_id: string }>(db, "SELECT action_id FROM local_action_registrations WHERE consumer_id = ? AND status = 'registered' AND attendee_name <> ''", consumerId);
  const farmerRows = await queryAll<Record<string, unknown>>(db, "SELECT id, display_name, city, district FROM profiles WHERE role = 'farmer' ORDER BY display_name");
  const farmerStoryRow = await queryOne<Record<string, unknown>>(db, "SELECT fs.*, p.display_name AS farmer_name, p.city, p.district FROM farmer_stories fs JOIN profiles p ON p.id = fs.farmer_id WHERE fs.farmer_id = ?", farmerId);
  const farmerNewsRows = await queryAll<Record<string, unknown>>(db, "SELECT fn.*, p.display_name AS farmer_name, p.city, p.district FROM farmer_news fn JOIN profiles p ON p.id = fn.farmer_id WHERE fn.farmer_id = ? ORDER BY fn.updated_at DESC, fn.created_at DESC", farmerId);
  const consumerNewsRows = await queryAll<Record<string, unknown>>(db, `SELECT fn.*, p.display_name AS farmer_name, p.city, p.district
    FROM farmer_news fn JOIN profiles p ON p.id = fn.farmer_id
    WHERE fn.status = 'published' AND fn.farmer_id IN (
      SELECT product.farmer_id FROM orders consumer_order JOIN products product ON product.id = consumer_order.product_id WHERE consumer_order.consumer_id = ?
      UNION
      SELECT project.farmer_id FROM project_supports support JOIN projects project ON project.id = support.project_id WHERE support.consumer_id = ?
    )
    ORDER BY fn.published_at DESC, fn.updated_at DESC LIMIT 20`, consumerId, consumerId);
  const evidenceRows = viewer?.role === "farmer"
    ? await queryAll<Record<string, unknown>>(db, "SELECT * FROM evidence WHERE farmer_id = ? ORDER BY submitted_at DESC, id DESC", farmerId)
    : viewer?.role === "admin" || !viewer
      ? await queryAll<Record<string, unknown>>(db, "SELECT * FROM evidence ORDER BY submitted_at DESC, id DESC")
      : [];
  const outcomeRows = viewer?.role === "farmer"
    ? await queryAll<Record<string, unknown>>(db, "SELECT * FROM outcome_reports WHERE farmer_id = ? ORDER BY submitted_at DESC, id DESC", farmerId)
    : viewer?.role === "institution"
      ? await queryAll<Record<string, unknown>>(db, "SELECT * FROM outcome_reports WHERE institution_id = ? ORDER BY submitted_at DESC, id DESC", institutionId)
      : viewer?.role === "admin" || !viewer
        ? await queryAll<Record<string, unknown>>(db, "SELECT * FROM outcome_reports ORDER BY submitted_at DESC, id DESC")
        : [];
  const procurementRows = viewer?.role === "institution"
    ? await queryAll<Record<string, unknown>>(db, "SELECT * FROM procurement_requests WHERE institution_id = ? ORDER BY created_at DESC, id DESC", institutionId)
    : [];
  const integrationRows = await queryAll<Record<string, unknown>>(db, "SELECT * FROM integration_settings ORDER BY service_key");
  const verificationRows = await queryAll<Record<string, unknown>>(db, "SELECT * FROM verification_runs ORDER BY created_at DESC, id DESC LIMIT 30");
  const adminAccountRows = await queryAll<Record<string, unknown>>(db, `SELECT p.id, p.role, p.display_name, p.city, p.district, p.created_at,
    COALESCE(ac.email, p.id || '@gfes.tw') AS email,
    COALESCE(ac.username, '') AS username,
    COALESCE(ac.account_kind, 'test') AS account_kind,
    COALESCE(ac.status, 'active') AS account_status,
    COALESCE((SELECT SUM(pl.delta_points) FROM point_ledger pl WHERE pl.user_id = p.id), 0) AS point_balance
    FROM profiles p LEFT JOIN account_controls ac ON ac.profile_id = p.id
    ORDER BY CASE p.role WHEN 'consumer' THEN 1 WHEN 'farmer' THEN 2 ELSE 3 END, p.created_at`);
  const adminProductRows = await queryAll<Record<string, unknown>>(db, "SELECT p.id, p.title, p.points, p.stock, p.status, p.farmer_id, f.display_name AS farmer_name FROM products p JOIN profiles f ON f.id = p.farmer_id ORDER BY p.created_at DESC, p.id");
  const adminProcurementRows = await queryAll<Record<string, unknown>>(db, "SELECT pr.*, p.display_name AS institution_name FROM procurement_requests pr JOIN profiles p ON p.id = pr.institution_id ORDER BY pr.created_at DESC, pr.id DESC");
  const parameterRows = await queryAll<Record<string, unknown>>(db, "SELECT * FROM system_parameters ORDER BY parameter_key");
  const auditRows = await queryAll<Record<string, unknown>>(db, "SELECT * FROM admin_audit_logs ORDER BY created_at DESC, id DESC LIMIT 60");
  const dataTemplateRows = await queryAll<Record<string, unknown>>(db, "SELECT * FROM data_templates ORDER BY CASE target_role WHEN 'consumer' THEN 1 WHEN 'farmer' THEN 2 ELSE 3 END, display_name");
  const actionSubmissionRows = await queryAll<Record<string, unknown>>(db, "SELECT * FROM action_submissions ORDER BY submitted_at DESC, id DESC");

  const productToProject = (row: Record<string, unknown>) => ({
    id: row.id,
    farmerId: row.farmer_id,
    kind: "redeem" as const,
    image: row.image,
    title: `${row.farmer_name ?? farmer?.display_name ?? "合作小農"}｜${row.title}`,
    farmer: row.farmer_name ?? farmer?.display_name ?? "合作小農",
    note: row.description,
    purpose: row.delivery,
    points: Number(row.points),
    progress: 100,
    impact: "形成可追蹤的在地訂單",
    city: row.city,
    district: row.district,
    distance: Number(row.distance_km),
    proof: row.proof,
  });
  const productToFarmer = (row: Record<string, unknown>) => ({
    id: row.id,
    farmerId: row.farmer_id,
    title: row.title,
    points: Number(row.points),
    stock: Number(row.stock),
    unit: row.unit,
    proof: row.proof,
    delivery: row.delivery,
    description: row.description,
    image: row.image,
  });
  const projectImageMap: Record<string, string> = {
    water: "/farmer-library/heri-leafy/cultivation-1.webp",
    rice: "/farmer-library/qinggu-rice/cultivation-1.webp",
    "solar-cold": "/farmer-library/shanli-pomelo/cultivation-1.webp",
    "circular-pack": "/farmer-library/nuantian-tomato/cultivation-1.webp",
    pollinator: "/farmer-library/xipan-herb/cultivation-1.webp",
  };
  const projectToLocal = (row: Record<string, unknown>) => ({
    id: row.id,
    farmerId: row.farmer_id,
    kind: "support" as const,
    image: projectImageMap[String(row.id)] ?? "/farmer-library/heri-leafy/cultivation-1.webp",
    title: row.title,
    farmer: farmerRows.find((item) => item.id === row.farmer_id)?.display_name ?? "合作小農",
    note: row.note,
    purpose: row.purpose,
    points: Number(row.points),
    progress: Number(row.progress),
    impact: row.impact,
    targetPoints: Number(row.target_points),
    raisedPoints: Number(row.raised_points),
    supporters: Number(row.supporters),
    city: row.city,
    district: row.district,
    distance: Number(row.distance_km),
    completionDate: row.completion_date,
    proof: row.proof,
    allocations: parse(row.allocations_json as string, []),
    story: parse(row.story_json as string, {}),
    status: row.status,
  });
  const storyToPublic = (row: Record<string, unknown>) => ({
    farmerId: String(row.farmer_id), farmerName: String(row.farmer_name), city: String(row.city), district: String(row.district),
    headline: String(row.headline), summary: String(row.summary), body: String(row.body), quote: String(row.quote ?? ""),
    image: String(row.image_url ?? ""), imageKey: row.image_key ? String(row.image_key) : "", status: String(row.status),
    updatedAt: String(row.updated_at), publishedAt: row.published_at ? String(row.published_at) : "",
  });
  const newsToPublic = (row: Record<string, unknown>) => ({
    id: String(row.id), farmerId: String(row.farmer_id), farmerName: String(row.farmer_name), city: String(row.city), district: String(row.district),
    title: String(row.title), content: String(row.content), category: String(row.category), image: String(row.image_url ?? ""),
    imageKey: row.image_key ? String(row.image_key) : "", status: String(row.status), createdAt: String(row.created_at),
    updatedAt: String(row.updated_at), publishedAt: row.published_at ? String(row.published_at) : "",
  });

  return {
    version: 1,
    consumer: { id: consumer?.id ?? consumerId, displayName: consumer?.display_name ?? "消費者", city: consumer?.city ?? "台北市", district: consumer?.district ?? "大安區", points: await balance(db, consumerId) },
    consumerSettings: {
      displayName: consumer?.display_name ?? "消費者",
      contactEmail: String(consumerSettingsRow?.contact_email ?? consumerSettingsRow?.auth_email ?? ""),
      phone: String(consumerSettingsRow?.phone ?? (consumerId === CONSUMER_ID ? "0912-345-678" : "")),
      deliveryRecipientName: String(consumerSettingsRow?.delivery_recipient_name ?? consumer?.display_name ?? ""),
      deliveryPhone: String(consumerSettingsRow?.delivery_phone ?? (consumerId === CONSUMER_ID ? "0912-345-678" : "")),
      deliveryPostalCode: String(consumerSettingsRow?.delivery_postal_code ?? (consumerId === CONSUMER_ID ? "106" : "")),
      deliveryCity: String(consumerSettingsRow?.delivery_city ?? consumer?.city ?? ""),
      deliveryDistrict: String(consumerSettingsRow?.delivery_district ?? consumer?.district ?? ""),
      deliveryAddress: String(consumerSettingsRow?.delivery_address ?? (consumerId === CONSUMER_ID ? "仁愛路四段示範地址" : "")),
      deliveryNote: String(consumerSettingsRow?.delivery_note ?? ""),
      residencePostalCode: String(consumerSettingsRow?.residence_postal_code ?? (consumerId === CONSUMER_ID ? "106" : "")),
      residenceCity: String(consumerSettingsRow?.residence_city ?? consumer?.city ?? ""),
      residenceDistrict: String(consumerSettingsRow?.residence_district ?? consumer?.district ?? ""),
      residenceAddress: String(consumerSettingsRow?.residence_address ?? (consumerId === CONSUMER_ID ? "仁愛路四段示範地址" : "")),
      updatedAt: String(consumerSettingsRow?.updated_at ?? ""),
    },
    farmer: { id: farmer?.id ?? farmerId, displayName: farmer?.display_name ?? "合作小農", city: farmer?.city ?? "雲林縣", district: farmer?.district ?? "斗六市", points: await balance(db, farmerId) },
    institution: { id: institution?.id ?? institutionId, displayName: institution?.display_name ?? "合作機構", city: institution?.city ?? "台北市", district: institution?.district ?? "信義區" },
    products: productsRows.map(productToFarmer),
    productsForConsumer: productsRows.map(productToProject),
    projects: projectRows.map(projectToLocal),
    catalog: [...projectRows.map(projectToLocal), ...productsRows.map(productToProject)],
    farmers: farmerRows.map((row) => ({ id: row.id, name: row.display_name, area: row.city, district: row.district })),
    farmerStory: farmerStoryRow ? storyToPublic(farmerStoryRow) : null,
    farmerNews: farmerNewsRows.map(newsToPublic),
    consumerNews: consumerNewsRows.map(newsToPublic),
    incentives: incentiveRows.map((row) => ({ id: row.id, institutionId: row.institution_id, name: row.name, sponsor: row.sponsor, action: row.action, reward: row.reward, budgetPoints: Number(row.budget_points), participants: row.participants, progress: Number(row.progress), esg: row.esg })),
    resources: resourceRows.map((row) => ({ id: row.id, category: row.category, name: row.name, requiredScore: Number(row.required_points), amount: `${Number(row.required_points).toLocaleString()} 綠點`, term: row.term, rate: row.rate, description: row.description, purpose: row.purpose })),
    resourceRedemptions: resourceRedemptionRows.map((row) => ({ id: row.id, institutionId: row.institution_id, farmerId: row.farmer_id, offerId: row.offer_id, resourceName: row.resource_name, points: Number(row.points), cooperative: row.cooperative, contactName: row.contact_name, contactPhone: row.contact_phone, fulfillmentType: row.fulfillment_type, deliveryAddress: row.delivery_address, appointmentDate: row.appointment_date, appointmentSlot: row.appointment_slot, note: row.note, stage: Number(row.stage), status: row.status, trackingNumber: row.tracking_number, createdAt: row.created_at, updatedAt: row.updated_at })),
    changeRequests: changeRequestRows.map((row) => ({ id: row.id, requestType: row.request_type, targetId: row.target_id, requesterId: row.requester_id, ownerId: row.request_type === "order" ? row.order_owner_id : row.resource_owner_id, institutionId: row.resource_institution_id, reasonCode: row.reason_code, reasonDetail: row.reason_detail, requested: parse(row.requested_json as string, {}), status: row.status, reviewerId: row.reviewer_id, reviewNote: row.review_note, createdAt: row.created_at, updatedAt: row.updated_at })),
    localActions: actionRows.map((row) => ({ id: row.id, title: row.title, organizer: row.organizer, description: row.description, rewardPoints: Number(row.reward_points), city: row.city, district: row.district, address: row.address, details: row.details, eventStart: row.event_start, eventEnd: row.event_end, distance: Number(row.distance_km) })),
    merchantOffers: merchantRows.map((row) => ({ id: row.id, merchant: row.merchant, title: row.title, description: row.description, requiredPoints: Number(row.required_points), city: row.city, district: row.district, address: row.address, details: row.details, distance: Number(row.distance_km) })),
    registeredActionIds: registrationRows.map((row) => row.action_id),
    orders: orderRows.map((row) => ({ id: row.id, productId: row.product_id, farmerId: row.farmer_id, title: row.title, image: row.image, farmer: row.farmer_name, points: Number(row.points), quantity: Number(row.quantity), stage: Number(row.stage), status: row.status, recipientName: row.recipient_name || "林子晴", recipientPhone: row.recipient_phone || "0912-345-678", postalCode: row.postal_code || "106", shippingCity: row.shipping_city, shippingDistrict: row.shipping_district, shippingAddress: row.shipping_address || "仁愛路四段示範地址", deliveryNote: row.delivery_note || "請於送達前電話聯絡", carrier: row.carrier || "", trackingNumber: row.tracking_number || "", fulfillmentNote: row.fulfillment_note || "", packedAt: row.packed_at || "", shippedAt: row.shipped_at || "", completedAt: row.completed_at || "", createdAt: row.created_at, updatedAt: row.updated_at || row.created_at })),
    ledger: ledgerRows.map((row) => ({ id: Number(row.id), deltaPoints: Number(row.delta_points), sourceType: row.source_type, sourceId: row.source_id, description: row.description, createdAt: row.created_at })),
    supportedProjectIds: supportRows.map((row) => row.project_id),
    redeemedProductIds: orderRows.map((row) => row.product_id),
    evidence: evidenceRows.map((row) => ({ id: Number(row.id), title: row.title, evidenceType: row.evidence_type, fileName: row.file_name, contentType: row.content_type, fileSize: row.file_size == null ? null : Number(row.file_size), status: row.status, projectId: row.project_id, productId: row.product_id, submittedAt: row.submitted_at })),
    outcomeReports: outcomeRows.map((row) => ({ id: Number(row.id), institutionId: row.institution_id, projectId: row.project_id, waterLiters: row.water_liters, carbonKg: row.carbon_kg, beneficiaries: row.beneficiaries, note: row.note, status: row.status, submittedAt: row.submitted_at })),
    procurements: procurementRows.map((row) => ({ id: row.id, title: row.title, category: row.category, quantity: Number(row.quantity), budgetPoints: Number(row.budget_points), deliveryRegion: row.delivery_region, status: row.status, createdAt: row.created_at })),
    integrationSettings: integrationRows.map((row) => ({ serviceKey: row.service_key, displayName: row.display_name, mode: row.mode, enabled: Boolean(row.enabled), rewardPoints: Number(row.reward_points), endpointLabel: row.endpoint_label, sampleResponse: parse(row.sample_response_json as string, {}), updatedAt: row.updated_at })),
    verificationRuns: verificationRows.map((row) => ({ id: row.id, serviceKey: row.service_key, input: parse(row.input_json as string, {}), response: parse(row.response_json as string, {}), status: row.status, rewardPoints: Number(row.reward_points), createdAt: row.created_at })),
    actionSubmissions: actionSubmissionRows.filter((row) => row.consumer_id === consumerId).map((row) => ({ id: row.id, consumerId: row.consumer_id, actionType: row.action_type, title: row.title, note: row.note, rewardPoints: Number(row.reward_points), fileName: row.file_name, contentType: row.content_type, fileSize: Number(row.file_size), status: row.status, reviewNote: row.review_note, proofViewedAt: row.proof_viewed_at, submittedAt: row.submitted_at, reviewedAt: row.reviewed_at })),
    admin: {
      summary: {
        totalAccounts: adminAccountRows.length,
        activeAccounts: adminAccountRows.filter((row) => row.account_status === "active").length,
        totalPoints: adminAccountRows.reduce((sum, row) => sum + Number(row.point_balance), 0),
        activeProducts: adminProductRows.filter((row) => row.status === "active").length,
        fundingProjects: projectRows.filter((row) => row.status === "funding").length,
        pendingReviews: adminAccountRows.filter((row) => row.account_kind === "real" && row.account_status === "pending").length + evidenceRows.filter((row) => row.status === "submitted").length + outcomeRows.filter((row) => row.status === "submitted").length + actionSubmissionRows.filter((row) => row.status === "pending").length,
      },
      accounts: adminAccountRows.map((row) => ({ id: row.id, role: row.role, displayName: row.display_name, email: row.email, username: row.username, accountKind: row.account_kind === "real" ? "real" : "test", status: row.account_status, city: row.city, district: row.district, points: Number(row.point_balance), createdAt: row.created_at })),
      products: adminProductRows.map((row) => ({ id: row.id, title: row.title, farmerId: row.farmer_id, farmerName: row.farmer_name, points: Number(row.points), stock: Number(row.stock), status: row.status })),
      projects: projectRows.map((row) => ({ id: row.id, title: row.title, points: Number(row.points), targetPoints: Number(row.target_points), raisedPoints: Number(row.raised_points), supporters: Number(row.supporters), progress: Number(row.progress), status: row.status })),
      incentives: incentiveRows.map((row) => ({ id: row.id, name: row.name, sponsor: row.sponsor, budgetPoints: Number(row.budget_points), progress: Number(row.progress) })),
      procurements: adminProcurementRows.map((row) => ({ id: row.id, institutionId: row.institution_id, institutionName: row.institution_name, title: row.title, category: row.category, quantity: Number(row.quantity), budgetPoints: Number(row.budget_points), deliveryRegion: row.delivery_region, status: row.status, createdAt: row.created_at })),
      parameters: parameterRows.map((row) => ({ parameterKey: row.parameter_key, displayName: row.display_name, value: row.value, unit: row.unit, description: row.description, updatedAt: row.updated_at })),
      dataTemplates: dataTemplateRows.map((row) => ({ templateKey: row.template_key, displayName: row.display_name, targetRole: row.target_role, uploadArea: row.upload_area, documentType: row.document_type, fileName: row.file_name, schemaVersion: row.schema_version, description: row.description, sampleData: parse(row.sample_data_json as string, {}), updatedAt: row.updated_at })),
      actionSubmissions: actionSubmissionRows.map((row) => ({ id: row.id, consumerId: row.consumer_id, actionType: row.action_type, title: row.title, note: row.note, rewardPoints: Number(row.reward_points), fileName: row.file_name, contentType: row.content_type, fileSize: Number(row.file_size), status: row.status, reviewNote: row.review_note, proofViewedAt: row.proof_viewed_at, submittedAt: row.submitted_at, reviewedAt: row.reviewed_at })),
      auditLogs: auditRows.map((row) => ({ id: Number(row.id), action: row.action, targetType: row.target_type, targetId: row.target_id, detail: parse(row.detail_json as string, {}), createdAt: row.created_at })),
    },
  };
}

export async function getPublicPlatformContent(db: DbBinding) {
  const storyRows = await queryAll<Record<string, unknown>>(db, `SELECT fs.*, p.display_name AS farmer_name, p.city, p.district
    FROM farmer_stories fs JOIN profiles p ON p.id = fs.farmer_id
    WHERE fs.status = 'published' ORDER BY fs.published_at DESC, fs.updated_at DESC LIMIT 12`);
  const newsRows = await queryAll<Record<string, unknown>>(db, `SELECT fn.*, p.display_name AS farmer_name, p.city, p.district
    FROM farmer_news fn JOIN profiles p ON p.id = fn.farmer_id
    WHERE fn.status = 'published' ORDER BY fn.published_at DESC, fn.updated_at DESC LIMIT 12`);
  return {
    stories: storyRows.map((row) => ({
      farmerId: String(row.farmer_id), farmerName: String(row.farmer_name), city: String(row.city), district: String(row.district),
      headline: String(row.headline), summary: String(row.summary), body: String(row.body), quote: String(row.quote ?? ""),
      image: String(row.image_url ?? ""), imageKey: row.image_key ? String(row.image_key) : "", status: String(row.status),
      updatedAt: String(row.updated_at), publishedAt: row.published_at ? String(row.published_at) : "",
    })),
    news: newsRows.map((row) => ({
      id: String(row.id), farmerId: String(row.farmer_id), farmerName: String(row.farmer_name), city: String(row.city), district: String(row.district),
      title: String(row.title), content: String(row.content), category: String(row.category), image: String(row.image_url ?? ""),
      imageKey: row.image_key ? String(row.image_key) : "", status: String(row.status), createdAt: String(row.created_at),
      updatedAt: String(row.updated_at), publishedAt: row.published_at ? String(row.published_at) : "",
    })),
  };
}

export async function getPlatformDb() {
  const db = await getDb();
  await ensurePlatformSchema(db.$client as unknown as DbBinding);
  return db.$client as unknown as DbBinding;
}
