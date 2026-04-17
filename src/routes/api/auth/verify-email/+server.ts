import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDatabase } from '../../../../../server/auth/db';
import { consumeVerificationToken } from '../../../../../server/auth/verification';
import { markEmailVerified, findUserById } from '../../../../../server/auth/users';
import { createSession } from '../../../../../server/auth/sessions';
import { setSessionCookie } from '../../../../../server/auth/cookies';

export const POST: RequestHandler = async ({ request, cookies, getClientAddress }) => {
  let body: { token?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Ungültiger Request-Body.' }, { status: 400 });
  }
  const token = typeof body.token === 'string' ? body.token : '';
  if (!token) return json({ error: 'Link ungültig oder abgelaufen.' }, { status: 400 });

  const db = getDatabase();
  const userId = consumeVerificationToken(db, token);
  if (!userId) return json({ error: 'Link ungültig oder abgelaufen.' }, { status: 400 });

  markEmailVerified(db, userId);
  const user = findUserById(db, userId);
  if (!user) return json({ error: 'User nicht gefunden.' }, { status: 400 });

  const { token: sessionToken } = createSession(db, userId, {
    userAgent: request.headers.get('user-agent') ?? undefined,
    ip: getClientAddress(),
  });
  setSessionCookie(cookies, sessionToken);

  return json({
    user: {
      id: user.id,
      email: user.email,
      emailVerified: true,
      proUntil: user.proUntil,
    },
  });
};
