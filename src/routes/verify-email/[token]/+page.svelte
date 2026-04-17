<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { auth } from '$lib/auth/client.svelte';
  import { m } from '$lib/paraglide/messages';

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
      errorMessage = body.error ?? m.verify_token_error_generic();
      status = 'error';
    } catch {
      errorMessage = m.verify_token_error_connection();
      status = 'error';
    }
  });
</script>

<section class="page">
  {#if status === 'loading'}
    <p>{m.verify_token_checking()}</p>
  {:else}
    <h1>{m.verify_token_failed_title()}</h1>
    <p>{errorMessage}</p>
    <a href="/verify-email">{m.verify_token_resend_link()}</a>
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
