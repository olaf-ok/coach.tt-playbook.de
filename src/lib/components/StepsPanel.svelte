<script lang="ts">
  import { currentExercise } from '$lib/stores/currentExercise.svelte';
  import { getStrokeColor } from '$lib/constants/colors';
  import StrokeTypeButtons from './StrokeTypeButtons.svelte';
  import UndoIcon from '$lib/icons/UndoIcon.svelte';
  import { DEFAULT_STROKE_TYPE_CODES, isStrokeTypeCode, type StrokeTypeCode } from '$lib/constants/strokeTypes';
  import { strokeTypeLabel, strokeTypeDesc } from '$lib/i18n/stroke-type-labels';
  import { m } from '$lib/paraglide/messages';
  import type { SheetState } from './steps-sheet-state';

  function tagLabel(strokeType: string | null): string {
    if (!strokeType || !isStrokeTypeCode(strokeType)) return '';
    return strokeTypeLabel(strokeType).short;
  }

  interface Props {
    selectedStrokeId: string | null;
    onSelectStroke?: (id: string | null) => void;
    onDeleteStroke?: (id: string) => void;
    onUndo?: () => void;
    canUndo?: boolean;
    sheetState?: SheetState;
    onSheetToggle?: () => void;
  }

  let {
    selectedStrokeId,
    onSelectStroke,
    onDeleteStroke,
    onUndo,
    canUndo = false,
    sheetState = 'peek',
    onSheetToggle,
  }: Props = $props();

  function isEmptyOrPreviousDefault(text: string | null | undefined): boolean {
    if (!text) return true;
    const trimmed = text.trim();
    if (!trimmed) return true;
    return DEFAULT_STROKE_TYPE_CODES.some((c) => strokeTypeDesc(c) === trimmed);
  }

  function setType(code: StrokeTypeCode) {
    if (!selectedStrokeId) return;
    currentExercise.assignStrokeType(selectedStrokeId, code);

    const stroke = currentExercise.exercise.strokes.find((s) => s.id === selectedStrokeId);
    if (stroke && isEmptyOrPreviousDefault(stroke.description)) {
      currentExercise.setDescription(selectedStrokeId, strokeTypeDesc(code));
    }
  }

  function setDescription(event: Event, id: string) {
    const target = event.target as HTMLTextAreaElement;
    currentExercise.setDescription(id, target.value);
  }

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

<aside
  class="panel"
  class:sheet-peek={sheetState === 'peek'}
  class:sheet-expanded={sheetState === 'expanded'}
