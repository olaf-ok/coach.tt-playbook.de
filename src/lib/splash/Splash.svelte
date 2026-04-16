<script lang="ts">
  import { onMount } from 'svelte';
  import AppLogo from '$lib/brand/AppLogo.svelte';

  interface Props {
    visibleMs?: number;
    fadeMs?: number;
    ondone?: () => void;
  }

  let { visibleMs = 1000, fadeMs = 300, ondone }: Props = $props();
  let fading = $state(false);

  onMount(() => {
    const fadeTimer = setTimeout(() => { fading = true; }, visibleMs);
    const doneTimer = setTimeout(() => { ondone?.(); }, visibleMs + fadeMs);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  });
</script>

<div
  class="splash"
  class:fading
  style="--fade-ms: {fadeMs}ms"
  role="presentation"
  aria-hidden="true"
>
  <AppLogo size={140} />
</div>

<style>
  .splash {
    position: fixed;
    inset: 0;
    background: var(--bg-app);
    color: var(--color-text-primary);
    display: grid;
    place-items: center;
    z-index: 9999;
    opacity: 1;
    transition: opacity var(--fade-ms) ease;
  }
  .splash.fading {
    opacity: 0;
  }
</style>
