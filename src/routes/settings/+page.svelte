<script lang="ts">
  import { m } from '$lib/paraglide/messages';

  const items = [
    { href: '/settings/account', label: m.settings_nav_account() },
    { href: '/settings/language', label: m.settings_nav_language() },
    { href: '/settings/tv', label: m.settings_nav_tv() },
    { href: '/settings/display', label: m.settings_nav_display() },
    { href: '/settings/pro', label: m.settings_nav_pro() },
    { href: '/settings/about', label: m.settings_nav_about() },
  ];
</script>

<section class="settings-index">
  <ul class="list mobile-only">
    {#each items as item (item.href)}
      <li>
        <a class="row" href={item.href}>
          <span class="row-label">{item.label}</span>
          <span class="chev">›</span>
        </a>
      </li>
    {/each}
  </ul>
  <p class="tablet-hint desktop-only">{m.settings_hint_pick_left()}</p>
</section>

<style>
  .settings-index { padding: 8px 0; }
  .list { list-style: none; margin: 0; padding: 0; }
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    color: var(--color-text-primary);
    text-decoration: none;
    font-size: 15px;
    border-bottom: 1px solid var(--color-border);
    transition: background var(--transition-quick);
  }
  .row:active { background: var(--bg-glass-hover); }
  .row-label { font-weight: 500; }
  .chev { color: var(--color-text-tertiary); font-size: 18px; }
  .tablet-hint { padding: 48px; text-align: center; color: var(--color-text-secondary); font-size: 14px; }
  .desktop-only { display: none; }
  .mobile-only { display: block; }
  @media (min-width: 768px) {
    .mobile-only { display: none; }
    .desktop-only { display: block; }
  }
</style>
