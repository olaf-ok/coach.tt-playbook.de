import { db } from './database';
import type { Exercise } from '../types/exercise';

export async function saveExercise(exercise: Exercise): Promise<void> {
  exercise.updatedAt = Date.now();
  // structuredClone unwraps Svelte 5 $state proxies to plain objects,
  // which IndexedDB can persist (otherwise DataCloneError).
  await db.exercises.put(structuredClone(exercise));
}

export async function loadExercise(id: string): Promise<Exercise | undefined> {
  return await db.exercises.get(id);
}

export async function deleteExercise(id: string): Promise<void> {
  await db.exercises.delete(id);
}

export async function listExerciseIds(): Promise<string[]> {
  return await db.exercises.toCollection().primaryKeys();
}

export async function listAllExercises(): Promise<Exercise[]> {
  return await db.exercises.orderBy('updatedAt').reverse().toArray();
}

export async function listActive(): Promise<Exercise[]> {
  const rows = await db.exercises.filter((e) => e.deletedAt === null).toArray();
  return rows.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true })
  );
}

export async function countActive(): Promise<number> {
  return await db.exercises.filter((e) => e.deletedAt === null).count();
}
