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
vi.mock('../../../../../server/auth/mailer', () => ({
  sendVerificationMail: vi.fn(async () => {}),
  sendResetMail: vi.fn(async () => {}),
}));

import { POST } from './+server';
import { getDatabase } from '../../../../../server/auth/db';
import { createUser } from '../../../../../server/auth/users';
import { sendVerificationMail } from '../../../../../server/auth/mailer';

function mkRequest(body: Record<string, unknown>): any {
  return {
    request: new Request('http://localhost/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    getClientAddress: () => '1.2.3.4',
  };
}

describe('POST /api/auth/resend-verification', () => {
  beforeEach(() => {
    getDatabase().exec(`DELETE FROM users; DELETE FROM verification_tokens; DELETE FROM rate_limits;`);
    (sendVerificationMail as any).mockClear();
  });

  it('sendet Mail bei unverifiziertem User', async () => {
    await createUser(getDatabase(), 'u@x.de', 'h');
    const res = await POST(mkRequest({ email: 'u@x.de' }));
    expect(res.status).toBe(200);
    expect(sendVerificationMail).toHaveBeenCalled();
  });

  it('sendet KEINE Mail bei bereits verifiziertem User (generic 200)', async () => {
    const u = await createUser(getDatabase(), 'v@x.de', 'h');
    getDatabase().prepare(`UPDATE users SET email_verified = 1 WHERE id = ?`).run(u.id);
    const res = await POST(mkRequest({ email: 'v@x.de' }));
    expect(res.status).toBe(200);
    expect(sendVerificationMail).not.toHaveBeenCalled();
  });

  it('sendet KEINE Mail bei unbekanntem User (generic 200)', async () => {
    const res = await POST(mkRequest({ email: 'nope@x.de' }));
    expect(res.status).toBe(200);
    expect(sendVerificationMail).not.toHaveBeenCalled();
  });

  it('429 nach 3 Versuchen pro Email', async () => {
    for (let i = 0; i < 3; i++) await POST(mkRequest({ email: 'rl@x.de' }));
    const res = await POST(mkRequest({ email: 'rl@x.de' }));
    expect(res.status).toBe(429);
  });
});
