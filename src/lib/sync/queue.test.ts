import { describe, it, expect, beforeEach } from 'vitest';
import Dexie from 'dexie';
import { PushQueue } from './queue';

beforeEach(async () => {
  await Dexie.delete('tt-playbook-trainer');
});

describe('PushQueue', () => {
  it('dedups per (type, entityId)', async () => {
    const q = new PushQueue();
    await q.enqueue('exercise', 'e1');
    await q.enqueue('exercise', 'e1');
    await q.enqueue('exercise', 'e2');
    expect(await q.size()).toBe(2);
  });

  it('snapshot returns distinct ids by type', async () => {
    const q = new PushQueue();
    await q.enqueue('exercise', 'e1');
    await q.enqueue('playlist', 'p1');
    await q.enqueue('settings', 'default');
    const snap = await q.snapshot();
    expect(snap.exercises).toEqual(['e1']);
    expect(snap.playlists).toEqual(['p1']);
    expect(snap.settings).toBe(true);
  });

  it('removes items after ack', async () => {
    const q = new PushQueue();
    await q.enqueue('exercise', 'e1');
    await q.enqueue('exercise', 'e2');
    await q.ack({ exercises: ['e1', 'e2'], playlists: [], settings: false });
    expect(await q.size()).toBe(0);
  });

  it('persists across reinstantiation (Dexie-backed)', async () => {
    const q1 = new PushQueue();
    await q1.enqueue('exercise', 'e1');
    const q2 = new PushQueue();
    expect(await q2.size()).toBe(1);
  });
});
