import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDatabase } from '../../../../../server/auth/db';
import { hashPassword } from '../../../../../server/auth/password';
import { createUser, findUserByEmail, EMAIL_REGEX } from '../../../../../server/auth/users';
import { createVerificationToken } from '../../../../../server/auth/verification';
import { sendVerificationMail } from '../../../../../server/auth/mailer';
import { checkAndConsume } from '../../../../../server/auth/ratelimit';

const GENERIC_OK = { message: 'Bestätigungs-Mail verschickt, falls die Adresse gültig ist.' };

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
  const ip = getClientAddress();
  const db = getDatabase();

  if (!checkAndConsume(db, 'signup', `ip:${ip}`)) {
    return json({ error: 'Zu viele Versuche, bitte später erneut.' }, { status: 429 });
  }

  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Ungültiger Request-Body.' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!EMAIL_REGEX.test(email)) {
    return json({ error: 'Ungültige E-Mail-Adresse.' }, { status: 400 });
  }
  if (password.length < 10) {
    return json({ error: 'Passwort muss mindestens 10 Zeichen lang sein.' }, { status: 400 });
  }

  const existing = findUserByEmail(db, email);
  if (existing) {
    // Keine DB-Writes, Response trotzdem generic. Bestehender User ignoriert.
    return json(GENERIC_OK);
  }

  const hash = await hashPassword(password);
  const user = await createUser(db, email, hash);
  const token = createVerificationToken(db, user.id);

  sendVerificationMail(email, token).catch((err) => {
    console.error('sendVerificationMail failed:', err);
  });

  return json(GENERIC_OK);
};
