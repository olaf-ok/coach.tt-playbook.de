import { db } from '../db/database';
import type { EntityType, QueueItem } from './types';

function keyFor(type: EntityType, entityId: string): string {
  return `${type}:${entityId}`;
}

export class PushQueue {
  async enqueue(type: EntityType, entityId: string): Promise<void> {
    await db.syncQueue.put({
      id: keyFor(type, entityId),
      type,
      entityId,
      enqueuedAt: Date.now(),
    });
  }

  async size(): Promise<number> {
    return db.syncQueue.count();
  }

  async snapshot(): Promise<{ exercises: string[]; playlists: string[]; settings: boolean }> {
    const rows = (await db.syncQueue.toArray()) as QueueItem[];
    const exercises: string[] = [];
    const playlists: string[] = [];
    let settings = false;
    for (const r of rows) {
      if (r.type === 'exercise') exercises.push(r.entityId);
      else if (r.type === 'playlist') playlists.push(r.entityId);
      else if (r.type === 'settings') settings = true;
    }
    return { exercises, playlists, settings };
  }

  async ack(result: { exercises: string[]; playlists: string[]; settings: boolean }): Promise<void> {
    const keys: string[] = [
      ...result.exercises.map((id) => keyFor('exercise', id)),
      ...result.playlists.map((id) => keyFor('playlist', id)),
      ...(result.settings ? [keyFor('settings', 'default')] : []),
    ];
    await db.syncQueue.bulkDelete(keys);
  }

  async clear(): Promise<void> {
    await db.syncQueue.clear();
  }
}
