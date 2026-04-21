import { describe, expect, it, beforeEach } from 'vitest';
import { openDatabase, resetSingletonForTests, type AuthDatabase } from '../auth/db';
import { getChangesSince } from './pull';

let db: AuthDatabase;

beforeEach(() => {
  resetSingletonForTests();
  db = openDatabase(':memory:');
  db.prepare('INSERT INTO users (id,email,password_hash,email_verified,created_at,updated_at) VALUES (?,?,?,?,?,?)')
    .run('u1', 'a@b.c', 'h', 1, 1, 1);
  db.prepare('INSERT INTO users (id,email,password_hash,email_verified,created_at,updated_at) VALUES (?,?,?,?,?,?)')
    .run('u2', 'x@y.z', 'h', 1, 1, 1);
});

function insertExercise(userId: string, id: string, updatedAt: number, deletedAt: number | null = null) {
  db.prepare(
    'INSERT INTO sync_exercises (user_id,id,updated_at,deleted_at,data) VALUES (?,?,?,?,?)'
  ).run(userId, id, updatedAt, deletedAt, JSON.stringify({ name: id }));
}

describe('getChangesSince', () => {
  it('returns empty payload for user with no data', () => {
    const result = getChangesSince(db, 'u1');
    expect(result.exercises).toEqual([]);
    expect(result.playlists).toEqual([]);
    expect(result.settings).toBeNull();
    expect(result.serverTime).toBeGreaterThan(0);
  });

  it('returns all entities when since is undefined', () => {
    insertExercise('u1', 'e1', 100);
    insertExercise('u1', 'e2', 200);
    const result = getChangesSince(db, 'u1');
    expect(result.exercises).toHaveLength(2);
  });

  it('filters by since timestamp (exclusive lower bound)', () => {
    insertExercise('u1', 'e1', 100);
    insertExercise('u1', 'e2', 200);
    const result = getChangesSince(db, 'u1', 100);
    expect(result.exercises.map((e) => e.id)).toEqual(['e2']);
  });

  it('includes soft-deleted entities', () => {
    insertExercise('u1', 'e1', 100, 150);
    const result = getChangesSince(db, 'u1');
    expect(result.exercises[0].deletedAt).toBe(150);
  });

  it('isolates by user_id', () => {
    insertExercise('u1', 'e1', 100);
    insertExercise('u2', 'e2', 100);
    const result = getChangesSince(db, 'u1');
    expect(result.exercises).toHaveLength(1);
    expect(result.exercises[0].id).toBe('e1');
  });
});
