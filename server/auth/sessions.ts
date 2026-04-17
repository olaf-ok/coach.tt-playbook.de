import type { AuthDatabase } from './db';
import { generateToken, hashToken } from './tokens';

export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export interface SessionUser {
  id: string;
  email: string;
  emailVerified: boolean;
  proUntil: number | null;
}

export interface CreateSessionOpts {
  userAgent?: string;
  ip?: string;
}

export function createSession(
  db: AuthDatabase,
  userId: string,
  opts: CreateSessionOpts = {},
): { token: string; expiresAt: number } {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const now = Date.now();
  const expiresAt = now + SESSION_TTL_MS;
  db.prepare(
    `INSERT INTO sessions (token_hash, user_id, created_at, expires_at, user_agent, ip)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(tokenHash, userId, now, expiresAt, opts.userAgent ?? null, opts.ip ?? null);
  return { token, expiresAt };
}

interface SessionRow {
  user_id: string;
  expires_at: number;
}

interface UserRow {
  id: string;
  email: string;
  email_verified: number;
  pro_until: number | null;
}

export function validateAndRefreshSession(db: AuthDatabase, token: string): SessionUser | null {
  const tokenHash = hashToken(token);
  const session = db.prepare(`SELECT user_id, expires_at FROM sessions WHERE token_hash = ?`).get(tokenHash) as
    | SessionRow
    | undefined;
  if (!session) return null;
  if (session.expires_at <= Date.now()) {
    db.prepare(`DELETE FROM sessions WHERE token_hash = ?`).run(tokenHash);
    return null;
  }
  const newExpires = Date.now() + SESSION_TTL_MS;
  db.prepare(`UPDATE sessions SET expires_at = ? WHERE token_hash = ?`).run(newExpires, tokenHash);
  const user = db.prepare(`SELECT id, email, email_verified, pro_until FROM users WHERE id = ?`).get(
    session.user_id,
  ) as UserRow | undefined;
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    emailVerified: user.email_verified === 1,
    proUntil: user.pro_until,
  };
}

export function deleteSession(db: AuthDatabase, token: string): void {
  db.prepare(`DELETE FROM sessions WHERE token_hash = ?`).run(hashToken(token));
}

export function deleteAllUserSessions(db: AuthDatabase, userId: string): void {
  db.prepare(`DELETE FROM sessions WHERE user_id = ?`).run(userId);
}
