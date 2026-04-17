import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { openDatabase, type AuthDatabase } from './db';
import {
  createUser,
  findUserByEmail,
  findUserById,
  markEmailVerified,
  updatePasswordHash,
  listUsers,
  setStripeCustomerId,
  updateSubscriptionFields,
  findUserByStripeCustomerId,
  EMAIL_REGEX,
} from './users';

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

describe('stripe user helpers', () => {
  it('setStripeCustomerId persists customer id', async () => {
    const db = openDatabase(':memory:');
    const user = await createUser(db, 'a@b.c', 'hash');
    setStripeCustomerId(db, user.id, 'cus_123');
    const found = findUserByStripeCustomerId(db, 'cus_123');
    expect(found?.id).toBe(user.id);
    db.close();
  });

  it('findUserByStripeCustomerId returns null for unknown id', () => {
    const db = openDatabase(':memory:');
    expect(findUserByStripeCustomerId(db, 'cus_nope')).toBeNull();
    db.close();
  });

  it('updateSubscriptionFields writes subscription id, status and proUntil', async () => {
    const db = openDatabase(':memory:');
    const user = await createUser(db, 'a@b.c', 'hash');
    updateSubscriptionFields(db, user.id, {
      subscriptionId: 'sub_1',
      status: 'active',
      proUntil: 1_700_000_000_000,
    });
    const reloaded = findUserById(db, user.id);
    expect(reloaded?.proUntil).toBe(1_700_000_000_000);
    expect(reloaded?.stripeSubscriptionId).toBe('sub_1');
    expect(reloaded?.stripeSubscriptionStatus).toBe('active');
    db.close();
  });

  it('updateSubscriptionFields with proUntil=null leaves proUntil unchanged', async () => {
    const db = openDatabase(':memory:');
    const user = await createUser(db, 'a@b.c', 'hash');
    updateSubscriptionFields(db, user.id, {
      subscriptionId: 'sub_1',
      status: 'active',
      proUntil: 1_700_000_000_000,
    });
    updateSubscriptionFields(db, user.id, {
      subscriptionId: 'sub_1',
      status: 'canceled',
      proUntil: null,
    });
    const reloaded = findUserById(db, user.id);
    expect(reloaded?.proUntil).toBe(1_700_000_000_000);
    expect(reloaded?.stripeSubscriptionStatus).toBe('canceled');
    db.close();
  });

  it('listUsers returns stripeSubscriptionStatus', async () => {
    const db = openDatabase(':memory:');
    const user = await createUser(db, 'a@b.c', 'hash');
    updateSubscriptionFields(db, user.id, {
      subscriptionId: 'sub_1',
      status: 'active',
      proUntil: 1_700_000_000_000,
    });
    const summaries = listUsers(db);
    expect(summaries[0].stripeSubscriptionStatus).toBe('active');
    db.close();
  });
});
