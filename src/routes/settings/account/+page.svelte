<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { auth } from '$lib/auth/client.svelte';
  import { billing } from '$lib/billing/client.svelte';
  import { m } from '$lib/paraglide/messages';

  type Mode = 'login' | 'signup' | 'forgot';
  let mode = $state<Mode>('login');
  let email = $state('');
  let password = $state('');
  let busy = $state(false);
  let error = $state<string | null>(null);
  let info = $state<string | null>(null);

  let portalBusy = $state(false);
  let toast = $state<{ kind: 'ok' | 'info' | 'error'; msg: string } | null>(null);

  async function openPortal() {
    portalBusy = true;
    try {
      await billing.openPortal();
    } catch (e) {
      toast = {
        kind: 'error',
        msg: e instanceof Error ? e.message : m.billing_portal_failed_toast(),
      };
      portalBusy = false;
    }
  }

  // Handle ?checkout=success / ?checkout=cancel after Stripe redirect.
  $effect(() => {
    const status = $page.url.searchParams.get('checkout');
    if (status === 'success') {
      toast = { kind: 'ok', msg: m.billing_checkout_success_toast() };
      auth.init();
      goto('/settings/account', { replaceState: true });
    } else if (status === 'cancel') {
      toast = { kind: 'info', msg: m.billing_checkout_cancel_toast() };
      goto('/settings/account', { replaceState: true });
    }
  });

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
    if (!proUntil || proUntil <= Date.now()) return m.account_badge_free();
    const d = new Date(proUntil);
    return m.account_badge_pro_until({ date: d.toLocaleDateString('de-DE') });
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
          error = res.error ?? m.account_error_login_failed();
          if (res.canResend) error += ' ' + m.account_error_resend_hint();
        } else {
          email = '';
          password = '';
        }
      } else if (mode === 'signup') {
        const res = await auth.signup(email, password);
        if (!res.ok) {
          error = res.error ?? m.account_error_signup_failed();
        } else {
          goto(`/verify-email?email=${encodeURIComponent(email)}`);
        }
      } else if (mode === 'forgot') {
        await auth.requestReset(email);
        info = m.account_info_reset_sent();
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
    <h2>{m.account_title()}</h2>
  </header>

  {#if toast}
    <div class="toast toast-{toast.kind}" role="status">{toast.msg}</div>
  {/if}

  {#if auth.user}
    <div class="profile">
      <div class="avatar">{initial(auth.user.email)}</div>
      <div class="email">{auth.user.email}</div>
      {#if !auth.user.emailVerified}
        <span class="badge warning">{m.account_badge_email_unverified()}</span>
      {/if}
      <span class="badge" class:pro={auth.isPro}>{formatPro(auth.user.proUntil)}</span>
    </div>

    <div class="actions">
      {#if auth.isPro}
        <button type="button" class="btn secondary" onclick={openPortal} disabled={portalBusy}>
          {m.billing_portal_button()}
        </button>
      {/if}
      <button type="button" class="btn danger" onclick={logout}>{m.account_logout()}</button>
    </div>
  {:else}
    <div class="tabs" role="tablist">
      <button class:active={mode === 'login'} onclick={() => setMode('login')}>{m.account_tab_login()}</button>
      <button class:active={mode === 'signup'} onclick={() => setMode('signup')}>{m.account_tab_signup()}</button>
    </div>

    <form onsubmit={submit}>
      <label>
        <span>{m.account_field_email()}</span>
        <input type="email" bind:value={email} autocomplete="email" required />
      </label>
      {#if mode !== 'forgot'}
        <label>
          <span>{m.account_password_min_10()}</span>
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
        {#if busy}{m.account_submit_busy()}{:else if mode === 'login'}{m.account_submit_login()}{:else if mode === 'signup'}{m.account_submit_signup()}{:else}{m.account_submit_forgot()}{/if}
      </button>
      {#if mode === 'login'}
        <p class="link">
          <button type="button" class="linkbtn" onclick={() => setMode('forgot')}>{m.account_link_forgot()}</button>
        </p>
      {/if}
      {#if mode === 'forgot'}
        <p class="link">
          <button type="button" class="linkbtn" onclick={() => setMode('login')}>{m.account_link_back_to_login()}</button>
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
  .btn.secondary {
    background: var(--bg-elevated);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border);
  }
  .btn[disabled] { opacity: 0.5; cursor: not-allowed; }
  .actions { display: flex; gap: 10px; flex-wrap: wrap; }
  .toast {
    padding: 12px 16px;
    border-radius: var(--radius-panel);
    font-size: 14px;
    border: 1px solid;
  }
  .toast-ok {
    background: color-mix(in oklab, var(--color-success) 18%, transparent);
    border-color: var(--color-success);
    color: var(--color-success);
  }
  .toast-info {
    background: var(--bg-surface);
    border-color: var(--color-border);
    color: var(--color-text-secondary);
  }
  .toast-error {
    background: color-mix(in oklab, var(--color-danger) 18%, transparent);
    border-color: var(--color-danger);
    color: var(--color-danger);
  }
  .error { color: var(--color-danger); font-size: 13px; margin: 0; }
  .info { color: var(--color-text-secondary); font-size: 13px; margin: 0; }
  .link { margin: 0; font-size: 13px; }
  .linkbtn {
    background: none; color: var(--color-accent); padding: 0;
    text-decoration: underline; cursor: pointer;
  }
</style>
