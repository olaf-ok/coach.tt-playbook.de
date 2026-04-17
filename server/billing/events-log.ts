import type { AuthDatabase } from '../auth/db';

// Returns true if this is the first time we see this event id
// (caller should proceed with handling), false if it's a duplicate
// (caller should skip). Stripe retries webhooks with the same event id.
export function markEventProcessed(
  db: AuthDatabase,
  eventId: string,
  createdAtMs: number,
): boolean {
  const result = db
    .prepare(`INSERT OR IGNORE INTO stripe_events (event_id, created_at) VALUES (?, ?)`)
    .run(eventId, createdAtMs);
  return Number(result.changes) > 0;
}
