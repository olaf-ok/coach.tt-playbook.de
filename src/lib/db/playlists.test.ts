import { describe, it, expect, beforeEach } from 'vitest';
import { db } from './database';
import {
  savePlaylist,
  loadPlaylist,
  deletePlaylist,
  listAllPlaylists,
  listActive,
} from './playlists';
import { createEmptyPlaylist } from '../types/playlist';

describe('playlists DB', () => {
  beforeEach(async () => {
    await db.playlists.clear();
  });

  it('speichert und lädt eine Playlist', async () => {
    const p = createEmptyPlaylist();
    p.name = 'Aufschlag';
    p.exerciseIds = ['ex-1', 'ex-2'];
    await savePlaylist(p);

    const loaded = await loadPlaylist(p.id);
    expect(loaded?.name).toBe('Aufschlag');
    expect(loaded?.exerciseIds).toEqual(['ex-1', 'ex-2']);
  });

  it('updatedAt wird beim Speichern aktualisiert', async () => {
    const p = createEmptyPlaylist();
    const before = p.updatedAt;
    await savePlaylist(p);
    await new Promise((r) => setTimeout(r, 5));
    p.name = 'Geändert';
    await savePlaylist(p);

    const loaded = await loadPlaylist(p.id);
    expect(loaded!.updatedAt).toBeGreaterThan(before);
  });

  it('listet alle Playlists nach updatedAt absteigend', async () => {
    const a = createEmptyPlaylist();
    a.name = 'Alt';
    await savePlaylist(a);
    await new Promise((r) => setTimeout(r, 5));
    const b = createEmptyPlaylist();
    b.name = 'Neu';
    await savePlaylist(b);

    const all = await listAllPlaylists();
    expect(all.map((p) => p.name)).toEqual(['Neu', 'Alt']);
  });

  it('löscht eine Playlist', async () => {
    const p = createEmptyPlaylist();
    await savePlaylist(p);
    await deletePlaylist(p.id);
    expect(await loadPlaylist(p.id)).toBeUndefined();
  });
});

describe('listActive', () => {
  beforeEach(async () => {
    await db.playlists.clear();
  });

  it('excludes soft-deleted entries', async () => {
    const a = createEmptyPlaylist();
    a.id = 'a';
    a.name = 'a';
    a.deletedAt = null;
    await db.playlists.put(a);

    const b = createEmptyPlaylist();
    b.id = 'b';
    b.name = 'b';
    b.deletedAt = Date.now();
    await db.playlists.put(b);

    const rows = await listActive();
    expect(rows.map((p) => p.id)).toEqual(['a']);
  });
});
