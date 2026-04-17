import { v7 as uuidv7 } from 'uuid';
import type { AuthDatabase } from './db';

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  emailVerified: boolean;
  proUntil: number | null;
}

interface Row {
  id: string;
  email: string;
  password_hash: string;
  email_verified: number;
  pro_until: number | null;
}

function rowToUser(row: Row): UserRecord {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    emailVerified: !!row.email_verified,
    proUntil: row.pro_until,
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
  return { id, email: trimmed, passwordHash, emailVerified: false, proUntil: null };
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
  emailVerified: boolean;
  proUntil: number | null;
  createdAt: number;
}

interface SummaryRow {
  id: string;
  email: string;
  email_verified: number;
  pro_until: number | null;
  created_at: number;
}

export function listUsers(db: AuthDatabase): UserSummary[] {
  const rows = db
    .prepare(`SELECT id, email, email_verified, pro_until, created_at FROM users ORDER BY created_at DESC`)
    .all() as unknown as SummaryRow[];
  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    emailVerified: !!r.email_verified,
    proUntil: r.pro_until,
    createdAt: r.created_at,
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
