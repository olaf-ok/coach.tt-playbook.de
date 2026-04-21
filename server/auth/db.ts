import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { SCHEMA_V1, SCHEMA_V2 } from './schema';
import { SCHEMA_V3 } from '../sync/schema';

export type AuthDatabase = DatabaseSync;

const CURRENT_USER_VERSION = 3;

const MIGRATIONS: Record<number, string> = {
  1: SCHEMA_V1,
  2: SCHEMA_V2,
  3: SCHEMA_V3,
};

export function openDatabase(path: string): AuthDatabase {
  if (path !== ':memory:') {
    mkdirSync(dirname(path), { recursive: true });
  }
  const db = new DatabaseSync(path);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  migrate(db);
  return db;
}

function migrate(db: AuthDatabase): void {
  const row = db.prepare('PRAGMA user_version').get() as { user_version: number };
  let version = row.user_version;
  while (version < CURRENT_USER_VERSION) {
    const next = version + 1;
    const sql = MIGRATIONS[next];
    if (!sql) throw new Error(`Missing migration for version ${next}`);
    db.exec('BEGIN');
    try {
      db.exec(sql);
      db.exec(`PRAGMA user_version = ${next}`);
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
    version = next;
  }
}

let singleton: AuthDatabase | null = null;

// Should be called once at server boot (see server/production.ts) so that
// subsequent concurrent request handlers never race to initialize.
export function getDatabase(): AuthDatabase {
  if (singleton) return singleton;
  const path = process.env.AUTH_DB_PATH ?? resolve(process.cwd(), 'data', 'auth.db');
  singleton = openDatabase(path);
  return singleton;
}

export function resetSingletonForTests(): void {
  if (singleton) {
    singleton.close();
    singleton = null;
  }
}
