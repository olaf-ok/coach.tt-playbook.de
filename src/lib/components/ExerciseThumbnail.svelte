<script lang="ts">
  import Konva from 'konva';
  import { onMount, onDestroy } from 'svelte';
  import { TableRenderer } from '$lib/canvas/TableRenderer';
  import { StrokeRenderer } from '$lib/canvas/StrokeRenderer';
  import { TABLE_ASPECT } from '$lib/canvas/tableDimensions';
  import type { Exercise } from '$lib/types/exercise';

  interface Props {
    exercise: Exercise;
    width?: number;
    height?: number;
  }

  let { exercise, width = 220, height = 140 }: Props = $props();

  let container: HTMLDivElement;
  let stage: Konva.Stage | null = null;
  let strokesLayer: Konva.Layer | null = null;
  let tableBox = { x: 0, y: 0, width: 0, height: 0 };

  onMount(() => {
    const tableWidth = Math.min(width * 0.85, (height / TABLE_ASPECT) * 0.9);
    const tableHeight = tableWidth * TABLE_ASPECT;
    const tableX = (width - tableWidth) / 2;
    const tableY = (height - tableHeight) / 2;

    stage = new Konva.Stage({ container, width, height, listening: false });
    const tableLayer = new Konva.Layer({ listening: false });
    strokesLayer = new Konva.Layer({ listening: false });
    stage.add(tableLayer);
    stage.add(strokesLayer);

    const tableRenderer = new TableRenderer({
      width: tableWidth,
      height: tableHeight,
      showZoneMarkers: false,
      strokeScale: 0.4,
    });
    const tableNode = tableRenderer.getKonvaNode();
    tableNode.position({ x: tableX, y: tableY });
    tableLayer.add(tableNode);

    tableBox = { x: tableX, y: tableY, width: tableWidth, height: tableHeight };
    tableLayer.draw();
  });

  $effect(() => {
    if (!strokesLayer) return;
    // Trigger on exercise.strokes changes
    void exercise.strokes.length;
    strokesLayer.destroyChildren();
    for (const stroke of exercise.strokes) {
      const renderer = new StrokeRenderer(
        stroke,
        tableBox,
        {},
        { scale: 0.725, showLabel: false },
      );
      strokesLayer.add(renderer.getKonvaNode());
    }
    strokesLayer.batchDraw();
  });

  onDestroy(() => {
    stage?.destroy();
    stage = null;
  });
</script>

<div
  bind:this={container}
  class="thumb"
  style="width: {width}px; height: {height}px;"
></div>

<style>
  .thumb {
    border-radius: var(--radius-panel);
    overflow: hidden;
    background: var(--bg-app);
  }
</style>
