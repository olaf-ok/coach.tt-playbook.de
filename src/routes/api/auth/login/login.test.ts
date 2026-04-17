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
import { hashPassword } from '../../../../../server/auth/password';

function mkRequest(body: Record<string, unknown>, ip = '1.2.3.4'): any {
  return {
    request: new Request('http://localhost/', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'user-agent': 'vitest' },
      body: JSON.stringify(body),
    }),
    getClientAddress: () => ip,
    cookies: { set: vi.fn(), delete: vi.fn(), get: () => undefined },
  };
}

async function seedUser(email: string, password: string, verified = true) {
  const hash = await hashPassword(password);
  const u = await createUser(getDatabase(), email, hash);
  if (verified) markEmailVerified(getDatabase(), u.id);
  return u;
}

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    getDatabase().exec(`DELETE FROM users; DELETE FROM sessions; DELETE FROM rate_limits;`);
  });

  it('erfolgreicher Login setzt Cookie, gibt User', async () => {
    await seedUser('ok@x.de', 'passpasspass');
    const event = mkRequest({ email: 'ok@x.de', password: 'passpasspass' });
    const res = await POST(event);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.email).toBe('ok@x.de');
    expect(event.cookies.set).toHaveBeenCalledWith('ttp_session', expect.any(String), expect.any(Object));
  });

  it('401 bei falschem Passwort', async () => {
    await seedUser('p@x.de', 'passpasspass');
    const res = await POST(mkRequest({ email: 'p@x.de', password: 'wrong' }));
    expect(res.status).toBe(401);
  });

  it('401 bei unbekannter E-Mail (generic)', async () => {
    const res = await POST(mkRequest({ email: 'nope@x.de', password: 'irrelevant' }));
    expect(res.status).toBe(401);
  });

  it('403 bei unverifizierter Mail', async () => {
    await seedUser('unv@x.de', 'passpasspass', false);
    const res = await POST(mkRequest({ email: 'unv@x.de', password: 'passpasspass' }));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.canResend).toBe(true);
  });

  it('429 nach 5 falschen Versuchen (Email-Rate-Limit)', async () => {
    await seedUser('rl@x.de', 'passpasspass');
    for (let i = 0; i < 5; i++) {
      await POST(mkRequest({ email: 'rl@x.de', password: 'wrong' }, '5.5.5.5'));
    }
    const res = await POST(mkRequest({ email: 'rl@x.de', password: 'wrong' }, '5.5.5.5'));
    expect(res.status).toBe(429);
  });

  it('Timing-Angleich: unbekannte Mail ≈ bekannte Mail mit falschem Passwort', async () => {
    await seedUser('timing@x.de', 'passpasspass');
    const t1 = performance.now();
    await POST(mkRequest({ email: 'timing@x.de', password: 'wrong' }, '7.7.7.7'));
    const d1 = performance.now() - t1;

    getDatabase().exec(`DELETE FROM rate_limits`);

    const t2 = performance.now();
    await POST(mkRequest({ email: 'unknown-user@x.de', password: 'wrong' }, '8.8.8.8'));
    const d2 = performance.now() - t2;

    // Beide Pfade führen argon2 aus → Differenz klein (argon2 ~30ms, Toleranz 200ms).
    expect(Math.abs(d1 - d2)).toBeLessThan(200);
  });
});
