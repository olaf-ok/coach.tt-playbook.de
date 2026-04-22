<script lang="ts">
  import { currentExercise } from '$lib/stores/currentExercise.svelte';
  import PlusIcon from '$lib/icons/PlusIcon.svelte';
  import SyncStatusButton from './SyncStatusButton.svelte';
  import SyncStatusPanel from './SyncStatusPanel.svelte';
  import { m } from '$lib/paraglide/messages';

  interface Props {
    onSave?: () => void;
    onNew?: () => void;
    onOpenTv?: () => void;
    tvStatus?: string;
  }

  let {
    onSave,
    onNew,
    onOpenTv,
    tvStatus = 'idle',
  }: Props = $props();

  const tvConnected = $derived(tvStatus === 'paired');
  let syncPanelOpen = $state(false);
</script>

<header class="toolbar">
  <input
    type="text"
    class="name-field"
    bind:value={currentExercise.exercise.name}
    placeholder={m.toolbar_exercise_name_placeholder()}
  />

  <div class="actions">
    <div class="sync-holder">
      <SyncStatusButton onclick={() => (syncPanelOpen = !syncPanelOpen)} />
      {#if syncPanelOpen}
        <SyncStatusPanel onclose={() => (syncPanelOpen = false)} />
      {/if}
    </div>
    <button
      type="button"
      class="tv-btn"
      class:connected={tvConnected}
      onclick={() => onOpenTv?.()}
      aria-label={m.toolbar_tv_status_aria()}
      title={tvConnected ? m.toolbar_tv_connected_title() : m.toolbar_tv_disconnected_title()}
    >
      <span class="tv-dot" class:on={tvConnected}></span>
      <span>{m.toolbar_tv_label()}</span>
    </button>
    <button type="button" class="btn btn-secondary" onclick={() => onNew?.()}>
      <PlusIcon size={16} />
      <span>{m.toolbar_new_exercise()}</span>
    </button>
    <button type="button" class="btn btn-primary" onclick={() => onSave?.()}>{m.common_save()}</button>
  </div>
</header>

<style>
  .toolbar {
    height: 64px;
    padding: 0 16px;
    background: var(--bg-glass);
    backdrop-filter: blur(40px) saturate(180%);
    -webkit-backdrop-filter: blur(40px) saturate(180%);
    border-bottom: 1px solid var(--color-border);
    box-shadow: inset 0 -1px 0 rgba(255, 255, 255, 0.04);
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .name-field {
    flex: 1;
    min-width: 0;
    max-width: 320px;
    height: 40px;
    padding: 0 12px;
    background: var(--bg-elevated);
    color: var(--color-text-primary);
    border: 1px solid transparent;
    border-radius: var(--radius-button);
    outline: none;
    font-size: 15px;
    font-weight: 500;
    transition: border-color var(--transition-quick);
  }

  .name-field:focus {
    border-color: var(--color-border);
  }

  .actions {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .sync-holder {
    position: relative;
    display: flex;
    align-items: center;
  }

  .tv-btn {
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
  }
  .tv-btn.connected {
    color: var(--color-text-primary);
    border-color: var(--color-success);
  }
  .tv-btn:hover {
    background: var(--bg-elevated);
  }
  .tv-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-text-tertiary);
  }
  .tv-dot.on {
    background: var(--color-success);
  }

  .btn {
    height: 40px;
    padding: 0 16px;
    border-radius: var(--radius-button);
    font-size: 14px;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: opacity var(--transition-quick), background var(--transition-quick), transform 0.15s ease, box-shadow var(--transition-quick);
  }
  .btn:active:not(:disabled) {
    transform: scale(0.96);
  }
  .btn-primary {
    background: var(--color-accent);
    color: #fff;
    box-shadow: 0 2px 8px rgba(10, 132, 255, 0.3);
  }
  .btn-primary:hover {
    opacity: 0.9;
    box-shadow: 0 4px 16px rgba(10, 132, 255, 0.4);
  }
  .btn-secondary {
    background: rgba(255, 255, 255, 0.06);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border);
  }
  .btn-secondary:hover:not(:disabled) {
    background: var(--bg-glass-hover);
  }
  .btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  @media (max-width: 767.98px) {
    .toolbar {
      height: 52px;
      padding: 0 10px;
      gap: 8px;
    }
    .name-field {
      max-width: none;
      font-size: 14px;
      height: 36px;
    }
    .tv-btn {
      display: none;
    }
    .btn {
      height: 36px;
      padding: 0 12px;
      font-size: 13px;
    }
    .btn-secondary :global(span) {
      display: none;
    }
  }
</style>
