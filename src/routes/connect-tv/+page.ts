import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const ssr = false;

export const load: PageLoad = ({ url }) => {
  const code = url.searchParams.get('code');
  const target = code ? `/settings/tv?code=${code}` : '/settings/tv';
  throw redirect(307, target);
};
