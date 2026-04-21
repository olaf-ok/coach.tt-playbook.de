import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import Dexie from 'dexie';

describe('Dexie v4', () => {
  beforeEach(async () => {
    await Dexie.delete('tt-playbook-trainer');
  });

  it('migrates v3 exercises to have deletedAt=null and keeps updatedAt', async () => {
    const oldDb = new Dexie('tt-playbook-trainer');
    oldDb.version(3).stores({
      exercises: 'id, name, createdAt, updatedAt',
      playlists: 'id, name, createdAt, updatedAt',
    });
    await oldDb.open();
    await oldDb.table('exercises').put({
      id: 'e1', name: 'legacy', tags: [], strokes: [],
      repetitions: null, duration: null, createdAt: 1, updatedAt: 2,
    });
    oldDb.close();

    const { db } = await import('./database');
    const row = await db.exercises.get('e1');
    expect(row?.deletedAt).toBeNull();
    expect(row?.updatedAt).toBe(2);
  });

  it('creates settings table on fresh install', async () => {
    const { db } = await import('./database');
    await db.open();
    expect(db.table('settings')).toBeDefined();
  });
});
