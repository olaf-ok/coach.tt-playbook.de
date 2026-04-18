<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  const THRESHOLD = 80;
  const MAX_PULL = 140;
  const EXCLUDED_PREFIXES = ['/draw', '/tv'];

  let distance = $state(0);
  let triggered = $state(false);

  const isRouteExcluded = $derived(
    EXCLUDED_PREFIXES.some((p) => $page.url.pathname === p || $page.url.pathname.startsWith(p + '/')),
  );

  function scrollableAncestorAtTop(el: HTMLElement | null): boolean {
    let cur: HTMLElement | null = el;
    while (cur) {
      const cs = getComputedStyle(cur);
      const scrollable =
        (cs.overflowY === 'auto' || cs.overflowY === 'scroll') && cur.scrollHeight > cur.clientHeight;
      if (scrollable) {
        return cur.scrollTop <= 0;
      }
      cur = cur.parentElement;
    }
    return true;
  }

  onMount(() => {
    let startY = 0;
    let tracking = false;

    function onTouchStart(e: TouchEvent) {
      if (isRouteExcluded) return;
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      if (!scrollableAncestorAtTop(e.target as HTMLElement)) return;
      startY = t.clientY;
      tracking = true;
      distance = 0;
      triggered = false;
    }

    function onTouchMove(e: TouchEvent) {
      if (!tracking) return;
      const dy = e.touches[0].clientY - startY;
      if (dy <= 0) {
        distance = 0;
        return;
      }
      distance = Math.min(dy, MAX_PULL);
    }

    function onTouchEnd() {
      if (!tracking) return;
      tracking = false;
      if (distance > THRESHOLD) {
        triggered = true;
        setTimeout(() => location.reload(), 150);
        return;
      }
      distance = 0;
    }

    function onTouchCancel() {
      tracking = false;
      distance = 0;
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', onTouchEnd);
    document.addEventListener('touchcancel', onTouchCancel);

    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('touchcancel', onTouchCancel);
    };
  });

  const progress = $derived(Math.min(distance / THRESHOLD, 1));
</script>

{#if distance > 10}
  <div
    class="ptr"
    class:ready={progress >= 1}
    class:triggered
    style="transform: translate(-50%, {Math.min(distance * 0.5, 70) - 48}px); opacity: {progress};"
  >
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        d="M12 4V1L7 6l5 5V8c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.41 3.59 8 8 8s8-3.59 8-8-3.59-8-8-8z"
        fill="currentColor"
      />
    </svg>
  </div>
{/if}

<style>
  .ptr {
    position: fixed;
    top: 16px;
    left: 50%;
    z-index: 1000;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: var(--bg-elevated);
    color: var(--color-text-secondary);
    display: grid;
    place-items: center;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    pointer-events: none;
    transition:
      background 0.15s,
      color 0.15s;
  }
  .ptr.ready {
    background: var(--color-accent);
    color: #fff;
  }
  .ptr.triggered svg {
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
