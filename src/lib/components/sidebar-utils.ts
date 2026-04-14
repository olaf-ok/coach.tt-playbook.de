export type TabId = 'draw' | 'archive' | 'playlists';

export function pathToTabId(pathname: string): TabId | null {
  if (pathname === '/' || pathname.startsWith('/draw')) return 'draw';
  if (pathname.startsWith('/archive')) return 'archive';
  if (pathname.startsWith('/playlists')) return 'playlists';
  return null;
}
