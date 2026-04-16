<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import ExerciseCard from '$lib/components/ExerciseCard.svelte';
  import SearchIcon from '$lib/icons/SearchIcon.svelte';
  import PlusIcon from '$lib/icons/PlusIcon.svelte';
  import { deleteExercise, saveExercise, loadExercise } from '$lib/db/exercises';
  import type { Exercise } from '$lib/types/exercise';
  import { DEFAULT_STROKE_TYPE_CODES, type StrokeTypeCode } from '$lib/constants/strokeTypes';
  import { strokeTypeLabel } from '$lib/i18n/stroke-type-labels';
  import { m } from '$lib/paraglide/messages';

  let { data } = $props();
  let exercises = $derived(data.exercises);

  let query = $state('');
  let activeTag = $state<StrokeTypeCode | null>(null);

  // Nur Codes anzeigen, die in mind. einer Übung tatsächlich vorkommen.
  const usedCodes = $derived(
    new Set(
      exercises.flatMap(
        (e) => e.strokes.map((s) => s.strokeType).filter(Boolean) as StrokeTypeCode[],
      ),
    ),
  );

  const visibleCodes = $derived(
    DEFAULT_STROKE_TYPE_CODES.filter((c) => usedCodes.has(c)),
  );

  let filtered = $derived(
    exercises.filter((e) => {
      const matchesQuery =
        query.trim() === '' ||
        e.name.toLowerCase().includes(query.toLowerCase().trim());
      const matchesTag =
        activeTag === null || e.strokes.some((s) => s.strokeType === activeTag);
      return matchesQuery && matchesTag;
    }),
  );

  function open(id: string) {
    goto(`/draw/${id}`);
  }

  async function rename(id: string) {
    const current = await loadExercise(id);
    if (!current) return;
    const next = prompt(m.archive_rename_prompt(), current.name);
    if (next === null) return;
    current.name = next.trim();
    await saveExercise(current);
    await invalidateAll();
  }

  async function duplicate(id: string) {
    const src = await loadExercise(id);
    if (!src) return;
    const copy: Exercise = {
      ...src,
      id: crypto.randomUUID(),
      name: `${src.name || m.exercise_unnamed()} (${m.archive_copy_suffix()})`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await saveExercise(copy);
    await invalidateAll();
  }

  async function remove(id: string) {
    if (!confirm(m.archive_delete_confirm())) return;
    await deleteExercise(id);
    await invalidateAll();
  }
</script>

<section class="archive">
  <header class="head">
    <div class="title-row">
      <h1>{m.archive_title()}</h1>
      <p class="count">
        {exercises.length === 1 ? m.archive_count_one() : m.archive_count_other({ count: exercises.length })}
      </p>
    </div>
    <a href="/draw" class="new-btn">
      <PlusIcon size={18} />
      <span>{m.archive_new_exercise()}</span>
    </a>
  </header>

  <div class="search-wrap">
    <span class="search-icon"><SearchIcon /></span>
    <input
      class="search"
      type="search"
      placeholder={m.archive_search_placeholder()}
      bind:value={query}
      aria-label={m.archive_search_aria()}
    />
  </div>

  {#if visibleCodes.length > 0}
    <div class="chips">
      <button
        type="button"
        class="chip"
        class:active={activeTag === null}
        onclick={() => (activeTag = null)}
      >
        {m.archive_filter_all()}
      </button>
      {#each visibleCodes as code (code)}
        {@const label = strokeTypeLabel(code)}
        <button
          type="button"
          class="chip"
          class:active={activeTag === code}
          title={label.full}
          onclick={() => (activeTag = code)}
        >
          {label.short}
        </button>
      {/each}
    </div>
  {/if}

  {#if exercises.length === 0}
    <div class="empty">
      <p>{m.archive_empty_no_exercises()}</p>
      <a class="cta" href="/draw">{m.archive_empty_cta()}</a>
    </div>
  {:else if filtered.length === 0}
    <div class="empty">
      <p>{m.archive_empty_no_match()}</p>
    </div>
  {:else}
    <div class="grid">
      {#each filtered as ex (ex.id)}
        <ExerciseCard
          exercise={ex}
          onOpen={open}
          onRename={rename}
          onDuplicate={duplicate}
          onDelete={remove}
        />
      {/each}
    </div>
  {/if}
</section>

<style>
  .archive {
    padding: 24px 32px;
    overflow-y: auto;
    flex: 1;
  }
  .head {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
  }
  .title-row {
    display: flex;
    align-items: baseline;
    gap: 12px;
    flex: 1;
  }
  h1 {
    font-size: 24px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;
  }
  .count {
    color: var(--color-text-secondary);
    font-size: 14px;
    margin: 0;
  }
  .new-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 10px 14px;
    background: var(--color-accent);
    color: #fff;
    border-radius: var(--radius-button);
    text-decoration: none;
    font-size: 14px;
    font-weight: 600;
  }
  .search-wrap {
    position: relative;
    width: 320px;
    margin-bottom: 16px;
  }
  .search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--color-text-secondary);
    pointer-events: none;
    display: flex;
  }
  .search {
    width: 100%;
    padding: 10px 14px 10px 38px;
    border-radius: var(--radius-button);
    background: var(--bg-surface);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border);
  }
  .chips {
    display: flex;
    gap: 6px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }
  .chip {
    padding: 6px 12px;
    border-radius: 999px;
    font-size: 13px;
    background: var(--bg-surface);
    color: var(--color-text-secondary);
    border: 1px solid var(--color-border);
  }
  .chip.active {
    background: var(--color-accent);
    color: #fff;
    border-color: var(--color-accent);
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px;
  }
  .empty {
    padding: 48px;
    text-align: center;
    color: var(--color-text-secondary);
  }
  .cta {
    display: inline-block;
    margin-top: 12px;
    padding: 10px 16px;
    background: var(--color-accent);
    color: #fff;
    border-radius: var(--radius-button);
    text-decoration: none;
  }
</style>
