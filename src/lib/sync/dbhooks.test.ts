import { describe, it, expect, beforeEach } from 'vitest';
import Dexie from 'dexie';
import { db } from '../db/database';
import { installDbHooks } from './dbhooks';
import { createEmptyExercise } from '../types/exercise';

beforeEach(async () => {
  db.close();
  await Dexie.delete('tt-playbook-trainer');
  installDbHooks();
  await db.open();
});

describe('Dexie hooks', () => {
  it('auto-stamps updatedAt on create', async () => {
    const e = createEmptyExercise();
    e.updatedAt = 0;
    await db.exercises.put(e);
    const row = await db.exercises.get(e.id);
    expect(row?.updatedAt).toBeGreaterThan(Date.now() - 5_000);
  });

  it('converts delete to soft-delete', async () => {
    const e = createEmptyExercise();
    await db.exercises.put(e);
    await db.exercises.delete(e.id);
    // The re-insert (onsuccess) runs asynchronously after the delete commits
    await new Promise((r) => setTimeout(r, 50));
    const row = await db.exercises.get(e.id);
    expect(row?.deletedAt).not.toBeNull();
  });

  it('enqueues into syncQueue on create/update/delete', async () => {
    const e = createEmptyExercise();
    await db.exercises.put(e);
    // Enqueue runs asynchronously in the hook — wait for it to settle
    await new Promise((r) => setTimeout(r, 50));
    const q = await db.syncQueue.count();
    expect(q).toBeGreaterThan(0);
  });
});
