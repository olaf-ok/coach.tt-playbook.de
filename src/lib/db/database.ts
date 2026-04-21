import Dexie, { type Table } from 'dexie';
import type { Exercise } from '../types/exercise';
import type { Playlist } from '../types/playlist';
import type { SettingsRecord } from '../types/settings';
import { migrateStrokeType } from './migrations';

class TTPlaybookDB extends Dexie {
  exercises!: Table<Exercise, string>;
  playlists!: Table<Playlist, string>;
  settings!: Table<SettingsRecord, string>;
  syncQueue!: Table<{ id: string; type: 'exercise' | 'playlist' | 'settings'; entityId: string; enqueuedAt: number }, string>;

  constructor() {
    super('tt-playbook-trainer');
    this.version(1).stores({
      exercises: 'id, name, createdAt, updatedAt'
    });
    this.version(2).stores({
      exercises: 'id, name, createdAt, updatedAt',
      playlists: 'id, name, createdAt, updatedAt'
    });
    this.version(3)
      .stores({
        exercises: 'id, name, createdAt, updatedAt',
        playlists: 'id, name, createdAt, updatedAt'
      })
      .upgrade(async (tx) => {
        await tx
          .table('exercises')
          .toCollection()
          .modify((ex: Exercise) => {
            ex.strokes = (ex.strokes ?? []).map((s) => ({
              ...s,
              strokeType: migrateStrokeType(
                (s.strokeType ?? null) as unknown as string | null
              )
            }));
          });
      });
    this.version(4)
      .stores({
        exercises: 'id, name, createdAt, updatedAt, deletedAt',
        playlists: 'id, name, createdAt, updatedAt, deletedAt',
        settings: 'id, updatedAt',
        syncQueue: 'id, type, entityId, enqueuedAt'
      })
      .upgrade(async (tx) => {
        const now = Date.now();
        await tx
          .table('exercises')
          .toCollection()
          .modify((e: Exercise) => {
            e.updatedAt ??= now;
            e.deletedAt ??= null;
          });
        await tx
          .table('playlists')
          .toCollection()
          .modify((p: Playlist) => {
            p.updatedAt ??= now;
            p.deletedAt ??= null;
          });
      });
  }
}

export const db = new TTPlaybookDB();
