import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDatabase } from '../../../../../server/auth/db';
import { deleteSession } from '../../../../../server/auth/sessions';
import { SESSION_COOKIE_NAME, clearSessionCookie } from '../../../../../server/auth/cookies';

export const POST: RequestHandler = async ({ cookies }) => {
  const token = cookies.get(SESSION_COOKIE_NAME);
  if (token) {
    deleteSession(getDatabase(), token);
  }
  clearSessionCookie(cookies);
  return json({ ok: true });
};
