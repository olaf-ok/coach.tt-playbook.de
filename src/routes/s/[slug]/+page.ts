import { browser } from '$app/environment';
import type { LoadEvent } from '@sveltejs/kit';
import type { Exercise } from '$lib/types/exercise';

export interface SharePageData {
  exercise: Exercise | null;
  trainerEmail: string | null;
  trainerName: string | null;
  message: string | null;
  expiresAt: number | null;
  error: number | null;
}

export const load = async ({ params, fetch }: LoadEvent): Promise<SharePageData> => {
  if (!browser) {
    return { exercise: null, trainerEmail: null, trainerName: null, message: null, expiresAt: null, error: null };
  }

  const res = await fetch(`/api/shares/${(params as { slug: string }).slug}`);
  if (!res.ok) {
    return { exercise: null, trainerEmail: null, trainerName: null, message: null, expiresAt: null, error: res.status };
  }

  const data = await res.json();
  return {
    exercise: data.exercise,
    trainerEmail: data.trainerEmail,
    trainerName: data.trainerName ?? null,
    message: data.message,
    expiresAt: data.expiresAt,
    error: null,
  };
};
