import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDatabase } from '../../../../../server/auth/db';
import { findUserByEmail, EMAIL_REGEX } from '../../../../../server/auth/users';
import { createVerificationToken } from '../../../../../server/auth/verification';
import { sendVerificationMail, detectLang } from '../../../../../server/auth/mailer';
import { checkAndConsume } from '../../../../../server/auth/ratelimit';

const GENERIC_OK = { message: 'Falls registriert, wurde eine Bestätigungs-Mail verschickt.' };

export const POST: RequestHandler = async ({ request }) => {
  const lang = detectLang(request.headers.get('accept-language'));
  let body: { email?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Ungültiger Request-Body.' }, { status: 400 });
  }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!EMAIL_REGEX.test(email)) return json(GENERIC_OK);

  const db = getDatabase();
  if (!checkAndConsume(db, 'resendVerification', `email:${email}`)) {
    return json({ error: 'Zu viele Versuche, bitte später erneut.' }, { status: 429 });
  }

  const user = findUserByEmail(db, email);
  if (user && !user.emailVerified) {
    const token = createVerificationToken(db, user.id);
    sendVerificationMail(email, token, lang).catch((err) => console.error('sendVerificationMail failed:', err));
  }
  return json(GENERIC_OK);
};
