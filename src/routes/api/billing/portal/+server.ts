import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDatabase } from '../../../../../server/auth/db';
import { findUserById } from '../../../../../server/auth/users';
import { createPortalSession } from '../../../../../server/billing/portal';

export const POST: RequestHandler = async ({ locals }) => {
  if (!locals.user) throw error(401, 'Nicht angemeldet');

  const db = getDatabase();
  const user = findUserById(db, locals.user.id);
  if (!user?.stripeCustomerId) {
    throw error(400, 'Kein Abo zum Verwalten');
  }

  const appUrl = process.env.APP_URL;
  if (!appUrl) throw error(500, 'APP_URL nicht konfiguriert');

  const url = await createPortalSession(
    user.stripeCustomerId,
    `${appUrl}/settings/account`,
  );
  return json({ url });
};
