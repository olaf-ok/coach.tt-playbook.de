<script lang="ts">
  import { m } from '$lib/paraglide/messages';

  interface Props {
    localCount: number;
    serverCount: number;
    onChoose: (choice: 'keepBoth' | 'serverOnly' | 'localOnly') => void;
  }

  let { localCount, serverCount, onChoose }: Props = $props();

  function handleBackdrop(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      // Optionally allow backdrop click to close, or prevent it
      // For now, we require an explicit choice
    }
  }
</script>

<div class="overlay" onclick={handleBackdrop} role="presentation">
  <div class="dialog" role="dialog" aria-modal="true">
    <h2>{m.initial_sync_title()}</h2>
    <p class="body">{m.initial_sync_body({ local: localCount, server: serverCount })}</p>
    <div class="actions">
      <button type="button" class="btn btn-primary" onclick={() => onChoose('keepBoth')}>
        {m.initial_sync_keep_both()}
      </button>
      <button type="button" class="btn btn-secondary" onclick={() => onChoose('serverOnly')}>
        {m.initial_sync_server_only()}
      </button>
      <button type="button" class="btn btn-secondary" onclick={() => onChoose('localOnly')}>
        {m.initial_sync_local_only()}
      </button>
    </div>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: grid;
    place-items: center;
    z-index: 1000;
  }

  .dialog {
    background: var(--color-surface);
    padding: 24px;
    border-radius: 14px;
    max-width: 440px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  }

  h2 {
    margin: 0 0 12px 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text);
  }

  .body {
    margin: 0 0 16px 0;
    font-size: 14px;
    color: var(--color-text-secondary);
    line-height: 1.5;
  }

  .actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 16px;
  }

  .btn {
    padding: 10px 16px;
    border-radius: 10px;
    border: 1px solid var(--color-border);
    background: var(--color-bg);
    color: var(--color-text);
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;
  }

  .btn:hover {
    background: var(--color-bg-hover);
    border-color: var(--color-border-hover);
  }

  .btn-primary {
    background: var(--color-primary);
    color: var(--color-primary-text);
    border-color: var(--color-primary);
  }

  .btn-primary:hover {
    background: var(--color-primary-hover);
    border-color: var(--color-primary-hover);
  }

  .btn-secondary {
    background: var(--color-bg);
    color: var(--color-text);
  }
</style>
