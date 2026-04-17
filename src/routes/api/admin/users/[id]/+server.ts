import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isAdmin } from '../../../../../../server/auth/admin';
import { getDatabase } from '../../../../../../server/auth/db';
import {
  deleteUser,
  findUserById,
  markEmailVerified,
  setProUntil,
} from '../../../../../../server/auth/users';
import { deleteAllUserSessions } from '../../../../../../server/auth/sessions';

export const PATCH: RequestHandler = async ({ locals, params, request }) => {
  if (!isAdmin(locals.user)) throw error(404);

  const id = params.id!;
  const db = getDatabase();
  if (!findUserById(db, id)) throw error(404, 'User nicht gefunden');

  let body: { emailVerified?: unknown; proUntil?: unknown };
  try {
    body = await request.json();
  } catch {
    throw error(400, 'Ungültiger Request-Body');
  }

  if (body.emailVerified === true) {
    markEmailVerified(db, id);
  }
  if (body.proUntil !== undefined) {
    const v = body.proUntil;
    if (v === null || typeof v === 'number') {
      setProUntil(db, id, v);
    } else {
      throw error(400, 'proUntil muss null oder eine Zahl sein');
    }
  }

  return json({ ok: true });
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
  if (!isAdmin(locals.user)) throw error(404);

  const id = params.id!;
  const db = getDatabase();
  // Sessions werden durch CASCADE mitgelöscht, aber explizit macht's offensichtlich.
  deleteAllUserSessions(db, id);
  deleteUser(db, id);
  return json({ ok: true });
};
