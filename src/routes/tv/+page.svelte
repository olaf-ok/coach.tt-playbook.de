<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import QRCode from 'qrcode';
  import TvDisplay from '$lib/components/TvDisplay.svelte';
  import { tvSession } from '$lib/tv/session.svelte';
  import AppIcon from '$lib/brand/AppIcon.svelte';
  import { m } from '$lib/paraglide/messages';

  const client = tvSession.ensureClient();
  let qrSvg = $state<string>('');

  $effect(() => {
    if (!client.code) {
      qrSvg = '';
      return;
    }
    const url = `${window.location.origin}/connect-tv?code=${client.code}`;
    QRCode.toString(url, { type: 'svg', margin: 1, width: 240 }).then((svg) => {
      qrSvg = svg;
    });
  });

  onMount(() => {
    client.registerAsTv();
  });

  onDestroy(() => {
    tvSession.reset();
  });
</script>

<section class="tv-root">
  <div class="watermark" aria-hidden="true">
    <AppIcon size={32} />
  </div>
  {#if client.status === 'paired'}
    <TvDisplay exercise={client.lastExercise} />
  {:else}
    <div class="pair-view">
      <h1>{m.common_brand_full()}</h1>
      <p class="sub">{m.tv_pair_subtitle()}</p>

      {#if client.status === 'registered' && client.code}
        <div class="qr-wrap">
          {@html qrSvg}
        </div>
        <div class="code-group">
          <span class="code-label">{m.tv_pair_code_label()}</span>
          <span class="code">{client.code}</span>
        </div>
        <p class="hint">
          {m.tv_pair_hint_prefix()}<span class="path">/connect-tv</span>{m.tv_pair_hint_suffix()}
        </p>
      {:else if client.status === 'connecting'}
        <p class="status">{m.tv_status_connecting_server()}</p>
      {:else if client.status === 'error'}
        <p class="error">{m.tv_status_error({ reason: client.errorReason ?? m.tv_status_error_unknown() })}</p>
      {:else if client.status === 'closed'}
        <p class="status">{m.tv_status_closed()}</p>
      {/if}
    </div>
  {/if}
</section>

<style>
  .tv-root {
    flex: 1;
    display: flex;
    overflow: hidden;
    position: relative;
  }
  .watermark {
    position: absolute;
    top: 24px;
    left: 24px;
    color: var(--color-text-primary);
    opacity: 0.4;
    z-index: 2;
    pointer-events: none;
  }
  .pair-view {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px;
    gap: 32px;
    background: var(--bg-app);
  }
  h1 {
    font-size: 48px;
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0;
  }
  .sub {
    font-size: 22px;
    color: var(--color-text-secondary);
    margin: 0;
  }
  .qr-wrap {
    background: #fff;
    padding: 16px;
    border-radius: var(--radius-panel);
  }
  .qr-wrap :global(svg) {
    display: block;
    width: 240px;
    height: 240px;
  }
  .code-group {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }
  .code-label {
    font-size: 14px;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 2px;
  }
  .code {
    font-size: 96px;
    font-weight: 600;
    color: var(--color-accent);
    letter-spacing: 8px;
  }
  .hint {
    font-size: 16px;
    color: var(--color-text-secondary);
    text-align: center;
    max-width: 480px;
  }
  .path {
    color: var(--color-text-primary);
    font-family: ui-monospace, monospace;
  }
  .status,
  .error {
    font-size: 18px;
    color: var(--color-text-secondary);
  }
  .error {
    color: var(--color-danger);
  }
</style>
