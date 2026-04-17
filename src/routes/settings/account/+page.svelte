<script lang="ts">
  import { goto } from '$app/navigation';
  import { auth } from '$lib/auth/client.svelte';

  type Mode = 'login' | 'signup' | 'forgot';
  let mode = $state<Mode>('login');
  let email = $state('');
  let password = $state('');
  let busy = $state(false);
  let error = $state<string | null>(null);
  let info = $state<string | null>(null);

  const emailValid = $derived(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  const canSubmit = $derived(
    mode === 'forgot'
      ? emailValid && !busy
      : emailValid && password.length >= 10 && !busy,
  );

  function setMode(next: Mode) {
    mode = next;
    error = null;
    info = null;
  }

  function initial(e: string): string {
    return (e[0] ?? '?').toUpperCase();
  }

  function formatPro(proUntil: number | null): string {
    if (!proUntil || proUntil <= Date.now()) return 'Free';
    const d = new Date(proUntil);
    return `Pro bis ${d.toLocaleDateString('de-DE')}`;
  }

  async function submit(e: Event) {
    e.preventDefault();
    if (!canSubmit) return;
    error = null;
    info = null;
    busy = true;
    try {
      if (mode === 'login') {
        const res = await auth.login(email, password);
        if (!res.ok) {
          error = res.error ?? 'Login fehlgeschlagen';
          if (res.canResend) error += ' (Mail erneut senden?)';
        } else {
          email = '';
          password = '';
        }
      } else if (mode === 'signup') {
        const res = await auth.signup(email, password);
        if (!res.ok) {
          error = res.error ?? 'Registrierung fehlgeschlagen';
        } else {
          goto(`/verify-email?email=${encodeURIComponent(email)}`);
        }
      } else if (mode === 'forgot') {
        await auth.requestReset(email);
        info = 'Falls registriert, haben wir einen Reset-Link geschickt.';
      }
    } finally {
      busy = false;
    }
  }

  async function logout() {
    await auth.logout();
  }
</script>

<section class="account">
  <header class="head">
    <h2>Account</h2>
  </header>

  {#if auth.user}
    <div class="profile">
      <div class="avatar">{initial(auth.user.email)}</div>
      <div class="email">{auth.user.email}</div>
      {#if !auth.user.emailVerified}
        <span class="badge warning">E-Mail unbestätigt</span>
      {/if}
      <span class="badge" class:pro={auth.isPro}>{formatPro(auth.user.proUntil)}</span>
    </div>

    <div class="actions">
      <button type="button" class="btn danger" onclick={logout}>Ausloggen</button>
    </div>
  {:else}
    <div class="tabs" role="tablist">
      <button class:active={mode === 'login'} onclick={() => setMode('login')}>Anmelden</button>
      <button class:active={mode === 'signup'} onclick={() => setMode('signup')}>Registrieren</button>
    </div>

    <form onsubmit={submit}>
      <label>
        <span>E-Mail</span>
        <input type="email" bind:value={email} autocomplete="email" required />
      </label>
      {#if mode !== 'forgot'}
        <label>
          <span>Passwort (min. 10 Zeichen)</span>
          <input
            type="password"
            bind:value={password}
            autocomplete={mode === 'login' ? 'current-password' : 'new-password'}
            minlength="10"
            required
          />
        </label>
      {/if}
      {#if error}<p class="error">{error}</p>{/if}
      {#if info}<p class="info">{info}</p>{/if}
      <button type="submit" class="btn primary" disabled={!canSubmit}>
        {#if busy}Wird verarbeitet…{:else if mode === 'login'}Anmelden{:else if mode === 'signup'}Registrieren{:else}Reset-Link senden{/if}
      </button>
      {#if mode === 'login'}
        <p class="link">
          <button type="button" class="linkbtn" onclick={() => setMode('forgot')}>Passwort vergessen?</button>
        </p>
      {/if}
      {#if mode === 'forgot'}
        <p class="link">
          <button type="button" class="linkbtn" onclick={() => setMode('login')}>Zurück zum Login</button>
        </p>
      {/if}
    </form>
  {/if}
</section>

<style>
  .account { padding: 32px; max-width: 520px; display: flex; flex-direction: column; gap: 20px; }
  .head h2 { font-size: 22px; font-weight: 600; color: var(--color-text-primary); margin: 0; }
  .profile {
    display: flex; flex-direction: column; align-items: flex-start; gap: 8px;
    padding: 20px; background: var(--bg-surface);
    border: 1px solid var(--color-border); border-radius: var(--radius-panel);
  }
  .avatar {
    width: 56px; height: 56px; border-radius: 50%;
    background: var(--color-accent); color: #fff;
    font-size: 22px; font-weight: 600; display: grid; place-items: center;
  }
  .email { font-size: 18px; font-weight: 500; color: var(--color-text-primary); }
  .badge {
    font-size: 12px; padding: 4px 10px; border-radius: 999px;
    background: var(--bg-elevated); color: var(--color-text-secondary);
    letter-spacing: 1px; text-transform: uppercase;
  }
  .badge.pro { background: var(--color-success); color: #fff; }
  .badge.warning { background: var(--color-danger); color: #fff; }
  .tabs {
    display: flex; gap: 4px; padding: 4px;
    background: var(--bg-surface); border-radius: var(--radius-button);
    border: 1px solid var(--color-border); align-self: flex-start;
  }
  .tabs button {
    padding: 8px 16px; border-radius: 6px; background: transparent;
    color: var(--color-text-secondary); font-size: 14px; font-weight: 500;
  }
  .tabs button.active { background: var(--bg-elevated); color: var(--color-text-primary); }
  form { display: flex; flex-direction: column; gap: 14px; }
  label { display: flex; flex-direction: column; gap: 6px; }
  label span { font-size: 13px; color: var(--color-text-secondary); }
  input {
    padding: 10px 12px; background: var(--bg-surface);
    border: 1px solid var(--color-border); border-radius: var(--radius-button);
    color: var(--color-text-primary); font-size: 15px;
  }
  .btn {
    padding: 12px 16px; border-radius: var(--radius-button);
    font-weight: 600; font-size: 15px;
  }
  .btn.primary { background: var(--color-accent); color: #fff; }
  .btn.danger { background: var(--color-danger); color: #fff; }
  .btn[disabled] { opacity: 0.5; cursor: not-allowed; }
  .error { color: var(--color-danger); font-size: 13px; margin: 0; }
  .info { color: var(--color-text-secondary); font-size: 13px; margin: 0; }
  .link { margin: 0; font-size: 13px; }
  .linkbtn {
    background: none; color: var(--color-accent); padding: 0;
    text-decoration: underline; cursor: pointer;
  }
</style>