>
  <button
    type="button"
    class="handle-row"
    onclick={() => onSheetToggle?.()}
    aria-label={m.mobile_sheet_toggle_aria()}
  >
    <span class="handle"></span>
    <span class="peek-summary">
      <span class="peek-name">{currentExercise.exercise.name || m.toolbar_exercise_name_placeholder()}</span>
      <span class="peek-meta">
        {#if currentExercise.exercise.repetitions}<span class="chip">{currentExercise.exercise.repetitions}×</span>{/if}
        {#if currentExercise.exercise.duration}<span class="chip">{currentExercise.exercise.duration}</span>{/if}
        <span class="chip">{currentExercise.exercise.strokes.length === 1 ? m.exercise_meta_strokes_one({ count: 1 }) : m.exercise_meta_strokes_other({ count: currentExercise.exercise.strokes.length })}</span>
      </span>
    </span>
  </button>

  <div class="sheet-body">
    <header class="panel-header">
      <h2>{m.steps_header()}</h2>
      <button
        type="button"
        class="undo-btn"
        disabled={!canUndo}
        onclick={() => onUndo?.()}
        aria-label={m.toolbar_undo_aria()}
        title={m.toolbar_undo_aria()}
      >
        <UndoIcon size={15} />
        <span>{m.toolbar_undo()}</span>
      </button>
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
              <span class="step-type">{tagLabel(stroke.strokeType)}</span>
            {/if}
            <textarea
              class="step-desc"
              placeholder={m.steps_freetext_placeholder()}
              rows="1"
              data-desc-id={stroke.id}
              value={stroke.description ?? ''}
              oninput={(e) => setDescription(e, stroke.id)}
            ></textarea>
          </div>
          <button
            type="button"
            class="delete"
            aria-label={m.steps_delete_aria()}
            onclick={(e) => {
              e.stopPropagation();
              onDeleteStroke?.(stroke.id);
            }}
          >×</button>
        </div>
      {/each}

      {#if currentExercise.exercise.strokes.length === 0}
        <p class="hint">{m.draw_hint_empty()}</p>
      {/if}
    </div>

    <footer class="meta">
      <div class="field">
        <span class="field-label">{m.steps_label_repeats()}</span>
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
            placeholder={m.steps_select_placeholder()}
            bind:value={currentExercise.exercise.repetitions}
          />
        </div>
      </div>

      <div class="field">
        <span class="field-label">{m.steps_label_duration()}</span>
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
            placeholder={m.steps_select_placeholder()}
            bind:value={currentExercise.exercise.duration}
          />
        </div>
      </div>
    </footer>
  </div>
</aside>

<style>
  .panel {
    width: 320px;
    height: 100%;
    background: var(--bg-glass);
    backdrop-filter: blur(40px) saturate(180%);
    -webkit-backdrop-filter: blur(40px) saturate(180%);
    border-left: 1px solid var(--color-border);
    box-shadow: inset 1px 0 0 rgba(255, 255, 255, 0.04);
    display: flex;
    flex-direction: column;
  }

  .handle-row {
    display: none;
  }

  .panel-header {
    padding: 16px 16px 8px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  h2 {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .undo-btn {
    height: 30px;
    padding: 0 10px;
    border-radius: var(--radius-button);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 500;
    color: var(--color-text-secondary);
    background: transparent;
    border: 1px solid var(--color-border);
    transition: background var(--transition-quick), color var(--transition-quick), transform 0.15s ease;
  }
  .undo-btn:hover:not(:disabled) {
    background: var(--bg-glass-hover);
    color: var(--color-text-primary);
  }
  .undo-btn:active:not(:disabled) {
    transform: scale(0.92);
  }
  .undo-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .sheet-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
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
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: var(--radius-card);
    cursor: pointer;
    transition: background var(--transition-quick), transform 0.15s ease, box-shadow var(--transition-quick);
  }

  .step:hover {
    background: rgba(255, 255, 255, 0.07);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  .step:active {
    transform: translateY(0);
  }

  .step.selected {
    outline: 1.5px solid var(--step-color);
    background: rgba(255, 255, 255, 0.06);
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

  @media (max-width: 767.98px) {
    .panel {
      position: fixed;
      left: 0;
      right: 0;
      bottom: calc(var(--mobile-tabbar-h) + env(safe-area-inset-bottom, 0));
      width: auto;
      height: auto;
      max-height: 60vh;
      border-left: none;
      border-top: 1px solid var(--color-border);
      border-radius: 16px 16px 0 0;
      background: var(--bg-glass-strong);
      z-index: 20;
      transition: max-height 0.25s ease;
    }
    .panel.sheet-peek {
      max-height: 72px;
      overflow: hidden;
    }
    .panel.sheet-expanded {
      max-height: 60vh;
    }
    .handle-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 14px 6px;
      background: transparent;
      border: none;
      color: inherit;
      text-align: left;
      width: 100%;
    }
    .handle {
      width: 36px;
      height: 4px;
      border-radius: 2px;
      background: var(--color-text-tertiary);
      opacity: 0.5;
      flex-shrink: 0;
    }
    .peek-summary {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }
    .peek-name {
      font-size: 13px;
      font-weight: 600;
      color: var(--color-text-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .peek-meta {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .chip {
      background: var(--color-chip-bg);
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 11px;
      color: var(--color-text-secondary);
      line-height: 1.4;
    }
    .panel.sheet-peek .sheet-body {
      display: none;
    }
    .panel.sheet-expanded .sheet-body {
      display: flex;
      overflow-y: auto;
    }
  }
</style>
