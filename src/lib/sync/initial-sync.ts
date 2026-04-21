import { db } from '../db/database';
import { syncClient } from './client.svelte';
import { listActive as listActiveExercises } from '../db/exercises';
import { listActive as listActivePlaylists } from '../db/playlists';

export type InitialAction =
  | { kind: 'noop' }
  | { kind: 'pullOnly' }
  | { kind: 'pushOnly' }
  | { kind: 'needsMergeChoice' };

export function decideInitialAction(localCount: number, serverCount: number): InitialAction {
  if (localCount === 0 && serverCount === 0) return { kind: 'noop' };
  if (localCount === 0) return { kind: 'pullOnly' };
  if (serverCount === 0) return { kind: 'pushOnly' };
  return { kind: 'needsMergeChoice' };
}

export async function collectLocalCount(): Promise<number> {
  const [ex, pl] = await Promise.all([listActiveExercises(), listActivePlaylists()]);
  return ex.length + pl.length;
}

export async function pushAllLocalAsNew(): Promise<void> {
  const [ex, pl] = await Promise.all([listActiveExercises(), listActivePlaylists()]);
  const now = Date.now();
  await db.transaction('rw', db.exercises, db.playlists, async () => {
    for (const e of ex) await db.exercises.update(e.id, { updatedAt: now });
    for (const p of pl) await db.playlists.update(p.id, { updatedAt: now });
  });
  for (const e of ex) await syncClient.queue.enqueue('exercise', e.id);
  for (const p of pl) await syncClient.queue.enqueue('playlist', p.id);
  await syncClient.push();
}

export async function discardLocalAndPull(): Promise<void> {
  await db.exercises.clear();
  await db.playlists.clear();
  await db.settings.clear();
  localStorage.removeItem('tt-sync-last-at');
  await syncClient.pull();
}
