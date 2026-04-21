import type { AuthDatabase } from '../auth/db';
import type { PushPayload, PushResponse, EntityItem } from './payload';

function applyEntity(
  db: AuthDatabase,
  table: string,
  userId: string,
  item: EntityItem
): 'accepted' | 'rejected' {
  const existing = db
    .prepare(`SELECT updated_at FROM ${table} WHERE user_id=? AND id=?`)
    .get(userId, item.id) as { updated_at: number } | undefined;

  if (existing && existing.updated_at >= item.updatedAt) return 'rejected';

  db.prepare(
    `INSERT INTO ${table} (user_id,id,updated_at,deleted_at,data)
     VALUES (?,?,?,?,?)
     ON CONFLICT(user_id,id) DO UPDATE
       SET updated_at=excluded.updated_at,
           deleted_at=excluded.deleted_at,
           data=excluded.data`
  ).run(userId, item.id, item.updatedAt, item.deletedAt, JSON.stringify(item.data));

  return 'accepted';
}

function applySettings(
  db: AuthDatabase,
  userId: string,
  s: { updatedAt: number; data: Record<string, unknown> }
): 'accepted' | 'rejected' {
  const existing = db
    .prepare('SELECT updated_at FROM sync_settings WHERE user_id=?')
    .get(userId) as { updated_at: number } | undefined;

  if (existing && existing.updated_at >= s.updatedAt) return 'rejected';

  db.prepare(
    `INSERT INTO sync_settings (user_id,updated_at,data) VALUES (?,?,?)
     ON CONFLICT(user_id) DO UPDATE SET updated_at=excluded.updated_at, data=excluded.data`
  ).run(userId, s.updatedAt, JSON.stringify(s.data));

  return 'accepted';
}

export function applyChanges(
  db: AuthDatabase,
  userId: string,
  payload: PushPayload
): PushResponse {
  const result: PushResponse = {
    accepted: { exercises: [], playlists: [], settings: false },
    rejected: { exercises: [], playlists: [], settings: false },
    serverTime: Date.now(),
  };

  db.exec('BEGIN');
  try {
    for (const ex of payload.exercises) {
      result[applyEntity(db, 'sync_exercises', userId, ex)].exercises.push(ex.id);
    }
    for (const pl of payload.playlists) {
      result[applyEntity(db, 'sync_playlists', userId, pl)].playlists.push(pl.id);
    }
    if (payload.settings) {
      const outcome = applySettings(db, userId, payload.settings);
      result[outcome].settings = true;
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  return result;
}
