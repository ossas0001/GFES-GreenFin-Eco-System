-- Local display fixture only. Run via seed-institution-demo-local.sh.
-- Each row is scoped to the built-in test institution account and is explicitly simulated.
INSERT OR IGNORE INTO procurement_requests
  (id, institution_id, title, category, quantity, budget_points, delivery_region, status)
SELECT 'DEMO-PR-001', ac.profile_id, 'DEMO／SIMULATED｜員工友善農產箱', '友善農產箱', 200, 120000, '台北市', 'open'
FROM account_controls ac WHERE ac.profile_id = 'institution-001' AND ac.account_kind = 'test';
INSERT OR IGNORE INTO procurement_requests
  (id, institution_id, title, category, quantity, budget_points, delivery_region, status)
SELECT 'DEMO-PR-002', ac.profile_id, 'DEMO／SIMULATED｜低碳在地米採購', '在地米', 150, 90000, '新北市', 'open'
FROM account_controls ac WHERE ac.profile_id = 'institution-001' AND ac.account_kind = 'test';
INSERT OR IGNORE INTO procurement_requests
  (id, institution_id, title, category, quantity, budget_points, delivery_region, status)
SELECT 'DEMO-PR-003', ac.profile_id, 'DEMO／SIMULATED｜循環蔬果箱', '蔬果箱', 100, 65000, '台北市', 'open'
FROM account_controls ac WHERE ac.profile_id = 'institution-001' AND ac.account_kind = 'test';
INSERT OR IGNORE INTO outcome_reports
  (id, institution_id, project_id, farmer_id, water_liters, carbon_kg, beneficiaries, note, status, verified_at)
SELECT 990001, ac.profile_id, 'water', 'farmer-001', 0, 2400, 200,
  'DEMO／SIMULATED：提案展示用估算減碳量，非實際量測或第三方查證成果', 'verified', CURRENT_TIMESTAMP
FROM account_controls ac WHERE ac.profile_id = 'institution-001' AND ac.account_kind = 'test';
