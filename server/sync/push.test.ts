import { describe, expect, it, beforeEach } from 'vitest';
import { openDatabase, resetSingletonForTests, type AuthDatabase } from '../auth/db';
import { applyChanges } from './push';

let db: AuthDatabase;

beforeEach(() => {
  resetSingletonForTests();
  db = openDatabase(':memory:');
  db.prepare('INSERT INTO users (id,email,password_hash,email_verified,created_at,updated_at) VALUES (?,?,?,?,?,?)')
    .run('u1', 'a@b.c', 'h', 1, 1, 1);
});

describe('applyChanges', () => {
  it('accepts new exercise', () => {
    const res = applyChanges(db, 'u1', {
      exercises: [{ id: 'e1', updatedAt: 100, deletedAt: null, data: { name: 'test' } }],
      playlists: [],
      settings: null,
    });
    expect(res.accepted.exercises).toEqual(['e1']);
    expect(res.rejected.exercises).toEqual([]);
    const row = db.prepare('SELECT data FROM sync_exercises WHERE user_id=? AND id=?').get('u1', 'e1') as { data: string };
    expect(JSON.parse(row.data)).toEqual({ name: 'test' });
  });

  it('rejects older updatedAt', () => {
    db.prepare('INSERT INTO sync_exercises VALUES (?,?,?,?,?)').run('u1', 'e1', 200, null, '{"name":"server"}');
    const res = applyChanges(db, 'u1', {
      exercises: [{ id: 'e1', updatedAt: 100, deletedAt: null, data: { name: 'client-old' } }],
      playlists: [],
      settings: null,
    });
    expect(res.rejected.exercises).toEqual(['e1']);
    const row = db.prepare('SELECT data FROM sync_exercises WHERE id=?').get('e1') as { data: string };
    expect(JSON.parse(row.data)).toEqual({ name: 'server' });
  });

  it('accepts equal updatedAt as rejected (server wins tie)', () => {
    db.prepare('INSERT INTO sync_exercises VALUES (?,?,?,?,?)').run('u1', 'e1', 100, null, '{"name":"server"}');
    const res = applyChanges(db, 'u1', {
      exercises: [{ id: 'e1', updatedAt: 100, deletedAt: null, data: { name: 'client' } }],
      playlists: [],
      settings: null,
    });
    expect(res.rejected.exercises).toEqual(['e1']);
  });

  it('upserts settings when newer', () => {
    const res = applyChanges(db, 'u1', {
      exercises: [],
      playlists: [],
      settings: { updatedAt: 500, data: { theme: 'dark' } },
    });
    expect(res.accepted.settings).toBe(true);
    const row = db.prepare('SELECT data FROM sync_settings WHERE user_id=?').get('u1') as { data: string };
    expect(JSON.parse(row.data)).toEqual({ theme: 'dark' });
  });

  it('rejects older settings', () => {
    db.prepare('INSERT INTO sync_settings VALUES (?,?,?)').run('u1', 500, '{"theme":"dark"}');
    const res = applyChanges(db, 'u1', {
      exercises: [],
      playlists: [],
      settings: { updatedAt: 400, data: { theme: 'light' } },
    });
    expect(res.rejected.settings).toBe(true);
  });

  it('accepts soft-delete', () => {
    db.prepare('INSERT INTO sync_exercises VALUES (?,?,?,?,?)').run('u1', 'e1', 100, null, '{}');
    const res = applyChanges(db, 'u1', {
      exercises: [{ id: 'e1', updatedAt: 200, deletedAt: 200, data: {} }],
      playlists: [],
      settings: null,
    });
    expect(res.accepted.exercises).toEqual(['e1']);
    const row = db.prepare('SELECT deleted_at FROM sync_exercises WHERE id=?').get('e1') as { deleted_at: number };
    expect(row.deleted_at).toBe(200);
  });

  it('isolates user (does not affect other users rows)', () => {
    // Use column-named INSERT (safer than positional) — matches Task 3 pattern
    db.prepare('INSERT INTO users (id,email,password_hash,email_verified,created_at,updated_at) VALUES (?,?,?,?,?,?)').run('u2', 'x@y.z', 'h', 1, 1, 1);
    db.prepare('INSERT INTO sync_exercises VALUES (?,?,?,?,?)').run('u2', 'e1', 500, null, '{}');
    const res = applyChanges(db, 'u1', {
      exercises: [{ id: 'e1', updatedAt: 100, deletedAt: null, data: {} }],
      playlists: [],
      settings: null,
    });
    expect(res.accepted.exercises).toEqual(['e1']);
    const u1 = db.prepare('SELECT updated_at FROM sync_exercises WHERE user_id=? AND id=?').get('u1', 'e1') as { updated_at: number };
    const u2 = db.prepare('SELECT updated_at FROM sync_exercises WHERE user_id=? AND id=?').get('u2', 'e1') as { updated_at: number };
    expect(u1.updated_at).toBe(100);
    expect(u2.updated_at).toBe(500);
  });
});
