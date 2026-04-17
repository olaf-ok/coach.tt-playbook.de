<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { auth } from '$lib/auth/client.svelte';

  let status = $state<'loading' | 'error'>('loading');
  let errorMessage = $state('');

  onMount(async () => {
    const token = $page.params.token;
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (res.ok) {
        const body = await res.json();
        auth.user = body.user;
        await goto('/draw');
        return;
      }
      const body = await res.json().catch(() => ({}));
      errorMessage = body.error ?? 'Link ungültig oder abgelaufen.';
      status = 'error';
    } catch {
      errorMessage = 'Verbindung fehlgeschlagen.';
      status = 'error';
    }
  });
</script>

<section class="page">
  {#if status === 'loading'}
    <p>E-Mail wird bestätigt…</p>
  {:else}
    <h1>Bestätigung fehlgeschlagen</h1>
    <p>{errorMessage}</p>
    <a href="/verify-email">Neue Bestätigungs-Mail anfordern</a>
  {/if}
</section>

<style>
  .page {
    padding: 32px;
    max-width: 520px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  h1 {
    font-size: 22px;
    font-weight: 600;
    color: var(--color-text-primary);
  }
  a {
    color: var(--color-accent);
  }
</style>
