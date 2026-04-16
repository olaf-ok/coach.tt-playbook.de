<script lang="ts">
  import Konva from 'konva';
  import { onMount, onDestroy } from 'svelte';
  import { TableRenderer } from '$lib/canvas/TableRenderer';
  import { StrokeRenderer } from '$lib/canvas/StrokeRenderer';
  import { TABLE_ASPECT } from '$lib/canvas/tableDimensions';
  import { getStrokeColor } from '$lib/constants/colors';
  import { strokeTypeShort } from '$lib/i18n/stroke-type-labels';
  import { m } from '$lib/paraglide/messages';
  import type { Exercise } from '$lib/types/exercise';

  interface Props {
    exercise: Exercise | null;
  }

  let { exercise }: Props = $props();

  let container: HTMLDivElement;
  let stage: Konva.Stage | null = null;
  let tableLayer: Konva.Layer | null = null;
  let strokesLayer: Konva.Layer | null = null;

  function render() {
    if (!stage || !tableLayer || !strokesLayer) return;
    tableLayer.destroyChildren();
    strokesLayer.destroyChildren();

    const width = stage.width();
    const height = stage.height();
    if (width <= 0 || height <= 0) return;

    const tableWidth = Math.min(width * 0.85, (height / TABLE_ASPECT) * 0.95);
    const tableHeight = tableWidth * TABLE_ASPECT;
    const tableX = (width - tableWidth) / 2;
    const tableY = (height - tableHeight) / 2;

    const tableRenderer = new TableRenderer({
      width: tableWidth,
      height: tableHeight,
      showZoneMarkers: false,
    });
    const tableNode = tableRenderer.getKonvaNode();
    tableNode.position({ x: tableX, y: tableY });
    tableLayer.add(tableNode);

    if (exercise) {
      const box = { x: tableX, y: tableY, width: tableWidth, height: tableHeight };
      for (const stroke of exercise.strokes) {
        const r = new StrokeRenderer(stroke, box);
        strokesLayer.add(r.getKonvaNode());
      }
    }
    tableLayer.batchDraw();
    strokesLayer.batchDraw();
  }

  onMount(() => {
    const rect = container.getBoundingClientRect();
    stage = new Konva.Stage({
      container,
      width: rect.width,
      height: rect.height,
      listening: false,
    });
    tableLayer = new Konva.Layer({ listening: false });
    strokesLayer = new Konva.Layer({ listening: false });
    stage.add(tableLayer);
    stage.add(strokesLayer);
    render();

    const resizeObserver = new ResizeObserver(() => {
      if (!stage) return;
      const r = container.getBoundingClientRect();
      stage.size({ width: r.width, height: r.height });
      render();
    });
    resizeObserver.observe(container);
  });

  $effect(() => {
    void exercise;
    render();
  });

  onDestroy(() => {
    stage?.destroy();
    stage = null;
  });
</script>

<div class="tv-display">
  <div class="canvas-wrap" bind:this={container}></div>

  {#if exercise}
    <aside class="info">
      <header>
        <h1 class="title">{exercise.name || m.tv_display_exercise_fallback()}</h1>
        <div class="meta">
          {#if exercise.repetitions}<span class="chip">{m.tv_display_repeats({ n: exercise.repetitions })}</span>{/if}
          {#if exercise.duration}<span class="chip">{exercise.duration}</span>{/if}
          <span class="chip">
            {exercise.strokes.length === 1 ? m.tv_display_strokes_one() : m.tv_display_strokes_other({ count: exercise.strokes.length })}
          </span>
        </div>
      </header>

      {#if exercise.strokes.length > 0}
        <ol class="steps">
          {#each exercise.strokes as stroke (stroke.id)}
            <li class="step" style:--step-color={getStrokeColor(stroke.number)}>
              <span class="step-num">{stroke.number}</span>
              <div class="step-body">
                {#if stroke.strokeType}
                  <span class="step-type">{strokeTypeShort(stroke.strokeType)}</span>
                {:else}
                  <span class="step-type step-type--muted">—</span>
                {/if}
                {#if stroke.description}
                  <span class="step-desc">{stroke.description}</span>
                {/if}
              </div>
            </li>
          {/each}
        </ol>
      {:else}
        <p class="empty">{m.tv_display_empty_strokes()}</p>
      {/if}
    </aside>
  {/if}
</div>

<style>
  .tv-display {
    width: 100%;
    height: 100%;
    background: var(--bg-app);
    display: flex;
    overflow: hidden;
  }
  .canvas-wrap {
    flex: 1;
    min-width: 0;
  }
  .info {
    width: 380px;
    flex-shrink: 0;
    background: var(--bg-surface);
    border-left: 1px solid var(--color-border);
    padding: 28px 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    overflow-y: auto;
  }
  header {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .title {
    font-size: 28px;
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0;
    line-height: 1.15;
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .chip {
    padding: 4px 10px;
    border-radius: 999px;
    background: var(--color-chip-bg);
    color: var(--color-text-secondary);
    font-size: 13px;
    font-weight: 500;
  }

  .steps {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .step {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    background: var(--bg-elevated);
    border-radius: var(--radius-card);
    border-left: 4px solid var(--step-color);
  }
  .step-num {
    width: 28px;
    height: 28px;
    border-radius: 999px;
    background: var(--step-color);
    color: #000;
    font-size: 13px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .step-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .step-type {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary);
  }
  .step-type--muted {
    color: var(--color-text-tertiary);
    font-weight: 400;
  }
  .step-desc {
    font-size: 12px;
    color: var(--color-text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .empty {
    color: var(--color-text-secondary);
    font-size: 14px;
    margin: 0;
  }
</style>
