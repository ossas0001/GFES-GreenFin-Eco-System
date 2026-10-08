export const CONSUMER_WELCOME_POINTS = 500;

export function consumerWelcomeGrant(db: D1Database, profileId: string) {
  return db.prepare(`INSERT OR IGNORE INTO point_ledger
    (user_id, delta_points, source_type, source_id, description, metadata_json)
    VALUES (?, ?, 'consumer_welcome', ?, '消費者新戶註冊贈點', ?)`)
    .bind(profileId, CONSUMER_WELCOME_POINTS, `consumer-welcome:${profileId}`, JSON.stringify({ campaign: "NEW_CONSUMER_500", welcomePoints: CONSUMER_WELCOME_POINTS }));
}
