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

import { POST } from './+server';
import { getDatabase } from '../../../../../server/auth/db';
import { createUser } from '../../../../../server/auth/users';
import { createSession } from '../../../../../server/auth/sessions';

describe('POST /api/auth/logout', () => {
  beforeEach(() => {
    getDatabase().exec(`DELETE FROM users; DELETE FROM sessions;`);
  });

  it('löscht Session und Cookie', async () => {
    const u = await createUser(getDatabase(), 'l@x.de', 'h');
    const { token } = createSession(getDatabase(), u.id);

    const cookies = {
      get: (name: string) => (name === 'ttp_session' ? token : undefined),
      set: vi.fn(),
      delete: vi.fn(),
    };
    const event: any = { cookies };
    const res = await POST(event);
    expect(res.status).toBe(200);
    expect(cookies.delete).toHaveBeenCalledWith('ttp_session', { path: '/' });
    const rows = getDatabase().prepare(`SELECT * FROM sessions`).all();
    expect(rows).toHaveLength(0);
  });

  it('200 auch ohne bestehende Session', async () => {
    const cookies = { get: () => undefined, set: vi.fn(), delete: vi.fn() };
    const event: any = { cookies };
    const res = await POST(event);
    expect(res.status).toBe(200);
  });
});
