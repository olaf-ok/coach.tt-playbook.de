import type { AuthDatabase } from './db';
import { generateToken, hashToken } from './tokens';

export const RESET_TTL_MS = 60 * 60 * 1000;

export function createResetToken(db: AuthDatabase, userId: string): string {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = Date.now() + RESET_TTL_MS;
  db.prepare(
    `INSERT INTO reset_tokens (token_hash, user_id, expires_at, used_at) VALUES (?, ?, ?, NULL)`,
  ).run(tokenHash, userId, expiresAt);
  return token;
}

export function consumeResetToken(db: AuthDatabase, token: string): string | null {
  const tokenHash = hashToken(token);
  const row = db
    .prepare(`SELECT user_id, expires_at, used_at FROM reset_tokens WHERE token_hash = ?`)
    .get(tokenHash) as { user_id: string; expires_at: number; used_at: number | null } | undefined;
  if (!row) return null;
  if (row.used_at !== null) return null;
  if (row.expires_at <= Date.now()) return null;
  db.prepare(`UPDATE reset_tokens SET used_at = ? WHERE token_hash = ?`).run(Date.now(), tokenHash);
  return row.user_id;
}
