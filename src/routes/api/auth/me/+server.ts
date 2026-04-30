import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isAdmin } from '../../../../../server/auth/admin';

export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.user) return json({ error: 'not authenticated' }, { status: 401 });
  return json({ user: { ...locals.user, isAdmin: isAdmin(locals.user) } });
};
