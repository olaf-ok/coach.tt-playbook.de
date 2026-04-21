import { describe, expect, it, beforeEach } from 'vitest';
import { openDatabase, resetSingletonForTests, type AuthDatabase } from '../auth/db';
import { purgeUserSyncData, resetUserData } from './reset';

let db: AuthDatabase;

beforeEach(() => {
  resetSingletonForTests();
  db = openDatabase(':memory:');
  for (const id of ['u1', 'u2']) {
    db.prepare('INSERT INTO users (id,email,password_hash,email_verified,created_at,updated_at) VALUES (?,?,?,?,?,?)')
      .run(id, `${id}@x.y`, 'h', 1, 1, 1);
  }
});

describe('resetUserData', () => {
  it('soft-deletes all user entities', () => {
    db.prepare('INSERT INTO sync_exercises VALUES (?,?,?,?,?)').run('u1', 'e1', 100, null, '{}');
    db.prepare('INSERT INTO sync_playlists VALUES (?,?,?,?,?)').run('u1', 'p1', 100, null, '{}');
    db.prepare('INSERT INTO sync_settings VALUES (?,?,?)').run('u1', 100, '{}');

    resetUserData(db, 'u1');

    const ex = db.prepare('SELECT deleted_at FROM sync_exercises WHERE id=?').get('e1') as { deleted_at: number };
    expect(ex.deleted_at).toBeGreaterThan(0);
    const pl = db.prepare('SELECT deleted_at FROM sync_playlists WHERE id=?').get('p1') as { deleted_at: number };
    expect(pl.deleted_at).toBeGreaterThan(0);
    const s = db.prepare('SELECT COUNT(*) AS c FROM sync_settings WHERE user_id=?').get('u1') as { c: number };
    expect(s.c).toBe(0);
  });

  it('does not touch other users data', () => {
    db.prepare('INSERT INTO sync_exercises VALUES (?,?,?,?,?)').run('u1', 'e1', 100, null, '{}');
    db.prepare('INSERT INTO sync_exercises VALUES (?,?,?,?,?)').run('u2', 'e2', 100, null, '{}');
    resetUserData(db, 'u1');
    const u2 = db.prepare('SELECT deleted_at FROM sync_exercises WHERE id=?').get('e2') as { deleted_at: number | null };
    expect(u2.deleted_at).toBeNull();
  });
});

describe('purgeUserSyncData', () => {
  it('hard-deletes all user sync rows across all three tables', () => {
    db.prepare('INSERT INTO sync_exercises VALUES (?,?,?,?,?)').run('u1', 'e1', 100, null, '{}');
    db.prepare('INSERT INTO sync_exercises VALUES (?,?,?,?,?)').run('u1', 'e2', 100, 200, '{}');
    db.prepare('INSERT INTO sync_playlists VALUES (?,?,?,?,?)').run('u1', 'p1', 100, null, '{}');
    db.prepare('INSERT INTO sync_settings VALUES (?,?,?)').run('u1', 100, '{}');

    purgeUserSyncData(db, 'u1');

    const ex = db.prepare('SELECT COUNT(*) AS c FROM sync_exercises WHERE user_id=?').get('u1') as { c: number };
    const pl = db.prepare('SELECT COUNT(*) AS c FROM sync_playlists WHERE user_id=?').get('u1') as { c: number };
    const se = db.prepare('SELECT COUNT(*) AS c FROM sync_settings WHERE user_id=?').get('u1') as { c: number };
    expect(ex.c).toBe(0);
    expect(pl.c).toBe(0);
    expect(se.c).toBe(0);
  });

  it('does not touch other users rows', () => {
    db.prepare('INSERT INTO sync_exercises VALUES (?,?,?,?,?)').run('u1', 'e1', 100, null, '{}');
    db.prepare('INSERT INTO sync_exercises VALUES (?,?,?,?,?)').run('u2', 'e2', 100, null, '{}');

    purgeUserSyncData(db, 'u1');

    const u2 = db.prepare('SELECT COUNT(*) AS c FROM sync_exercises WHERE user_id=?').get('u2') as { c: number };
    expect(u2.c).toBe(1);
  });
});
