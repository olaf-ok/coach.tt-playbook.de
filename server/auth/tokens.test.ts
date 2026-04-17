import { describe, it, expect } from 'vitest';
import { generateToken, hashToken, constantTimeEquals } from './tokens';

describe('tokens', () => {
  it('generateToken produziert 43-Zeichen base64url (32 bytes)', () => {
    const t = generateToken();
    expect(t).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it('zwei Tokens sind (praktisch sicher) unterschiedlich', () => {
    const a = generateToken();
    const b = generateToken();
    expect(a).not.toBe(b);
  });

  it('hashToken produziert deterministischen sha256-hex', () => {
    const t = 'abc';
    expect(hashToken(t)).toBe(hashToken(t));
    expect(hashToken(t)).toHaveLength(64);
    expect(hashToken(t)).toMatch(/^[0-9a-f]{64}$/);
  });

  it('hashToken unterscheidet verschiedene Inputs', () => {
    expect(hashToken('a')).not.toBe(hashToken('b'));
  });

  it('constantTimeEquals ist true bei gleichen Strings', () => {
    expect(constantTimeEquals('foo', 'foo')).toBe(true);
  });

  it('constantTimeEquals ist false bei ungleichen', () => {
    expect(constantTimeEquals('foo', 'bar')).toBe(false);
    expect(constantTimeEquals('foo', 'foo2')).toBe(false);
  });
});
