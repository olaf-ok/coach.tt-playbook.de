import { v7 as uuidv7 } from 'uuid';
import type { AuthDatabase } from './db';

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  emailVerified: boolean;
  proUntil: number | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripeSubscriptionStatus: string | null;
}

interface Row {
  id: string;
  email: string;
  password_hash: string;
  email_verified: number;
  pro_until: number | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_subscription_status: string | null;
}

function rowToUser(row: Row): UserRecord {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    emailVerified: !!row.email_verified,
    proUntil: row.pro_until,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    stripeSubscriptionStatus: row.stripe_subscription_status,
  };
}

// Defense-in-depth: normalise even if caller forgot. Schema already enforces
// COLLATE NOCASE, but trimming whitespace isn't covered by that.
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function createUser(
  db: AuthDatabase,
  email: string,
  passwordHash: string,
): Promise<UserRecord> {
  const trimmed = email.trim();
  const id = uuidv7();
  const now = Date.now();
  db.prepare(
    `INSERT INTO users (id, email, password_hash, email_verified, pro_until, created_at, updated_at)
     VALUES (?, ?, ?, 0, NULL, ?, ?)`,
  ).run(id, trimmed, passwordHash, now, now);
  return {
    id,
    email: trimmed,
    passwordHash,
    emailVerified: false,
    proUntil: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    stripeSubscriptionStatus: null,
  };
}

export function findUserByEmail(db: AuthDatabase, email: string): UserRecord | null {
  const row = db.prepare(`SELECT * FROM users WHERE email = ?`).get(normalizeEmail(email)) as Row | undefined;
  return row ? rowToUser(row) : null;
}

export function findUserById(db: AuthDatabase, id: string): UserRecord | null {
  const row = db.prepare(`SELECT * FROM users WHERE id = ?`).get(id) as Row | undefined;
  return row ? rowToUser(row) : null;
}

export function markEmailVerified(db: AuthDatabase, userId: string): void {
  db.prepare(`UPDATE users SET email_verified = 1, updated_at = ? WHERE id = ?`).run(Date.now(), userId);
}

export function updatePasswordHash(db: AuthDatabase, userId: string, newHash: string): void {
  db.prepare(`UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?`).run(newHash, Date.now(), userId);
}

export interface UserSummary {
  id: string;
  email: string;
  trainerName: string | null;
  emailVerified: boolean;
  proUntil: number | null;
  createdAt: number;
  stripeSubscriptionStatus: string | null;
}

export interface SyncStats {
  lastSyncAt: number | null;
  storageBytes: number;
}

export function getSyncStats(db: AuthDatabase, userId: string): SyncStats {
  const ex = db
    .prepare(
      `SELECT MAX(updated_at) AS m, COALESCE(SUM(LENGTH(data)), 0) AS s
       FROM sync_exercises WHERE user_id = ? AND deleted_at IS NULL`,
    )
    .get(userId) as unknown as { m: number | null; s: number };
  const pl = db
    .prepare(
      `SELECT MAX(updated_at) AS m, COALESCE(SUM(LENGTH(data)), 0) AS s
       FROM sync_playlists WHERE user_id = ? AND deleted_at IS NULL`,
    )
    .get(userId) as unknown as { m: number | null; s: number };
  const se = db
    .prepare(
      `SELECT updated_at AS m, LENGTH(data) AS s
       FROM sync_settings WHERE user_id = ?`,
    )
    .get(userId) as unknown as { m: number; s: number } | undefined;

  const maxM = Math.max(Number(ex.m ?? 0), Number(pl.m ?? 0), Number(se?.m ?? 0));
  const bytes = Number(ex.s ?? 0) + Number(pl.s ?? 0) + Number(se?.s ?? 0);
  return {
    lastSyncAt: maxM > 0 ? maxM : null,
    storageBytes: bytes,
  };
}

interface SummaryRow {
  id: string;
  email: string;
  trainer_name: string | null;
  email_verified: number;
  pro_until: number | null;
  created_at: number;
  stripe_subscription_status: string | null;
}

export function listUsers(db: AuthDatabase): UserSummary[] {
  const rows = db
    .prepare(
      `SELECT id, email, trainer_name, email_verified, pro_until, created_at, stripe_subscription_status
       FROM users ORDER BY created_at DESC`,
    )
    .all() as unknown as SummaryRow[];
  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    trainerName: r.trainer_name,
    emailVerified: !!r.email_verified,
    proUntil: r.pro_until,
    createdAt: r.created_at,
    stripeSubscriptionStatus: r.stripe_subscription_status,
  }));
}

export function deleteUser(db: AuthDatabase, id: string): void {
  db.prepare(`DELETE FROM users WHERE id = ?`).run(id);
}

export function setProUntil(db: AuthDatabase, id: string, timestamp: number | null): void {
  db.prepare(`UPDATE users SET pro_until = ?, updated_at = ? WHERE id = ?`).run(
    timestamp,
    Date.now(),
    id,
  );
}

export function setStripeCustomerId(db: AuthDatabase, userId: string, customerId: string): void {
  db.prepare(
    `UPDATE users SET stripe_customer_id = ?, updated_at = ? WHERE id = ?`,
  ).run(customerId, Date.now(), userId);
}

export function findUserByStripeCustomerId(
  db: AuthDatabase,
  customerId: string,
): UserRecord | null {
  const row = db
    .prepare(`SELECT * FROM users WHERE stripe_customer_id = ?`)
    .get(customerId) as Row | undefined;
  return row ? rowToUser(row) : null;
}

export interface SubscriptionUpdate {
  subscriptionId: string;
  status: string;
  // null = explicitly leave proUntil unchanged (cancellation case: subscription
  // ends but user keeps Pro until paid period expires).
  proUntil: number | null;
}

export function updateSubscriptionFields(
  db: AuthDatabase,
  userId: string,
  update: SubscriptionUpdate,
): void {
  if (update.proUntil === null) {
    db.prepare(
      `UPDATE users
       SET stripe_subscription_id = ?,
           stripe_subscription_status = ?,
           updated_at = ?
       WHERE id = ?`,
    ).run(update.subscriptionId, update.status, Date.now(), userId);
  } else {
    db.prepare(
      `UPDATE users
       SET stripe_subscription_id = ?,
           stripe_subscription_status = ?,
           pro_until = ?,
           updated_at = ?
       WHERE id = ?`,
    ).run(update.subscriptionId, update.status, update.proUntil, Date.now(), userId);
  }
}
