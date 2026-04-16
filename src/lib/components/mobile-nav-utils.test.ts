import { describe, it, expect } from 'vitest';
import { pathToMobileTabId } from './mobile-nav-utils';

describe('pathToMobileTabId', () => {
  it('mapt / auf draw', () => {
    expect(pathToMobileTabId('/')).toBe('draw');
  });
  it('mapt /draw und /draw/:id auf draw', () => {
    expect(pathToMobileTabId('/draw')).toBe('draw');
    expect(pathToMobileTabId('/draw/abc')).toBe('draw');
  });
  it('mapt /archive auf archive', () => {
    expect(pathToMobileTabId('/archive')).toBe('archive');
  });
  it('mapt /playlists und /playlists/:id auf playlists', () => {
    expect(pathToMobileTabId('/playlists')).toBe('playlists');
    expect(pathToMobileTabId('/playlists/abc')).toBe('playlists');
  });
  it('mapt /settings und /settings/:sub auf more', () => {
    expect(pathToMobileTabId('/settings')).toBe('more');
    expect(pathToMobileTabId('/settings/tv')).toBe('more');
    expect(pathToMobileTabId('/settings/display')).toBe('more');
  });
  it('unbekannter Pfad → null', () => {
    expect(pathToMobileTabId('/foo')).toBeNull();
  });
});

import { resolveMobileHeader } from './mobile-nav-utils';

describe('resolveMobileHeader', () => {
  it('Root-Routen ohne Back-Button', () => {
    expect(resolveMobileHeader('/draw')).toEqual({ titleKey: 'mobile_header_draw', showBack: false, backHref: null });
    expect(resolveMobileHeader('/archive')).toEqual({ titleKey: 'mobile_header_archive', showBack: false, backHref: null });
    expect(resolveMobileHeader('/playlists')).toEqual({ titleKey: 'mobile_header_playlists', showBack: false, backHref: null });
    expect(resolveMobileHeader('/settings')).toEqual({ titleKey: 'mobile_header_settings', showBack: false, backHref: null });
  });

  it('Settings-Sub-Seiten: Back zu /settings', () => {
    expect(resolveMobileHeader('/settings/tv')).toEqual({ titleKey: 'settings_nav_tv', showBack: true, backHref: '/settings' });
    expect(resolveMobileHeader('/settings/display')).toEqual({ titleKey: 'settings_nav_display', showBack: true, backHref: '/settings' });
    expect(resolveMobileHeader('/settings/account')).toEqual({ titleKey: 'settings_nav_account', showBack: true, backHref: '/settings' });
    expect(resolveMobileHeader('/settings/language')).toEqual({ titleKey: 'settings_nav_language', showBack: true, backHref: '/settings' });
    expect(resolveMobileHeader('/settings/pro')).toEqual({ titleKey: 'settings_nav_pro', showBack: true, backHref: '/settings' });
    expect(resolveMobileHeader('/settings/about')).toEqual({ titleKey: 'settings_nav_about', showBack: true, backHref: '/settings' });
  });

  it('Draw mit ID: Back zu /archive', () => {
    expect(resolveMobileHeader('/draw/abc-123')).toEqual({ titleKey: 'mobile_header_draw', showBack: true, backHref: '/archive' });
  });

  it('Unbekannt: ohne Back, leerer Titel', () => {
    expect(resolveMobileHeader('/foo')).toEqual({ titleKey: null, showBack: false, backHref: null });
  });

  it('Draw mit Trailing-Slash ohne ID: wie /draw', () => {
    expect(resolveMobileHeader('/draw/')).toEqual({ titleKey: 'mobile_header_draw', showBack: false, backHref: null });
  });
});
