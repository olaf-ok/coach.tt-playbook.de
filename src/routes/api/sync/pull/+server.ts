import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getDatabase } from '../../../../../server/auth/db';
import { checkAndConsume } from '../../../../../server/auth/ratelimit';
import { getChangesSince } from '../../../../../server/sync/pull';
import { PullQuerySchema } from '../../../../../server/sync/payload';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
  if (env.SYNC_ENABLED === 'false') {
    return new Response('sync disabled', { status: 503, headers: { 'Retry-After': '300' } });
  }

  const user = event.locals.user;
  if (!user) throw error(401);

  const db = getDatabase();
  if (!checkAndConsume(db, 'syncPull', `user:${user.id}`)) {
    return new Response('rate limited', { status: 429, headers: { 'Retry-After': '60' } });
  }

  const parsed = PullQuerySchema.safeParse({
    since: event.url.searchParams.get('since') ?? undefined,
  });
  if (!parsed.success) throw error(400, 'invalid since');

  const payload = getChangesSince(db, user.id, parsed.data.since ?? 0);
  return json(payload);
};
