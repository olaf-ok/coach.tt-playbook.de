import { json, error } from '@sveltejs/kit';
import { getDatabase } from '../../../../server/auth/db';
import type { RequestHandler } from '@sveltejs/kit';

const MAX_TRAINER_NAME = 60;

export const GET: RequestHandler = async (event) => {
  const user = event.locals.user;
  if (!user) throw error(401);
  return json({ trainerName: user.trainerName });
};

export const PUT: RequestHandler = async (event) => {
  const user = event.locals.user;
  if (!user) throw error(401);

  let body: { trainerName?: unknown };
  try {
    body = await event.request.json();
  } catch {
    throw error(400, 'invalid json');
  }

  const raw = typeof body.trainerName === 'string' ? body.trainerName.trim() : '';
  const trainerName = raw.slice(0, MAX_TRAINER_NAME) || null;

  const db = getDatabase();
  db.prepare(`UPDATE users SET trainer_name = ?, updated_at = ? WHERE id = ?`).run(
    trainerName,
    Date.now(),
    user.id,
  );

  return json({ trainerName });
};
