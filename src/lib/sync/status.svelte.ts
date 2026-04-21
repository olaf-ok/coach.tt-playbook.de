export type SyncState = 'idle' | 'pending' | 'syncing' | 'offline' | 'error';

let state = $state<SyncState>('idle');
let lastSyncAt = $state<number | null>(null);
let lastError = $state<string | null>(null);
let queueSize = $state(0);
let online = $state(true);

function recompute(currentState: SyncState = state): SyncState {
  if (!online) return 'offline';
  if (currentState === 'syncing' || currentState === 'error') return currentState;
  return queueSize > 0 ? 'pending' : 'idle';
}

export const syncStatus = {
  get state() {
    return state;
  },
  get lastSyncAt() {
    return lastSyncAt;
  },
  get lastError() {
    return lastError;
  },
  get queueSize() {
    return queueSize;
  },
  get online() {
    return online;
  },

  startSync() {
    state = 'syncing';
    lastError = null;
  },

  syncSucceeded() {
    lastSyncAt = Date.now();
    state = recompute('idle');
  },

  syncFailed(msg: string) {
    lastError = msg;
    state = 'error';
  },

  updateQueueSize(n: number) {
    queueSize = n;
    if (state !== 'syncing' && state !== 'error') {
      state = recompute();
    }
  },

  setOnline(v: boolean) {
    online = v;
    state = recompute();
  },

  reset() {
    state = 'idle';
    lastSyncAt = null;
    lastError = null;
    queueSize = 0;
    online = true;
  },
};
