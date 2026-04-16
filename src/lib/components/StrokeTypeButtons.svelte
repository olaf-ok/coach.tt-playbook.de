<script lang="ts">
  import { DEFAULT_STROKE_TYPE_CODES, type StrokeTypeCode } from '$lib/constants/strokeTypes';
  import { strokeTypeLabel } from '$lib/i18n/stroke-type-labels';

  interface Props {
    activeType: StrokeTypeCode | null;
    onSelect: (code: StrokeTypeCode) => void;
  }

  let { activeType, onSelect }: Props = $props();
</script>

<div class="tags">
  {#each DEFAULT_STROKE_TYPE_CODES as code (code)}
    {@const label = strokeTypeLabel(code)}
    <button
      type="button"
      class="tag"
      class:active={activeType === code}
      title={label.full}
      onclick={() => onSelect(code)}
    >
      {label.short}
    </button>
  {/each}
</div>

<style>
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
