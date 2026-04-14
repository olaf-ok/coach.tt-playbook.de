<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import PlaylistListItem from '$lib/components/PlaylistListItem.svelte';
  import PlaylistDetail from '$lib/components/PlaylistDetail.svelte';
  import AddExerciseDialog from '$lib/components/AddExerciseDialog.svelte';
  import { createEmptyPlaylist, type Playlist } from '$lib/types/playlist';
  import { savePlaylist, deletePlaylist, loadPlaylist } from '$lib/db/playlists';
  import { addExerciseId, removeExerciseId, moveExerciseId } from '$lib/db/playlistOps';

  let { data } = $props();

  let selectedId = $state<string | null>(null);
  let showAddDialog = $state(false);

  $effect(() => {
    if (selectedId === null && data.playlists.length > 0) {
      selectedId = data.playlists[0].id;
    }
  });

  const selected = $derived(
    data.playlists.find((p) => p.id === selectedId) ?? null,
  );
  const selectedExercises = $derived(
    selected
      ? (selected.exerciseIds
          .map((id) => data.exercises.find((e) => e.id === id))
          .filter(Boolean) as typeof data.exercises)
      : [],
  );

  async function createPlaylist() {
    const name = prompt('Name der Playlist:');
    if (name === null) return;
    const p = createEmptyPlaylist();
    p.name = name.trim();
    await savePlaylist(p);
    selectedId = p.id;
    await invalidateAll();
  }

  async function renameSelected() {
    if (!selected) return;
    const next = prompt('Neuer Name:', selected.name);
    if (next === null) return;
    const p = await loadPlaylist(selected.id);
    if (!p) return;
    p.name = next.trim();
    await savePlaylist(p);
    await invalidateAll();
  }

  async function duplicateSelected() {
    if (!selected) return;
    const copy: Playlist = {
      ...selected,
      id: crypto.randomUUID(),
      name: `${selected.name || 'Unbenannt'} (Kopie)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await savePlaylist(copy);
    selectedId = copy.id;
    await invalidateAll();
  }

  async function deleteSelected() {
    if (!selected) return;
    if (!confirm('Diese Playlist wirklich löschen?')) return;
    const idToRemove = selected.id;
    await deletePlaylist(idToRemove);
    selectedId = data.playlists.find((p) => p.id !== idToRemove)?.id ?? null;
    await invalidateAll();
  }

  async function addExercise(exerciseId: string) {
    if (!selected) return;
    const p = await loadPlaylist(selected.id);
    if (!p) return;
    p.exerciseIds = addExerciseId(p.exerciseIds, exerciseId);
    await savePlaylist(p);
    showAddDialog = false;
    await invalidateAll();
  }

  async function removeExercise(exerciseId: string) {
    if (!selected) return;
    const p = await loadPlaylist(selected.id);
    if (!p) return;
    p.exerciseIds = removeExerciseId(p.exerciseIds, exerciseId);
    await savePlaylist(p);
    await invalidateAll();
  }

  async function reorder(from: number, to: number) {
    if (!selected) return;
    const p = await loadPlaylist(selected.id);
    if (!p) return;
    p.exerciseIds = moveExerciseId(p.exerciseIds, from, to);
    await savePlaylist(p);
    await invalidateAll();
  }
</script>

<section class="playlists-page">
  <aside class="left">
    <header class="left-head">
      <h1>Playlists</h1>
      <button
        type="button"
        class="add-btn"
        aria-label="Neue Playlist"
        onclick={createPlaylist}>+</button
      >
    </header>
    {#if data.playlists.length === 0}
      <p class="empty">Noch keine Playlist.</p>
    {:else}
      <div class="list">
        {#each data.playlists as pl (pl.id)}
          <PlaylistListItem
            playlist={pl}
            active={pl.id === selectedId}
            exerciseCount={pl.exerciseIds.length}
            onSelect={(id) => (selectedId = id)}
          />
        {/each}
      </div>
    {/if}
  </aside>

  <div class="right">
    {#if selected}
      <PlaylistDetail
        playlist={selected}
        exercises={selectedExercises}
        onRename={renameSelected}
        onDuplicate={duplicateSelected}
        onDelete={deleteSelected}
        onAddExercise={() => (showAddDialog = true)}
        onRemoveExercise={removeExercise}
        onReorder={reorder}
      />
    {:else}
      <div class="empty">
        <p>Wähle oder erstelle eine Playlist.</p>
      </div>
    {/if}
  </div>

  {#if showAddDialog && selected}
    <AddExerciseDialog
      exercises={data.exercises}
      excludeIds={selected.exerciseIds}
      onPick={addExercise}
      onClose={() => (showAddDialog = false)}
    />
  {/if}
</section>

<style>
  .playlists-page {
    flex: 1;
    display: flex;
    overflow: hidden;
  }
  .left {
    width: 320px;
    border-right: 1px solid var(--color-border);
    background: var(--bg-surface);
    display: flex;
    flex-direction: column;
    padding: 16px;
    gap: 12px;
  }
  .left-head { display: flex; align-items: center; gap: 8px; }
  h1 {
    flex: 1;
    font-size: 20px;
    font-weight: 600;
    color: var(--color-text-primary);
  }
  .add-btn {
    width: 36px;
    height: 36px;
    border-radius: var(--radius-button);
    background: var(--color-accent);
    color: #fff;
    font-size: 20px;
  }
  .list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    overflow-y: auto;
  }
  .right {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .empty {
    padding: 48px;
    text-align: center;
    color: var(--color-text-secondary);
  }
</style>
