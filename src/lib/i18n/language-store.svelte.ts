import { browser } from '$app/environment';
import { setLocale } from '$lib/paraglide/runtime';
import { writeSyncedSetting } from '$lib/sync/settings-bridge.svelte';

export type LanguageMode = 'system' | 'de' | 'en' | 'es';

const STORAGE_KEY = 'tt-language-mode';
const PARAGLIDE_KEY = 'PARAGLIDE_LOCALE';

let applyingSync = false;

function readMode(): LanguageMode {
  if (!browser) return 'system';
  const v = localStorage.getItem(STORAGE_KEY);
  return v === 'de' || v === 'en' || v === 'es' || v === 'system' ? v : 'system';
}

export const language = $state({
  mode: readMode()
});

export function setLanguage(mode: LanguageMode): void {
  language.mode = mode;
  localStorage.setItem(STORAGE_KEY, mode);

  if (!applyingSync) void writeSyncedSetting('language', mode);

  if (mode === 'system') {
    localStorage.removeItem(PARAGLIDE_KEY);
    location.reload();
  } else {
    setLocale(mode);
  }
}

if (browser) {
  window.addEventListener('tt-settings-synced', (e) => {
    const data = (e as CustomEvent).detail as Record<string, unknown>;
    if (typeof data.language === 'string') {
      applyingSync = true;
      setLanguage(data.language as LanguageMode);
      applyingSync = false;
    }
  });
}
