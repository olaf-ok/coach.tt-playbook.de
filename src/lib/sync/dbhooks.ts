import { db } from '../db/database';
import { syncClient } from './client.svelte';
import type { Exercise } from '../types/exercise';
import type { Playlist } from '../types/playlist';

let installed = false;

/**
 * When hookBypass.active is true all hooks return early without stamping
 * or enqueuing. This prevents pull() from overwriting server timestamps
 * and re-enqueuing rows that were just received from the server.
 */
export const hookBypass = { active: false };

export function installDbHooks(): void {
  if (installed) return;
  installed = true;

  // --- Auto-stamp + soft-delete hooks (must run before enqueue hooks) ---

  db.exercises.hook('creating', (_pk, obj) => {
    if (hookBypass.active) return;
    obj.updatedAt = Date.now();
    obj.deletedAt ??= null;
  });

  db.exercises.hook('updating', (mods) => {
    if (hookBypass.active) return;
    (mods as Record<string, unknown>).updatedAt = Date.now();
  });

  // Soft-delete: re-insert with deletedAt after the hard-delete commits.
  // trans.abort() was evaluated but is not viable: in fake-indexeddb it accepts the abort()
  // call without throwing, but subsequent put() calls on the now-inactive transaction fail
  // with TransactionInactiveError. In real IndexedDB environments abort() would need the
  // put() issued before the transaction closes — not safely achievable from a hook callback.
  // Chosen approach: onsuccess callback fires after the delete transaction commits, allowing
  // a fresh transaction for the re-insert. Errors are logged so data-loss is visible.
  db.exercises.hook('deleting', function (pk, obj) {
    if (hookBypass.active) return;
    const snapshot = { ...(obj as Exercise) };
    const now = Date.now();
    (this as { onsuccess?: () => void }).onsuccess = () => {
      void (async () => {
        try {
          await db.exercises.put({ ...snapshot, deletedAt: now, updatedAt: now });
        } catch (err) {
          console.error('[sync] soft-delete re-insert failed for exercise', pk, err);
        }
      })();
    };
  });

  db.playlists.hook('creating', (_pk, obj) => {
    if (hookBypass.active) return;
    obj.updatedAt = Date.now();
    obj.deletedAt ??= null;
  });

  db.playlists.hook('updating', (mods) => {
    if (hookBypass.active) return;
    (mods as Record<string, unknown>).updatedAt = Date.now();
  });

  // Soft-delete: same pattern as exercises (see comment above)
  db.playlists.hook('deleting', function (pk, obj) {
    if (hookBypass.active) return;
    const snapshot = { ...(obj as Playlist) };
    const now = Date.now();
    (this as { onsuccess?: () => void }).onsuccess = () => {
      void (async () => {
        try {
          await db.playlists.put({ ...snapshot, deletedAt: now, updatedAt: now });
        } catch (err) {
          console.error('[sync] soft-delete re-insert failed for playlist', pk, err);
        }
      })();
    };
  });

  // --- Enqueue hooks (run after stamp hooks so obj is already stamped) ---
  // Note: enqueue runs in setTimeout(0) to escape the current Dexie transaction scope.
  // syncQueue is a different object store than exercises/playlists, so it cannot be
  // accessed within the same auto-transaction that fires the hook.

  db.exercises.hook('creating', (_pk, obj) => {
    if (hookBypass.active) return;
    const id = obj.id;
    setTimeout(() => { void syncClient.queue.enqueue('exercise', id); syncClient.schedulePush(); }, 0);
  });

  db.exercises.hook('updating', (_mods, pk) => {
    if (hookBypass.active) return;
    const id = String(pk);
    setTimeout(() => { void syncClient.queue.enqueue('exercise', id); syncClient.schedulePush(); }, 0);
  });

  db.playlists.hook('creating', (_pk, obj) => {
    if (hookBypass.active) return;
    const id = obj.id;
    setTimeout(() => { void syncClient.queue.enqueue('playlist', id); syncClient.schedulePush(); }, 0);
  });

  db.playlists.hook('updating', (_mods, pk) => {
    if (hookBypass.active) return;
    const id = String(pk);
    setTimeout(() => { void syncClient.queue.enqueue('playlist', id); syncClient.schedulePush(); }, 0);
  });
}
