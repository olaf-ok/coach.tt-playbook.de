<script lang="ts">
  import { page } from '$app/stores';
  import { pathToTabId, type TabId } from './sidebar-utils';

  const topTabs: Array<{ id: TabId; href: string; label: string; icon: string }> = [
    { id: 'draw', href: '/draw', label: 'Zeichnen', icon: '✎' },
    { id: 'archive', href: '/archive', label: 'Archiv', icon: '▤' },
    { id: 'playlists', href: '/playlists', label: 'Playlists', icon: '▸' },
  ];

  let activeTab = $derived(pathToTabId($page.url.pathname));
</script>

<aside class="sidebar">
  <div class="tabs">
    {#each topTabs as tab (tab.id)}
      <a
        href={tab.href}
        class="tab"
        class:active={activeTab === tab.id}
        aria-label={tab.label}
        aria-current={activeTab === tab.id ? 'page' : undefined}
      >
        <span class="tab-icon">{tab.icon}</span>
      </a>
    {/each}
  </div>

  <div class="bottom">
    <a
      href="/settings"
      class="tab"
      class:active={$page.url.pathname.startsWith('/settings')}
      aria-label="Einstellungen"
    >
      <span class="tab-icon">⚙</span>
    </a>
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
    text-decoration: none;
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
