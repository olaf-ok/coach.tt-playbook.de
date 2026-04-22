<script lang="ts">
  import { browser } from '$app/environment';
  import { auth } from '$lib/auth/client.svelte';
  import { m } from '$lib/paraglide/messages';

  const SHARE_NOTICE_KEY = 'tt-share-notice-seen';
  const MAX_MESSAGE = 280;

  interface Props {
    exerciseId: string;
    exerciseName: string;
    onClose: () => void;
  }

  let { exerciseId, exerciseName, onClose }: Props = $props();

  let message = $state('');
  let neverExpires = $state(false);
  let busy = $state(false);
  let error = $state<string | null>(null);
  let shareResult = $state<{ url: string; expiresAt: number | null } | null>(null);
  let copied = $state(false);
  let showNotice = $state(browser && !localStorage.getItem(SHARE_NOTICE_KEY));

  const isPro = $derived(auth.isPro);
  const charsLeft = $derived(MAX_MESSAGE - message.length);

  async function createShare() {
    if (busy) return;
    busy = true;
    error = null;

    if (showNotice && browser) {
      localStorage.setItem(SHARE_NOTICE_KEY, '1');
      showNotice = false;
    }

    try {
      const res = await fetch('/api/shares', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          exerciseId,
          message: message.trim() || undefined,
          neverExpires: isPro && neverExpires ? true : undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (body.error === 'share_limit') {
          error = m.share_dialog_limit_reached();
        } else if (body.error === 'exercise_not_synced') {
          error = m.share_dialog_not_synced();
        } else if (res.status === 429) {
          error = m.share_dialog_rate_limited();
        } else {
          error = m.share_dialog_create_error();
        }
        return;
      }

      const data = await res.json();
      const publicUrl = `https://coach.tt-playbook.de/s/${data.slug}`;
      shareResult = { url: publicUrl, expiresAt: data.expiresAt };
    } catch {
      error = m.share_dialog_create_error();
    } finally {
      busy = false;
    }
  }

  async function copyLink() {
    if (!shareResult) return;
    try {
      await navigator.clipboard.writeText(shareResult.url);
    } catch {
      const el = document.querySelector<HTMLInputElement>('.link-input');
      if (el) { el.select(); document.execCommand('copy'); }
    }
    copied = true;
    setTimeout(() => (copied = false), 2000);
  }

  async function nativeShare() {
    if (!shareResult || !navigator.share) return;
    try {
      await navigator.share({ url: shareResult.url, title: exerciseName });
    } catch {
      // user cancelled or not supported
    }
  }

  function formatExpiry(ts: number | null): string {
    if (ts === null) return m.settings_shares_never_expires();
    return new Date(ts).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
</script>

<div class="overlay" role="presentation" onclick={onClose} onkeydown={(e) => e.key === 'Escape' && onClose()}>
  <div
    class="dialog"
    role="dialog"
    aria-modal="true"
    aria-labelledby="share-title"
    tabindex="-1"
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.stopPropagation()}
  >
    <div class="dialog-header">
      <h2 id="share-title">{m.share_dialog_title()}</h2>
      <button type="button" class="close-btn" onclick={onClose} aria-label="Schließen">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M2 2L16 16M16 2L2 16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    </div>

    <p class="exercise-name">{exerciseName || m.exercise_unnamed()}</p>

    {#if showNotice}
      <div class="notice">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" class="notice-icon">
          <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/>
          <path d="M8 5V8.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <circle cx="8" cy="11" r="0.75" fill="currentColor"/>
        </svg>
        <span>{m.share_dsgvo_notice()}</span>
      </div>
    {/if}

    {#if !shareResult}
      <div class="form">
        <label class="field-label" for="share-msg">{m.share_dialog_message_label()}</label>
        <textarea
          id="share-msg"
          class="msg-input"
          placeholder={m.share_dialog_message_placeholder()}
          bind:value={message}
          maxlength={MAX_MESSAGE}
          rows="3"
        ></textarea>
        <span class="char-count" class:warn={charsLeft < 40}>{m.share_dialog_message_counter({ n: charsLeft })}</span>

        {#if isPro}
          <label class="never-label">
            <input type="checkbox" bind:checked={neverExpires} />
            {m.share_dialog_never_expires()}
          </label>
        {/if}

        {#if error}
          <p class="error-msg">{error}</p>
        {/if}

        <button type="button" class="btn-create" onclick={createShare} disabled={busy}>
          {busy ? '…' : m.share_dialog_create_button()}
        </button>
      </div>
    {:else}
      <div class="result">
        <div class="link-row">
          <input class="link-input" type="text" readonly value={shareResult.url} onclick={(e) => (e.target as HTMLInputElement).select()} />
          <button type="button" class="btn-copy" onclick={copyLink}>
            {copied ? m.share_dialog_copied() : m.share_dialog_copy_button()}
          </button>
        </div>
        {#if 'share' in navigator}
          <button type="button" class="btn-share-native" onclick={nativeShare}>
            {m.share_dialog_native_share()}
          </button>
        {/if}
        <p class="expiry-info">
          {m.settings_shares_expires({ date: formatExpiry(shareResult.expiresAt) })}
        </p>
        <a href="/settings/shares" class="manage-link" onclick={onClose}>
          {m.share_dialog_manage_link()}
        </a>
      </div>
    {/if}
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.65);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 16px;
  }

  .dialog {
    background: var(--bg-elevated);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-panel);
    padding: 24px;
    width: 100%;
    max-width: 440px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    color: var(--color-text-primary);
  }

  .dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  h2 {
    font-size: 18px;
    font-weight: 700;
    margin: 0;
    color: var(--color-text-primary);
  }

  .close-btn {
    background: none;
    border: none;
    color: var(--color-text-secondary);
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
  }

  .exercise-name {
    font-size: 14px;
    color: var(--color-text-secondary);
    margin: 0;
  }

  .notice {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    padding: 10px 12px;
    background: var(--bg-glass-hover);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    font-size: 13px;
    color: var(--color-text-secondary);
    line-height: 1.5;
  }

  .notice-icon {
    flex-shrink: 0;
    color: var(--color-accent);
    margin-top: 1px;
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .field-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-secondary);
  }

  .msg-input {
    width: 100%;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid var(--color-border);
    background: var(--bg-surface);
    color: var(--color-text-primary);
    font-size: 14px;
    resize: vertical;
    font-family: inherit;
    box-sizing: border-box;
  }

  .char-count {
    font-size: 12px;
    color: var(--color-text-secondary);
    text-align: right;
  }

  .char-count.warn {
    color: var(--color-danger);
  }

  .never-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: var(--color-text-primary);
    cursor: pointer;
  }

  .error-msg {
    font-size: 13px;
    color: var(--color-danger);
    margin: 0;
    padding: 8px 12px;
    background: rgba(255, 59, 48, 0.1);
    border-radius: 6px;
  }

  .btn-create {
    padding: 11px 0;
    border: none;
    border-radius: var(--radius-button);
    background: var(--color-accent);
    color: #fff;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s;
  }

  .btn-create:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .result {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .link-row {
    display: flex;
    gap: 8px;
  }

  .link-input {
    flex: 1;
    padding: 9px 12px;
    border-radius: 8px;
    border: 1px solid var(--color-border);
    background: var(--bg-surface);
    color: var(--color-text-primary);
    font-size: 13px;
    min-width: 0;
    cursor: text;
  }

  .btn-copy {
    padding: 9px 14px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--bg-surface);
    color: var(--color-text-primary);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.15s;
    white-space: nowrap;
  }

  .btn-copy:hover {
    background: var(--bg-glass-hover);
  }

  .btn-share-native {
    padding: 10px 0;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-button);
    background: var(--bg-surface);
    color: var(--color-text-primary);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
  }

  .btn-share-native:hover {
    background: var(--bg-glass-hover);
  }

  .expiry-info {
    font-size: 13px;
    color: var(--color-text-secondary);
    margin: 0;
    text-align: center;
  }

  .manage-link {
    font-size: 13px;
    color: var(--color-accent);
    text-decoration: none;
    text-align: center;
  }

  .manage-link:hover {
    text-decoration: underline;
  }
</style>
