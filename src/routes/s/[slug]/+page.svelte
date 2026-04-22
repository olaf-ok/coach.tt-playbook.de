<script lang="ts">
  import ShareViewer from '$lib/components/ShareViewer.svelte';
  import AppLogo from '$lib/brand/AppLogo.svelte';
  import { m } from '$lib/paraglide/messages';
  import type { SharePageData } from './+page.ts';

  let { data }: { data: SharePageData } = $props();
</script>

<svelte:head>
  <title>TT Playbook Coach</title>
  <meta name="robots" content="noindex" />
</svelte:head>

{#if !data.exercise}
  <div class="error-shell">
    <AppLogo size={40} />
    <h1 class="error-title">
      {data.error === 404 ? m.share_viewer_not_found() : m.share_viewer_not_found()}
    </h1>
    <p class="error-sub">{m.share_viewer_expired()}</p>
    <a href="https://coach.tt-playbook.de" class="cta-btn">
      {m.share_viewer_cta()}
    </a>
  </div>
{:else}
  <ShareViewer
    exercise={data.exercise}
    trainerEmail={data.trainerEmail ?? ''}
    message={data.message}
    expiresAt={data.expiresAt}
  />
{/if}

<style>
  .error-shell {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 40px 24px;
    background: var(--bg-app);
    color: var(--color-text-primary);
    text-align: center;
  }

  .error-title {
    font-size: 22px;
    font-weight: 700;
    margin: 0;
    color: var(--color-text-primary);
  }

  .error-sub {
    font-size: 15px;
    color: var(--color-text-secondary);
    margin: 0;
  }

  .cta-btn {
    margin-top: 8px;
    padding: 10px 24px;
    border-radius: 10px;
    background: var(--color-accent);
    color: #fff;
    font-size: 15px;
    font-weight: 600;
    text-decoration: none;
    transition: opacity 0.15s;
  }

  .cta-btn:hover {
    opacity: 0.85;
  }
</style>
