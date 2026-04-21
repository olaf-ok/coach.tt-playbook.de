import { db } from '../db/database';
import { syncClient } from './client.svelte';
import type { SyncedSettings } from '../types/settings';

export async function writeSyncedSetting<K extends keyof SyncedSettings>(
  key: K,
  value: SyncedSettings[K]
): Promise<void> {
  const existing = (await db.settings.get('default')) ?? {
    id: 'default' as const,
    updatedAt: 0,
    data: {
      theme: 'auto',
      language: 'system',
      billingCurrency: 'eur',
      hasSeenSyncNotice: false,
    } as SyncedSettings,
  };
  await db.settings.put({
    id: 'default',
    updatedAt: Date.now(),
    data: { ...existing.data, [key]: value },
  });
  void syncClient.queue.enqueue('settings', 'default');
  syncClient.schedulePush();
}

export async function readSyncedSettings(): Promise<SyncedSettings | null> {
  const row = await db.settings.get('default');
  return row?.data ?? null;
}
