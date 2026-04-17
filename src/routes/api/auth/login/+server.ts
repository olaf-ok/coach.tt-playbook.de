import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDatabase } from '../../../../../server/auth/db';
import { findUserByEmail, EMAIL_REGEX } from '../../../../../server/auth/users';
import { verifyPassword, DUMMY_HASH } from '../../../../../server/auth/password';
import { createSession } from '../../../../../server/auth/sessions';
import { setSessionCookie } from '../../../../../server/auth/cookies';
import { checkAndConsume } from '../../../../../server/auth/ratelimit';

export const POST: RequestHandler = async ({ request, cookies, getClientAddress }) => {
  const ip = getClientAddress();
  const db = getDatabase();

  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Ungültiger Request-Body.' }, { status: 400 });
  }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!EMAIL_REGEX.test(email) || password.length === 0) {
    return json({ error: 'E-Mail oder Passwort falsch.' }, { status: 401 });
  }

  if (!checkAndConsume(db, 'login', `ip:${ip}`) || !checkAndConsume(db, 'login', `email:${email}`)) {
    return json({ error: 'Zu viele Versuche, bitte später erneut.' }, { status: 429 });
  }

  const user = findUserByEmail(db, email);
  // Timing-attack protection: run argon2.verify regardless.
  const hashForCompare = user?.passwordHash ?? DUMMY_HASH;
  const ok = await verifyPassword(hashForCompare, password);

  if (!user || !ok) {
    return json({ error: 'E-Mail oder Passwort falsch.' }, { status: 401 });
  }

  if (!user.emailVerified) {
    return json(
      { error: 'Bitte bestätige zuerst deine E-Mail.', canResend: true },
      { status: 403 },
    );
  }

  const { token } = createSession(db, user.id, {
    userAgent: request.headers.get('user-agent') ?? undefined,
    ip,
  });
  setSessionCookie(cookies, token);

  return json({
    user: {
      id: user.id,
      email: user.email,
      emailVerified: true,
      proUntil: user.proUntil,
    },
  });
};
