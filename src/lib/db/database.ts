import Dexie, { type Table } from 'dexie';
import type { Exercise } from '../types/exercise';
import type { Playlist } from '../types/playlist';

class TTPlaybookDB extends Dexie {
  exercises!: Table<Exercise, string>;
  playlists!: Table<Playlist, string>;

  constructor() {
    super('tt-playbook-trainer');
    this.version(1).stores({
      exercises: 'id, name, createdAt, updatedAt',
    });
    this.version(2).stores({
      exercises: 'id, name, createdAt, updatedAt',
      playlists: 'id, name, createdAt, updatedAt',
    });
  }
}

export const db = new TTPlaybookDB();
