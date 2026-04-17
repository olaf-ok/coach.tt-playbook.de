import type { Handle } from '@sveltejs/kit';
import { getDatabase } from '../server/auth/db';
import { validateAndRefreshSession } from '../server/auth/sessions';
import { SESSION_COOKIE_NAME } from '../server/auth/cookies';

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get(SESSION_COOKIE_NAME);
	if (!token) {
		event.locals.user = null;
		return resolve(event);
	}
	const db = getDatabase();
	const user = validateAndRefreshSession(db, token);
	event.locals.user = user;
	if (!user) {
		event.cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
	}
	return resolve(event);
};
