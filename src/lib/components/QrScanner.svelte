<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { m } from '$lib/paraglide/messages';

  interface Props {
    onDecoded: (text: string) => void;
    onCancel: () => void;
  }

  let { onDecoded, onCancel }: Props = $props();

  let container: HTMLDivElement;
  let scanner: unknown | null = null;
  let errorMessage = $state<string | null>(null);

  onMount(async () => {
    try {
      const mod = await import('html5-qrcode');
      const Html5Qrcode = mod.Html5Qrcode;
      const instance = new Html5Qrcode('qr-reader-region');
      scanner = instance;

      await instance.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 240 },
        (decoded: string) => {
          onDecoded(decoded);
        },
        () => {
          // decode errors are expected when no QR in frame; ignore
        },
      );
    } catch (err) {
      errorMessage =
        err instanceof Error ? err.message : m.qr_scanner_camera_error();
    }
  });

  onDestroy(async () => {
    if (!scanner) return;
    try {
      const instance = scanner as { stop: () => Promise<void>; clear: () => void };
      await instance.stop();
      instance.clear();
    } catch {
      // ignore — stop sometimes rejects if already stopped
    }
  });
</script>

<div class="scanner" bind:this={container}>
  <div id="qr-reader-region" class="region"></div>
  {#if errorMessage}
    <p class="error">{errorMessage}</p>
  {/if}
  <button type="button" class="cancel" onclick={onCancel}>{m.qr_scanner_cancel()}</button>
</div>

<style>
  .scanner {
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: center;
  }
  .region {
    width: 320px;
    max-width: 100%;
    aspect-ratio: 1;
    background: #000;
    border-radius: var(--radius-panel);
    overflow: hidden;
  }
  .region :global(video) {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .error {
    color: var(--color-danger);
    font-size: 14px;
  }
  .cancel {
    padding: 10px 16px;
    border-radius: var(--radius-button);
    background: var(--bg-surface);
    color: var(--color-text-primary);
    font-size: 14px;
  }
</style>
