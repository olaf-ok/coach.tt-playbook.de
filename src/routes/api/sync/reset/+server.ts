import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getDatabase } from '../../../../../server/auth/db';
import { checkAndConsume } from '../../../../../server/auth/ratelimit';
import { resetUserData } from '../../../../../server/sync/reset';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
  if (env.SYNC_ENABLED === 'false') {
    return new Response('sync disabled', { status: 503, headers: { 'Retry-After': '300' } });
  }

  const user = event.locals.user;
  if (!user) throw error(401);

  const db = getDatabase();
  if (!checkAndConsume(db, 'syncReset', `user:${user.id}`)) {
    return new Response('rate limited', { status: 429, headers: { 'Retry-After': '3600' } });
  }

  resetUserData(db, user.id);
  return json({ serverTime: Date.now() });
};
