export type MobileTabId = 'draw' | 'archive' | 'playlists' | 'more';

export function pathToMobileTabId(pathname: string): MobileTabId | null {
  if (pathname === '/' || pathname.startsWith('/draw')) return 'draw';
  if (pathname.startsWith('/archive')) return 'archive';
  if (pathname.startsWith('/playlists')) return 'playlists';
  if (pathname.startsWith('/settings')) return 'more';
  return null;
}
