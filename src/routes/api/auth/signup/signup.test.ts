import { describe, it, expect, beforeEach, vi } from 'vitest';

// In-memory DB mock for the whole api test suite
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

vi.mock('../../../../../server/auth/mailer', () => ({
  sendVerificationMail: vi.fn(async () => {}),
  sendResetMail: vi.fn(async () => {}),
}));

import { POST } from './+server';
import { getDatabase } from '../../../../../server/auth/db';
import { sendVerificationMail } from '../../../../../server/auth/mailer';

function mkRequest(body: Record<string, unknown>, ip = '1.2.3.4'): any {
  return {
    request: new Request('http://localhost/api/auth/signup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    getClientAddress: () => ip,
    cookies: { set: vi.fn(), delete: vi.fn(), get: () => undefined },
  };
}

describe('POST /api/auth/signup', () => {
  beforeEach(() => {
    getDatabase().exec(`DELETE FROM users; DELETE FROM verification_tokens; DELETE FROM rate_limits;`);
    (sendVerificationMail as any).mockClear();
  });

  it('legt User an und sendet Verification-Mail', async () => {
    const res = await POST(mkRequest({ email: 'a@b.de', password: 'passpasspass' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toMatch(/bestätigung/i);

    const rows = getDatabase().prepare(`SELECT * FROM users`).all() as any[];
    expect(rows).toHaveLength(1);
    expect(rows[0].email).toBe('a@b.de');

    expect(sendVerificationMail).toHaveBeenCalledWith('a@b.de', expect.any(String));
  });

  it('lehnt zu kurzes Passwort ab (400)', async () => {
    const res = await POST(mkRequest({ email: 'a@b.de', password: 'short' }));
    expect(res.status).toBe(400);
  });

  it('lehnt ungültige E-Mail ab (400)', async () => {
    const res = await POST(mkRequest({ email: 'not-an-email', password: 'passpasspass' }));
    expect(res.status).toBe(400);
  });

  it('bei existierender Mail: generic 200, KEIN zweiter User', async () => {
    await POST(mkRequest({ email: 'dup@b.de', password: 'passpasspass' }));
    (sendVerificationMail as any).mockClear();

    const res = await POST(mkRequest({ email: 'dup@b.de', password: 'other-pass-1234' }));
    expect(res.status).toBe(200);

    const rows = getDatabase().prepare(`SELECT * FROM users`).all() as any[];
    expect(rows).toHaveLength(1);
  });

  it('rate-limited nach 3 Versuchen pro IP (429)', async () => {
    for (let i = 0; i < 3; i++) {
      await POST(mkRequest({ email: `u${i}@x.de`, password: 'passpasspass' }, '9.9.9.9'));
    }
    const res = await POST(mkRequest({ email: 'u9@x.de', password: 'passpasspass' }, '9.9.9.9'));
    expect(res.status).toBe(429);
  });
});
