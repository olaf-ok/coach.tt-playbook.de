<script lang="ts">
  type TabId = 'draw' | 'archive' | 'playlists' | 'settings';

  interface Props {
    activeTab?: TabId;
    onSelectTab?: (tab: TabId) => void;
  }

  let { activeTab = 'draw', onSelectTab }: Props = $props();

  const topTabs: Array<{ id: TabId; label: string; icon: string }> = [
    { id: 'draw', label: 'Zeichnen', icon: '✎' },
    { id: 'archive', label: 'Archiv', icon: '▤' },
    { id: 'playlists', label: 'Playlists', icon: '▸' },
  ];
</script>

<aside class="sidebar">
  <div class="tabs">
    {#each topTabs as tab (tab.id)}
      <button
        type="button"
        class="tab"
        class:active={activeTab === tab.id}
        aria-label={tab.label}
        onclick={() => onSelectTab?.(tab.id)}
      >
        <span class="tab-icon">{tab.icon}</span>
      </button>
    {/each}
  </div>

  <div class="bottom">
    <button
      type="button"
      class="tab"
      class:active={activeTab === 'settings'}
      aria-label="Einstellungen"
      onclick={() => onSelectTab?.('settings')}
    >
      <span class="tab-icon">⚙</span>
    </button>
  </div>
</aside>

<style>
  .sidebar {
    width: 68px;
    height: 100%;
    background: var(--bg-surface);
    border-right: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 16px 0;
    justify-content: space-between;
  }

  .tabs {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .tab {
    width: 44px;
    height: 44px;
    border-radius: var(--radius-button);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-secondary);
    transition: background var(--transition-quick), color var(--transition-quick);
  }

  .tab:hover {
    background: var(--bg-elevated);
    color: var(--color-text-primary);
  }

  .tab.active {
    background: var(--bg-elevated);
    color: var(--color-text-primary);
  }

  .tab-icon {
    font-size: 20px;
  }

  .bottom {
    display: flex;
    flex-direction: column;
  }
</style>
