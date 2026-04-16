<script lang="ts">
  import { m } from '$lib/paraglide/messages';
  import type { Exercise } from '$lib/types/exercise';

  interface Props {
    exercises: Exercise[];
    excludeIds: string[];
    onPick: (id: string) => void;
    onClose: () => void;
  }

  let { exercises, excludeIds, onPick, onClose }: Props = $props();
  let query = $state('');

  const available = $derived(exercises.filter((e) => !excludeIds.includes(e.id)));
  const filtered = $derived(
    query.trim() === ''
      ? available
      : available.filter((e) =>
          e.name.toLowerCase().includes(query.toLowerCase().trim()),
        ),
  );

  function handleBackdrop(e: MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }
</script>

<div class="backdrop" onclick={handleBackdrop} role="presentation">
  <div class="dialog" role="dialog" aria-modal="true" aria-label={m.playlists_dialog_title()}>
    <header class="head">
      <h3>{m.playlists_dialog_title()}</h3>
      <button type="button" class="close" onclick={onClose} aria-label={m.playlists_dialog_close_aria()}>✕</button>
    </header>
    <input
      type="search"
      bind:value={query}
      placeholder={m.playlists_dialog_search_placeholder()}
      aria-label={m.playlists_dialog_search_aria()}
    />
    {#if filtered.length === 0}
      <p class="empty">{m.playlists_dialog_empty()}</p>
    {:else}
      <ul>
        {#each filtered as ex (ex.id)}
          <li>
            <button type="button" onclick={() => onPick(ex.id)}>
              <span class="name">{ex.name || m.exercise_unnamed()}</span>
              <span class="meta">
                {ex.strokes.length === 1 ? m.exercise_meta_strokes_one() : m.exercise_meta_strokes_other({ count: ex.strokes.length })}
              </span>
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: grid;
    place-items: center;
    z-index: 50;
  }
  .dialog {
    width: min(480px, 92vw);
    max-height: 80vh;
    background: var(--bg-elevated);
    border-radius: var(--radius-panel);
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .head { display: flex; align-items: center; }
  h3 {
    flex: 1;
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text-primary);
  }
  .close {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    color: var(--color-text-secondary);
  }
  input {
    padding: 10px 14px;
    border-radius: var(--radius-button);
    background: var(--bg-surface);
    border: 1px solid var(--color-border);
    color: var(--color-text-primary);
  }
  ul {
    list-style: none;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  ul button {
    width: 100%;
    text-align: left;
    padding: 10px 12px;
    border-radius: var(--radius-panel);
    display: flex;
    justify-content: space-between;
    color: var(--color-text-primary);
  }
  ul button:hover {
    background: var(--bg-surface);
  }
  .name { font-weight: 500; }
  .meta {
    color: var(--color-text-secondary);
    font-size: 12px;
  }
  .empty {
    text-align: center;
    color: var(--color-text-secondary);
    padding: 24px 0;
  }
</style>
