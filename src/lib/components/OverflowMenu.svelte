<script lang="ts">
  import MoreIcon from '$lib/icons/MoreIcon.svelte';

  interface MenuItem {
    label: string;
    onSelect: () => void;
    destructive?: boolean;
  }

  interface Props {
    items: MenuItem[];
  }

  let { items }: Props = $props();
  let open = $state(false);
  let root: HTMLDivElement;

  function toggle() {
    open = !open;
  }

  function handleDocumentClick(e: MouseEvent) {
    if (!root.contains(e.target as Node)) open = false;
  }

  $effect(() => {
    if (open) {
      document.addEventListener('click', handleDocumentClick);
      return () => document.removeEventListener('click', handleDocumentClick);
    }
  });
</script>

<div class="overflow" bind:this={root}>
  <button type="button" class="trigger" aria-label="Aktionen" onclick={toggle}>
    <MoreIcon />
  </button>
  {#if open}
    <ul class="menu" role="menu">
      {#each items as item (item.label)}
        <li>
          <button
            type="button"
            class:destructive={item.destructive}
            role="menuitem"
            onclick={() => {
              item.onSelect();
              open = false;
            }}
          >
            {item.label}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .overflow {
    position: relative;
  }
  .trigger {
    width: 32px;
    height: 32px;
    border-radius: var(--radius-button);
    color: var(--color-text-secondary);
  }
  .trigger:hover {
    background: var(--bg-elevated);
  }
  .menu {
    position: absolute;
    right: 0;
    top: 36px;
    background: var(--bg-elevated);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-panel);
    min-width: 160px;
    padding: 4px;
    list-style: none;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    z-index: 20;
  }
  .menu button {
    width: 100%;
    padding: 8px 12px;
    text-align: left;
    color: var(--color-text-primary);
    border-radius: 6px;
    font-size: 14px;
  }
  .menu button:hover {
    background: var(--bg-surface);
  }
  .menu button.destructive {
    color: var(--color-danger);
  }
</style>
