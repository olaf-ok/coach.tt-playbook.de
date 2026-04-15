<script lang="ts">
  import Konva from 'konva';
  import { onMount } from 'svelte';
  import { TableRenderer } from '$lib/canvas/TableRenderer';
  import { StrokeRenderer } from '$lib/canvas/StrokeRenderer';
  import { TABLE_ASPECT } from '$lib/canvas/tableDimensions';
  import { currentExercise } from '$lib/stores/currentExercise.svelte';
  import type { Point } from '$lib/types/exercise';
  import type { TableBox } from '$lib/canvas/coords';

  interface Props {
    showZoneMarkers?: boolean;
    onEmptyAreaTap?: (relPoint: Point) => void;
    onStrokeTap?: (strokeId: string) => void;
    onEmptyAreaDragStart?: (relPoint: Point) => void;
    onDragMove?: (relPoint: Point) => void;
    onDragEnd?: (relPoint: Point) => void;
  }

  let {
    showZoneMarkers = false,
    onEmptyAreaTap,
    onStrokeTap,
    onEmptyAreaDragStart,
    onDragMove,
    onDragEnd,
  }: Props = $props();

  let container: HTMLDivElement;
  let stage: Konva.Stage | null = $state(null);
  let strokesLayer: Konva.Layer | null = null;
  let box = $state<TableBox | null>(null);

  let lastW = 0;
  let lastH = 0;

  onMount(() => {
    function tryRender() {
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      // Nur bei relevanter Größenänderung neu aufbauen
      if (Math.abs(rect.width - lastW) < 2 && Math.abs(rect.height - lastH) < 2) return;
      lastW = rect.width;
      lastH = rect.height;
      if (stage) {
        stage.destroy();
        stage = null;
      }
      setup(rect.width, rect.height);
    }

    const ro = new ResizeObserver(() => tryRender());
    ro.observe(container);
    requestAnimationFrame(() => tryRender());
    window.addEventListener('orientationchange', tryRender);

    return () => {
      ro.disconnect();
      window.removeEventListener('orientationchange', tryRender);
      stage?.destroy();
      stage = null;
    };
  });

  function setup(width: number, height: number) {
    const tableWidth = Math.min(width * 0.85, (height / TABLE_ASPECT) * 0.9);
    const tableHeight = tableWidth * TABLE_ASPECT;
    const tableX = (width - tableWidth) / 2;
    const tableY = (height - tableHeight) / 2;

    const s = new Konva.Stage({ container, width, height });
    const tableLayer = new Konva.Layer();
    strokesLayer = new Konva.Layer();

    const tableRenderer = new TableRenderer({
      width: tableWidth,
      height: tableHeight,
      showZoneMarkers,
    });
    const tableNode = tableRenderer.getKonvaNode();
    tableNode.position({ x: tableX, y: tableY });
    tableLayer.add(tableNode);
    s.add(tableLayer);
    s.add(strokesLayer);

    const localBox: TableBox = { x: tableX, y: tableY, width: tableWidth, height: tableHeight };

    let dragStart: Point | null = null;
    let isDragging = false;

    s.on('mousedown touchstart', (e) => {
      if (e.target !== s && e.target !== tableNode && !(e.target as Konva.Node).hasName('table-surface')) {
        const ancestors = (e.target as Konva.Node).findAncestors('Group');
        if (!ancestors.some((a) => a === tableNode)) return;
      }
      const pos = s.getPointerPosition();
      if (!pos) return;
      const rel: Point = {
        x: (pos.x - localBox.x) / localBox.width,
        y: (pos.y - localBox.y) / localBox.height,
      };
      if (rel.x < 0 || rel.x > 1 || rel.y < 0 || rel.y > 1) return;
      dragStart = rel;
      isDragging = false;
    });

    s.on('mousemove touchmove', () => {
      if (!dragStart) return;
      const pos = s.getPointerPosition();
      if (!pos) return;
      const rel: Point = {
        x: (pos.x - localBox.x) / localBox.width,
        y: (pos.y - localBox.y) / localBox.height,
      };
      const dx = rel.x - dragStart.x;
      const dy = rel.y - dragStart.y;
      if (Math.sqrt(dx * dx + dy * dy) > 0.03 && !isDragging) {
        isDragging = true;
        onEmptyAreaDragStart?.(dragStart);
      }
      if (isDragging) onDragMove?.(rel);
    });

    s.on('mouseup touchend', () => {
      const pos = s.getPointerPosition();
      if (!pos || !dragStart) {
        dragStart = null;
        return;
      }
      const rel: Point = {
        x: (pos.x - localBox.x) / localBox.width,
        y: (pos.y - localBox.y) / localBox.height,
      };
      if (rel.x >= 0 && rel.x <= 1 && rel.y >= 0 && rel.y <= 1) {
        if (isDragging) onDragEnd?.(rel);
        else onEmptyAreaTap?.(rel);
      }
      dragStart = null;
      isDragging = false;
    });

    stage = s;
    box = localBox;
  }

  $effect(() => {
    if (!stage || !strokesLayer || !box) return;
    strokesLayer.destroyChildren();
    for (const stroke of currentExercise.exercise.strokes) {
      const renderer = new StrokeRenderer(stroke, box, {
        onStrokeTap: (id) => onStrokeTap?.(id),
        onControlPointDrag: (id, cp) => currentExercise.setControlPoint(id, cp),
      });
      strokesLayer.add(renderer.getKonvaNode());
    }
    strokesLayer.batchDraw();
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
