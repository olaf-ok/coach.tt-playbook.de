<script lang="ts">
  import { syncStatus } from '$lib/sync/status.svelte';
  import { syncClient } from '$lib/sync/client.svelte';
  import { m } from '$lib/paraglide/messages';

  interface Props { onclose: () => void }
  let { onclose }: Props = $props();

  let busy = $state(false);
  let confirmingReset = $state(false);

  async function syncNow() {
    busy = true;
    try { await syncClient.push(); await syncClient.pull(); } finally { busy = false; }
  }
  async function reset() {
    busy = true;
    try { await syncClient.reset(); confirmingReset = false; } finally { busy = false; }
  }
</script>

<div class="panel">
  <h3>{m.sync_panel_title()}</h3>
  <p class="status">{syncStatus.state}</p>
  {#if syncStatus.lastSyncAt}
    <p class="meta">{m.sync_last_at({ at: new Date(syncStatus.lastSyncAt).toLocaleString() })}</p>
  {/if}
  {#if syncStatus.lastError}<p class="error">{syncStatus.lastError}</p>{/if}
  <button type="button" onclick={syncNow} disabled={busy}>{m.sync_button_now()}</button>
  {#if !confirmingReset}
    <button type="button" class="danger" onclick={() => confirmingReset = true}>{m.sync_button_reset()}</button>
  {:else}
    <p class="warn">{m.sync_reset_confirm()}</p>
    <button type="button" class="danger" onclick={reset} disabled={busy}>{m.sync_button_reset_confirm()}</button>
    <button type="button" onclick={() => confirmingReset = false}>{m.sync_button_cancel()}</button>
  {/if}
  <button type="button" onclick={onclose}>{m.sync_panel_close()}</button>
</div>

<style>
  .panel { position: absolute; top: 48px; right: 16px; background: var(--color-surface); padding: 16px; border-radius: 14px; min-width: 280px; box-shadow: var(--shadow-card); z-index: 500; }
  button { margin-top: 8px; width: 100%; padding: 8px; border-radius: 10px; border: 1px solid var(--color-border); background: var(--color-bg); cursor: pointer; }
  .danger { color: var(--color-danger); }
  .error { color: var(--color-danger); font-size: 0.9em; }
  .meta { font-size: 0.85em; color: var(--color-text-secondary); }
</style>
