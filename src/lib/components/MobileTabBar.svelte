<script lang="ts">
  import { page } from '$app/stores';
  import { pathToMobileTabId, type MobileTabId } from './mobile-nav-utils';
  import DrawIcon from '$lib/icons/DrawIcon.svelte';
  import ArchiveIcon from '$lib/icons/ArchiveIcon.svelte';
  import PlaylistIcon from '$lib/icons/PlaylistIcon.svelte';
  import MoreIcon from '$lib/icons/MoreIcon.svelte';
  import AdminIcon from '$lib/icons/AdminIcon.svelte';
  import { auth } from '$lib/auth/client.svelte';
  import { m } from '$lib/paraglide/messages';
  import type { Component } from 'svelte';

  const tabs: Array<{ id: MobileTabId; href: string; label: string; icon: Component }> = [
    { id: 'draw', href: '/draw', label: m.sidebar_tab_draw(), icon: DrawIcon },
    { id: 'archive', href: '/archive', label: m.sidebar_tab_archive(), icon: ArchiveIcon },
    { id: 'playlists', href: '/playlists', label: m.sidebar_tab_playlists(), icon: PlaylistIcon },
    { id: 'more', href: '/settings', label: m.mobile_tab_more(), icon: MoreIcon },
  ];

  let activeTab = $derived(pathToMobileTabId($page.url.pathname));
</script>

<nav class="tabbar" aria-label="Mobile Navigation">
  {#each tabs as tab (tab.id)}
    {@const Icon = tab.icon}
    <a
      href={tab.href}
      class="tab"
      class:active={activeTab === tab.id}
      aria-current={activeTab === tab.id ? 'page' : undefined}
    >
      <span class="tab-icon"><Icon /></span>
      <span class="tab-label">{tab.label}</span>
    </a>
  {/each}
  {#if auth.user?.isAdmin}
    <a
      href="/admin/users"
      class="tab"
      class:active={$page.url.pathname.startsWith('/admin')}
      aria-current={$page.url.pathname.startsWith('/admin') ? 'page' : undefined}
    >
      <span class="tab-icon"><AdminIcon /></span>
      <span class="tab-label">Admin</span>
    </a>
  {/if}
</nav>

<style>
  .tabbar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    height: calc(var(--mobile-tabbar-h) + env(safe-area-inset-bottom, 0));
    padding-bottom: env(safe-area-inset-bottom, 0);
    background: var(--bg-glass-strong);
    backdrop-filter: blur(40px) saturate(180%);
    -webkit-backdrop-filter: blur(40px) saturate(180%);
    border-top: 1px solid var(--color-border);
    display: flex;
    justify-content: space-around;
    align-items: stretch;
    z-index: 40;
  }
  .tab {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    color: var(--color-text-tertiary);
    text-decoration: none;
    font-size: 11px;
    font-weight: 500;
    padding: 6px 4px;
    transition: color var(--transition-quick), transform 0.15s ease;
  }
  .tab:active {
    transform: scale(0.92);
  }
  .tab.active {
    color: var(--color-accent);
  }
  .tab-icon {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .tab-label {
    line-height: 1;
  }

  @media (min-width: 768px) {
    .tabbar { display: none; }
  }
</style>
