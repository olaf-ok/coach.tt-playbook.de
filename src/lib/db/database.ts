import Dexie, { type Table } from 'dexie';
import type { Exercise } from '../types/exercise';

class TTPlaybookDB extends Dexie {
  exercises!: Table<Exercise, string>;

  constructor() {
    super('tt-playbook-trainer');
    this.version(1).stores({
      exercises: 'id, name, createdAt, updatedAt',
    });
  }
}

export const db = new TTPlaybookDB();
