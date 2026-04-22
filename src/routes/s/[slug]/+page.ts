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
  slug: string;
}

export const load = async ({ params, fetch }: LoadEvent): Promise<SharePageData> => {
  const slug = (params as { slug: string }).slug;

  if (!browser) {
    return { exercise: null, trainerEmail: null, trainerName: null, message: null, expiresAt: null, error: null, slug };
  }

  const res = await fetch(`/api/shares/${slug}`);
  if (!res.ok) {
    return { exercise: null, trainerEmail: null, trainerName: null, message: null, expiresAt: null, error: res.status, slug };
  }

  const data = await res.json();
  return {
    exercise: data.exercise,
    trainerEmail: data.trainerEmail,
    trainerName: data.trainerName ?? null,
    message: data.message,
    expiresAt: data.expiresAt,
    error: null,
    slug,
  };
};
