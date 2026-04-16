import { describe, it, expect, beforeEach } from 'vitest';
import { shouldShowSplash, SPLASH_SESSION_KEY } from './splash-state';

function fakeStorage(): Storage {
  const data = new Map<string, string>();
  return {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => { data.set(k, String(v)); },
    removeItem: (k) => { data.delete(k); },
    clear: () => data.clear(),
    key: (i) => Array.from(data.keys())[i] ?? null,
    get length() { return data.size; },
  };
}

describe('shouldShowSplash', () => {
  let storage: Storage;
  beforeEach(() => { storage = fakeStorage(); });

  it('zeigt Splash wenn kein Flag gesetzt und Pfad nicht /tv', () => {
    expect(shouldShowSplash(storage, '/draw')).toBe(true);
  });
  it('versteckt Splash wenn Flag bereits gesetzt', () => {
    storage.setItem(SPLASH_SESSION_KEY, '1');
    expect(shouldShowSplash(storage, '/draw')).toBe(false);
  });
  it('versteckt Splash auf /tv', () => {
    expect(shouldShowSplash(storage, '/tv')).toBe(false);
  });
  it('versteckt Splash auf /tv/beliebigem-suffix', () => {
    expect(shouldShowSplash(storage, '/tv/display')).toBe(false);
  });
});
