<script lang="ts">
  import { page } from '$app/stores';
  import { pathToTabId, type TabId } from './sidebar-utils';
  import DrawIcon from '$lib/icons/DrawIcon.svelte';
  import ArchiveIcon from '$lib/icons/ArchiveIcon.svelte';
  import PlaylistIcon from '$lib/icons/PlaylistIcon.svelte';
  import SettingsIcon from '$lib/icons/SettingsIcon.svelte';
  import type { Component } from 'svelte';

  const topTabs: Array<{ id: TabId; href: string; label: string; icon: Component }> = [
    { id: 'draw', href: '/draw', label: 'Zeichnen', icon: DrawIcon },
    { id: 'archive', href: '/archive', label: 'Archiv', icon: ArchiveIcon },
    { id: 'playlists', href: '/playlists', label: 'Playlists', icon: PlaylistIcon },
  ];

  let activeTab = $derived(pathToTabId($page.url.pathname));
</script>

<aside class="sidebar">
  <div class="tabs">
    {#each topTabs as tab (tab.id)}
      {@const Icon = tab.icon}
      <a
        href={tab.href}
        class="tab"
        class:active={activeTab === tab.id}
        aria-label={tab.label}
        aria-current={activeTab === tab.id ? 'page' : undefined}
      >
        <Icon />
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
      <SettingsIcon />
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
  .bottom {
    display: flex;
    flex-direction: column;
  }
</style>
