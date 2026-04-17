import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { openDatabase, type AuthDatabase } from './db';
import { createUser, findUserByEmail, markEmailVerified, updatePasswordHash, EMAIL_REGEX } from './users';

describe('users', () => {
  let db: AuthDatabase;
  beforeEach(() => {
    db = openDatabase(':memory:');
  });
  afterEach(() => db.close());

  it('createUser legt neuen User mit uuid-id an', async () => {
    const user = await createUser(db, 'user@example.de', 'argon-hash');
    expect(user.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(user.email).toBe('user@example.de');
    expect(user.emailVerified).toBe(false);
  });

  it('findUserByEmail ist case-insensitiv', async () => {
    await createUser(db, 'User@Example.de', 'h');
    const found = findUserByEmail(db, 'user@example.de');
    expect(found?.email).toBe('User@Example.de');
  });

  it('findUserByEmail gibt null bei unbekannter Mail', () => {
    expect(findUserByEmail(db, 'nope@x.de')).toBeNull();
  });

  it('createUser wirft bei Duplicate', async () => {
    await createUser(db, 'dup@x.de', 'h');
    await expect(createUser(db, 'DUP@x.de', 'h')).rejects.toThrow();
  });

  it('markEmailVerified setzt flag und gibt User zurück', async () => {
    const u = await createUser(db, 'v@x.de', 'h');
    markEmailVerified(db, u.id);
    const refreshed = findUserByEmail(db, 'v@x.de');
    expect(refreshed?.emailVerified).toBe(true);
  });

  it('updatePasswordHash überschreibt Hash', async () => {
    const u = await createUser(db, 'p@x.de', 'old');
    updatePasswordHash(db, u.id, 'new');
    const row = db.prepare(`SELECT password_hash FROM users WHERE id = ?`).get(u.id) as { password_hash: string };
    expect(row.password_hash).toBe('new');
  });

  it('EMAIL_REGEX erkennt gültige und ungültige Adressen', () => {
    expect(EMAIL_REGEX.test('a@b.de')).toBe(true);
    expect(EMAIL_REGEX.test('not-an-email')).toBe(false);
    expect(EMAIL_REGEX.test('a@b')).toBe(false);
  });
});
