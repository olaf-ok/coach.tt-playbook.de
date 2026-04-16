export const MOCK_USER_STORAGE_KEY = 'tt-mock-user';

export interface MockUser {
  email: string;
}

export interface MockUserApi {
  readUser(): MockUser | null;
  login(email: string): void;
  logout(): void;
}

export function createMockUserApi(
  storage: Storage,
  setPro: (value: boolean) => void,
): MockUserApi {
  function readUser(): MockUser | null {
    const raw = storage.getItem(MOCK_USER_STORAGE_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.email === 'string') {
        return { email: parsed.email };
      }
      return null;
    } catch {
      return null;
    }
  }

  function login(email: string): void {
    storage.setItem(MOCK_USER_STORAGE_KEY, JSON.stringify({ email }));
    setPro(true);
  }

  function logout(): void {
    storage.removeItem(MOCK_USER_STORAGE_KEY);
    setPro(false);
  }

  return { readUser, login, logout };
}
