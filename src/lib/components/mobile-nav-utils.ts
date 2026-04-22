export type MobileTabId = 'draw' | 'archive' | 'playlists' | 'more';

export function pathToMobileTabId(pathname: string): MobileTabId | null {
  if (pathname === '/' || pathname.startsWith('/draw')) return 'draw';
  if (pathname.startsWith('/archive')) return 'archive';
  if (pathname.startsWith('/playlists')) return 'playlists';
  if (pathname.startsWith('/settings')) return 'more';
  return null;
}

export interface MobileHeaderInfo {
  titleKey: string | null;
  showBack: boolean;
  backHref: string | null;
}

const SETTINGS_SUB_MAP: Record<string, string> = {
  '/settings/account': 'settings_nav_account',
  '/settings/language': 'settings_nav_language',
  '/settings/tv': 'settings_nav_tv',
  '/settings/display': 'settings_nav_display',
  '/settings/pro': 'settings_nav_pro',
  '/settings/help': 'settings_nav_help',
  '/settings/notation': 'settings_nav_notation',
  '/settings/about': 'settings_nav_about',
  '/settings/shares': 'settings_nav_shares',
};

export function resolveMobileHeader(pathname: string): MobileHeaderInfo {
  // /draw/:id — Zeichnen mit Back zum Archiv
  if (pathname.startsWith('/draw/') && pathname.length > '/draw/'.length) {
    return { titleKey: 'mobile_header_draw', showBack: true, backHref: '/archive' };
  }
  if (pathname === '/' || pathname === '/draw' || pathname === '/draw/') {
    return { titleKey: 'mobile_header_draw', showBack: false, backHref: null };
  }
  if (pathname === '/archive') {
    return { titleKey: 'mobile_header_archive', showBack: false, backHref: null };
  }
  if (pathname === '/playlists') {
    return { titleKey: 'mobile_header_playlists', showBack: false, backHref: null };
  }
  if (pathname === '/settings') {
    return { titleKey: 'mobile_header_settings', showBack: false, backHref: null };
  }
  if (SETTINGS_SUB_MAP[pathname]) {
    return { titleKey: SETTINGS_SUB_MAP[pathname], showBack: true, backHref: '/settings' };
  }
  return { titleKey: null, showBack: false, backHref: null };
}
