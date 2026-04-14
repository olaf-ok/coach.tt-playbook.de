import { describe, it, expect } from 'vitest';
import { pathToTabId } from './sidebar-utils';

describe('pathToTabId', () => {
  it('mapt / auf draw', () => {
    expect(pathToTabId('/')).toBe('draw');
  });
  it('mapt /draw auf draw', () => {
    expect(pathToTabId('/draw')).toBe('draw');
  });
  it('mapt /archive auf archive', () => {
    expect(pathToTabId('/archive')).toBe('archive');
  });
  it('mapt /playlists und /playlists/:id auf playlists', () => {
    expect(pathToTabId('/playlists')).toBe('playlists');
    expect(pathToTabId('/playlists/abc')).toBe('playlists');
  });
  it('unbekannter Pfad → null', () => {
    expect(pathToTabId('/foo')).toBeNull();
  });
});
