import { describe, it, expect, beforeEach } from 'vitest';
import { db } from './database';
import {
  saveExercise,
  loadExercise,
  deleteExercise,
  listExerciseIds,
  listActive,
  countActive
} from './exercises';
import { createEmptyExercise } from '../types/exercise';

describe('exercises DB', () => {
  beforeEach(async () => {
    await db.exercises.clear();
  });

  it('speichert und lädt eine Übung', async () => {
    const ex = createEmptyExercise();
    ex.name = 'Topspin-Drill';
    await saveExercise(ex);

    const loaded = await loadExercise(ex.id);
    expect(loaded?.name).toBe('Topspin-Drill');
    expect(loaded?.id).toBe(ex.id);
  });

  it('listet alle IDs auf', async () => {
    const a = createEmptyExercise();
    const b = createEmptyExercise();
    await saveExercise(a);
    await saveExercise(b);

    const ids = await listExerciseIds();
    expect(ids).toContain(a.id);
    expect(ids).toContain(b.id);
    expect(ids.length).toBe(2);
  });

  it('löscht eine Übung', async () => {
    const ex = createEmptyExercise();
    await saveExercise(ex);
    await deleteExercise(ex.id);

    const loaded = await loadExercise(ex.id);
    expect(loaded).toBeUndefined();
  });

  it('updatedAt wird beim erneuten Speichern aktualisiert', async () => {
    const ex = createEmptyExercise();
    const originalUpdated = ex.updatedAt;
    await saveExercise(ex);

    await new Promise((r) => setTimeout(r, 5));
    ex.name = 'Changed';
    await saveExercise(ex);

    const loaded = await loadExercise(ex.id);
    expect(loaded!.updatedAt).toBeGreaterThan(originalUpdated);
  });
});

describe('listActive', () => {
  beforeEach(async () => {
    await db.exercises.clear();
  });

  it('excludes soft-deleted entries', async () => {
    const a = createEmptyExercise();
    a.id = 'a';
    a.name = 'a';
    a.deletedAt = null;
    await db.exercises.put(a);

    const b = createEmptyExercise();
    b.id = 'b';
    b.name = 'b';
    b.deletedAt = Date.now();
    await db.exercises.put(b);

    const rows = await listActive();
    expect(rows.map((e) => e.id)).toEqual(['a']);
  });
});

describe('countActive', () => {
  beforeEach(async () => {
    await db.exercises.clear();
  });

  it('counts only non-tombstoned entries', async () => {
    const a = createEmptyExercise();
    a.id = 'a';
    a.deletedAt = null;
    await db.exercises.put(a);

    const b = createEmptyExercise();
    b.id = 'b';
    b.deletedAt = Date.now();
    await db.exercises.put(b);

    const c = createEmptyExercise();
    c.id = 'c';
    c.deletedAt = Date.now();
    await db.exercises.put(c);

    expect(await db.exercises.count()).toBe(3);
    expect(await countActive()).toBe(1);
  });
});
