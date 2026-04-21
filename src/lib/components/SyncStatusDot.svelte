<script lang="ts">
  import { syncStatus } from '$lib/sync/status.svelte';
  import { m } from '$lib/paraglide/messages';

  interface Props { onclick?: () => void }
  let { onclick }: Props = $props();

  const colorClass = $derived(
    syncStatus.state === 'idle' ? 'green'
    : syncStatus.state === 'syncing' ? 'blue'
    : syncStatus.state === 'pending' ? 'yellow'
    : syncStatus.state === 'offline' ? 'grey'
    : 'red'
  );
  const label = $derived(
    syncStatus.state === 'idle' ? m.sync_dot_idle()
    : syncStatus.state === 'syncing' ? m.sync_dot_syncing()
    : syncStatus.state === 'pending' ? m.sync_dot_pending({ n: syncStatus.queueSize })
    : syncStatus.state === 'offline' ? m.sync_dot_offline()
    : m.sync_dot_error()
  );
</script>

<button type="button" class="dot {colorClass}" aria-label={label} title={label} {onclick}></button>

<style>
  .dot {
    width: 10px; height: 10px; border-radius: 50%; border: none; padding: 0; cursor: pointer;
    transition: background 0.2s;
  }
  .dot.green  { background: var(--color-success); }
  .dot.yellow { background: #f0b429; }
  .dot.grey   { background: #86868b; }
  .dot.red    { background: var(--color-danger); }
  .dot.blue   { background: var(--color-accent); animation: pulse 1s infinite alternate; }
  @keyframes pulse { to { opacity: 0.4; } }
</style>
