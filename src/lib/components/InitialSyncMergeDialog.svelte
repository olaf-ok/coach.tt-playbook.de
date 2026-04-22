<script lang="ts">
  import { m } from '$lib/paraglide/messages';

  interface Props {
    localCount: number;
    serverCount: number;
    onChoose: (choice: 'keepBoth' | 'serverOnly' | 'localOnly') => void;
  }

  let { localCount, serverCount, onChoose }: Props = $props();
</script>

<div class="overlay" role="presentation">
  <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="merge-title">
    <h2 id="merge-title">{m.initial_sync_title()}</h2>
    <p class="intro">{m.initial_sync_intro()}</p>

    <ul class="counts">
      <li>{m.initial_sync_local_line({ local: localCount })}</li>
      <li>{m.initial_sync_server_line({ server: serverCount })}</li>
    </ul>

    <div class="actions">
      <button type="button" class="btn btn-primary" onclick={() => onChoose('keepBoth')}>
        <span class="btn-label">{m.initial_sync_keep_both()}</span>
        <span class="btn-note">{m.initial_sync_keep_both_note()}</span>
      </button>
      <button type="button" class="btn btn-secondary" onclick={() => onChoose('serverOnly')}>
        <span class="btn-label">{m.initial_sync_server_only()}</span>
        <span class="btn-note">{m.initial_sync_server_only_note()}</span>
      </button>
      <button type="button" class="btn btn-secondary" onclick={() => onChoose('localOnly')}>
        <span class="btn-label">{m.initial_sync_local_only()}</span>
        <span class="btn-note">{m.initial_sync_local_only_note()}</span>
      </button>
    </div>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.65);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    display: grid;
    place-items: center;
    padding: 16px;
    z-index: 1000;
  }

  .dialog {
    background: var(--bg-elevated);
    color: var(--color-text-primary);
    padding: 24px;
    border-radius: 16px;
    max-width: 460px;
    width: 100%;
    border: 1px solid var(--color-border);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  }

  h2 {
    margin: 0 0 10px 0;
    font-size: 19px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .intro {
    margin: 0 0 14px 0;
    font-size: 14px;
    color: var(--color-text-secondary);
    line-height: 1.5;
  }

  .counts {
    list-style: none;
    margin: 0 0 20px 0;
    padding: 12px 14px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    font-size: 14px;
    color: var(--color-text-primary);
  }
  .counts li {
    padding: 3px 0;
  }

  .actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .btn {
    padding: 12px 16px;
    border-radius: 10px;
    border: 1px solid var(--color-border);
    background: rgba(255, 255, 255, 0.06);
    color: var(--color-text-primary);
    cursor: pointer;
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 2px;
    transition: background var(--transition-quick), border-color var(--transition-quick), transform 0.15s ease;
  }
  .btn:hover {
    background: var(--bg-glass-hover);
  }
  .btn:active {
    transform: scale(0.98);
  }
  .btn-label {
    font-size: 14px;
    font-weight: 600;
  }
  .btn-note {
    font-size: 12px;
    color: var(--color-text-secondary);
    font-weight: 400;
  }

  .btn-primary {
    background: var(--color-accent);
    color: #fff;
    border-color: var(--color-accent);
    box-shadow: 0 2px 8px rgba(10, 132, 255, 0.3);
  }
  .btn-primary:hover {
    opacity: 0.92;
    background: var(--color-accent);
  }
  .btn-primary .btn-note {
    color: rgba(255, 255, 255, 0.85);
  }
</style>
