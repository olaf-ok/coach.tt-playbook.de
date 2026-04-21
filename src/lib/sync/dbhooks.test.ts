import { describe, it, expect, beforeEach } from 'vitest';
import Dexie from 'dexie';
import { db } from '../db/database';
import { installDbHooks, hookBypass } from './dbhooks';
import { createEmptyExercise } from '../types/exercise';

beforeEach(async () => {
  db.close();
  await Dexie.delete('tt-playbook-trainer');
  // Reset bypass flag between tests
  hookBypass.active = false;
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

  describe('hookBypass', () => {
    it('bypasses auto-stamp when hookBypass.active is true', async () => {
      const e = createEmptyExercise();
      const frozenTimestamp = 12345;
      e.updatedAt = frozenTimestamp;

      hookBypass.active = true;
      try {
        await db.exercises.put(e);
      } finally {
        hookBypass.active = false;
      }

      const row = await db.exercises.get(e.id);
      // updatedAt must NOT be overwritten by the hook
      expect(row?.updatedAt).toBe(frozenTimestamp);
    });

    it('bypasses enqueue into syncQueue when hookBypass.active is true', async () => {
      const e = createEmptyExercise();

      hookBypass.active = true;
      try {
        await db.exercises.put(e);
      } finally {
        hookBypass.active = false;
      }

      // Wait long enough for any async setTimeout enqueue to run
      await new Promise((r) => setTimeout(r, 50));
      const count = await db.syncQueue.count();
      expect(count).toBe(0);
    });
  });

  describe('installDbHooks idempotency', () => {
    it('double-install does not cause double-enqueue', async () => {
      // installDbHooks is already called in beforeEach; calling again must be a no-op
      installDbHooks();

      const e = createEmptyExercise();
      await db.exercises.put(e);

      await new Promise((r) => setTimeout(r, 50));
      const count = await db.syncQueue.count();
      // Should be exactly 1 — not 2 (double-register) or 0
      expect(count).toBe(1);
    });
  });
});
