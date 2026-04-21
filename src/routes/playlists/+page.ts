import type { PageLoad } from './$types';
import { listActive as listActivePlaylists } from '$lib/db/playlists';
import { listActive as listActiveExercises } from '$lib/db/exercises';
import { browser } from '$app/environment';

export const ssr = false;

export const load: PageLoad = async () => {
  if (!browser) return { playlists: [], exercises: [] };
  const [playlists, exercises] = await Promise.all([
    listActivePlaylists(),
    listActiveExercises(),
  ]);
  return { playlists, exercises };
};
