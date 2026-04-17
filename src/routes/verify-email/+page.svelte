<script lang="ts">
  import { auth } from '$lib/auth/client.svelte';
  import { page } from '$app/stores';

  const email = $derived($page.url.searchParams.get('email') ?? '');
  let sending = $state(false);
  let sent = $state(false);

  async function resend() {
    if (!email) return;
    sending = true;
    await auth.resendVerification(email);
    sending = false;
    sent = true;
  }
</script>

<section class="page">
  <h1>Check deine Mails</h1>
  <p>Wir haben einen Bestätigungs-Link an <strong>{email || 'deine Adresse'}</strong> geschickt.</p>
  <p class="muted">Klicke auf den Link in der Mail, um dein Konto zu aktivieren. Der Link läuft in 24 Stunden ab.</p>

  {#if email}
    <button type="button" onclick={resend} disabled={sending || sent}>
      {#if sent}Erneut gesendet{:else if sending}Wird gesendet…{:else}Mail erneut senden{/if}
    </button>
  {/if}
</section>

<style>
  .page {
    padding: 32px;
    max-width: 520px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  h1 {
    font-size: 24px;
    font-weight: 600;
    margin: 0;
    color: var(--color-text-primary);
  }
  .muted {
    color: var(--color-text-secondary);
    font-size: 14px;
    margin: 0;
  }
  button {
    padding: 10px 14px;
    background: var(--color-accent);
    color: #fff;
    border-radius: var(--radius-button);
    font-weight: 500;
    align-self: flex-start;
  }
  button[disabled] {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
