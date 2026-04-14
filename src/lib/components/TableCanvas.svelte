<script lang="ts">
  import Konva from 'konva';
  import { onMount } from 'svelte';
  import { TableRenderer } from '$lib/canvas/TableRenderer';
  import { StrokeRenderer } from '$lib/canvas/StrokeRenderer';
  import { TABLE_ASPECT } from '$lib/canvas/tableDimensions';
  import { currentExercise } from '$lib/stores/currentExercise.svelte';
  import type { Point } from '$lib/types/exercise';

  interface Props {
    showZoneMarkers?: boolean;
    onEmptyAreaTap?: (relPoint: Point) => void;
    onStrokeTap?: (strokeId: string) => void;
    onEmptyAreaDragStart?: (relPoint: Point) => void;
    onDragMove?: (relPoint: Point) => void;
    onDragEnd?: (relPoint: Point) => void;
    bendingStrokeId?: string | null;
  }

  let {
    showZoneMarkers = false,
    onEmptyAreaTap,
    onStrokeTap,
    onEmptyAreaDragStart,
    onDragMove,
    onDragEnd,
    bendingStrokeId = null,
  }: Props = $props();

  let container: HTMLDivElement;
  let stage: Konva.Stage;
  let tableLayer: Konva.Layer;
  let strokesLayer: Konva.Layer;
  let tableRenderer: TableRenderer;

  onMount(() => {
    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const tableWidth = Math.min(width * 0.85, (height / TABLE_ASPECT) * 0.9);
    const tableHeight = tableWidth * TABLE_ASPECT;
    const tableX = (width - tableWidth) / 2;
    const tableY = (height - tableHeight) / 2;

    stage = new Konva.Stage({
      container,
      width,
      height,
    });

    tableLayer = new Konva.Layer();
    strokesLayer = new Konva.Layer();

    tableRenderer = new TableRenderer({
      width: tableWidth,
      height: tableHeight,
      showZoneMarkers,
    });
    const tableNode = tableRenderer.getKonvaNode();
    tableNode.position({ x: tableX, y: tableY });
    tableLayer.add(tableNode);

    stage.add(tableLayer);
    stage.add(strokesLayer);

    const box = { x: tableX, y: tableY, width: tableWidth, height: tableHeight };

    let dragStart: Point | null = null;
    let isDragging = false;

    stage.on('mousedown touchstart', (e) => {
      if (e.target !== stage && e.target !== tableNode && !(e.target as Konva.Node).hasName('table-surface')) {
        const ancestors = (e.target as Konva.Node).findAncestors('Group');
        if (ancestors.some((a) => a === tableNode)) {
          // Tap auf Tisch, aber nicht auf Pfeil
        } else {
          return;
        }
      }
      const pos = stage.getPointerPosition();
      if (!pos) return;
      const rel: Point = {
        x: (pos.x - box.x) / box.width,
        y: (pos.y - box.y) / box.height,
      };
      if (rel.x < 0 || rel.x > 1 || rel.y < 0 || rel.y > 1) return;
      dragStart = rel;
      isDragging = false;
    });

    stage.on('mousemove touchmove', () => {
      if (!dragStart) return;
      const pos = stage.getPointerPosition();
      if (!pos) return;
      const rel: Point = {
        x: (pos.x - box.x) / box.width,
        y: (pos.y - box.y) / box.height,
      };
      const dx = rel.x - dragStart.x;
      const dy = rel.y - dragStart.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0.03 && !isDragging) {
        isDragging = true;
        onEmptyAreaDragStart?.(dragStart);
      }
      if (isDragging) {
        onDragMove?.(rel);
      }
    });

    stage.on('mouseup touchend', () => {
      const pos = stage.getPointerPosition();
      if (!pos || !dragStart) {
        dragStart = null;
        return;
      }
      const rel: Point = {
        x: (pos.x - box.x) / box.width,
        y: (pos.y - box.y) / box.height,
      };
      if (rel.x < 0 || rel.x > 1 || rel.y < 0 || rel.y > 1) {
        dragStart = null;
        isDragging = false;
        return;
      }
      if (isDragging) {
        onDragEnd?.(rel);
      } else {
        onEmptyAreaTap?.(rel);
      }
      dragStart = null;
      isDragging = false;
    });

    $effect(() => {
      strokesLayer.destroyChildren();
      for (const stroke of currentExercise.exercise.strokes) {
        const renderer = new StrokeRenderer(stroke, box, {
          onStrokeTap: (id) => onStrokeTap?.(id),
          onControlPointDrag: (id, cp) =>
            currentExercise.setControlPoint(id, cp),
        });
        strokesLayer.add(renderer.getKonvaNode());
        if (bendingStrokeId === stroke.id) {
          renderer.showControlHandle();
        }
      }
      strokesLayer.batchDraw();
    });
  });
</script>

<div bind:this={container} class="canvas-container"></div>

<style>
  .canvas-container {
    width: 100%;
    height: 100%;
    background: var(--bg-app);
    touch-action: none;
  }
</style>
