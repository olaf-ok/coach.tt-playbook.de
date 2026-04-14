<script lang="ts">
  import ExerciseThumbnail from './ExerciseThumbnail.svelte';
  import OverflowMenu from './OverflowMenu.svelte';
  import type { Exercise } from '$lib/types/exercise';

  interface Props {
    exercise: Exercise;
    onOpen: (id: string) => void;
    onRename: (id: string) => void;
    onDuplicate: (id: string) => void;
    onDelete: (id: string) => void;
  }

  let { exercise, onOpen, onRename, onDuplicate, onDelete }: Props = $props();

  const strokeCount = $derived(exercise.strokes.length);
  const uniqueTags = $derived(
    Array.from(
      new Set(exercise.strokes.map((s) => s.strokeType).filter(Boolean)),
    ) as string[],
  );
</script>

<article class="card">
  <button type="button" class="thumb-btn" onclick={() => onOpen(exercise.id)}>
    <ExerciseThumbnail {exercise} />
  </button>
  <div class="body">
    <div class="title-row">
      <h3 class="title">{exercise.name || 'Unbenannt'}</h3>
      <OverflowMenu
        items={[
          { label: 'Umbenennen', onSelect: () => onRename(exercise.id) },
          { label: 'Duplizieren', onSelect: () => onDuplicate(exercise.id) },
          { label: 'Löschen', onSelect: () => onDelete(exercise.id), destructive: true },
        ]}
      />
    </div>
    <div class="meta">
      <span>{strokeCount} Schläge</span>
      {#if exercise.repetitions}<span>{exercise.repetitions}x</span>{/if}
      {#if exercise.duration}<span>{exercise.duration}</span>{/if}
    </div>
    {#if uniqueTags.length > 0}
      <div class="tags">
        {#each uniqueTags as tag (tag)}
          <span class="chip">{tag}</span>
        {/each}
      </div>
    {/if}
  </div>
</article>

<style>
  .card {
    background: var(--bg-surface);
    border-radius: var(--radius-panel);
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .thumb-btn {
    padding: 0;
    background: none;
    border: 0;
    cursor: pointer;
    align-self: stretch;
  }
  .title-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .title {
    flex: 1;
    font-size: 15px;
    font-weight: 600;
    color: var(--color-text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .meta {
    display: flex;
    gap: 8px;
    font-size: 12px;
    color: var(--color-text-secondary);
  }
  .tags {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }
  .chip {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--bg-elevated);
    color: var(--color-text-secondary);
  }
</style>
