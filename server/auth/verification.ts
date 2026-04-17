import type { AuthDatabase } from './db';
import { generateToken, hashToken } from './tokens';

export const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

export function createVerificationToken(db: AuthDatabase, userId: string): string {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = Date.now() + VERIFICATION_TTL_MS;
  db.prepare(
    `INSERT INTO verification_tokens (token_hash, user_id, expires_at) VALUES (?, ?, ?)`,
  ).run(tokenHash, userId, expiresAt);
  return token;
}

export function consumeVerificationToken(db: AuthDatabase, token: string): string | null {
  const tokenHash = hashToken(token);
  const row = db
    .prepare(`SELECT user_id, expires_at FROM verification_tokens WHERE token_hash = ?`)
    .get(tokenHash) as { user_id: string; expires_at: number } | undefined;
  if (!row || row.expires_at <= Date.now()) return null;
  db.prepare(`DELETE FROM verification_tokens WHERE token_hash = ?`).run(tokenHash);
  return row.user_id;
}
