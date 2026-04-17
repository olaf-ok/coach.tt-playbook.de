import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../../../../server/auth/db', async () => {
  const { DatabaseSync } = await import('node:sqlite');
  const fs = await import('node:fs');
  const path = await import('node:path');
  const memDb = new DatabaseSync(':memory:');
  const schemaSql = fs.readFileSync(
    path.resolve(process.cwd(), 'server/auth/schema.sql'),
    'utf8',
  );
  memDb.exec('PRAGMA foreign_keys = ON');
  memDb.exec(schemaSql);
  memDb.exec('PRAGMA user_version = 1');
  return { getDatabase: () => memDb, resetSingletonForTests: () => {} };
});
vi.mock('../../../../../server/auth/mailer', () => ({
  sendVerificationMail: vi.fn(async () => {}),
  sendResetMail: vi.fn(async () => {}),
}));

import { POST } from './+server';
import { getDatabase } from '../../../../../server/auth/db';
import { createUser } from '../../../../../server/auth/users';
import { sendResetMail } from '../../../../../server/auth/mailer';

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

describe('POST /api/auth/request-reset', () => {
  beforeEach(() => {
    getDatabase().exec(`DELETE FROM users; DELETE FROM reset_tokens; DELETE FROM rate_limits;`);
    (sendResetMail as any).mockClear();
  });

  it('sendet Reset-Mail bei bekannter Mail', async () => {
    await createUser(getDatabase(), 'r@x.de', 'h');
    const res = await POST(mkRequest({ email: 'r@x.de' }));
    expect(res.status).toBe(200);
    expect(sendResetMail).toHaveBeenCalled();
  });

  it('generic 200 bei unbekannter Mail ohne Mail-Send', async () => {
    const res = await POST(mkRequest({ email: 'nope@x.de' }));
    expect(res.status).toBe(200);
    expect(sendResetMail).not.toHaveBeenCalled();
  });

  it('429 nach 3 Versuchen pro Email', async () => {
    for (let i = 0; i < 3; i++) await POST(mkRequest({ email: 'rl@x.de' }));
    const res = await POST(mkRequest({ email: 'rl@x.de' }));
    expect(res.status).toBe(429);
  });
});
