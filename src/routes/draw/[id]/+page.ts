import type { PageLoad } from './$types';
import { loadExercise } from '$lib/db/exercises';
import { browser } from '$app/environment';
import { error } from '@sveltejs/kit';

export const ssr = false;

export const load: PageLoad = async ({ params }) => {
  if (!browser) return { exercise: null };
  const exercise = await loadExercise(params.id);
  if (!exercise) throw error(404, 'Übung nicht gefunden');
  return { exercise };
};
