<script lang="ts">
  import { onMount } from 'svelte';
  import { auth } from '$lib/auth/client.svelte';
  import { m } from '$lib/paraglide/messages';

  const FREE_SHARE_LIMIT = 5;

  interface ShareRow {
    slug: string;
    exercise_id: string;
    exercise_name: string | null;
    message: string | null;
    created_at: number;
    expires_at: number | null;
  }

  let shares = $state<ShareRow[]>([]);
  let loading = $state(true);
  let revoking = $state<Set<string>>(new Set());
  let error = $state<string | null>(null);

  const isPro = $derived(auth.isPro);
  const activeCount = $derived(
    shares.filter((s) => s.expires_at === null || s.expires_at > Date.now()).length,
  );

  async function load() {
    loading = true;
    error = null;
    try {
      const res = await fetch('/api/shares');
      if (!res.ok) throw new Error();
      const data = await res.json();
      shares = data.shares;
    } catch {
      error = m.settings_shares_load_error();
    } finally {
      loading = false;
    }
  }

  async function revoke(slug: string) {
    revoking = new Set([...revoking, slug]);
    try {
      const res = await fetch(`/api/shares/${slug}`, { method: 'DELETE' });
      if (res.ok) {
        shares = shares.filter((s) => s.slug !== slug);
      }
    } finally {
      const next = new Set(revoking);
      next.delete(slug);
      revoking = next;
    }
  }

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // ignore
    }
  }

  function formatDate(ts: number | null): string {
    if (ts === null) return m.settings_shares_never_expires();
    return new Date(ts).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function isExpired(ts: number | null): boolean {
    return ts !== null && ts < Date.now();
  }

  onMount(() => {
    void load();
  });
</script>

<section class="shares-page">
  <h2>{m.settings_shares_title()}</h2>

  {#if !isPro}
    <p class="counter">
      {m.settings_shares_active_count({ n: activeCount, max: FREE_SHARE_LIMIT })}
    </p>
  {/if}

  {#if loading}
    <p class="hint">{m.common_loading()}</p>
  {:else if error}
    <p class="hint error">{error}</p>
  {:else if shares.length === 0}
    <div class="empty">
      <p>{m.settings_shares_empty()}</p>
    </div>
  {:else}
    <ul class="share-list">
      {#each shares as share (share.slug)}
        {@const expired = isExpired(share.expires_at)}
        <li class="share-item" class:expired>
          <div class="share-body">
            <span class="ex-name">{share.exercise_name || m.exercise_unnamed()}</span>
            {#if share.message}
              <span class="share-msg">„{share.message}"</span>
            {/if}
            <span class="share-url">coach.tt-playbook.de/s/{share.slug}</span>
            <span class="expiry" class:expired>
              {expired ? m.settings_shares_expired_label() : m.settings_shares_expires({ date: formatDate(share.expires_at) })}
            </span>
          </div>
          <div class="share-actions">
            <button
              type="button"
              class="btn-copy"
              onclick={() => copyLink(`https://coach.tt-playbook.de/s/${share.slug}`)}
              disabled={expired}
            >
              {m.share_dialog_copy_button()}
            </button>
            <button
              type="button"
              class="btn-revoke"
              onclick={() => revoke(share.slug)}
              disabled={revoking.has(share.slug)}
            >
              {revoking.has(share.slug) ? '…' : m.settings_shares_revoke()}
            </button>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .shares-page {
    padding: 40px;
    max-width: 760px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  h2 {
    font-size: 22px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;
  }

  .counter {
    font-size: 14px;
    color: var(--color-text-secondary);
    margin: 0;
  }

  .hint {
    font-size: 14px;
    color: var(--color-text-secondary);
    margin: 0;
  }

  .hint.error {
    color: var(--color-danger);
  }

  .empty {
    padding: 40px;
    text-align: center;
    background: var(--bg-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-panel);
    color: var(--color-text-secondary);
    font-size: 14px;
  }

  .share-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .share-item {
    background: var(--bg-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-panel);
    padding: 16px 18px;
    display: flex;
    gap: 12px;
    align-items: flex-start;
  }

  .share-item.expired {
    opacity: 0.55;
  }

  .share-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .ex-name {
    font-size: 15px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .share-msg {
    font-size: 13px;
    color: var(--color-text-secondary);
    font-style: italic;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .share-url {
    font-size: 12px;
    color: var(--color-accent);
    font-family: ui-monospace, monospace;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .expiry {
    font-size: 12px;
    color: var(--color-text-secondary);
  }

  .expiry.expired {
    color: var(--color-danger);
  }

  .share-actions {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex-shrink: 0;
  }

  .btn-copy,
  .btn-revoke {
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid var(--color-border);
    white-space: nowrap;
  }

  .btn-copy {
    background: var(--bg-elevated);
    color: var(--color-text-primary);
  }

  .btn-revoke {
    background: transparent;
    color: var(--color-danger);
    border-color: var(--color-danger);
  }

  .btn-copy:disabled,
  .btn-revoke:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: 767.98px) {
    .shares-page {
      padding: 20px 16px;
    }

    .share-item {
      flex-direction: column;
    }

    .share-actions {
      flex-direction: row;
      width: 100%;
    }

    .btn-copy,
    .btn-revoke {
      flex: 1;
      text-align: center;
    }
  }
</style>
