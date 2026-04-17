import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDatabase } from '../../../../../server/auth/db';
import { consumeResetToken } from '../../../../../server/auth/reset';
import { findUserById, updatePasswordHash } from '../../../../../server/auth/users';
import { hashPassword } from '../../../../../server/auth/password';
import { createSession, deleteAllUserSessions } from '../../../../../server/auth/sessions';
import { setSessionCookie } from '../../../../../server/auth/cookies';

export const POST: RequestHandler = async ({ request, cookies, getClientAddress }) => {
  let body: { token?: unknown; newPassword?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Ungültiger Request-Body.' }, { status: 400 });
  }
  const token = typeof body.token === 'string' ? body.token : '';
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

  if (newPassword.length < 10) {
    return json({ error: 'Passwort muss mindestens 10 Zeichen lang sein.' }, { status: 400 });
  }

  const db = getDatabase();
  const userId = consumeResetToken(db, token);
  if (!userId) return json({ error: 'Link ungültig oder abgelaufen.' }, { status: 400 });

  const newHash = await hashPassword(newPassword);
  updatePasswordHash(db, userId, newHash);
  deleteAllUserSessions(db, userId);

  const user = findUserById(db, userId);
  if (!user) return json({ error: 'User nicht gefunden.' }, { status: 400 });

  const { token: sessionToken } = createSession(db, userId, {
    userAgent: request.headers.get('user-agent') ?? undefined,
    ip: getClientAddress(),
  });
  setSessionCookie(cookies, sessionToken);

  return json({
    user: { id: user.id, email: user.email, emailVerified: user.emailVerified, proUntil: user.proUntil },
  });
};
