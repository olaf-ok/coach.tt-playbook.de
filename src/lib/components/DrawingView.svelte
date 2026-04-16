<script lang="ts">
  import { goto } from '$app/navigation';
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
  import { m } from '$lib/paraglide/messages';
  import type { Point } from '$lib/types/exercise';

  type ToastKind = 'info' | 'success' | 'warning';
  let selectedStrokeId = $state<string | null>(null);
  let toast = $state<{ text: string; kind: ToastKind } | null>(null);
  let paywallOpen = $state(false);

  function showToast(text: string, kind: ToastKind = 'info', ms = 2000) {
    toast = { text, kind };
    setTimeout(() => (toast = null), ms);
  }

  const input = new StrokeInputController((n) => {
    showToast(
      m.draw_many_strokes_warning({ count: n }),
      'warning',
      5000,
    );
  });

  $effect(() => {
    const client = tvSession.client;
    if (!client || client.status !== 'paired') return;
    const ex = currentExercise.exercise;
    void ex.strokes.length;
    void ex.name;
    void ex.repetitions;
    void ex.duration;
    client.sendSync(ex);
  });

  function handleTap(rel: Point) {
    const added = input.handleTap(rel);
    if (added) selectedStrokeId = added.id;
  }

  function handleDragStart(rel: Point) {
    input.handleDragStart(rel);
  }

  function handleDragMove(rel: Point) {
    input.handleDragMove(rel);
  }

  function handleDragEnd(rel: Point) {
    const added = input.handleDragEnd(rel);
    if (added) selectedStrokeId = added.id;
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
    try {
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
        currentExercise.exercise.name = m.draw_default_exercise_name();
      }
      // $state.snapshot: deep plain copy — strips Svelte 5 Proxy so IndexedDB akzeptiert es
      const plain = $state.snapshot(currentExercise.exercise);
      await saveExercise(plain);
      showToast(m.draw_save_success(), 'success');
    } catch (err) {
      console.error('save failed', err);
      showToast(m.draw_save_error(), 'warning', 3000);
    }
  }

  function handleNew() {
    currentExercise.reset();
    selectedStrokeId = null;
    goto('/draw');
    showToast(m.draw_save_new(), 'info');
  }

  function handleOpenTv() {
    goto('/settings/tv');
  }
</script>

<Toolbar
  onSave={handleSave}
  onNew={handleNew}
  onOpenTv={handleOpenTv}
  tvStatus={tvSession.status}
/>

<div class="layout">
  <div class="canvas-area">
    {#if toast}
      <div class="toast toast--{toast.kind}">{toast.text}</div>
    {/if}
    <TableCanvas
      showZoneMarkers={false}
      onEmptyAreaTap={handleTap}
      onEmptyAreaDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onStrokeTap={handleStrokeTap}
    />
  </div>

  <StepsPanel
    selectedStrokeId={selectedStrokeId}
    onSelectStroke={(id) => (selectedStrokeId = id)}
    onDeleteStroke={handleDeleteStroke}
    onUndo={handleUndo}
    canUndo={currentExercise.exercise.strokes.length > 0}
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

  .toast {
    position: absolute;
    top: 16px;
    left: 50%;
    transform: translateX(-50%);
    padding: 10px 18px;
    border-radius: var(--radius-button);
    font-size: 14px;
    font-weight: 600;
    z-index: 10;
    max-width: 80%;
    text-align: center;
    box-shadow: var(--shadow-card);
    color: #fff;
  }
  .toast--success {
    background: var(--color-success);
  }
  .toast--info {
    background: var(--color-accent);
  }
  .toast--warning {
    background: var(--color-danger);
  }
</style>
