<script lang="ts">
  import { currentExercise } from '$lib/stores/currentExercise.svelte';

  interface Props {
    onUndo?: () => void;
    onSave?: () => void;
    onToggleBend?: () => void;
    isBendingMode?: boolean;
    canUndo?: boolean;
  }

  let {
    onUndo,
    onSave,
    onToggleBend,
    isBendingMode = false,
    canUndo = false,
  }: Props = $props();
</script>

<header class="toolbar">
  <input
    type="text"
    class="name-field"
    bind:value={currentExercise.exercise.name}
    placeholder="Übungsname"
  />

  <div class="tools">
    <button
      type="button"
      class="tool"
      class:active={isBendingMode}
      onclick={() => onToggleBend?.()}
      aria-label="Kurve biegen"
      title="Pfeil antippen, dann Kontrollpunkt ziehen"
    >
      ∿
    </button>
    <button
      type="button"
      class="tool"
      disabled={!canUndo}
      onclick={() => onUndo?.()}
      aria-label="Rückgängig"
      title="Rückgängig"
    >
      ↶
    </button>
  </div>

  <div class="actions">
    <button type="button" class="save" onclick={() => onSave?.()}>Speichern</button>
  </div>
</header>

<style>
  .toolbar {
    height: 64px;
    padding: 0 16px;
    background: var(--bg-surface);
    border-bottom: 1px solid var(--color-border);
    display: flex;
    align-items: center;
    gap: 24px;
  }

  .name-field {
    flex: 1;
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

  .tools {
    display: flex;
    gap: 6px;
  }

  .tool {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-button);
    color: var(--color-text-secondary);
    font-size: 18px;
    transition: background var(--transition-quick), color var(--transition-quick);
  }

  .tool:hover:not(:disabled) {
    background: var(--bg-elevated);
    color: var(--color-text-primary);
  }

  .tool.active {
    background: var(--bg-elevated);
    color: var(--color-primary);
  }

  .tool:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .actions {
    margin-left: auto;
  }

  .save {
    height: 40px;
    padding: 0 18px;
    background: var(--color-primary);
    color: #000;
    border-radius: var(--radius-button);
    font-size: 14px;
    font-weight: 600;
    transition: opacity var(--transition-quick);
  }

  .save:hover {
    opacity: 0.9;
  }
</style>
