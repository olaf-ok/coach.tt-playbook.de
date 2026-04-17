import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { openDatabase, type AuthDatabase } from './db';
import {
  createSession,
  validateAndRefreshSession,
  deleteSession,
  deleteAllUserSessions,
  SESSION_TTL_MS,
} from './sessions';

describe('sessions', () => {
  let db: AuthDatabase;

  beforeEach(() => {
    db = openDatabase(':memory:');
    db.prepare(`INSERT INTO users (id, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`)
      .run('u1', 'user@example.de', 'hash', 1, 1);
  });

  afterEach(() => db.close());

  it('createSession gibt raw Token zurück und speichert Hash', () => {
    const { token, expiresAt } = createSession(db, 'u1', { userAgent: 'test', ip: '127.0.0.1' });
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(expiresAt).toBeGreaterThan(Date.now());
    const rows = db.prepare(`SELECT * FROM sessions WHERE user_id = ?`).all('u1');
    expect(rows).toHaveLength(1);
  });

  it('validateAndRefreshSession gibt User zurück bei gültigem Token und verlängert expires', () => {
    const { token } = createSession(db, 'u1');
    const before = db.prepare(`SELECT expires_at FROM sessions`).get() as { expires_at: number };

    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 60_000);

    const user = validateAndRefreshSession(db, token);
    expect(user?.id).toBe('u1');
    expect(user?.email).toBe('user@example.de');

    const after = db.prepare(`SELECT expires_at FROM sessions`).get() as { expires_at: number };
    expect(after.expires_at).toBeGreaterThan(before.expires_at);

    vi.useRealTimers();
  });

  it('validateAndRefreshSession gibt null bei unbekanntem Token', () => {
    const user = validateAndRefreshSession(db, 'unknown-token');
    expect(user).toBeNull();
  });

  it('validateAndRefreshSession löscht abgelaufene Session', () => {
    const { token } = createSession(db, 'u1');
    db.prepare(`UPDATE sessions SET expires_at = ? WHERE user_id = ?`).run(Date.now() - 1000, 'u1');

    const user = validateAndRefreshSession(db, token);
    expect(user).toBeNull();
    const rows = db.prepare(`SELECT * FROM sessions WHERE user_id = ?`).all('u1');
    expect(rows).toHaveLength(0);
  });

  it('deleteSession entfernt Zeile', () => {
    const { token } = createSession(db, 'u1');
    deleteSession(db, token);
    expect(db.prepare(`SELECT * FROM sessions`).all()).toHaveLength(0);
  });

  it('deleteAllUserSessions entfernt alle Sessions des Users', () => {
    createSession(db, 'u1');
    createSession(db, 'u1');
    createSession(db, 'u1');
    deleteAllUserSessions(db, 'u1');
    expect(db.prepare(`SELECT * FROM sessions WHERE user_id = ?`).all('u1')).toHaveLength(0);
  });

  it('SESSION_TTL_MS ist 30 Tage', () => {
    expect(SESSION_TTL_MS).toBe(30 * 24 * 60 * 60 * 1000);
  });
});
