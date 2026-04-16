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
