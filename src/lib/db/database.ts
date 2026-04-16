import Dexie, { type Table } from 'dexie';
import type { Exercise } from '../types/exercise';
import type { Playlist } from '../types/playlist';
import { migrateStrokeType } from './migrations';

class TTPlaybookDB extends Dexie {
  exercises!: Table<Exercise, string>;
  playlists!: Table<Playlist, string>;

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
            ex.strokes = ex.strokes.map((s) => ({
              ...s,
              strokeType: migrateStrokeType(s.strokeType as unknown as string | null)
            }));
          });
      });
  }
}

export const db = new TTPlaybookDB();
