<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import QRCode from 'qrcode';
  import TvDisplay from '$lib/components/TvDisplay.svelte';
  import { tvSession } from '$lib/tv/session.svelte';

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
  {#if client.status === 'paired'}
    <TvDisplay exercise={client.lastExercise} />
  {:else}
    <div class="pair-view">
      <h1>TT Playbook Trainer</h1>
      <p class="sub">Tablet mit diesem Bildschirm verbinden</p>

      {#if client.status === 'registered' && client.code}
        <div class="qr-wrap">
          {@html qrSvg}
        </div>
        <div class="code-group">
          <span class="code-label">Code</span>
          <span class="code">{client.code}</span>
        </div>
        <p class="hint">
          Scanne den QR-Code auf deinem Tablet oder gib den Code unter <span class="path">/connect-tv</span>
          manuell ein.
        </p>
      {:else if client.status === 'connecting'}
        <p class="status">Verbinde mit Server…</p>
      {:else if client.status === 'error'}
        <p class="error">Fehler: {client.errorReason ?? 'unbekannt'}</p>
      {:else if client.status === 'closed'}
        <p class="status">Verbindung geschlossen.</p>
      {/if}
    </div>
  {/if}
</section>

<style>
  .tv-root {
    flex: 1;
    display: flex;
    overflow: hidden;
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
