<script lang="ts">
  import { onMount } from 'svelte';
  import { m } from '$lib/paraglide/messages';

  const DISMISSED_KEY = 'tt-mobile-hint-dismissed';
  const MOBILE_MQ = '(max-width: 767.98px)';

  let show = $state(false);

  onMount(() => {
    try {
      if (localStorage.getItem(DISMISSED_KEY) === '1') return;
    } catch {
      return;
    }
    if (!window.matchMedia(MOBILE_MQ).matches) return;
    show = true;
  });

  function dismiss() {
    try {
      localStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      // Safari Private Mode etc. — einfach nur schließen
    }
    show = false;
  }
</script>

{#if show}
  <div class="backdrop" role="presentation">
    <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="mobile-hint-title">
      <h3 id="mobile-hint-title">{m.mobile_hint_title()}</h3>
      <p>{m.mobile_hint_body()}</p>
      <button type="button" class="ok-btn" onclick={dismiss}>
        {m.mobile_hint_dismiss()}
      </button>
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    display: grid;
    place-items: center;
    z-index: 200;
    padding: 20px;
  }
  .dialog {
    width: min(420px, 100%);
    background: var(--bg-elevated);
    border-radius: 20px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
  }
  h3 {
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;
  }
  p {
    font-size: 14px;
    line-height: 1.5;
    color: var(--color-text-secondary);
    margin: 0;
  }
  .ok-btn {
    margin-top: 6px;
    height: 44px;
    background: var(--color-accent);
    color: #fff;
    font-size: 15px;
    font-weight: 600;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(10, 132, 255, 0.3);
  }
  .ok-btn:active {
    transform: scale(0.97);
  }
</style>
