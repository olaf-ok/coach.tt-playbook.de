<script lang="ts">
  import OverflowMenu from './OverflowMenu.svelte';
  import ExerciseThumbnail from './ExerciseThumbnail.svelte';
  import { m } from '$lib/paraglide/messages';
  import type { Playlist } from '$lib/types/playlist';
  import type { Exercise } from '$lib/types/exercise';

  interface Props {
    playlist: Playlist;
    exercises: Exercise[];
    onRename: () => void;
    onDuplicate: () => void;
    onDelete: () => void;
    onAddExercise: () => void;
    onRemoveExercise: (exerciseId: string) => void;
    onReorder?: (fromIndex: number, toIndex: number) => void;
    onPlay?: () => void;
    canPlay?: boolean;
    playHint?: string;
  }

  let {
    playlist,
    exercises,
    onRename,
    onDuplicate,
    onDelete,
    onAddExercise,
    onRemoveExercise,
    onReorder,
    onPlay,
    canPlay = false,
    playHint = '',
  }: Props = $props();

  let dragIndex = $state<number | null>(null);
</script>

<div class="detail">
  <header class="head">
    <div class="title-row">
      <h2>{playlist.name || m.exercise_unnamed()}</h2>
      <button
        type="button"
        class="primary"
        disabled={!canPlay}
        title={playHint}
        onclick={() => onPlay?.()}
      >{m.playlists_play_on_tv()}</button>
    </div>
    <div class="meta-row">
      <span class="meta">
        {exercises.length === 1 ? m.archive_count_one() : m.archive_count_other({ count: exercises.length })}
      </span>
      <div class="actions">
        <button type="button" onclick={onRename}>{m.playlists_action_rename()}</button>
        <button type="button" onclick={onDuplicate}>{m.playlists_action_duplicate()}</button>
        <button type="button" class="danger" onclick={onDelete}>{m.playlists_action_delete()}</button>
      </div>
    </div>
  </header>

  {#if exercises.length === 0}
    <p class="empty">{m.playlists_empty_in_list()}</p>
  {:else}
    <ul class="list">
      {#each exercises as ex, i (ex.id)}
        <li
          class="row"
          class:dragging={dragIndex === i}
          draggable={onReorder ? 'true' : 'false'}
          ondragstart={(e) => {
            if (!onReorder) return;
            dragIndex = i;
            e.dataTransfer?.setData('text/plain', String(i));
          }}
          ondragover={(e) => {
            if (onReorder) e.preventDefault();
          }}
          ondrop={(e) => {
            if (!onReorder) return;
            e.preventDefault();
            const from = Number(e.dataTransfer?.getData('text/plain'));
            if (Number.isInteger(from) && from !== i) onReorder(from, i);
            dragIndex = null;
          }}
          ondragend={() => (dragIndex = null)}
        >
          {#if onReorder}
            <span class="handle" aria-hidden="true">≡</span>
          {/if}
          <span class="idx">{i + 1}</span>
          <ExerciseThumbnail exercise={ex} width={96} height={60} />
          <div class="body">
            <span class="name">{ex.name || m.exercise_unnamed()}</span>
            <span class="inline-meta">
              {ex.strokes.length === 1 ? m.exercise_meta_strokes_one() : m.exercise_meta_strokes_other({ count: ex.strokes.length })}
            </span>
          </div>
          <OverflowMenu
            items={[
              {
                label: m.playlists_remove_from_list(),
                onSelect: () => onRemoveExercise(ex.id),
                destructive: true,
              },
            ]}
          />
        </li>
      {/each}
    </ul>
  {/if}

  <button type="button" class="add" onclick={onAddExercise}>{m.playlists_add_exercise()}</button>
</div>

<style>
  .detail {
    padding: 20px 24px;
    overflow-y: auto;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .head { display: flex; flex-direction: column; gap: 8px; }
  .title-row { display: flex; align-items: center; gap: 12px; }
  h2 {
    flex: 1;
    font-size: 22px;
    font-weight: 600;
    color: var(--color-text-primary);
  }
  .primary {
    padding: 10px 16px;
    border-radius: var(--radius-button);
    background: var(--color-accent);
    color: #fff;
    font-weight: 600;
  }
  .primary[disabled] { opacity: 0.5; cursor: not-allowed; }
  .meta-row { display: flex; align-items: center; gap: 12px; }
  .meta {
    color: var(--color-text-secondary);
    font-size: 13px;
    flex: 1;
  }
  .actions { display: flex; gap: 8px; }
  .actions button {
    color: var(--color-accent);
    font-size: 13px;
    padding: 4px 8px;
  }
  .actions .danger { color: var(--color-danger); }
  .list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--bg-surface);
    border-radius: var(--radius-panel);
    padding: 10px 12px;
  }
  .row.dragging { opacity: 0.5; }
  .handle {
    color: var(--color-text-secondary);
    font-size: 16px;
    cursor: grab;
    padding: 0 4px;
  }
  .idx {
    width: 28px;
    text-align: center;
    color: var(--color-text-secondary);
  }
  .body {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .name {
    font-weight: 600;
    color: var(--color-text-primary);
  }
  .inline-meta {
    font-size: 12px;
    color: var(--color-text-secondary);
  }
  .add {
    padding: 12px;
    border: 1px dashed var(--color-border);
    border-radius: var(--radius-panel);
    color: var(--color-text-secondary);
    font-size: 14px;
  }
  .add:hover {
    color: var(--color-text-primary);
    border-color: var(--color-text-secondary);
  }
  .empty {
    padding: 24px;
    text-align: center;
    color: var(--color-text-secondary);
  }
</style>
