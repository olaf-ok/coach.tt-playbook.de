import { proStatus } from '$lib/pro/status.svelte';
import { createMockUserApi, type MockUser } from './mock-user-api';

function readInitial(): MockUser | null {
  if (typeof localStorage === 'undefined') return null;
  const api = createMockUserApi(localStorage, () => {});
  return api.readUser();
}

let user = $state<MockUser | null>(readInitial());

function getApi() {
  return createMockUserApi(localStorage, (v) => proStatus.set(v));
}

export const mockUser = {
  get current(): MockUser | null {
    return user;
  },
  get loggedIn(): boolean {
    return user !== null;
  },
  async login(email: string): Promise<void> {
    await new Promise((r) => setTimeout(r, 500));
    getApi().login(email);
    user = { email };
  },
  async signup(email: string): Promise<void> {
    return this.login(email);
  },
  logout(): void {
    getApi().logout();
    user = null;
  },
};
