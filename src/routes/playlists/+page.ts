import type { PageLoad } from './$types';
import { listAllPlaylists } from '$lib/db/playlists';
import { listAllExercises } from '$lib/db/exercises';
import { browser } from '$app/environment';

export const ssr = false;

export const load: PageLoad = async () => {
  if (!browser) return { playlists: [], exercises: [] };
  const [playlists, exercises] = await Promise.all([
    listAllPlaylists(),
    listAllExercises(),
  ]);
  return { playlists, exercises };
};
