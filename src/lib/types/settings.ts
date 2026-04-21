import type { LanguageMode } from '$lib/i18n/language-store.svelte';
import type { ThemeMode } from '$lib/theme/store.svelte';
import type { Currency } from '$lib/billing/currency-detection';

export interface SyncedSettings {
  theme: ThemeMode;
  language: LanguageMode;
  billingCurrency: Currency;
  hasSeenSyncNotice: boolean;
}

export interface SettingsRecord {
  id: 'default';
  updatedAt: number;
  data: SyncedSettings;
}
