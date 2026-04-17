import BetterSqlite3 from 'better-sqlite3';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export type AuthDatabase = BetterSqlite3.Database;

const CURRENT_USER_VERSION = 1;

const MIGRATIONS: Record<number, string> = {
  1: readFileSync(resolve(__dirname, 'schema.sql'), 'utf8'),
};

export function openDatabase(path: string): AuthDatabase {
  const db = new BetterSqlite3(path);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
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
      db.pragma(`user_version = ${next}`);
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
    version = next;
  }
}

let singleton: AuthDatabase | null = null;

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
