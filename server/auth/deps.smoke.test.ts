import { describe, it, expect } from 'vitest';

describe('auth deps smoke test', () => {
	it('node:sqlite ist verfügbar', async () => {
		const { DatabaseSync } = await import('node:sqlite');
		const db = new DatabaseSync(':memory:');
		const result = db.prepare('SELECT 1 AS one').get() as { one: number };
		expect(result.one).toBe(1);
		db.close();
	});

	it('@node-rs/argon2 kann Passwort hashen und verifizieren', async () => {
		const { hash, verify } = await import('@node-rs/argon2');
		const hashed = await hash('test-password');
		expect(await verify(hashed, 'test-password')).toBe(true);
		expect(await verify(hashed, 'wrong')).toBe(false);
	});

	it('uuid exportiert v7', async () => {
		const { v7 } = await import('uuid');
		const id = v7();
		expect(id).toMatch(/^[0-9a-f-]{36}$/);
	});
});
