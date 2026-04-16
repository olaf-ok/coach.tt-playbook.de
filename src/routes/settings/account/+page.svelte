<script lang="ts">
  import { mockUser } from '$lib/auth/mock-user.svelte';
  import { proStatus } from '$lib/pro/status.svelte';
  import { m } from '$lib/paraglide/messages';

  type Mode = 'login' | 'signup';
  let mode = $state<Mode>('login');
  let email = $state('');
  let password = $state('');
  let busy = $state(false);
  let error = $state<string | null>(null);

  const canSubmit = $derived(
    email.includes('@') && password.length >= 6 && !busy,
  );

  async function submit(e: Event) {
    e.preventDefault();
    if (!canSubmit) return;
    error = null;
    busy = true;
    try {
      if (mode === 'login') await mockUser.login(email);
      else await mockUser.signup(email);
      email = '';
      password = '';
    } catch (err) {
      error = err instanceof Error ? err.message : m.account_error_generic();
    } finally {
      busy = false;
    }
  }

  function logout() {
    mockUser.logout();
  }

  function initial(e: string): string {
    return (e[0] ?? '?').toUpperCase();
  }
</script>

<section class="account">
  <header class="head">
    <h2>{m.account_title()}</h2>
  </header>

  {#if mockUser.loggedIn && mockUser.current}
    <div class="profile">
      <div class="avatar">{initial(mockUser.current.email)}</div>
      <div class="email">{mockUser.current.email}</div>
      {#if proStatus.isPro}
        <span class="badge pro">{m.account_badge_pro()}</span>
      {:else}
        <span class="badge">{m.account_badge_free()}</span>
      {/if}
    </div>

    <div class="card">
      <h3>{m.account_subscription_heading()}</h3>
      <p class="muted">{m.account_subscription_hint()}</p>
      <button type="button" class="btn secondary" disabled>{m.account_subscription_manage()}</button>
    </div>

    <div class="actions">
      <button type="button" class="btn danger" onclick={logout}>{m.account_logout()}</button>
    </div>
  {:else}
    <div class="tabs" role="tablist">
      <button
        type="button"
        role="tab"
        class:active={mode === 'login'}
        aria-selected={mode === 'login'}
        onclick={() => (mode = 'login')}
      >
        {m.account_tab_login()}
      </button>
      <button
        type="button"
        role="tab"
        class:active={mode === 'signup'}
        aria-selected={mode === 'signup'}
        onclick={() => (mode = 'signup')}
      >
        {m.account_tab_signup()}
      </button>
    </div>

    <form class="form" onsubmit={submit}>
      <label class="field">
        <span>{m.account_field_email()}</span>
        <input
          type="email"
          bind:value={email}
          autocomplete="email"
          required
          placeholder={m.account_field_email_placeholder()}
        />
      </label>
      <label class="field">
        <span>{m.account_field_password()}</span>
        <input
          type="password"
          bind:value={password}
          autocomplete={mode === 'login' ? 'current-password' : 'new-password'}
          required
          minlength="6"
          placeholder={m.account_field_password_placeholder()}
        />
      </label>

      {#if error}
        <p class="error">{error}</p>
      {/if}

      <button type="submit" class="btn primary" disabled={!canSubmit}>
        {#if busy}
          <span class="spinner" aria-hidden="true"></span>
          {mode === 'login' ? m.account_submit_login_busy() : m.account_submit_signup_busy()}
        {:else}
          {mode === 'login' ? m.account_submit_login() : m.account_submit_signup()}
        {/if}
      </button>

      <p class="note">{m.account_note()}</p>
    </form>
  {/if}
</section>

<style>
  .account {
    padding: 32px;
    max-width: 520px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .head h2 {
    font-size: 22px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;
  }
  .profile {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding: 20px;
    background: var(--bg-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-panel);
  }
  .avatar {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--color-accent);
    color: #fff;
    font-size: 22px;
    font-weight: 600;
    display: grid;
    place-items: center;
  }
  .email {
    font-size: 18px;
    font-weight: 500;
    color: var(--color-text-primary);
  }
  .badge {
    font-size: 12px;
    padding: 4px 10px;
    border-radius: 999px;
    background: var(--bg-elevated);
    color: var(--color-text-secondary);
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  .badge.pro {
    background: var(--color-success);
    color: #fff;
  }
  .card {
    padding: 16px 20px;
    background: var(--bg-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-panel);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .card h3 {
    font-size: 15px;
    font-weight: 600;
    margin: 0;
    color: var(--color-text-primary);
  }
  .muted {
    color: var(--color-text-secondary);
    font-size: 13px;
    margin: 0;
  }
  .tabs {
    display: flex;
    gap: 4px;
    padding: 4px;
    background: var(--bg-surface);
    border-radius: var(--radius-button);
    border: 1px solid var(--color-border);
    align-self: flex-start;
  }
  .tabs button {
    padding: 8px 16px;
    border-radius: 6px;
    background: transparent;
    color: var(--color-text-secondary);
    font-size: 14px;
    font-weight: 500;
  }
  .tabs button.active {
    background: var(--bg-elevated);
    color: var(--color-text-primary);
  }
  .form {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .field span {
    font-size: 13px;
    color: var(--color-text-secondary);
  }
  .field input {
    padding: 10px 12px;
    background: var(--bg-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-button);
    color: var(--color-text-primary);
    font-size: 15px;
  }
  .field input:focus {
    outline: 2px solid var(--color-accent);
    outline-offset: 0;
  }
  .btn {
    padding: 12px 16px;
    border-radius: var(--radius-button);
    font-weight: 600;
    font-size: 15px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .btn.primary {
    background: var(--color-accent);
    color: #fff;
  }
  .btn.secondary {
    background: var(--bg-elevated);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border);
  }
  .btn.danger {
    background: var(--color-danger);
    color: #fff;
  }
  .btn[disabled] {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .actions {
    display: flex;
    justify-content: flex-start;
  }
  .note {
    font-size: 12px;
    color: var(--color-text-secondary);
    margin: 0;
  }
  .error {
    color: var(--color-danger);
    font-size: 13px;
    margin: 0;
  }
  .spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    display: inline-block;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
