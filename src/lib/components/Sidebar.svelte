<script lang="ts">
  import { page } from '$app/stores';
  import { pathToTabId, type TabId } from './sidebar-utils';
  import AppIcon from '$lib/brand/AppIcon.svelte';
  import DrawIcon from '$lib/icons/DrawIcon.svelte';
  import ArchiveIcon from '$lib/icons/ArchiveIcon.svelte';
  import PlaylistIcon from '$lib/icons/PlaylistIcon.svelte';
  import SettingsIcon from '$lib/icons/SettingsIcon.svelte';
  import HelpIcon from '$lib/icons/HelpIcon.svelte';
  import NotationIcon from '$lib/icons/NotationIcon.svelte';
  import { m } from '$lib/paraglide/messages';
  import type { Component } from 'svelte';
  import AdminIcon from '$lib/icons/AdminIcon.svelte';
  import { auth } from '$lib/auth/client.svelte';

  const topTabs: Array<{ id: TabId; href: string; label: string; icon: Component }> = [
    { id: 'draw', href: '/draw', label: m.sidebar_tab_draw(), icon: DrawIcon },
    { id: 'archive', href: '/archive', label: m.sidebar_tab_archive(), icon: ArchiveIcon },
    { id: 'playlists', href: '/playlists', label: m.sidebar_tab_playlists(), icon: PlaylistIcon },
  ];

  let activeTab = $derived(pathToTabId($page.url.pathname));
</script>

<aside class="sidebar">
  <div class="top">
    <a href="/draw" class="brand" aria-label={m.sidebar_brand_aria()}>
      <AppIcon size={34} />
    </a>
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
  </div>

  <div class="bottom">
    {#if auth.user?.isAdmin}
      <a
        href="/admin/users"
        class="tab"
        class:active={$page.url.pathname.startsWith('/admin')}
        aria-label="Admin"
      >
        <AdminIcon />
      </a>
    {/if}
    <a
      href="/settings/notation"
      class="tab"
      class:active={$page.url.pathname === '/settings/notation'}
      aria-label={m.sidebar_notation_aria()}
    >
      <NotationIcon />
    </a>
    <a
      href="/settings/help"
      class="tab"
      class:active={$page.url.pathname === '/settings/help'}
      aria-label={m.sidebar_help_aria()}
    >
      <HelpIcon />
    </a>
    <a
      href="/settings"
      class="tab"
      class:active={$page.url.pathname.startsWith('/settings') && $page.url.pathname !== '/settings/help' && $page.url.pathname !== '/settings/notation'}
      aria-label={m.sidebar_settings_aria()}
    >
      <SettingsIcon />
    </a>
  </div>
</aside>

<style>
  .sidebar {
    width: 68px;
    height: 100%;
    background: var(--bg-glass);
    backdrop-filter: blur(40px) saturate(180%);
    -webkit-backdrop-filter: blur(40px) saturate(180%);
    border-right: 1px solid var(--color-border);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 16px 0;
    justify-content: space-between;
  }
  .top {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }
  .brand {
    width: 52px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-primary);
    text-decoration: none;
    overflow: visible;
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
    transition: background var(--transition-quick), color var(--transition-quick), transform 0.15s ease;
  }
  .tab:hover {
    background: var(--bg-glass-hover);
    color: var(--color-text-primary);
    transform: scale(1.06);
  }
  .tab:active {
    transform: scale(0.95);
  }
  .tab.active {
    background: var(--bg-glass-hover);
    color: var(--color-text-primary);
    box-shadow: var(--shadow-glass);
  }
  .bottom {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  @media (max-width: 767.98px) {
    .sidebar { display: none; }
  }
</style>
