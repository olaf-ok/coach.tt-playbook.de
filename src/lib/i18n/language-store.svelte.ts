import { browser } from '$app/environment';
import { setLocale, getLocale } from '$lib/paraglide/runtime';

export type LanguageMode = 'system' | 'de' | 'en' | 'es';

const STORAGE_KEY = 'tt-language-mode';
const PARAGLIDE_KEY = 'PARAGLIDE_LOCALE';

function readMode(): LanguageMode {
  if (!browser) return 'system';
  const v = localStorage.getItem(STORAGE_KEY);
  return v === 'de' || v === 'en' || v === 'es' || v === 'system' ? v : 'system';
}

export const language = $state({
  mode: readMode(),
  current: (browser ? getLocale() : 'de') as 'de' | 'en' | 'es'
});

export function setLanguage(mode: LanguageMode): void {
  language.mode = mode;
  localStorage.setItem(STORAGE_KEY, mode);

  if (mode === 'system') {
    localStorage.removeItem(PARAGLIDE_KEY);
    location.reload();
  } else {
    setLocale(mode);
  }
}
