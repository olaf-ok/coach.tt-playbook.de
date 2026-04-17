import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../server/auth/db', async () => {
	const BetterSqlite3 = (await import('better-sqlite3')).default;
	const fs = await import('node:fs');
	const path = await import('node:path');
	const url = await import('node:url');
	const here = path.dirname(url.fileURLToPath(import.meta.url));
	const memDb = new BetterSqlite3(':memory:');
	const schemaSql = fs.readFileSync(
		path.resolve(here, '../server/auth/schema.sql'),
		'utf8',
	);
	memDb.pragma('foreign_keys = ON');
	memDb.exec(schemaSql);
	memDb.pragma('user_version = 1');
	return {
		getDatabase: () => memDb,
		resetSingletonForTests: () => {},
	};
});

import { handle } from './hooks.server';
import { getDatabase } from '../server/auth/db';
import { createSession } from '../server/auth/sessions';

function mkEvent(cookieHeader: string | null): any {
	const cookies = {
		get(name: string) {
			if (!cookieHeader) return undefined;
			const match = cookieHeader.match(new RegExp(`(^|;\\s*)${name}=([^;]*)`));
			return match ? match[2] : undefined;
		},
		delete: vi.fn(),
	};
	return {
		cookies,
		locals: {},
		request: new Request('http://localhost/'),
	};
}

describe('hooks.server', () => {
	beforeEach(() => {
		const db = getDatabase();
		db.exec(`DELETE FROM sessions; DELETE FROM users;`);
		db.prepare(
			`INSERT INTO users (id, email, password_hash, email_verified, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
		).run('u1', 'user@example.de', 'hash', 1, 1, 1);
	});

	it('setzt locals.user = null ohne Cookie', async () => {
		const event = mkEvent(null);
		await handle({ event, resolve: async () => new Response('ok') });
		expect(event.locals.user).toBeNull();
	});

	it('setzt locals.user bei gültigem Cookie', async () => {
		const { token } = createSession(getDatabase(), 'u1');
		const event = mkEvent(`ttp_session=${token}`);
		await handle({ event, resolve: async () => new Response('ok') });
		expect(event.locals.user?.email).toBe('user@example.de');
	});

	it('setzt locals.user = null bei ungültigem Cookie', async () => {
		const event = mkEvent(`ttp_session=garbage`);
		await handle({ event, resolve: async () => new Response('ok') });
		expect(event.locals.user).toBeNull();
	});
});
