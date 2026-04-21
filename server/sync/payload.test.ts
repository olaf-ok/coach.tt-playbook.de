import { describe, expect, it } from 'vitest';
import { PushPayloadSchema, PullQuerySchema, MAX_CLOCK_SKEW_MS } from './payload';

describe('PushPayloadSchema', () => {
  it('accepts a minimal valid payload', () => {
    const result = PushPayloadSchema.safeParse({
      exercises: [],
      playlists: [],
      settings: null,
    });
    expect(result.success).toBe(true);
  });

  it('accepts exercise with data blob', () => {
    const now = Date.now();
    const result = PushPayloadSchema.safeParse({
      exercises: [{ id: 'e1', updatedAt: now, deletedAt: null, data: { foo: 'bar' } }],
      playlists: [],
      settings: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects updatedAt in future beyond clock skew', () => {
    const tooFuture = Date.now() + MAX_CLOCK_SKEW_MS + 10_000;
    const result = PushPayloadSchema.safeParse({
      exercises: [{ id: 'e1', updatedAt: tooFuture, deletedAt: null, data: {} }],
      playlists: [],
      settings: null,
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing required fields', () => {
    const result = PushPayloadSchema.safeParse({ exercises: [{ id: 'e1' }] });
    expect(result.success).toBe(false);
  });

  it('rejects deletedAt in future beyond clock skew', () => {
    const tooFuture = Date.now() + MAX_CLOCK_SKEW_MS + 10_000;
    const result = PushPayloadSchema.safeParse({
      exercises: [{ id: 'e1', updatedAt: Date.now(), deletedAt: tooFuture, data: {} }],
      playlists: [],
      settings: null,
    });
    expect(result.success).toBe(false);
  });
});

describe('PullQuerySchema', () => {
  it('accepts no query (full snapshot)', () => {
    expect(PullQuerySchema.safeParse({}).success).toBe(true);
  });

  it('accepts since as number string', () => {
    const result = PullQuerySchema.safeParse({ since: '1713484800000' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.since).toBe(1713484800000);
  });

  it('rejects negative since', () => {
    expect(PullQuerySchema.safeParse({ since: '-1' }).success).toBe(false);
  });

  it('rejects empty since', () => {
    expect(PullQuerySchema.safeParse({ since: '' }).success).toBe(false);
  });

  it('rejects non-numeric since', () => {
    expect(PullQuerySchema.safeParse({ since: 'abc' }).success).toBe(false);
  });
});
