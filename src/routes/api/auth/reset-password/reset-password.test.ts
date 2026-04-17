import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../../../../server/auth/db', async () => {
  const BetterSqlite3 = (await import('better-sqlite3')).default;
  const fs = await import('node:fs');
  const path = await import('node:path');
  const memDb = new BetterSqlite3(':memory:');
  const schemaSql = fs.readFileSync(
    path.resolve(process.cwd(), 'server/auth/schema.sql'),
    'utf8',
  );
  memDb.pragma('foreign_keys = ON');
  memDb.exec(schemaSql);
  memDb.pragma('user_version = 1');
  return { getDatabase: () => memDb, resetSingletonForTests: () => {} };
});

import { POST } from './+server';
import { getDatabase } from '../../../../../server/auth/db';
import { createUser, markEmailVerified } from '../../../../../server/auth/users';
import { createResetToken } from '../../../../../server/auth/reset';
import { createSession } from '../../../../../server/auth/sessions';
import { hashPassword, verifyPassword } from '../../../../../server/auth/password';

function mkRequest(body: Record<string, unknown>): any {
  return {
    request: new Request('http://localhost/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    getClientAddress: () => '1.2.3.4',
    cookies: { set: vi.fn(), delete: vi.fn(), get: () => undefined },
  };
}

describe('POST /api/auth/reset-password', () => {
  beforeEach(() => {
    getDatabase().exec(`DELETE FROM users; DELETE FROM sessions; DELETE FROM reset_tokens;`);
  });

  it('setzt neues Passwort, löscht ALLE alten Sessions, auto-login', async () => {
    const hash = await hashPassword('oldpasspass');
    const u = await createUser(getDatabase(), 'r@x.de', hash);
    markEmailVerified(getDatabase(), u.id);
    createSession(getDatabase(), u.id);
    createSession(getDatabase(), u.id);
    const token = createResetToken(getDatabase(), u.id);

    const event = mkRequest({ token, newPassword: 'newpasspass' });
    const res = await POST(event);
    expect(res.status).toBe(200);

    // altes Passwort invalide
    const row = getDatabase().prepare(`SELECT password_hash FROM users WHERE id = ?`).get(u.id) as any;
    expect(await verifyPassword(row.password_hash, 'newpasspass')).toBe(true);
    expect(await verifyPassword(row.password_hash, 'oldpasspass')).toBe(false);

    // Nur noch die neue Session (andere wurden gelöscht)
    const sessions = getDatabase().prepare(`SELECT * FROM sessions WHERE user_id = ?`).all(u.id);
    expect(sessions).toHaveLength(1);

    expect(event.cookies.set).toHaveBeenCalledWith('ttp_session', expect.any(String), expect.any(Object));
  });

  it('400 bei ungültigem Token', async () => {
    const res = await POST(mkRequest({ token: 'invalid', newPassword: 'newpasspass' }));
    expect(res.status).toBe(400);
  });

  it('400 bei zu kurzem Passwort', async () => {
    const u = await createUser(getDatabase(), 's@x.de', 'h');
    const token = createResetToken(getDatabase(), u.id);
    const res = await POST(mkRequest({ token, newPassword: 'short' }));
    expect(res.status).toBe(400);
  });

  it('400 bei bereits-verwendetem Token (one-shot)', async () => {
    const u = await createUser(getDatabase(), 'o@x.de', 'h');
    const token = createResetToken(getDatabase(), u.id);
    await POST(mkRequest({ token, newPassword: 'firstfirst' }));
    const res = await POST(mkRequest({ token, newPassword: 'secondsecond' }));
    expect(res.status).toBe(400);
  });
});
