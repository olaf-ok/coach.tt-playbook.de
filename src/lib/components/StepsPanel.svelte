<script lang="ts">
  import { currentExercise } from '$lib/stores/currentExercise.svelte';
  import { getStrokeColor } from '$lib/constants/colors';
  import StrokeTypeButtons from './StrokeTypeButtons.svelte';

  interface Props {
    selectedStrokeId: string | null;
    onSelectStroke?: (id: string | null) => void;
    onDeleteStroke?: (id: string) => void;
  }

  let { selectedStrokeId, onSelectStroke, onDeleteStroke }: Props = $props();

  function setType(shortLabel: string) {
    if (!selectedStrokeId) return;
    currentExercise.assignStrokeType(selectedStrokeId, shortLabel);
  }

  function setDescription(event: Event, id: string) {
    const target = event.target as HTMLTextAreaElement;
    currentExercise.setDescription(id, target.value);
  }

  // Auto-Focus nur auf Geräten mit präzisem Zeiger (Desktop).
  // Auf Touch-Geräten würde focus() die Tastatur öffnen — unerwünscht im Training.
  $effect(() => {
    if (!selectedStrokeId) return;
    if (typeof window === 'undefined') return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    const el = document.querySelector<HTMLTextAreaElement>(
      `textarea[data-desc-id="${selectedStrokeId}"]`,
    );
    el?.focus();
  });
</script>

<aside class="panel">
  <header class="panel-header">
    <h2>Schritte</h2>
  </header>

  <div class="steps">
    {#each currentExercise.exercise.strokes as stroke (stroke.id)}
      <div
        class="step"
        class:selected={selectedStrokeId === stroke.id}
        role="button"
        tabindex="0"
        style:--step-color={getStrokeColor(stroke.number)}
        onclick={() => onSelectStroke?.(stroke.id)}
        onkeydown={(e) => e.key === 'Enter' && onSelectStroke?.(stroke.id)}
      >
        <span class="step-dot">
          {stroke.number}
        </span>
        <div class="step-body">
          {#if selectedStrokeId === stroke.id}
            <StrokeTypeButtons
              activeType={stroke.strokeType}
              onSelect={setType}
            />
          {:else if stroke.strokeType}
            <span class="step-type">{stroke.strokeType}</span>
          {/if}
          <textarea
            class="step-desc"
            placeholder="Freitext (optional)"
            rows="1"
            data-desc-id={stroke.id}
            value={stroke.description ?? ''}
            oninput={(e) => setDescription(e, stroke.id)}
          ></textarea>
        </div>
        <button
          type="button"
          class="delete"
          aria-label="Schritt löschen"
          onclick={(e) => {
            e.stopPropagation();
            onDeleteStroke?.(stroke.id);
          }}
        >×</button>
      </div>
    {/each}

    {#if currentExercise.exercise.strokes.length === 0}
      <p class="hint">Tippe auf den Tisch oder ziehe einen Pfeil um zu starten.</p>
    {/if}
  </div>

  <footer class="meta">
    <div class="field">
      <span class="field-label">Wiederholungen</span>
      <div class="presets">
        {#each [5, 10, 15, 20] as n (n)}
          <button
            type="button"
            class="preset"
            class:active={currentExercise.exercise.repetitions === n}
            onclick={() => (currentExercise.exercise.repetitions = n)}
          >
            {n}
          </button>
        {/each}
        <input
          type="number"
          min="1"
          class="preset-input"
          placeholder="Wählen"
          bind:value={currentExercise.exercise.repetitions}
        />
      </div>
    </div>

    <div class="field">
      <span class="field-label">Dauer</span>
      <div class="presets">
        {#each ['5 min', '10 min', '15 min'] as d (d)}
          <button
            type="button"
            class="preset"
            class:active={currentExercise.exercise.duration === d}
            onclick={() => (currentExercise.exercise.duration = d)}
          >
            {d}
          </button>
        {/each}
        <input
          type="text"
          class="preset-input"
          placeholder="Wählen"
          bind:value={currentExercise.exercise.duration}
        />
      </div>
    </div>
  </footer>
</aside>

<style>
  .panel {
    width: 320px;
    height: 100%;
    background: var(--bg-surface);
    border-left: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
  }

  .panel-header {
    padding: 16px 16px 8px 16px;
  }

  h2 {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .steps {
    flex: 1;
    overflow-y: auto;
    padding: 8px 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .step {
    display: flex;
    gap: 10px;
    padding: 10px;
    background: var(--bg-elevated);
    border-radius: var(--radius-card);
    cursor: pointer;
    transition: background var(--transition-quick);
  }

  .step.selected {
    outline: 1.5px solid var(--step-color);
  }

  .step-dot {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--step-color);
    color: #000;
    font-size: 12px;
    font-weight: 700;
    flex-shrink: 0;
  }

  .step-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }

  .step-type {
    align-self: flex-start;
    padding: 2px 8px;
    background: var(--bg-surface);
    border-radius: 999px;
    color: var(--color-text-secondary);
    font-size: 11px;
    font-weight: 500;
  }

  .step-desc {
    width: 100%;
    resize: none;
    background: transparent;
    border: none;
    color: var(--color-text-primary);
    font-size: 13px;
    outline: none;
    padding: 0;
  }

  .step-desc::placeholder {
    color: var(--color-text-tertiary);
  }

  .delete {
    width: 24px;
    height: 24px;
    color: var(--color-text-tertiary);
    font-size: 18px;
    align-self: flex-start;
    flex-shrink: 0;
    transition: color var(--transition-quick);
  }

  .delete:hover {
    color: #ff453a;
  }

  .hint {
    color: var(--color-text-tertiary);
    font-size: 13px;
    padding: 12px;
    text-align: center;
  }

  .meta {
    padding: 16px 20px 20px;
    border-top: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .field-label {
    color: var(--color-text-secondary);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .presets {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .preset {
    min-width: 40px;
    height: 32px;
    padding: 0 10px;
    background: var(--bg-elevated);
    color: var(--color-text-primary);
    border-radius: var(--radius-button);
    font-size: 13px;
    font-weight: 500;
    transition: background var(--transition-quick), color var(--transition-quick);
  }

  .preset:hover {
    background: var(--color-chip-bg);
  }

  .preset.active {
    background: var(--color-accent);
    color: #fff;
  }

  .preset-input {
    flex: 1;
    min-width: 60px;
    height: 32px;
    padding: 0 10px;
    background: var(--bg-elevated);
    color: var(--color-text-primary);
    border: none;
    border-radius: var(--radius-button);
    outline: none;
    font-size: 13px;
  }

  .preset-input:focus {
    outline: 1.5px solid var(--color-accent);
  }

  .preset-input::placeholder {
    color: var(--color-text-tertiary);
  }
</style>
