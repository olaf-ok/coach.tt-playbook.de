export type ThemeMode = 'auto' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'tt-playbook-theme';

function systemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function readStoredMode(): ThemeMode {
  if (typeof localStorage === 'undefined') return 'auto';
  const v = localStorage.getItem(STORAGE_KEY);
  return v === 'light' || v === 'dark' || v === 'auto' ? v : 'auto';
}

export function resolve(mode: ThemeMode): ResolvedTheme {
  return mode === 'auto' ? systemTheme() : mode;
}

let mode = $state<ThemeMode>(readStoredMode());
let resolved = $state<ResolvedTheme>(resolve(mode));

function apply(resolvedTheme: ResolvedTheme) {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = resolvedTheme;
}

export const theme = {
  get mode() {
    return mode;
  },
  get resolved() {
    return resolved;
  },
  set(next: ThemeMode) {
    mode = next;
    resolved = resolve(next);
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, next);
    apply(resolved);
  },
  init() {
    // Runs once on app start. Applies persisted mode + sets up system-theme watcher.
    apply(resolve(mode));
    if (typeof window !== 'undefined') {
      const mq = window.matchMedia('(prefers-color-scheme: light)');
      mq.addEventListener('change', () => {
        if (mode === 'auto') {
          resolved = systemTheme();
          apply(resolved);
        }
      });
    }
  },
};
