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
    emailVerified: row.email_verified === 1,
    proUntil: row.pro_until,
  };
}

export async function createUser(
  db: AuthDatabase,
  email: string,
  passwordHash: string,
): Promise<UserRecord> {
  const id = uuidv7();
  const now = Date.now();
  db.prepare(
    `INSERT INTO users (id, email, password_hash, email_verified, pro_until, created_at, updated_at)
     VALUES (?, ?, ?, 0, NULL, ?, ?)`,
  ).run(id, email, passwordHash, now, now);
  return { id, email, passwordHash, emailVerified: false, proUntil: null };
}

export function findUserByEmail(db: AuthDatabase, email: string): UserRecord | null {
  const row = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email) as Row | undefined;
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
