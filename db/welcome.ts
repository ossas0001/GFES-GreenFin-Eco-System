export const CONSUMER_WELCOME_POINTS = 500;

export function consumerWelcomeGrant(db: D1Database, profileId: string) {
  return db.prepare(`INSERT OR IGNORE INTO point_ledger
    (user_id, delta_points, source_type, source_id, description)
    VALUES (?, ?, 'platform_reward', ?, '新戶歡迎綠點')`)
    .bind(profileId, CONSUMER_WELCOME_POINTS, `welcome:${profileId}`);
}
