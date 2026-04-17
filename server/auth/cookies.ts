import type { Cookies } from '@sveltejs/kit';
import { SESSION_TTL_MS } from './sessions';

export const SESSION_COOKIE_NAME = 'ttp_session';

export function setSessionCookie(cookies: Cookies, token: string): void {
  cookies.set(SESSION_COOKIE_NAME, token, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

export function clearSessionCookie(cookies: Cookies): void {
  cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
}
