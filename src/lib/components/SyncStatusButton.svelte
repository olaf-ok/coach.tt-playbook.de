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
    syncStatus.state === 'idle' ? m.sync_label_idle()
    : syncStatus.state === 'syncing' ? m.sync_label_syncing()
    : syncStatus.state === 'pending' ? m.sync_label_pending({ n: syncStatus.queueSize })
    : syncStatus.state === 'offline' ? m.sync_label_offline()
    : m.sync_label_error()
  );

  const title = $derived(
    syncStatus.state === 'idle' ? m.sync_dot_idle()
    : syncStatus.state === 'syncing' ? m.sync_dot_syncing()
    : syncStatus.state === 'pending' ? m.sync_dot_pending({ n: syncStatus.queueSize })
    : syncStatus.state === 'offline' ? m.sync_dot_offline()
    : m.sync_dot_error()
  );
</script>

<button
  type="button"
  class="sync-btn"
  aria-label={title}
  {title}
  {onclick}
>
  <span class="dot {colorClass}"></span>
  <span class="label">{label}</span>
</button>

<style>
  .sync-btn {
    height: 40px;
    padding: 0 12px;
    border-radius: var(--radius-button);
    background: transparent;
    color: var(--color-text-secondary);
    font-size: 13px;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border: 1px solid var(--color-border);
    cursor: pointer;
    transition: background var(--transition-quick), border-color var(--transition-quick);
  }
  .sync-btn:hover {
    background: var(--bg-elevated);
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .dot.green  { background: var(--color-success); }
  .dot.yellow { background: #f0b429; }
  .dot.grey   { background: var(--color-text-tertiary); }
  .dot.red    { background: var(--color-danger); }
  .dot.blue   { background: var(--color-accent); animation: pulse 1s infinite alternate; }
  @keyframes pulse { to { opacity: 0.4; } }

  .label {
    white-space: nowrap;
  }

  @media (max-width: 767.98px) {
    .sync-btn { display: none; }
  }
</style>
