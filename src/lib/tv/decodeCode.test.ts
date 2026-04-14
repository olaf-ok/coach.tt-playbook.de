import { describe, it, expect } from 'vitest';
import { decodeCode } from './decodeCode';

describe('decodeCode', () => {
  it('liest Code aus URL mit ?code=', () => {
    expect(decodeCode('https://tt-playbook.app/connect-tv?code=1234')).toBe('1234');
    expect(decodeCode('http://localhost:5173/connect-tv?code=9876')).toBe('9876');
  });
  it('akzeptiert reinen 4-stelligen Code', () => {
    expect(decodeCode('1234')).toBe('1234');
  });
  it('ignoriert Whitespace', () => {
    expect(decodeCode(' 5678 ')).toBe('5678');
  });
  it('liefert null bei unbekanntem Format', () => {
    expect(decodeCode('nicht-ein-code')).toBeNull();
    expect(decodeCode('https://example.com/')).toBeNull();
    expect(decodeCode('12')).toBeNull();
    expect(decodeCode('12345')).toBeNull();
  });
});
