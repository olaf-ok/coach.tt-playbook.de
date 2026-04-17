import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { openDatabase, type AuthDatabase } from './db';
import { checkAndConsume, LIMITS } from './ratelimit';

describe('ratelimit', () => {
  let db: AuthDatabase;

  beforeEach(() => {
    db = openDatabase(':memory:');
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });

  afterEach(() => {
    db.close();
    vi.useRealTimers();
  });

  it('erlaubt Requests bis zum Limit', () => {
    for (let i = 0; i < LIMITS.login.max; i++) {
      expect(checkAndConsume(db, 'login', 'ip:1.2.3.4')).toBe(true);
    }
  });

  it('blockt nach Erreichen des Limits', () => {
    for (let i = 0; i < LIMITS.login.max; i++) {
      checkAndConsume(db, 'login', 'ip:1.2.3.4');
    }
    expect(checkAndConsume(db, 'login', 'ip:1.2.3.4')).toBe(false);
  });

  it('setzt nach Window-Ablauf zurück', () => {
    for (let i = 0; i < LIMITS.login.max; i++) {
      checkAndConsume(db, 'login', 'ip:1.2.3.4');
    }
    expect(checkAndConsume(db, 'login', 'ip:1.2.3.4')).toBe(false);

    vi.setSystemTime(Date.now() + LIMITS.login.windowMs + 1);
    expect(checkAndConsume(db, 'login', 'ip:1.2.3.4')).toBe(true);
  });

  it('trennt Keys (IP vs. Email)', () => {
    for (let i = 0; i < LIMITS.login.max; i++) {
      checkAndConsume(db, 'login', 'ip:1.2.3.4');
    }
    expect(checkAndConsume(db, 'login', 'email:foo@x.de')).toBe(true);
  });

  it('kennt Action-Typen signup, reset, resend, login', () => {
    expect(LIMITS.signup).toBeDefined();
    expect(LIMITS.reset).toBeDefined();
    expect(LIMITS.resendVerification).toBeDefined();
    expect(LIMITS.login).toBeDefined();
  });
});
