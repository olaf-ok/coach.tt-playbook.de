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
import { createUser } from '../../../../../server/auth/users';
import { createVerificationToken } from '../../../../../server/auth/verification';

function mkRequest(body: Record<string, unknown>): any {
  const cookies = {
    set: vi.fn(),
    delete: vi.fn(),
    get: () => undefined,
  };
  return {
    request: new Request('http://localhost/api/auth/verify-email', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    getClientAddress: () => '1.2.3.4',
    cookies,
  };
}

describe('POST /api/auth/verify-email', () => {
  beforeEach(() => {
    getDatabase().exec(`DELETE FROM users; DELETE FROM verification_tokens; DELETE FROM sessions;`);
  });

  it('verifiziert, setzt Cookie, gibt User zurück', async () => {
    const user = await createUser(getDatabase(), 'v@x.de', 'hash');
    const token = createVerificationToken(getDatabase(), user.id);

    const event = mkRequest({ token });
    const res = await POST(event);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.user.email).toBe('v@x.de');
    expect(body.user.emailVerified).toBe(true);
    expect(event.cookies.set).toHaveBeenCalledWith('ttp_session', expect.any(String), expect.any(Object));
  });

  it('400 bei ungültigem Token', async () => {
    const res = await POST(mkRequest({ token: 'invalid' }));
    expect(res.status).toBe(400);
  });

  it('400 bei abgelaufenem Token', async () => {
    const user = await createUser(getDatabase(), 'e@x.de', 'hash');
    const token = createVerificationToken(getDatabase(), user.id);
    getDatabase().prepare(`UPDATE verification_tokens SET expires_at = 1 WHERE user_id = ?`).run(user.id);

    const res = await POST(mkRequest({ token }));
    expect(res.status).toBe(400);
  });
});
