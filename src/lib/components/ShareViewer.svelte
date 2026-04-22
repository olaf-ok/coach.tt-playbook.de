<script lang="ts">
  import Konva from 'konva';
  import { onMount, onDestroy } from 'svelte';
  import { TableRenderer } from '$lib/canvas/TableRenderer';
  import { StrokeRenderer } from '$lib/canvas/StrokeRenderer';
  import { TABLE_ASPECT } from '$lib/canvas/tableDimensions';
  import { getStrokeColor } from '$lib/constants/colors';
  import { strokeTypeShort } from '$lib/i18n/stroke-type-labels';
  import AppLogo from '$lib/brand/AppLogo.svelte';
  import { m } from '$lib/paraglide/messages';
  import type { Exercise } from '$lib/types/exercise';

  interface Props {
    exercise: Exercise;
    trainerEmail: string;
    trainerName: string | null;
    message: string | null;
    expiresAt: number | null;
  }

  let { exercise, trainerEmail, trainerName, message }: Props = $props();

  const displayName = $derived(trainerName || trainerEmail.split('@')[0]);

  let container: HTMLDivElement;
  let stage: Konva.Stage | null = null;
  let tableLayer: Konva.Layer | null = null;
  let strokesLayer: Konva.Layer | null = null;
  let tableBox = { x: 0, y: 0, width: 0, height: 0 };
  let resizeObserver: ResizeObserver | null = null;

  // Step navigation: null = show all, 0-based index
  let activeStrokeIndex = $state<number | null>(null);
  let playing = $state(false);
  let playTimer: ReturnType<typeof setTimeout> | null = null;

  const activeStrokes = $derived(
    activeStrokeIndex === null
      ? exercise.strokes
      : exercise.strokes.slice(0, activeStrokeIndex + 1),
  );

  function buildTable(width: number, height: number) {
    if (!tableLayer || !strokesLayer) return;
    tableLayer.destroyChildren();

    const tableWidth = Math.min(width * 0.9, (height / TABLE_ASPECT) * 0.95);
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
    tableLayer.batchDraw();
    tableBox = { x: tableX, y: tableY, width: tableWidth, height: tableHeight };
  }

  function renderStrokes() {
    if (!strokesLayer || tableBox.width === 0) return;
    strokesLayer.destroyChildren();
    for (const stroke of activeStrokes) {
      const r = new StrokeRenderer(stroke, tableBox);
      strokesLayer.add(r.getKonvaNode());
    }
    strokesLayer.batchDraw();
  }

  onMount(() => {
    const rect = container.getBoundingClientRect();
    stage = new Konva.Stage({ container, width: rect.width, height: rect.height, listening: false });
    tableLayer = new Konva.Layer({ listening: false });
    strokesLayer = new Konva.Layer({ listening: false });
    stage.add(tableLayer);
    stage.add(strokesLayer);

    buildTable(rect.width, rect.height);
    renderStrokes();

    resizeObserver = new ResizeObserver(() => {
      if (!stage) return;
      const r = container.getBoundingClientRect();
      stage.size({ width: r.width, height: r.height });
      buildTable(r.width, r.height);
      renderStrokes();
    });
    resizeObserver.observe(container);
  });

  $effect(() => {
    void activeStrokes.length;
    renderStrokes();
  });

  onDestroy(() => {
    stopPlay();
    resizeObserver?.disconnect();
    stage?.destroy();
    stage = null;
  });

  function selectStep(index: number) {
    stopPlay();
    activeStrokeIndex = index === activeStrokeIndex ? null : index;
  }

  function resetView() {
    stopPlay();
    activeStrokeIndex = null;
  }

  function stopPlay() {
    if (playTimer !== null) {
      clearTimeout(playTimer);
      playTimer = null;
    }
    playing = false;
  }

  function startPlay() {
    if (exercise.strokes.length === 0) return;
    playing = true;
    activeStrokeIndex = 0;
    scheduleNextStep();
  }

  function scheduleNextStep() {
    playTimer = setTimeout(() => {
      if (!playing) return;
      const next = (activeStrokeIndex ?? -1) + 1;
      if (next >= exercise.strokes.length) {
        // Cycle back to overview then restart
        activeStrokeIndex = null;
        playTimer = setTimeout(() => {
          if (!playing) return;
          activeStrokeIndex = 0;
          scheduleNextStep();
        }, 1500);
      } else {
        activeStrokeIndex = next;
        scheduleNextStep();
      }
    }, 2000);
  }

  function togglePlay() {
    if (playing) {
      stopPlay();
    } else {
      startPlay();
    }
  }
</script>

