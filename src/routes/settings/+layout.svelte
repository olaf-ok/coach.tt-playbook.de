<script lang="ts">
  import { page } from '$app/stores';

  interface NavItem {
    id: string;
    href: string;
    label: string;
    available: boolean;
  }

  const items: NavItem[] = [
    { id: 'account', href: '/settings/account', label: 'Account', available: true },
    { id: 'language', href: '/settings/language', label: 'Sprache', available: false },
    { id: 'tv', href: '/settings/tv', label: 'TV-Verbindung', available: true },
    { id: 'display', href: '/settings/display', label: 'Anzeige', available: true },
    { id: 'pro', href: '/settings/pro', label: 'Pro-Abo', available: true },
    { id: 'about', href: '/settings/about', label: 'Über', available: true },
  ];

  let { children } = $props();
  let activeId = $derived(
    items.find((i) => $page.url.pathname.startsWith(i.href))?.id ?? null,
  );
</script>

<section class="settings-page">
  <aside class="sub-nav">
    <header class="head">
      <h1>Einstellungen</h1>
    </header>
    <nav>
      {#each items as item (item.id)}
        {#if item.available}
          <a
            href={item.href}
            class="item"
            class:active={activeId === item.id}
          >
            {item.label}
          </a>
        {:else}
          <span class="item disabled">
            {item.label}
            <span class="soon">bald</span>
          </span>
        {/if}
      {/each}
    </nav>
  </aside>

  <div class="detail">
    {@render children()}
  </div>
</section>

<style>
  .settings-page {
    flex: 1;
    display: flex;
    overflow: hidden;
  }
  .sub-nav {
    width: 260px;
    border-right: 1px solid var(--color-border);
    background: var(--bg-glass);
    backdrop-filter: blur(40px) saturate(180%);
    -webkit-backdrop-filter: blur(40px) saturate(180%);
    box-shadow: inset -1px 0 0 rgba(255, 255, 255, 0.04);
    display: flex;
    flex-direction: column;
    padding: 16px;
    gap: 12px;
  }
  .head h1 {
    font-size: 20px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;
  }
  nav {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .item {
    padding: 10px 12px;
    border-radius: var(--radius-button);
    color: var(--color-text-primary);
    font-size: 14px;
    text-decoration: none;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: background var(--transition-quick), transform 0.15s ease;
  }
  .item:hover {
    background: var(--bg-glass-hover);
    transform: translateX(2px);
  }
  .item.active {
    background: var(--color-accent);
    color: #fff;
  }
  .item.disabled {
    color: var(--color-text-secondary);
    cursor: default;
  }
  .soon {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--bg-elevated);
    color: var(--color-text-secondary);
  }
  .detail {
    flex: 1;
    overflow-y: auto;
  }
</style>
