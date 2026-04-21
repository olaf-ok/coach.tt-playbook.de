import { describe, expect, it, vi, beforeEach } from 'vitest';
import { GET } from './+server';

vi.mock('$env/dynamic/private', () => ({ env: { SYNC_ENABLED: 'true' } }));
vi.mock('../../../../../server/auth/db', () => ({
  getDatabase: vi.fn(() => ({})),
}));
vi.mock('../../../../../server/auth/ratelimit', () => ({
  checkAndConsume: vi.fn(() => true),
}));
vi.mock('../../../../../server/sync/pull', () => ({
  getChangesSince: vi.fn(() => ({
    exercises: [],
    playlists: [],
    settings: null,
    serverTime: 1000,
  })),
}));

describe('GET /api/sync/pull', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    const event = {
      locals: { user: null },
      url: new URL('http://x/?'),
      getClientAddress: () => '1.1.1.1',
    };
    await expect(GET(event as never)).rejects.toMatchObject({ status: 401 });
  });

  it('returns 503 when SYNC_ENABLED=false', async () => {
    const { env } = await import('$env/dynamic/private');
    (env as Record<string, string>).SYNC_ENABLED = 'false';

    const event = {
      locals: { user: { id: 'u1' } },
      url: new URL('http://x/?'),
      getClientAddress: () => '1.1.1.1',
    };
    const res = await GET(event as never);
    expect(res.status).toBe(503);

    // reset for subsequent tests
    (env as Record<string, string>).SYNC_ENABLED = 'true';
  });

  it('returns 429 when rate limited', async () => {
    const { checkAndConsume } = await import('../../../../../server/auth/ratelimit');
    vi.mocked(checkAndConsume).mockReturnValueOnce(false);

    const event = {
      locals: { user: { id: 'u1' } },
      url: new URL('http://x/?'),
      getClientAddress: () => '1.1.1.1',
    };
    const res = await GET(event as never);
    expect(res.status).toBe(429);
  });

  it('returns 400 for invalid since param', async () => {
    const event = {
      locals: { user: { id: 'u1' } },
      url: new URL('http://x/?since=abc'),
      getClientAddress: () => '1.1.1.1',
    };
    await expect(GET(event as never)).rejects.toMatchObject({ status: 400 });
  });

  it('returns 200 with payload for valid request', async () => {
    const event = {
      locals: { user: { id: 'u1' } },
      url: new URL('http://x/?since=0'),
      getClientAddress: () => '1.1.1.1',
    };
    const res = await GET(event as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ exercises: [], playlists: [], settings: null });
  });
});
