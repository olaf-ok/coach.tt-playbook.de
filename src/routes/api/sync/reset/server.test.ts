import { describe, expect, it, vi, beforeEach } from 'vitest';
import { POST } from './+server';

vi.mock('$env/dynamic/private', () => ({ env: { SYNC_ENABLED: 'true' } }));
vi.mock('../../../../../server/auth/db', () => ({
  getDatabase: vi.fn(() => ({})),
}));
vi.mock('../../../../../server/auth/ratelimit', () => ({
  checkAndConsume: vi.fn(() => true),
}));
vi.mock('../../../../../server/sync/reset', () => ({
  resetUserData: vi.fn(),
}));

function makeEvent(overrides: Record<string, unknown> = {}) {
  return {
    locals: { user: { id: 'u1' } },
    ...overrides,
  };
}

describe('POST /api/sync/reset', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    const event = makeEvent({ locals: { user: null } });
    await expect(POST(event as never)).rejects.toMatchObject({ status: 401 });
  });

  it('returns 503 when SYNC_ENABLED=false', async () => {
    const { env } = await import('$env/dynamic/private');
    (env as Record<string, string>).SYNC_ENABLED = 'false';

    const res = await POST(makeEvent() as never);
    expect(res.status).toBe(503);

    (env as Record<string, string>).SYNC_ENABLED = 'true';
  });

  it('returns 429 when rate limited', async () => {
    const { checkAndConsume } = await import('../../../../../server/auth/ratelimit');
    vi.mocked(checkAndConsume).mockReturnValueOnce(false);

    const res = await POST(makeEvent() as never);
    expect(res.status).toBe(429);
  });

  it('returns 200 with serverTime for valid request', async () => {
    const res = await POST(makeEvent() as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('serverTime');
    expect(typeof body.serverTime).toBe('number');
  });
});
