<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import ExerciseCard from '$lib/components/ExerciseCard.svelte';
  import { deleteExercise, saveExercise, loadExercise } from '$lib/db/exercises';
  import type { Exercise } from '$lib/types/exercise';

  let { data } = $props();
  let exercises = $derived(data.exercises);

  let query = $state('');
  let filtered = $derived(
    query.trim() === ''
      ? exercises
      : exercises.filter((e) =>
          e.name.toLowerCase().includes(query.toLowerCase().trim()),
        ),
  );

  function open(_id: string) {
    // Phase C: /draw/:id mit Vorlage — für jetzt: Navigation nach /draw
    goto('/draw');
  }

  async function rename(id: string) {
    const current = await loadExercise(id);
    if (!current) return;
    const next = prompt('Neuer Name:', current.name);
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
      name: `${src.name || 'Unbenannt'} (Kopie)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await saveExercise(copy);
    await invalidateAll();
  }

  async function remove(id: string) {
    if (!confirm('Diese Übung wirklich löschen?')) return;
    await deleteExercise(id);
    await invalidateAll();
  }
</script>

<section class="archive">
  <header class="head">
    <h1>Archiv</h1>
    <p class="count">{exercises.length} Übung{exercises.length === 1 ? '' : 'en'}</p>
  </header>

  <input
    class="search"
    type="search"
    placeholder="Suchen..."
    bind:value={query}
    aria-label="Übungen suchen"
  />

  {#if exercises.length === 0}
    <div class="empty">
      <p>Noch keine Übungen gespeichert.</p>
      <a class="cta" href="/draw">Neue Übung zeichnen</a>
    </div>
  {:else if filtered.length === 0}
    <div class="empty">
      <p>Keine Übung passt zu "{query}".</p>
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
    align-items: baseline;
    gap: 12px;
    margin-bottom: 20px;
  }
  h1 {
    font-size: 24px;
    font-weight: 600;
    color: var(--color-text-primary);
  }
  .count {
    color: var(--color-text-secondary);
    font-size: 14px;
  }
  .search {
    width: 320px;
    padding: 10px 14px;
    border-radius: var(--radius-button);
    background: var(--bg-surface);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border);
    margin-bottom: 16px;
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
