export const SYNCED_SETTING_KEYS = ['theme', 'language', 'billingCurrency', 'hasSeenSyncNotice'] as const;
export type SyncedSettingKey = (typeof SYNCED_SETTING_KEYS)[number];
