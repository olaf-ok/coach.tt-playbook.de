export const SPLASH_SESSION_KEY = 'tt-splash-shown';

export function shouldShowSplash(storage: Storage, pathname: string): boolean {
  if (pathname.startsWith('/tv')) return false;
  return storage.getItem(SPLASH_SESSION_KEY) === null;
}
