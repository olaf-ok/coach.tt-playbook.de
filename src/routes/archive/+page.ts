import type { PageLoad } from './$types';
import { listAllExercises } from '$lib/db/exercises';
import { browser } from '$app/environment';

export const ssr = false;

export const load: PageLoad = async () => {
  if (!browser) return { exercises: [] };
  return { exercises: await listAllExercises() };
};
