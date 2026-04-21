import { db } from '../db/database';
import { syncClient } from './client.svelte';
import type { Exercise } from '../types/exercise';
import type { Playlist } from '../types/playlist';

let installed = false;

export function installDbHooks(): void {
  if (installed) return;
  installed = true;

  // --- Auto-stamp + soft-delete hooks (must run before enqueue hooks) ---

  db.exercises.hook('creating', (_pk, obj) => {
    obj.updatedAt = Date.now();
    obj.deletedAt ??= null;
  });

  db.exercises.hook('updating', (mods) => {
    (mods as Record<string, unknown>).updatedAt = Date.now();
  });

  // Soft-delete: let the hard-delete happen, then immediately re-insert with deletedAt set.
  // ctx.onsuccess fires after the delete transaction commits, allowing a fresh transaction.
  db.exercises.hook('deleting', function (_pk, obj) {
    const snapshot = { ...(obj as Exercise) };
    const now = Date.now();
    (this as { onsuccess?: () => void }).onsuccess = () => {
      void db.exercises.put({ ...snapshot, deletedAt: now, updatedAt: now });
    };
  });

  db.playlists.hook('creating', (_pk, obj) => {
    obj.updatedAt = Date.now();
    obj.deletedAt ??= null;
  });

  db.playlists.hook('updating', (mods) => {
    (mods as Record<string, unknown>).updatedAt = Date.now();
  });

  // Soft-delete: same pattern as exercises
  db.playlists.hook('deleting', function (_pk, obj) {
    const snapshot = { ...(obj as Playlist) };
    const now = Date.now();
    (this as { onsuccess?: () => void }).onsuccess = () => {
      void db.playlists.put({ ...snapshot, deletedAt: now, updatedAt: now });
    };
  });

  // --- Enqueue hooks (run after stamp hooks so obj is already stamped) ---
  // Note: enqueue runs in setTimeout(0) to escape the current Dexie transaction scope.
  // syncQueue is a different object store than exercises/playlists, so it cannot be
  // accessed within the same auto-transaction that fires the hook.

  db.exercises.hook('creating', (_pk, obj) => {
    const id = obj.id;
    setTimeout(() => { void syncClient.queue.enqueue('exercise', id); syncClient.schedulePush(); }, 0);
  });

  db.exercises.hook('updating', (_mods, pk) => {
    const id = String(pk);
    setTimeout(() => { void syncClient.queue.enqueue('exercise', id); syncClient.schedulePush(); }, 0);
  });

  db.playlists.hook('creating', (_pk, obj) => {
    const id = obj.id;
    setTimeout(() => { void syncClient.queue.enqueue('playlist', id); syncClient.schedulePush(); }, 0);
  });

  db.playlists.hook('updating', (_mods, pk) => {
    const id = String(pk);
    setTimeout(() => { void syncClient.queue.enqueue('playlist', id); syncClient.schedulePush(); }, 0);
  });
}
