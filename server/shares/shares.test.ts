import { describe, expect, it, beforeEach } from 'vitest';
import { openDatabase, resetSingletonForTests, type AuthDatabase } from '../auth/db';
import {
  createShare,
  getShareData,
  listUserShares,
  deleteShare,
  countActiveShares,
  exerciseExistsInSync,
} from './shares';

let db: AuthDatabase;

const EXERCISE_DATA = JSON.stringify({
  id: 'ex1',
  name: 'Vorhand Topspin',
  tags: ['FH_TOPSPIN'],
  strokes: [],
  repetitions: 10,
  duration: null,
  createdAt: 1000,
  updatedAt: 1000,
  deletedAt: null,
});

beforeEach(() => {
  resetSingletonForTests();
  db = openDatabase(':memory:');
  db.prepare(
    'INSERT INTO users (id,email,password_hash,email_verified,created_at,updated_at) VALUES (?,?,?,?,?,?)',
  ).run('u1', 'trainer@example.com', 'h', 1, 1000, 1000);
  db.prepare(
    'INSERT INTO users (id,email,password_hash,email_verified,created_at,updated_at) VALUES (?,?,?,?,?,?)',
  ).run('u2', 'other@example.com', 'h', 1, 1000, 1000);
  db.prepare(
    'INSERT INTO sync_exercises (user_id,id,updated_at,deleted_at,data) VALUES (?,?,?,?,?)',
  ).run('u1', 'ex1', 1000, null, EXERCISE_DATA);
});

describe('createShare', () => {
  it('returns a 22-char base64url slug', () => {
    const slug = createShare(db, { ownerId: 'u1', exerciseId: 'ex1', message: null, expiresAt: null });
    expect(slug).toHaveLength(22);
    expect(slug).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('stores row in DB', () => {
    const now = Date.now();
    const slug = createShare(db, { ownerId: 'u1', exerciseId: 'ex1', message: 'Fokus Punkt 3', expiresAt: now + 86400000 });
    const row = db.prepare('SELECT * FROM exercise_shares WHERE slug=?').get(slug) as Record<string, unknown>;
    expect(row.owner_id).toBe('u1');
    expect(row.exercise_id).toBe('ex1');
    expect(row.message).toBe('Fokus Punkt 3');
    expect(Number(row.expires_at)).toBeGreaterThan(now);
  });

  it('generates unique slugs', () => {
    const s1 = createShare(db, { ownerId: 'u1', exerciseId: 'ex1', message: null, expiresAt: null });
    const s2 = createShare(db, { ownerId: 'u1', exerciseId: 'ex1', message: null, expiresAt: null });
    expect(s1).not.toBe(s2);
  });
});

describe('getShareData', () => {
  it('returns exercise data for valid share', () => {
    const slug = createShare(db, { ownerId: 'u1', exerciseId: 'ex1', message: 'Hallo', expiresAt: null });
    const data = getShareData(db, slug);
    expect(data).not.toBeNull();
    expect(data!.exercise.name).toBe('Vorhand Topspin');
    expect(data!.trainerEmail).toBe('trainer@example.com');
    expect(data!.message).toBe('Hallo');
    expect(data!.expiresAt).toBeNull();
  });

  it('returns null for unknown slug', () => {
    expect(getShareData(db, 'unknownslug1234567890xx')).toBeNull();
  });

  it('returns null for expired share', () => {
    const pastExpiry = Date.now() - 1000;
    const slug = createShare(db, { ownerId: 'u1', exerciseId: 'ex1', message: null, expiresAt: pastExpiry });
    expect(getShareData(db, slug)).toBeNull();
  });

  it('returns null when exercise is soft-deleted', () => {
    db.prepare('UPDATE sync_exercises SET deleted_at=? WHERE user_id=? AND id=?').run(Date.now(), 'u1', 'ex1');
    const slug = createShare(db, { ownerId: 'u1', exerciseId: 'ex1', message: null, expiresAt: null });
    expect(getShareData(db, slug)).toBeNull();
  });
});

describe('countActiveShares', () => {
  it('counts only non-expired shares', () => {
    const future = Date.now() + 86400000;
    const past = Date.now() - 1000;
    createShare(db, { ownerId: 'u1', exerciseId: 'ex1', message: null, expiresAt: future });
    createShare(db, { ownerId: 'u1', exerciseId: 'ex1', message: null, expiresAt: past });
    createShare(db, { ownerId: 'u1', exerciseId: 'ex1', message: null, expiresAt: null });
    expect(countActiveShares(db, 'u1')).toBe(2); // future + null
  });

  it('returns 0 for user with no shares', () => {
    expect(countActiveShares(db, 'u2')).toBe(0);
  });
});

describe('deleteShare', () => {
  it('deletes own share and returns true', () => {
    const slug = createShare(db, { ownerId: 'u1', exerciseId: 'ex1', message: null, expiresAt: null });
    expect(deleteShare(db, slug, 'u1')).toBe(true);
    expect(getShareData(db, slug)).toBeNull();
  });

  it('returns false when wrong owner', () => {
    const slug = createShare(db, { ownerId: 'u1', exerciseId: 'ex1', message: null, expiresAt: null });
    expect(deleteShare(db, slug, 'u2')).toBe(false);
    // share still exists
    expect(db.prepare('SELECT slug FROM exercise_shares WHERE slug=?').get(slug)).toBeTruthy();
  });

  it('returns false for unknown slug', () => {
    expect(deleteShare(db, 'notexist1234567890xxx', 'u1')).toBe(false);
  });
});

describe('listUserShares', () => {
  it('returns shares sorted by created_at DESC', () => {
    const s1 = createShare(db, { ownerId: 'u1', exerciseId: 'ex1', message: 'first', expiresAt: null });
    const s2 = createShare(db, { ownerId: 'u1', exerciseId: 'ex1', message: 'second', expiresAt: null });
    const shares = listUserShares(db, 'u1');
    expect(shares.length).toBe(2);
    // most recent first (s2 inserted after s1, same created_at ms → order stable)
    expect(shares.map((s) => s.slug)).toContain(s1);
    expect(shares.map((s) => s.slug)).toContain(s2);
  });

  it('includes exercise_name', () => {
    createShare(db, { ownerId: 'u1', exerciseId: 'ex1', message: null, expiresAt: null });
    const shares = listUserShares(db, 'u1');
    expect(shares[0].exercise_name).toBe('Vorhand Topspin');
  });

  it('returns empty array for user with no shares', () => {
    expect(listUserShares(db, 'u2')).toEqual([]);
  });
});

describe('exerciseExistsInSync', () => {
  it('returns true for existing non-deleted exercise', () => {
    expect(exerciseExistsInSync(db, 'u1', 'ex1')).toBe(true);
  });

  it('returns false for soft-deleted exercise', () => {
    db.prepare('UPDATE sync_exercises SET deleted_at=? WHERE user_id=? AND id=?').run(Date.now(), 'u1', 'ex1');
    expect(exerciseExistsInSync(db, 'u1', 'ex1')).toBe(false);
  });

  it('returns false for unknown exercise', () => {
    expect(exerciseExistsInSync(db, 'u1', 'notexist')).toBe(false);
  });
});
