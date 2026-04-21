import type { AuthDatabase } from '../auth/db';

export function resetUserData(db: AuthDatabase, userId: string): void {
  const now = Date.now();
  db.exec('BEGIN');
  try {
    db.prepare(
      'UPDATE sync_exercises SET deleted_at = ?, updated_at = ? WHERE user_id = ? AND deleted_at IS NULL'
    ).run(now, now, userId);
    db.prepare(
      'UPDATE sync_playlists SET deleted_at = ?, updated_at = ? WHERE user_id = ? AND deleted_at IS NULL'
    ).run(now, now, userId);
    db.prepare('DELETE FROM sync_settings WHERE user_id = ?').run(userId);
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

// Hard-delete everything for an account. Used when the user row itself is
// removed — sync_* tables have no FK cascade, so we purge manually to avoid
// orphaned tombstones.
export function purgeUserSyncData(db: AuthDatabase, userId: string): void {
  db.exec('BEGIN');
  try {
    db.prepare('DELETE FROM sync_exercises WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM sync_playlists WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM sync_settings WHERE user_id = ?').run(userId);
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}
