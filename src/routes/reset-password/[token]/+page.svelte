<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { auth } from '$lib/auth/client.svelte';

  let password = $state('');
  let confirm = $state('');
  let busy = $state(false);
  let error = $state<string | null>(null);

  const canSubmit = $derived(password.length >= 10 && password === confirm && !busy);

  async function submit(e: Event) {
    e.preventDefault();
    if (!canSubmit) return;
    busy = true;
    error = null;
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token: $page.params.token, newPassword: password }),
      });
      if (res.ok) {
        const body = await res.json();
        auth.user = body.user;
        await goto('/draw');
        return;
      }
      const body = await res.json().catch(() => ({}));
      error = body.error ?? 'Zurücksetzen fehlgeschlagen.';
    } catch {
      error = 'Verbindung fehlgeschlagen.';
    } finally {
      busy = false;
    }
  }
</script>

<section class="page">
  <h1>Neues Passwort setzen</h1>
  <form onsubmit={submit}>
    <label>
      <span>Neues Passwort (min. 10 Zeichen)</span>
      <input type="password" bind:value={password} autocomplete="new-password" minlength="10" required />
    </label>
    <label>
      <span>Passwort wiederholen</span>
      <input type="password" bind:value={confirm} autocomplete="new-password" minlength="10" required />
    </label>
    {#if password && confirm && password !== confirm}
      <p class="error">Passwörter stimmen nicht überein.</p>
    {/if}
    {#if error}<p class="error">{error}</p>{/if}
    <button type="submit" disabled={!canSubmit}>
      {busy ? 'Wird gespeichert…' : 'Passwort setzen'}
    </button>
  </form>
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
    font-size: 22px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;
  }
  form {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  span {
    font-size: 13px;
    color: var(--color-text-secondary);
  }
  input {
    padding: 10px 12px;
    background: var(--bg-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-button);
    color: var(--color-text-primary);
    font-size: 15px;
  }
  button {
    padding: 12px 16px;
    background: var(--color-accent);
    color: #fff;
    border-radius: var(--radius-button);
    font-weight: 600;
  }
  button[disabled] {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .error {
    color: var(--color-danger);
    font-size: 13px;
    margin: 0;
  }
</style>
