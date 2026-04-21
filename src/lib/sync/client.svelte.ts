import { db } from '../db/database';
import { PushQueue } from './queue';
import { syncStatus } from './status.svelte';
import type { Exercise } from '../types/exercise';
import type { Playlist } from '../types/playlist';
import type { SettingsRecord } from '../types/settings';

const LAST_SYNC_KEY = 'tt-sync-last-at';

function getLastSyncAt(): number {
  const raw = localStorage.getItem(LAST_SYNC_KEY);
  return raw ? Number(raw) || 0 : 0;
}

function setLastSyncAt(n: number) {
  localStorage.setItem(LAST_SYNC_KEY, String(n));
}

async function refreshQueueSize(q: PushQueue) {
  syncStatus.updateQueueSize(await q.size());
}

function createClient() {
  const queue = new PushQueue();
  let currentUserId: string | null = null;
  let pushTimer: ReturnType<typeof setTimeout> | null = null;

  async function pull(): Promise<void> {
    if (!currentUserId) return;
    syncStatus.startSync();
    try {
      const since = getLastSyncAt();
      const url = since ? `/api/sync/pull?since=${since}` : '/api/sync/pull';
      const res = await fetch(url);
      if (!res.ok) throw new Error(`pull ${res.status}`);
      const payload = await res.json();

      await db.transaction('rw', db.exercises, db.playlists, db.settings, async () => {
        for (const ex of payload.exercises) {
          await db.exercises.put({
            ...(ex.data as Exercise),
            deletedAt: ex.deletedAt,
            updatedAt: ex.updatedAt,
          });
        }
        for (const pl of payload.playlists) {
          await db.playlists.put({
            ...(pl.data as Playlist),
            deletedAt: pl.deletedAt,
            updatedAt: pl.updatedAt,
          });
        }
        if (payload.settings) {
          await db.settings.put({
            id: 'default',
            updatedAt: payload.settings.updatedAt,
            data: payload.settings.data,
          } as SettingsRecord);
        }
      });

      setLastSyncAt(payload.serverTime);
      syncStatus.syncSucceeded();
    } catch (e) {
      syncStatus.syncFailed((e as Error).message);
    }
  }

  async function push(): Promise<void> {
    if (!currentUserId) return;
    const snap = await queue.snapshot();
    if (!snap.exercises.length && !snap.playlists.length && !snap.settings) return;

    syncStatus.startSync();
    try {
      const exercises = await Promise.all(
        snap.exercises.map(async (id) => {
          const e = await db.exercises.get(id);
          return e ? { id, updatedAt: e.updatedAt, deletedAt: e.deletedAt, data: e } : null;
        })
      );
      const playlists = await Promise.all(
        snap.playlists.map(async (id) => {
          const p = await db.playlists.get(id);
          return p ? { id, updatedAt: p.updatedAt, deletedAt: p.deletedAt, data: p } : null;
        })
      );
      const settingsRow = snap.settings ? await db.settings.get('default') : null;

      const body = {
        exercises: exercises.filter(Boolean),
        playlists: playlists.filter(Boolean),
        settings: settingsRow
          ? { updatedAt: settingsRow.updatedAt, data: settingsRow.data }
          : null,
      };

      const res = await fetch('/api/sync/push', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`push ${res.status}`);
      const result = await res.json();
      await queue.ack({
        exercises: [...result.accepted.exercises, ...result.rejected.exercises],
        playlists: [...result.accepted.playlists, ...result.rejected.playlists],
        settings: result.accepted.settings || result.rejected.settings,
      });
      await refreshQueueSize(queue);
      syncStatus.syncSucceeded();
    } catch (e) {
      syncStatus.syncFailed((e as Error).message);
    }
  }

  function schedulePush() {
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(() => void push(), 500);
    void refreshQueueSize(queue);
  }

  async function init(userId: string): Promise<void> {
    if (currentUserId && currentUserId !== userId) {
      await clearLocal();
    }
    currentUserId = userId;
    await refreshQueueSize(queue);
    await pull();
  }

  async function clearLocal(): Promise<void> {
    currentUserId = null;
    localStorage.removeItem(LAST_SYNC_KEY);
    await queue.clear();
    await db.exercises.clear();
    await db.playlists.clear();
    await db.settings.clear();
    syncStatus.reset();
  }

  async function reset(): Promise<void> {
    if (!currentUserId) return;
    const res = await fetch('/api/sync/reset', { method: 'POST' });
    if (!res.ok) throw new Error(`reset ${res.status}`);
    await queue.clear();
    localStorage.removeItem(LAST_SYNC_KEY);
    await db.exercises.clear();
    await db.playlists.clear();
    await db.settings.clear();
    await pull();
  }

  return {
    init,
    pull,
    push,
    reset,
    clearLocal,
    schedulePush,
    get queue() {
      return queue;
    },
  };
}

export const syncClient = createClient();
