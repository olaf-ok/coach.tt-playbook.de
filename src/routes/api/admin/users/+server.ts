import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isAdmin } from '../../../../../server/auth/admin';
import { getDatabase } from '../../../../../server/auth/db';
import { getSyncStats, listUsers } from '../../../../../server/auth/users';

export const GET: RequestHandler = async ({ locals }) => {
  if (!isAdmin(locals.user)) throw error(404);
  const db = getDatabase();
  const users = listUsers(db).map((u) => ({ ...u, sync: getSyncStats(db, u.id) }));
  return json({ users });
};
