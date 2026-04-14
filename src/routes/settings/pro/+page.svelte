<script lang="ts">
  import { proStatus, FREE_EXERCISE_LIMIT } from '$lib/pro/status.svelte';
</script>

<section class="pro">
  <h2>Pro-Abo</h2>

  <div class="status-card" class:is-pro={proStatus.isPro}>
    <div class="status">
      <span class="badge">{proStatus.isPro ? 'PRO' : 'FREE'}</span>
      <div>
        <p class="label">Aktueller Plan</p>
        <p class="desc">
          {#if proStatus.isPro}
            Unbegrenzt Übungen und Playlists.
          {:else}
            Bis zu {FREE_EXERCISE_LIMIT} Übungen, 1 Playlist.
          {/if}
        </p>
      </div>
    </div>
  </div>

  <div class="features">
    <h3>Mit Pro freigeschaltet</h3>
    <ul>
      <li>Unbegrenzte Übungen und Playlists</li>
      <li>Eigene Schlagart-Tags erstellen</li>
      <li>Mehrere Geräte synchronisieren (bald)</li>
      <li>Frühe Features &amp; Trainer-Community</li>
    </ul>
  </div>

  <div class="cta-row">
    <p class="coming">Zahlung via Stripe — kommt, sobald wir live deployed haben.</p>
  </div>

  <details class="dev">
    <summary>Entwickler-Einstellung</summary>
    <p class="hint">
      Zum Testen kann der Pro-Status lokal umgeschaltet werden (wirkt sich nur auf dieses Gerät aus).
    </p>
    <button type="button" onclick={() => proStatus.toggle()}>
      {proStatus.isPro ? 'Pro deaktivieren' : 'Pro aktivieren (Dev)'}
    </button>
  </details>
</section>

<style>
  .pro {
    padding: 40px;
    max-width: 640px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  h2 {
    font-size: 22px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;
  }
  h3 {
    font-size: 15px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0 0 12px;
  }
  .status-card {
    background: var(--bg-surface);
    border-radius: var(--radius-panel);
    padding: 20px;
    border: 1px solid var(--color-border);
  }
  .status-card.is-pro {
    border-color: var(--color-accent);
  }
  .status {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .badge {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 2px;
    padding: 6px 12px;
    border-radius: 999px;
    background: var(--bg-elevated);
    color: var(--color-text-secondary);
  }
  .is-pro .badge {
    background: var(--color-accent);
    color: #fff;
  }
  .label {
    color: var(--color-text-secondary);
    font-size: 12px;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .desc {
    color: var(--color-text-primary);
    margin: 2px 0 0;
    font-size: 14px;
  }
  .features ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
    color: var(--color-text-primary);
    font-size: 14px;
  }
  .features li {
    padding-left: 24px;
    position: relative;
  }
  .features li::before {
    content: '✓';
    position: absolute;
    left: 0;
    color: var(--color-accent);
    font-weight: 700;
  }
  .coming {
    color: var(--color-text-secondary);
    font-size: 13px;
    margin: 0;
  }
  .dev {
    padding-top: 16px;
    border-top: 1px solid var(--color-border);
  }
  .dev summary {
    cursor: pointer;
    color: var(--color-text-secondary);
    font-size: 13px;
  }
  .dev .hint {
    color: var(--color-text-secondary);
    font-size: 13px;
    margin: 10px 0;
  }
  .dev button {
    padding: 10px 14px;
    border-radius: var(--radius-button);
    background: var(--bg-surface);
    color: var(--color-text-primary);
    font-size: 13px;
  }
</style>
