import { describe, it, expect } from 'vitest';
import { createEmptyPlaylist } from './playlist';

describe('createEmptyPlaylist', () => {
  it('erzeugt UUID, leeren Namen, leere exerciseIds und Timestamps', () => {
    const p = createEmptyPlaylist();
    expect(p.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(p.name).toBe('');
    expect(p.exerciseIds).toEqual([]);
    expect(p.createdAt).toBeGreaterThan(0);
    expect(p.updatedAt).toBe(p.createdAt);
  });

  it('erzeugt unterschiedliche IDs', () => {
    const a = createEmptyPlaylist();
    const b = createEmptyPlaylist();
    expect(a.id).not.toBe(b.id);
  });
});
