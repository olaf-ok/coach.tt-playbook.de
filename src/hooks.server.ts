import type { Handle } from '@sveltejs/kit';
import { getDatabase } from '../server/auth/db';
import { validateAndRefreshSession } from '../server/auth/sessions';

const COOKIE_NAME = 'ttp_session';

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get(COOKIE_NAME);
	if (!token) {
		event.locals.user = null;
		return resolve(event);
	}
	const db = getDatabase();
	const user = validateAndRefreshSession(db, token);
	event.locals.user = user;
	if (!user) {
		event.cookies.delete(COOKIE_NAME, { path: '/' });
	}
	return resolve(event);
};
