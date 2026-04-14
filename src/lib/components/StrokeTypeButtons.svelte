<script lang="ts">
  import { DEFAULT_STROKE_TYPES } from '$lib/constants/strokeTypes';

  interface Props {
    activeType: string | null;
    onSelect: (shortLabel: string) => void;
  }

  let { activeType, onSelect }: Props = $props();
</script>

<div class="tags">
  {#each DEFAULT_STROKE_TYPES as type (type.shortLabel)}
    <button
      type="button"
      class="tag"
      class:active={activeType === type.shortLabel}
      title={type.fullLabel}
      onclick={() => onSelect(type.shortLabel)}
    >
      {type.shortLabel}
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
