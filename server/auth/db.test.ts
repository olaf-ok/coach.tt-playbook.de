import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { openDatabase, type AuthDatabase } from './db';

describe('auth db', () => {
  let db: AuthDatabase;

  beforeEach(() => {
    db = openDatabase(':memory:');
  });

  afterEach(() => {
    db.close();
  });

  it('öffnet eine DB und legt das Schema an', () => {
    const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`).all() as { name: string }[];
    const names = tables.map(t => t.name);
    expect(names).toContain('users');
    expect(names).toContain('sessions');
    expect(names).toContain('verification_tokens');
    expect(names).toContain('reset_tokens');
    expect(names).toContain('rate_limits');
  });

  it('setzt user_version auf >= 1', () => {
    const row = db.prepare('PRAGMA user_version').get() as { user_version: number };
    expect(row.user_version).toBeGreaterThanOrEqual(1);
  });

  it('enforced foreign keys (CASCADE)', () => {
    db.prepare(`INSERT INTO users (id, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`).run('u1', 'x@y.de', 'h', 1, 1);
    db.prepare(`INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)`).run('th1', 'u1', 1, 1000);
    db.prepare(`DELETE FROM users WHERE id = ?`).run('u1');
    const rows = db.prepare(`SELECT * FROM sessions WHERE user_id = ?`).all('u1');
    expect(rows).toHaveLength(0);
  });

  it('ist idempotent (zweites openDatabase crasht nicht)', () => {
    const db2 = openDatabase(':memory:');
    expect(db2).toBeDefined();
    db2.close();
  });
});
