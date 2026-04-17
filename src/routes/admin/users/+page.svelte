<script lang="ts">
  import { onMount } from 'svelte';

  interface AdminUser {
    id: string;
    email: string;
    emailVerified: boolean;
    proUntil: number | null;
    createdAt: number;
    stripeSubscriptionStatus: string | null;
  }

  let users = $state<AdminUser[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let busyId = $state<string | null>(null);

  async function load() {
    loading = true;
    error = null;
    try {
      const res = await fetch('/api/admin/users');
      if (res.status === 404) {
        error = 'Kein Zugriff.';
        users = [];
        return;
      }
      if (!res.ok) {
        error = `Fehler: ${res.status}`;
        return;
      }
      const body = await res.json();
      users = body.users;
    } catch (e) {
      error = 'Verbindung fehlgeschlagen.';
    } finally {
      loading = false;
    }
  }

  onMount(load);

  async function patch(id: string, payload: Record<string, unknown>) {
    busyId = id;
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        error = `Update fehlgeschlagen (${res.status})`;
        return;
      }
      await load();
    } finally {
      busyId = null;
    }
  }

  async function remove(id: string, email: string) {
    if (!confirm(`Wirklich "${email}" löschen? Sessions werden mit gelöscht.`)) return;
    busyId = id;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        error = `Löschen fehlgeschlagen (${res.status})`;
        return;
      }
      await load();
    } finally {
      busyId = null;
    }
  }

  function fmtDate(ts: number): string {
    return new Date(ts).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function proLabel(proUntil: number | null): string {
    if (!proUntil) return 'Free';
    if (proUntil <= Date.now()) return `Pro abgelaufen (${fmtDate(proUntil)})`;
    return `Pro bis ${fmtDate(proUntil)}`;
  }

  function proDays(days: number): number {
    return Date.now() + days * 24 * 60 * 60 * 1000;
  }
</script>

<section class="admin">
  <header>
    <h1>Nutzerverwaltung</h1>
    <button type="button" class="btn-ghost" onclick={load} disabled={loading}>↻ Neu laden</button>
  </header>

  {#if loading}
    <p class="muted">Lade…</p>
  {:else if error}
    <p class="error">{error}</p>
  {:else if users.length === 0}
    <p class="muted">Noch keine Nutzer.</p>
  {:else}
    <p class="muted">{users.length} {users.length === 1 ? 'Nutzer' : 'Nutzer'}</p>
    <div class="grid">
      {#each users as u (u.id)}
        <article class="row" class:busy={busyId === u.id}>
          <div class="email">{u.email}</div>
          <div class="meta">
            <span class="badge" class:ok={u.emailVerified} class:warn={!u.emailVerified}>
              {u.emailVerified ? 'E-Mail bestätigt' : 'E-Mail unbestätigt'}
            </span>
            <span
              class="badge"
              class:ok={u.proUntil && u.proUntil > Date.now()}
              class:free={!u.proUntil || u.proUntil <= Date.now()}
            >
              {proLabel(u.proUntil)}
            </span>
            {#if u.stripeSubscriptionStatus}
              <span class="badge subscription subscription-{u.stripeSubscriptionStatus}">
                {u.stripeSubscriptionStatus}
              </span>
            {/if}
            <span class="muted">Angelegt {fmtDate(u.createdAt)}</span>
          </div>
          <div class="actions">
            {#if !u.emailVerified}
              <button
                type="button"
                onclick={() => patch(u.id, { emailVerified: true })}
                disabled={busyId !== null}
              >
                Verifizieren
              </button>
            {/if}
            <button
              type="button"
              onclick={() => patch(u.id, { proUntil: proDays(30) })}
              disabled={busyId !== null}
            >
              Pro 30 Tage
            </button>
            <button
              type="button"
              onclick={() => patch(u.id, { proUntil: proDays(365) })}
              disabled={busyId !== null}
            >
              Pro 1 Jahr
            </button>
            {#if u.proUntil}
              <button
                type="button"
                onclick={() => patch(u.id, { proUntil: null })}
                disabled={busyId !== null}
              >
                Pro aus
              </button>
            {/if}
            <button
              type="button"
              class="danger"
              onclick={() => remove(u.id, u.email)}
              disabled={busyId !== null}
            >
              Löschen
            </button>
          </div>
        </article>
      {/each}
    </div>
  {/if}
</section>

<style>
  .admin {
    padding: 32px;
    max-width: 960px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
  }
  h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    color: var(--color-text-primary);
  }
  .btn-ghost {
    padding: 8px 14px;
    background: var(--bg-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-button);
    color: var(--color-text-primary);
    font-size: 13px;
    cursor: pointer;
  }
  .btn-ghost:hover:not([disabled]) {
    background: var(--bg-elevated);
  }
  .muted {
    color: var(--color-text-secondary);
    font-size: 13px;
    margin: 0;
  }
  .error {
    color: var(--color-danger);
    font-size: 14px;
    margin: 0;
  }
  .grid {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .row {
    padding: 16px 18px;
    background: var(--bg-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-panel);
    display: flex;
    flex-direction: column;
    gap: 10px;
    transition: opacity 0.2s;
  }
  .row.busy {
    opacity: 0.6;
  }
  .email {
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-primary);
    word-break: break-all;
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
    font-size: 12px;
  }
  .badge {
    padding: 3px 10px;
    border-radius: 999px;
    background: var(--bg-elevated);
    color: var(--color-text-secondary);
    letter-spacing: 0.5px;
    font-weight: 500;
  }
  .badge.ok {
    background: var(--color-success);
    color: #fff;
  }
  .badge.warn {
    background: var(--color-danger);
    color: #fff;
  }
  .badge.free {
    background: var(--bg-elevated);
    color: var(--color-text-secondary);
  }
  .badge.subscription {
    text-transform: uppercase;
    letter-spacing: 0.6px;
    font-weight: 600;
  }
  .badge.subscription-active {
    background: var(--color-success);
    color: #fff;
  }
  .badge.subscription-past_due {
    background: var(--color-danger);
    color: #fff;
  }
  .badge.subscription-canceled {
    background: var(--bg-elevated);
    color: var(--color-text-secondary);
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding-top: 6px;
    border-top: 1px solid var(--color-border);
  }
  .actions button {
    padding: 7px 12px;
    background: var(--bg-elevated);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    color: var(--color-text-primary);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
  }
  .actions button:hover:not([disabled]) {
    background: var(--color-accent);
    color: #fff;
    border-color: var(--color-accent);
  }
  .actions button.danger:hover:not([disabled]) {
    background: var(--color-danger);
    border-color: var(--color-danger);
  }
  .actions button[disabled] {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
