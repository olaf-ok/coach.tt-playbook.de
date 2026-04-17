<script lang="ts">
  import { auth } from '$lib/auth/client.svelte';
  import { page } from '$app/stores';
  import { m } from '$lib/paraglide/messages';

  const email = $derived($page.url.searchParams.get('email') ?? '');
  let sending = $state(false);
  let sent = $state(false);

  function escapeHtml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  const introHtml = $derived(
    m.verify_email_intro({
      email: `<strong>${escapeHtml(email || m.verify_email_fallback_address())}</strong>`,
    }),
  );

  async function resend() {
    if (!email) return;
    sending = true;
    await auth.resendVerification(email);
    sending = false;
    sent = true;
  }
</script>

<section class="page">
  <h1>{m.verify_email_title()}</h1>
  <p>{@html introHtml}</p>
  <p class="muted">{m.verify_email_hint()}</p>

  {#if email}
    <button type="button" onclick={resend} disabled={sending || sent}>
      {#if sent}{m.verify_email_resent()}{:else if sending}{m.verify_email_resending()}{:else}{m.verify_email_resend()}{/if}
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
