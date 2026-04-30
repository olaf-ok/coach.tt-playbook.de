import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDatabase } from '../../../../../server/auth/db';
import { findUserByEmail, EMAIL_REGEX } from '../../../../../server/auth/users';
import { createResetToken } from '../../../../../server/auth/reset';
import { sendResetMail, detectLang } from '../../../../../server/auth/mailer';
import { checkAndConsume } from '../../../../../server/auth/ratelimit';

const GENERIC_OK = { message: 'Falls registriert, wurde ein Reset-Link verschickt.' };

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
  if (!checkAndConsume(db, 'reset', `email:${email}`)) {
    return json({ error: 'Zu viele Versuche, bitte später erneut.' }, { status: 429 });
  }

  const user = findUserByEmail(db, email);
  if (user) {
    const token = createResetToken(db, user.id);
    sendResetMail(email, token, lang).catch((err) => console.error('sendResetMail failed:', err));
  }
  return json(GENERIC_OK);
};
