import { describe, it, expect, beforeEach } from 'vitest';
import { decideInitialAction, collectLocalCount } from './initial-sync';
import { db } from '../db/database';
import { createEmptyExercise } from '../types/exercise';
import { createEmptyPlaylist } from '../types/playlist';

describe('decideInitialAction', () => {
  it('returns noop when both empty', () => {
    expect(decideInitialAction(0, 0).kind).toBe('noop');
  });

  it('returns pull-only when only server has data', () => {
    expect(decideInitialAction(0, 5).kind).toBe('pullOnly');
  });

  it('returns push-only when only local has data', () => {
    expect(decideInitialAction(5, 0).kind).toBe('pushOnly');
  });

  it('returns merge-decision when both have data', () => {
    expect(decideInitialAction(3, 5).kind).toBe('needsMergeChoice');
  });
});

describe('collectLocalCount', () => {
  beforeEach(async () => {
    await db.exercises.clear();
    await db.playlists.clear();
  });

  it('ignores soft-deleted exercises and playlists', async () => {
    const activeEx = createEmptyExercise();
    activeEx.deletedAt = null;
    await db.exercises.put(activeEx);

    const tombEx = createEmptyExercise();
    tombEx.id = 'tomb-ex';
    tombEx.deletedAt = Date.now();
    await db.exercises.put(tombEx);

    const activePl = createEmptyPlaylist();
    activePl.deletedAt = null;
    await db.playlists.put(activePl);

    const tombPl = createEmptyPlaylist();
    tombPl.id = 'tomb-pl';
    tombPl.deletedAt = Date.now();
    await db.playlists.put(tombPl);

    expect(await db.exercises.count()).toBe(2);
    expect(await db.playlists.count()).toBe(2);
    expect(await collectLocalCount()).toBe(2); // 1 aktive Übung + 1 aktive Playlist
  });
});
