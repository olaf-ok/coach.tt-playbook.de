import { describe, expect, it } from 'vitest';
import { openDatabase, resetSingletonForTests } from '../auth/db';

describe('sync schema v3', () => {
  it('creates sync_exercises, sync_playlists, sync_settings tables', () => {
    resetSingletonForTests();
    const db = openDatabase(':memory:');
    const tables = db
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`)
      .all()
      .map((r) => (r as { name: string }).name);
    expect(tables).toContain('sync_exercises');
    expect(tables).toContain('sync_playlists');
    expect(tables).toContain('sync_settings');
  });

  it('bumps user_version to 3', () => {
    resetSingletonForTests();
    const db = openDatabase(':memory:');
    const row = db.prepare('PRAGMA user_version').get() as { user_version: number };
    expect(row.user_version).toBe(3);
  });
});
