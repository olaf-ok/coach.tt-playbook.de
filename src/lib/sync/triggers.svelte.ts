import { syncClient } from './client.svelte';
import { syncStatus } from './status.svelte';

let installed = false;

export function installSyncTriggers(): void {
  if (installed) return;
  installed = true;

  syncStatus.setOnline(navigator.onLine);

  window.addEventListener('online', () => {
    syncStatus.setOnline(true);
    void (async () => {
      await syncClient.push();
      await syncClient.pull();
    })();
  });

  window.addEventListener('offline', () => syncStatus.setOnline(false));

  const onFocus = () => {
    void (async () => {
      await syncClient.push();
      await syncClient.pull();
    })();
  };

  window.addEventListener('focus', onFocus);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') onFocus();
  });
}
