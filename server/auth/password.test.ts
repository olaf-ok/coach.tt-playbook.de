import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, DUMMY_HASH } from './password';

describe('password', () => {
  it('hasht und verifiziert korrektes Passwort', async () => {
    const hash = await hashPassword('correcthorsebatterystaple');
    expect(hash).toMatch(/^\$argon2id\$/);
    expect(await verifyPassword(hash, 'correcthorsebatterystaple')).toBe(true);
  });

  it('lehnt falsches Passwort ab', async () => {
    const hash = await hashPassword('richtig');
    expect(await verifyPassword(hash, 'falsch')).toBe(false);
  });

  it('produziert unterschiedliche Hashes bei gleichem Passwort (Salt)', async () => {
    const a = await hashPassword('same');
    const b = await hashPassword('same');
    expect(a).not.toBe(b);
    expect(await verifyPassword(a, 'same')).toBe(true);
    expect(await verifyPassword(b, 'same')).toBe(true);
  });

  it('verifyPassword gibt false bei ungültigem Hash-Format', async () => {
    expect(await verifyPassword('not-a-hash', 'anything')).toBe(false);
  });

  it('DUMMY_HASH ist ein gültiger argon2-Hash und verifiziert keinen realen Input', async () => {
    expect(DUMMY_HASH).toMatch(/^\$argon2id\$/);
    expect(await verifyPassword(DUMMY_HASH, 'random')).toBe(false);
  });

  it('DUMMY_HASH verifyPassword läuft echte argon2-Zeit (nicht via catch)', async () => {
    const t0 = performance.now();
    const result = await verifyPassword(DUMMY_HASH, 'irrelevant');
    const duration = performance.now() - t0;
    expect(result).toBe(false);
    // echter argon2id-verify braucht >10ms; Parse-Exception wäre <1ms
    expect(duration).toBeGreaterThan(5);
  });
});
