<script lang="ts">
  import { fade } from 'svelte/transition';
  import { onDestroy } from 'svelte';
  import { DEFAULT_STROKE_TYPE_CODES, type StrokeTypeCode } from '$lib/constants/strokeTypes';
  import { strokeTypeLabel } from '$lib/i18n/stroke-type-labels';

  interface Props {
    activeType: StrokeTypeCode | null;
    onSelect: (code: StrokeTypeCode) => void;
  }

  let { activeType, onSelect }: Props = $props();

  let hintCode = $state<StrokeTypeCode | null>(null);
  let hintTimer: ReturnType<typeof setTimeout> | null = null;

  function handleClick(code: StrokeTypeCode) {
    onSelect(code);
    hintCode = code;
    if (hintTimer) clearTimeout(hintTimer);
    hintTimer = setTimeout(() => {
      hintCode = null;
      hintTimer = null;
    }, 2000);
  }

  onDestroy(() => {
    if (hintTimer) clearTimeout(hintTimer);
  });
</script>

<div class="wrap">
  <div class="hint-slot" aria-live="polite">
    {#if hintCode}
      <span class="hint" transition:fade={{ duration: 180 }}>
        {strokeTypeLabel(hintCode).full}
      </span>
    {/if}
  </div>
  <div class="tags">
    {#each DEFAULT_STROKE_TYPE_CODES as code (code)}
      {@const label = strokeTypeLabel(code)}
      <button
        type="button"
        class="tag"
        class:active={activeType === code}
        title={label.full}
        onclick={() => handleClick(code)}
      >
        {label.short}
      </button>
    {/each}
  </div>
</div>

<style>
  .wrap {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .hint-slot {
    min-height: 22px;
    display: flex;
    align-items: center;
  }

  .hint {
    padding: 3px 12px;
    border-radius: 999px;
    background: var(--color-accent);
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.01em;
    white-space: nowrap;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .tag {
    padding: 6px 10px;
    background: var(--bg-elevated);
    color: var(--color-text-secondary);
    border-radius: var(--radius-button);
    font-size: 12px;
    font-weight: 500;
    transition: background var(--transition-quick), color var(--transition-quick);
  }

  .tag:hover {
    background: var(--bg-surface);
    color: var(--color-text-primary);
  }

  .tag.active {
    background: var(--color-primary);
    color: #000;
  }
</style>
