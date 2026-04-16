<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { resolveMobileHeader } from './mobile-nav-utils';
  import { tvSession } from '$lib/tv/session.svelte';
  import { m } from '$lib/paraglide/messages';

  let info = $derived(resolveMobileHeader($page.url.pathname));
  let tvPaired = $derived(tvSession.status === 'paired');

  function title(): string {
    if (!info.titleKey) return '';
    const keys: Record<string, () => string> = {
      mobile_header_draw: m.mobile_header_draw,
      mobile_header_archive: m.mobile_header_archive,
      mobile_header_playlists: m.mobile_header_playlists,
      mobile_header_settings: m.mobile_header_settings,
      settings_nav_account: m.settings_nav_account,
      settings_nav_language: m.settings_nav_language,
      settings_nav_tv: m.settings_nav_tv,
      settings_nav_display: m.settings_nav_display,
      settings_nav_pro: m.settings_nav_pro,
      settings_nav_about: m.settings_nav_about,
    };
    return keys[info.titleKey]?.() ?? '';
  }

  function handleBack() {
    if (info.backHref) goto(info.backHref);
  }

  function handleTvTap() {
    goto('/settings/tv');
  }
</script>

<header class="m-header">
  <div class="left">
    {#if info.showBack}
      <button
        type="button"
        class="back"
        aria-label={m.mobile_header_back_aria()}
        onclick={handleBack}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 6 9 12 15 18"></polyline>
        </svg>
      </button>
    {/if}
  </div>

  <h1 class="title">{title()}</h1>

  <div class="right">
    <button
      type="button"
      class="tv-dot"
      class:paired={tvPaired}
      onclick={handleTvTap}
      aria-label={tvPaired ? m.mobile_tv_dot_aria_paired() : m.mobile_tv_dot_aria_unpaired()}
    ></button>
  </div>
</header>

<style>
  .m-header {
    position: sticky;
    top: 0;
    height: calc(var(--mobile-header-h) + env(safe-area-inset-top, 0));
    padding-top: env(safe-area-inset-top, 0);
    background: var(--bg-glass-strong);
    backdrop-filter: blur(40px) saturate(180%);
    -webkit-backdrop-filter: blur(40px) saturate(180%);
    border-bottom: 1px solid var(--color-border);
    display: flex;
    align-items: center;
    padding-left: 8px;
    padding-right: 14px;
    z-index: 30;
  }
  .left, .right {
    width: 44px;
    display: flex;
    align-items: center;
  }
  .right { justify-content: flex-end; }

  .back {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-button);
    color: var(--color-text-primary);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .back:active { background: var(--bg-glass-hover); }

  .title {
    flex: 1;
    text-align: center;
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tv-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--color-text-tertiary);
    padding: 0;
  }
  .tv-dot.paired {
    background: var(--color-success);
    box-shadow: 0 0 6px var(--color-success);
  }

  @media (min-width: 768px) {
    .m-header { display: none; }
  }
</style>
