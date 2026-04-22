import { json, error } from '@sveltejs/kit';
import { getDatabase } from '../../../../../server/auth/db';
import { checkAndConsume } from '../../../../../server/auth/ratelimit';
import { getShareData, deleteShare } from '../../../../../server/shares/shares';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async (event) => {
  const ip = event.getClientAddress();
  const db = getDatabase();

  if (!checkAndConsume(db, 'shareView', `ip:${ip}`)) {
    return new Response('rate limited', { status: 429, headers: { 'Retry-After': '60' } });
  }

  const data = getShareData(db, (event.params as { slug: string }).slug);
  if (!data) throw error(404);

  return json(data);
};

export const DELETE: RequestHandler = async (event) => {
  const user = event.locals.user;
  if (!user) throw error(401);

  const db = getDatabase();
  const deleted = deleteShare(db, (event.params as { slug: string }).slug, user.id);
  if (!deleted) throw error(403);

  return json({ ok: true });
};