<div class="viewer">
  <!-- Header -->
  <header class="viewer-header">
    <a href="https://coach.tt-playbook.de" class="logo-link" aria-label="TT Playbook Coach">
      <AppLogo size={28} />
    </a>
    <span class="trainer-name">{displayName}</span>
  </header>

  {#if message}
    <div class="message-banner">
      <span class="message-label">{m.share_viewer_message_label()}</span>
      <p class="message-text">{message}</p>
    </div>
  {/if}

  <!-- Canvas -->
  <div class="canvas-area" bind:this={container}></div>

  <!-- Controls -->
  <div class="controls">
    <div class="exercise-meta">
      <span class="exercise-name">{exercise.name || m.tv_display_exercise_fallback()}</span>
      {#if exercise.repetitions}
        <span class="meta-chip">{m.tv_display_repeats({ n: exercise.repetitions })}</span>
      {/if}
      {#if exercise.duration}
        <span class="meta-chip">{exercise.duration}</span>
      {/if}
    </div>

    {#if exercise.strokes.length > 0}
      <div class="step-row">
        <button class="btn-all" class:active={activeStrokeIndex === null} onclick={resetView}>
          {m.share_viewer_all_steps()}
        </button>
        {#each exercise.strokes as stroke, i (stroke.id)}
          <button
            class="step-btn"
            class:active={activeStrokeIndex !== null && activeStrokeIndex >= i}
            style:--step-color={getStrokeColor(stroke.number)}
            onclick={() => selectStep(i)}
            title={stroke.strokeType ? strokeTypeShort(stroke.strokeType) : String(stroke.number)}
          >
            {stroke.number}
          </button>
        {/each}
        <button class="play-btn" onclick={togglePlay} aria-label={playing ? m.share_viewer_pause() : m.share_viewer_play()}>
          {#if playing}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="3" y="2" width="3.5" height="12" rx="1" fill="currentColor"/>
              <rect x="9.5" y="2" width="3.5" height="12" rx="1" fill="currentColor"/>
            </svg>
          {:else}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 2.5L13 8L4 13.5V2.5Z" fill="currentColor"/>
            </svg>
          {/if}
        </button>
      </div>
    {/if}
  </div>

  <!-- CTA -->
  <footer class="cta-footer">
    <a href="https://coach.tt-playbook.de" class="cta-link">
      {m.share_viewer_cta()}
    </a>
  </footer>
</div>

<style>
  .viewer {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    background: var(--bg-app);
    color: var(--color-text-primary);
  }

  .viewer-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 20px;
    background: var(--bg-surface);
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  .logo-link {
    display: flex;
    align-items: center;
    color: var(--color-text-primary);
    flex-shrink: 0;
  }

  .trainer-name {
    font-size: 14px;
    color: var(--color-text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .message-banner {
    padding: 12px 20px;
    background: var(--bg-elevated);
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  .message-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-text-secondary);
    display: block;
    margin-bottom: 4px;
  }

  .message-text {
    font-size: 14px;
    color: var(--color-text-primary);
    margin: 0;
    line-height: 1.5;
  }

  .canvas-area {
    flex: 1;
    min-height: 240px;
  }

  .controls {
    flex-shrink: 0;
    padding: 12px 16px;
    background: var(--bg-surface);
    border-top: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .exercise-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .exercise-name {
    font-size: 15px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .meta-chip {
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--color-chip-bg);
    color: var(--color-text-secondary);
    font-size: 12px;
    font-weight: 500;
  }

  .step-row {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  .btn-all {
    padding: 4px 10px;
    border-radius: 6px;
    border: 1px solid var(--color-border);
    background: var(--bg-elevated);
    color: var(--color-text-secondary);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s;
  }

  .btn-all.active {
    background: var(--color-accent);
    color: #fff;
    border-color: var(--color-accent);
  }

  .step-btn {
    width: 32px;
    height: 32px;
    border-radius: 999px;
    border: 2px solid var(--step-color);
    background: transparent;
    color: var(--step-color);
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .step-btn.active {
    background: var(--step-color);
    color: #000;
  }

  .play-btn {
    width: 36px;
    height: 36px;
    border-radius: 999px;
    border: none;
    background: var(--color-accent);
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: auto;
    transition: opacity 0.15s;
  }

  .play-btn:hover {
    opacity: 0.85;
  }

  .cta-footer {
    flex-shrink: 0;
    padding: 10px 16px;
    background: var(--bg-elevated);
    border-top: 1px solid var(--color-border);
    text-align: center;
  }

  .cta-link {
    font-size: 13px;
    color: var(--color-accent);
    text-decoration: none;
  }

  .cta-link:hover {
    text-decoration: underline;
  }
</style>
