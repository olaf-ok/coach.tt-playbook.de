import { describe, it, expect } from 'vitest';

describe('auth deps smoke test', () => {
	it('better-sqlite3 kann in-memory DB öffnen', async () => {
		const BetterSqlite3 = (await import('better-sqlite3')).default;
		const db = new BetterSqlite3(':memory:');
		const result = db.prepare('SELECT 1 AS one').get() as { one: number };
		expect(result.one).toBe(1);
		db.close();
	});

	it('argon2 kann Passwort hashen und verifizieren', async () => {
		const argon2 = await import('argon2');
		const hash = await argon2.hash('test-password');
		expect(await argon2.verify(hash, 'test-password')).toBe(true);
		expect(await argon2.verify(hash, 'wrong')).toBe(false);
	});

	it('uuid exportiert v7', async () => {
		const { v7 } = await import('uuid');
		const id = v7();
		expect(id).toMatch(/^[0-9a-f-]{36}$/);
	});
});
