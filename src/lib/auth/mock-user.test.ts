import { describe, it, expect, beforeEach } from 'vitest';
import { createMockUserApi, MOCK_USER_STORAGE_KEY } from './mock-user-api';

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

describe('createMockUserApi', () => {
  let storage: Storage;
  let proSet: boolean | null;
  let setPro: (v: boolean) => void;

  beforeEach(() => {
    storage = fakeStorage();
    proSet = null;
    setPro = (v) => { proSet = v; };
  });

  it('startet ohne User wenn Storage leer', () => {
    const api = createMockUserApi(storage, setPro);
    expect(api.readUser()).toBeNull();
  });

  it('hydratisiert User aus Storage', () => {
    storage.setItem(MOCK_USER_STORAGE_KEY, JSON.stringify({ email: 'a@b.de' }));
    const api = createMockUserApi(storage, setPro);
    expect(api.readUser()).toEqual({ email: 'a@b.de' });
  });

  it('login schreibt User + setzt Pro', () => {
    const api = createMockUserApi(storage, setPro);
    api.login('user@test.de');
    expect(api.readUser()).toEqual({ email: 'user@test.de' });
    expect(storage.getItem(MOCK_USER_STORAGE_KEY)).toBe(JSON.stringify({ email: 'user@test.de' }));
    expect(proSet).toBe(true);
  });

  it('logout entfernt User + setzt Pro false', () => {
    const api = createMockUserApi(storage, setPro);
    api.login('user@test.de');
    api.logout();
    expect(api.readUser()).toBeNull();
    expect(storage.getItem(MOCK_USER_STORAGE_KEY)).toBeNull();
    expect(proSet).toBe(false);
  });

  it('ignoriert kaputten JSON-Storage-Inhalt', () => {
    storage.setItem(MOCK_USER_STORAGE_KEY, 'not-json');
    const api = createMockUserApi(storage, setPro);
    expect(api.readUser()).toBeNull();
  });
});
