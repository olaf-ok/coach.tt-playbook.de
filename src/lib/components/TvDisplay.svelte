<script lang="ts">
  import Konva from 'konva';
  import { onMount, onDestroy } from 'svelte';
  import { TableRenderer } from '$lib/canvas/TableRenderer';
  import { StrokeRenderer } from '$lib/canvas/StrokeRenderer';
  import { TABLE_ASPECT } from '$lib/canvas/tableDimensions';
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
    const tableWidth = Math.min(width * 0.7, (height / TABLE_ASPECT) * 0.95);
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
    // Trigger re-render bei exercise-Änderung
    void exercise;
    render();
  });

  onDestroy(() => {
    stage?.destroy();
    stage = null;
  });
</script>

<div bind:this={container} class="tv-display">
  {#if exercise}
    <div class="overlay-top">
      <span class="name">{exercise.name || 'Übung'}</span>
      {#if exercise.repetitions}<span class="meta">{exercise.repetitions}×</span>{/if}
      {#if exercise.duration}<span class="meta">{exercise.duration}</span>{/if}
    </div>
  {/if}
</div>

<style>
  .tv-display {
    position: relative;
    width: 100%;
    height: 100%;
    background: var(--bg-app);
    overflow: hidden;
  }
  .overlay-top {
    position: absolute;
    top: 24px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    align-items: baseline;
    gap: 16px;
    pointer-events: none;
  }
  .name {
    font-size: 32px;
    font-weight: 600;
    color: var(--color-text-primary);
  }
  .meta {
    font-size: 20px;
    color: var(--color-text-secondary);
  }
</style>
