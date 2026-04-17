import { describe, it, expect } from 'vitest';
import { GET } from './+server';

function mkEvent(user: any): any {
  return { locals: { user } };
}

describe('GET /api/auth/me', () => {
  it('200 mit User, wenn locals.user gesetzt', async () => {
    const res = await GET(mkEvent({ id: 'u1', email: 'a@b.de', emailVerified: true, proUntil: null }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.email).toBe('a@b.de');
  });

  it('401 ohne User', async () => {
    const res = await GET(mkEvent(null));
    expect(res.status).toBe(401);
  });
});
