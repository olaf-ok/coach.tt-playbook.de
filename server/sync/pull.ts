import type { AuthDatabase } from '../auth/db';
import type { PullResponse, EntityItem } from './payload';

interface Row {
  id: string;
  updated_at: number;
  deleted_at: number | null;
  data: string;
}

function loadEntities(db: AuthDatabase, table: string, userId: string, since: number): EntityItem[] {
  const rows = db
    .prepare(
      `SELECT id, updated_at, deleted_at, data FROM ${table}
       WHERE user_id = ? AND updated_at > ? ORDER BY updated_at ASC`
    )
    .all(userId, since) as Row[];

  return rows.map((r) => ({
    id: r.id,
    updatedAt: r.updated_at,
    deletedAt: r.deleted_at,
    data: JSON.parse(r.data),
  }));
}

function loadSettings(db: AuthDatabase, userId: string, since: number) {
  const row = db
    .prepare('SELECT updated_at, data FROM sync_settings WHERE user_id = ? AND updated_at > ?')
    .get(userId, since) as { updated_at: number; data: string } | undefined;

  if (!row) return null;
  return { updatedAt: row.updated_at, data: JSON.parse(row.data) };
}

export function getChangesSince(
  db: AuthDatabase,
  userId: string,
  since = 0
): PullResponse {
  return {
    exercises: loadEntities(db, 'sync_exercises', userId, since),
    playlists: loadEntities(db, 'sync_playlists', userId, since),
    settings: loadSettings(db, userId, since),
    serverTime: Date.now(),
  };
}
