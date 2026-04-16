// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const STORAGE_KEY = 'tt-language-mode';
const PARAGLIDE_KEY = 'PARAGLIDE_LOCALE';

vi.mock('$app/environment', () => ({ browser: true }));

const mockSetLocale = vi.fn();
const mockGetLocale = vi.fn(() => 'de');
vi.mock('$lib/paraglide/runtime', () => ({
  setLocale: (...args: unknown[]) => mockSetLocale(...args),
  getLocale: () => mockGetLocale()
}));

const mockReload = vi.fn();
beforeEach(() => {
  localStorage.clear();
  mockSetLocale.mockClear();
  mockReload.mockClear();
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { reload: mockReload }
  });
});

describe('language-store', () => {
  it('defaults to system mode when nothing stored', async () => {
    const { language } = await import('./language-store.svelte');
    expect(language.mode).toBe('system');
  });

  it('reads valid stored mode', async () => {
    localStorage.setItem(STORAGE_KEY, 'es');
    vi.resetModules();
    const { language } = await import('./language-store.svelte');
    expect(language.mode).toBe('es');
  });

  it('falls back to system on invalid stored value', async () => {
    localStorage.setItem(STORAGE_KEY, 'klingon');
    vi.resetModules();
    const { language } = await import('./language-store.svelte');
    expect(language.mode).toBe('system');
  });

  it('setLanguage("de") writes Paraglide localStorage and reloads', async () => {
    const { setLanguage } = await import('./language-store.svelte');
    setLanguage('de');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('de');
    expect(mockSetLocale).toHaveBeenCalledWith('de');
  });

  it('setLanguage("system") removes Paraglide override and reloads', async () => {
    localStorage.setItem(PARAGLIDE_KEY, 'es');
    const { setLanguage } = await import('./language-store.svelte');
    setLanguage('system');
    expect(localStorage.getItem(PARAGLIDE_KEY)).toBeNull();
    expect(mockReload).toHaveBeenCalled();
  });
});
