import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getDatabase } from '../../../../../server/auth/db';
import { checkAndConsume } from '../../../../../server/auth/ratelimit';
import { applyChanges } from '../../../../../server/sync/push';
import { PushPayloadSchema, MAX_PAYLOAD_BYTES } from '../../../../../server/sync/payload';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
  if (env.SYNC_ENABLED === 'false') {
    return new Response('sync disabled', { status: 503, headers: { 'Retry-After': '300' } });
  }

  const user = event.locals.user;
  if (!user) throw error(401);

  const db = getDatabase();
  if (!checkAndConsume(db, 'syncPush', `user:${user.id}`)) {
    return new Response('rate limited', { status: 429, headers: { 'Retry-After': '60' } });
  }

  const contentLength = Number(event.request.headers.get('content-length') ?? 0);
  if (contentLength > MAX_PAYLOAD_BYTES) throw error(413, 'payload too large');

  let body: unknown;
  try {
    body = await event.request.json();
  } catch {
    throw error(400, 'invalid json');
  }

  const parsed = PushPayloadSchema.safeParse(body);
  if (!parsed.success) throw error(400, 'invalid payload');

  const result = applyChanges(db, user.id, parsed.data);
  return json(result);
};
