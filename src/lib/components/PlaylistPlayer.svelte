<script lang="ts">
  import { onDestroy } from 'svelte';
  import ExerciseThumbnail from './ExerciseThumbnail.svelte';
  import type { Playlist } from '$lib/types/playlist';
  import type { Exercise } from '$lib/types/exercise';
  import { tvSession } from '$lib/tv/session.svelte';

  interface Props {
    playlist: Playlist;
    exercises: Exercise[]; // bereits in gewünschter Reihenfolge, 1+
    onExit: () => void;
  }

  let { playlist, exercises, onExit }: Props = $props();

  let index = $state(0);
  const current = $derived(exercises[index]);
  const canPrev = $derived(index > 0);
  const canNext = $derived(index < exercises.length - 1);

  $effect(() => {
    if (!current) return;
    if (!tvSession.hasClient()) return;
    const client = tvSession.ensureClient();
    if (client.status !== 'paired') return;
    client.sendSync(current);
  });

  function next() {
    if (canNext) index++;
  }
  function prev() {
    if (canPrev) index--;
  }
  function goTo(i: number) {
    if (i >= 0 && i < exercises.length) index = i;
  }

  function handleKey(e: KeyboardEvent) {
    if (e.key === 'ArrowRight') next();
    else if (e.key === 'ArrowLeft') prev();
    else if (e.key === 'Escape') onExit();
  }

  onDestroy(() => {
    // Sync beenden nicht nötig — Tablet bleibt verbunden, TV zeigt einfach letzte Übung
  });
</script>

<svelte:window onkeydown={handleKey} />

<div class="overlay" role="dialog" aria-modal="true" aria-label="Playlist wird abgespielt">
  <header class="top">
    <div class="meta">
      <span class="pill">{index + 1} / {exercises.length}</span>
      <span class="title">{playlist.name || 'Playlist'}</span>
    </div>
    <button class="exit" onclick={onExit} aria-label="Beenden">
      <span aria-hidden="true">✕</span>
      <span>Beenden</span>
    </button>
  </header>

  <div class="stage">
    <button class="nav nav-prev" disabled={!canPrev} onclick={prev} aria-label="Vorherige">
      ←
    </button>

    <div class="card">
      {#if current}
        <div class="card-thumb">
          <ExerciseThumbnail exercise={current} width={440} height={280} />
        </div>
        <div class="card-text">
          <h2>{current.name || 'Unbenannt'}</h2>
          <div class="card-meta">
            <span>{current.strokes.length} Schläge</span>
            {#if current.repetitions}<span>{current.repetitions}×</span>{/if}
            {#if current.duration}<span>{current.duration}</span>{/if}
          </div>
        </div>
      {/if}
    </div>

    <button class="nav nav-next" disabled={!canNext} onclick={next} aria-label="Nächste">
      →
    </button>
  </div>

  <nav class="steps" aria-label="Schritte">
    {#each exercises as ex, i (ex.id)}
      <button
        class="step"
        class:active={i === index}
        onclick={() => goTo(i)}
        aria-label={`Schritt ${i + 1}: ${ex.name}`}
      >
        <span class="step-idx">{i + 1}</span>
        <span class="step-name">{ex.name || 'Unbenannt'}</span>
      </button>
    {/each}
  </nav>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: var(--bg-app);
    z-index: 120;
    display: flex;
    flex-direction: column;
    padding: 20px 24px 24px;
    gap: 16px;
  }

  .top {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .meta {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .pill {
    padding: 4px 10px;
    background: var(--bg-surface);
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    color: var(--color-text-secondary);
  }
  .title {
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text-primary);
  }
  .exit {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 22px;
    border-radius: var(--radius-button);
    background: var(--color-danger);
    color: #fff;
    font-weight: 700;
    font-size: 15px;
    box-shadow: var(--shadow-card);
    transition: opacity var(--transition-quick), transform var(--transition-quick);
  }
  .exit:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
  .exit span:first-child {
    font-size: 16px;
    font-weight: 700;
  }

  .stage {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    min-height: 0;
  }
  .nav {
    width: 64px;
    height: 64px;
    border-radius: 999px;
    background: var(--bg-surface);
    color: var(--color-text-primary);
    font-size: 28px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .nav:hover:not(:disabled) {
    background: var(--bg-elevated);
  }
  .nav:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .card {
    background: var(--bg-surface);
    border-radius: var(--radius-panel);
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    align-items: center;
    max-width: 520px;
    box-shadow: var(--shadow-card);
  }
  .card-thumb {
    display: flex;
  }
  .card-text {
    text-align: center;
  }
  h2 {
    font-size: 22px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0 0 6px;
  }
  .card-meta {
    display: flex;
    gap: 12px;
    justify-content: center;
    color: var(--color-text-secondary);
    font-size: 14px;
  }

  .steps {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 4px;
  }
  .step {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: var(--radius-button);
    background: var(--bg-surface);
    color: var(--color-text-secondary);
    font-size: 13px;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .step:hover {
    background: var(--bg-elevated);
  }
  .step.active {
    background: var(--color-accent);
    color: #fff;
  }
  .step-idx {
    font-weight: 700;
  }
  .step-name {
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
