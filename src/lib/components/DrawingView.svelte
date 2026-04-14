<script lang="ts">
  import TableCanvas from '$lib/components/TableCanvas.svelte';
  import Toolbar from '$lib/components/Toolbar.svelte';
  import StepsPanel from '$lib/components/StepsPanel.svelte';
  import PaywallDialog from '$lib/components/PaywallDialog.svelte';
  import { StrokeInputController } from '$lib/canvas/StrokeInput';
  import { currentExercise } from '$lib/stores/currentExercise.svelte';
  import { saveExercise, loadExercise } from '$lib/db/exercises';
  import { db } from '$lib/db/database';
  import { tvSession } from '$lib/tv/session.svelte';
  import { proStatus, FREE_EXERCISE_LIMIT } from '$lib/pro/status.svelte';
  import type { Point } from '$lib/types/exercise';

  let selectedStrokeId = $state<string | null>(null);
  let isBendingMode = $state(false);
  let warningMessage = $state<string | null>(null);
  let paywallOpen = $state(false);

  const input = new StrokeInputController((n) => {
    warningMessage = `Viele Schläge (${n}) — Farben wiederholen sich ab hier. Übung ggf. in mehrere aufteilen.`;
    setTimeout(() => (warningMessage = null), 5000);
  });

  $effect(() => {
    if (!tvSession.hasClient()) return;
    const client = tvSession.ensureClient();
    if (client.status !== 'paired') return;
    const ex = currentExercise.exercise;
    void ex.strokes.length;
    void ex.name;
    void ex.repetitions;
    void ex.duration;
    client.sendSync(ex);
  });

  function handleTap(rel: Point) {
    input.handleTap(rel);
  }

  function handleDragStart(rel: Point) {
    input.handleDragStart(rel);
  }

  function handleDragMove(rel: Point) {
    input.handleDragMove(rel);
  }

  function handleDragEnd(rel: Point) {
    input.handleDragEnd(rel);
  }

  function handleStrokeTap(id: string) {
    selectedStrokeId = id;
  }

  function handleDeleteStroke(id: string) {
    currentExercise.deleteStroke(id);
    if (selectedStrokeId === id) selectedStrokeId = null;
  }

  function handleUndo() {
    const last = currentExercise.exercise.strokes.at(-1);
    if (last) {
      currentExercise.deleteStroke(last.id);
      if (selectedStrokeId === last.id) selectedStrokeId = null;
    }
  }

  async function handleSave() {
    if (!proStatus.isPro) {
      const existing = await loadExercise(currentExercise.exercise.id);
      if (!existing) {
        const count = await db.exercises.count();
        if (count >= FREE_EXERCISE_LIMIT) {
          paywallOpen = true;
          return;
        }
      }
    }
    if (currentExercise.exercise.name.trim() === '') {
      currentExercise.exercise.name = 'Neue Übung';
    }
    await saveExercise(currentExercise.exercise);
    warningMessage = 'Gespeichert.';
    setTimeout(() => (warningMessage = null), 2000);
  }

  function toggleBend() {
    isBendingMode = !isBendingMode;
    if (!isBendingMode) selectedStrokeId = null;
  }

  async function handleReload() {
    const id = currentExercise.exercise.id;
    const loaded = await loadExercise(id);
    if (loaded) {
      currentExercise.load(loaded);
      warningMessage = 'Neu geladen.';
      setTimeout(() => (warningMessage = null), 2000);
    } else {
      warningMessage = 'Noch nicht gespeichert.';
      setTimeout(() => (warningMessage = null), 2000);
    }
  }
</script>

<Toolbar
  onUndo={handleUndo}
  onSave={handleSave}
  onReload={handleReload}
  onToggleBend={toggleBend}
  isBendingMode={isBendingMode}
  canUndo={currentExercise.exercise.strokes.length > 0}
/>

<div class="layout">
  <div class="canvas-area">
    {#if warningMessage}
      <div class="warning">{warningMessage}</div>
    {/if}
    <TableCanvas
      showZoneMarkers={false}
      onEmptyAreaTap={handleTap}
      onEmptyAreaDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onStrokeTap={handleStrokeTap}
      bendingStrokeId={isBendingMode ? selectedStrokeId : null}
    />
  </div>

  <StepsPanel
    selectedStrokeId={selectedStrokeId}
    onSelectStroke={(id) => (selectedStrokeId = id)}
    onDeleteStroke={handleDeleteStroke}
  />
</div>

{#if paywallOpen}
  <PaywallDialog onClose={() => (paywallOpen = false)} />
{/if}

<style>
  .layout {
    flex: 1;
    display: flex;
    overflow: hidden;
  }

  .canvas-area {
    flex: 1;
    position: relative;
    overflow: hidden;
  }

  .warning {
    position: absolute;
    top: 12px;
    left: 50%;
    transform: translateX(-50%);
    padding: 8px 14px;
    background: rgba(255, 159, 10, 0.9);
    color: #000;
    border-radius: var(--radius-button);
    font-size: 13px;
    font-weight: 500;
    z-index: 10;
    max-width: 80%;
    text-align: center;
  }
</style>
