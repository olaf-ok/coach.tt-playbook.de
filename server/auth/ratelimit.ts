import type { AuthDatabase } from './db';

export type Action =
  | 'login'
  | 'signup'
  | 'reset'
  | 'resendVerification'
  | 'billingCheckout'
  | 'syncPull'
  | 'syncPush'
  | 'syncReset';

interface Limit {
  max: number;
  windowMs: number;
}

export const LIMITS: Record<Action, Limit> = {
  login: { max: 5, windowMs: 15 * 60 * 1000 },
  signup: { max: 3, windowMs: 60 * 60 * 1000 },
  reset: { max: 3, windowMs: 60 * 60 * 1000 },
  resendVerification: { max: 3, windowMs: 60 * 60 * 1000 },
  billingCheckout: { max: 5, windowMs: 60 * 1000 },
  syncPull: { max: 60, windowMs: 60 * 1000 },
  syncPush: { max: 60, windowMs: 60 * 1000 },
  syncReset: { max: 3, windowMs: 60 * 60 * 1000 },
};

interface Row {
  count: number;
  window_end: number;
}

export function checkAndConsume(db: AuthDatabase, action: Action, key: string): boolean {
  const limit = LIMITS[action];
  const compositeKey = `${action}:${key}`;
  const now = Date.now();

  const row = db.prepare(`SELECT count, window_end FROM rate_limits WHERE key = ?`).get(compositeKey) as
    | Row
    | undefined;

  if (!row || row.window_end <= now) {
    db.prepare(
      `INSERT OR REPLACE INTO rate_limits (key, count, window_end) VALUES (?, 1, ?)`,
    ).run(compositeKey, now + limit.windowMs);
    return true;
  }

  if (row.count >= limit.max) return false;

  db.prepare(`UPDATE rate_limits SET count = count + 1 WHERE key = ?`).run(compositeKey);
  return true;
}

// rate_limits grows with every unique (action, key) combination. Call periodically
// to bound the table — safe to run any time since stale rows don't affect live
// counting (checkAndConsume rewrites them via INSERT OR REPLACE on expiry).
export function cleanupExpiredRateLimits(db: AuthDatabase): number {
  const result = db.prepare(`DELETE FROM rate_limits WHERE window_end <= ?`).run(Date.now());
  return Number(result.changes);
}
