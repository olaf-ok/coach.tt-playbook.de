import { describe, it, expect, beforeEach } from 'vitest';
import { syncStatus } from './status.svelte';

beforeEach(() => syncStatus.reset());

describe('syncStatus', () => {
  it('starts idle', () => {
    expect(syncStatus.state).toBe('idle');
    expect(syncStatus.queueSize).toBe(0);
  });

  it('transitions idle → syncing → idle on success', () => {
    syncStatus.startSync();
    expect(syncStatus.state).toBe('syncing');
    syncStatus.syncSucceeded();
    expect(syncStatus.state).toBe('idle');
    expect(syncStatus.lastSyncAt).toBeGreaterThan(0);
  });

  it('records error on failure', () => {
    syncStatus.startSync();
    syncStatus.syncFailed('network');
    expect(syncStatus.state).toBe('error');
    expect(syncStatus.lastError).toBe('network');
  });

  it('queue size drives pending state when idle', () => {
    syncStatus.updateQueueSize(3);
    expect(syncStatus.state).toBe('pending');
    syncStatus.updateQueueSize(0);
    expect(syncStatus.state).toBe('idle');
  });

  it('offline overrides pending/idle', () => {
    syncStatus.setOnline(false);
    expect(syncStatus.state).toBe('offline');
    syncStatus.setOnline(true);
    expect(syncStatus.state).toBe('idle');
  });
});
