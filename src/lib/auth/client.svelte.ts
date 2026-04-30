import { syncClient } from '$lib/sync/client.svelte';

export interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  proUntil: number | null;
  trainerName: string | null;
  isAdmin: boolean;
}

class AuthState {
  user = $state<AuthUser | null>(null);
  loading = $state(true);

  get isPro(): boolean {
    return !!this.user?.proUntil && this.user.proUntil > Date.now();
  }

  async init(): Promise<void> {
    this.loading = true;
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const body = await res.json();
        this.user = body.user as AuthUser;
      } else {
        this.user = null;
      }
    } catch {
      this.user = null;
    } finally {
      this.loading = false;
    }
  }

  async signup(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: body.error ?? 'Unbekannter Fehler' };
    }
    return { ok: true };
  }

  async login(email: string, password: string): Promise<{ ok: boolean; error?: string; canResend?: boolean }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      const body = await res.json();
      this.user = body.user;
      return { ok: true };
    }
    const body = await res.json().catch(() => ({}));
    return { ok: false, error: body.error ?? 'Login fehlgeschlagen', canResend: body.canResend };
  }

  async logout(): Promise<void> {
    await fetch('/api/auth/logout', { method: 'POST' });
    this.user = null;
    await syncClient.clearLocal();
  }

  async requestReset(email: string): Promise<void> {
    await fetch('/api/auth/request-reset', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email }),
    });
  }

  async resendVerification(email: string): Promise<void> {
    await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email }),
    });
  }

  // for tests only
  _reset(): void {
    this.user = null;
    this.loading = true;
  }
}

export const auth = new AuthState();
