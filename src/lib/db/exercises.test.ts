import { describe, it, expect, beforeEach } from 'vitest';
import { db } from './database';
import { saveExercise, loadExercise, deleteExercise, listExerciseIds } from './exercises';
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
