import { describe, it, expect, beforeEach, vi } from 'vitest';
import Dexie from 'dexie';
import { db } from '../db/database';
import { syncClient } from './client.svelte';
import { syncStatus } from './status.svelte';

// localStorage is not available in Node test environment — provide a simple mock
const store: Record<string, string> = {};
global.localStorage = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
  length: 0,
  key: () => null,
} as Storage;

beforeEach(async () => {
  vi.restoreAllMocks();
  syncStatus.reset();
  localStorage.clear();
  // Reset singleton state between tests
  await syncClient.clearLocal();
  await Dexie.delete('tt-playbook-trainer');
  await db.open();
});

describe('syncClient.pull', () => {
  it('applies server exercises into local DB', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        exercises: [
          {
            id: 'e1',
            updatedAt: 5,
            deletedAt: null,
            data: {
              id: 'e1',
              name: 'server',
              tags: [],
              strokes: [],
              repetitions: null,
              duration: null,
              createdAt: 1,
              updatedAt: 5,
              deletedAt: null,
            },
          },
        ],
        playlists: [],
        settings: null,
        serverTime: 100,
      }),
    });
    // init sets currentUserId and calls pull internally
    await syncClient.init('u1');
    const row = await db.exercises.get('e1');
    expect(row?.name).toBe('server');
  });
});

describe('syncClient.push', () => {
  it('does nothing when queue empty', async () => {
    // push() should not call /api/sync/push when the queue has no items
    const calls: string[] = [];
    global.fetch = vi.fn().mockImplementation((url: string) => {
      calls.push(url);
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
    await syncClient.push();
    const pushCalls = calls.filter((url) => url.includes('/api/sync/push'));
    expect(pushCalls).toHaveLength(0);
  });
});
