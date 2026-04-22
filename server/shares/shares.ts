import { randomBytes } from 'node:crypto';
import type { AuthDatabase } from '../auth/db';
import type { Exercise } from '../../src/lib/types/exercise';

export interface ShareRow {
  slug: string;
  owner_id: string;
  exercise_id: string;
  exercise_name: string | null;
  message: string | null;
  created_at: number;
  expires_at: number | null;
}

interface ShareDataRow {
  data: string;
  email: string;
  message: string | null;
  expires_at: number | null;
}

export interface ShareData {
  exercise: Exercise;
  trainerEmail: string;
  message: string | null;
  expiresAt: number | null;
}

function generateSlug(): string {
  return randomBytes(16).toString('base64url');
}

export function createShare(
  db: AuthDatabase,
  opts: { ownerId: string; exerciseId: string; message: string | null; expiresAt: number | null },
): string {
  const slug = generateSlug();
  db.prepare(
    `INSERT INTO exercise_shares (slug, owner_id, exercise_id, message, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(slug, opts.ownerId, opts.exerciseId, opts.message ?? null, Date.now(), opts.expiresAt ?? null);
  return slug;
}

export function getShareData(db: AuthDatabase, slug: string): ShareData | null {
  const now = Date.now();
  const row = db
    .prepare(
      `SELECT se.data, u.email, es.message, es.expires_at
       FROM exercise_shares es
       JOIN sync_exercises se ON se.user_id = es.owner_id AND se.id = es.exercise_id
       JOIN users u ON u.id = es.owner_id
       WHERE es.slug = ?
         AND (es.expires_at IS NULL OR es.expires_at > ?)
         AND se.deleted_at IS NULL`,
    )
    .get(slug, now) as ShareDataRow | undefined;

  if (!row) return null;

  let exercise: Exercise;
  try {
    exercise = JSON.parse(row.data) as Exercise;
  } catch {
    return null;
  }

  return {
    exercise,
    trainerEmail: row.email,
    message: row.message,
    expiresAt: row.expires_at,
  };
}

export function listUserShares(db: AuthDatabase, userId: string): ShareRow[] {
  return db
    .prepare(
      `SELECT es.slug, es.owner_id, es.exercise_id, es.message, es.created_at, es.expires_at,
              JSON_EXTRACT(se.data, '$.name') AS exercise_name
       FROM exercise_shares es
       LEFT JOIN sync_exercises se ON se.user_id = es.owner_id AND se.id = es.exercise_id
       WHERE es.owner_id = ?
       ORDER BY es.created_at DESC`,
    )
    .all(userId) as unknown as ShareRow[];
}

export function deleteShare(db: AuthDatabase, slug: string, requestingUserId: string): boolean {
  const result = db
    .prepare(`DELETE FROM exercise_shares WHERE slug = ? AND owner_id = ?`)
    .run(slug, requestingUserId);
  return Number(result.changes) > 0;
}

export function countActiveShares(db: AuthDatabase, userId: string): number {
  const now = Date.now();
  const row = db
    .prepare(
      `SELECT COUNT(*) AS count FROM exercise_shares
       WHERE owner_id = ? AND (expires_at IS NULL OR expires_at > ?)`,
    )
    .get(userId, now) as { count: number };
  return row.count;
}

export function exerciseExistsInSync(db: AuthDatabase, userId: string, exerciseId: string): boolean {
  const row = db
    .prepare(
      `SELECT 1 FROM sync_exercises WHERE user_id = ? AND id = ? AND deleted_at IS NULL`,
    )
    .get(userId, exerciseId);
  return !!row;
}
