<script lang="ts">
  import { FREE_EXERCISE_LIMIT } from '$lib/pro/status.svelte';

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();

  function handleBackdrop(e: MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }
</script>

<div class="backdrop" onclick={handleBackdrop} role="presentation">
  <div class="dialog" role="dialog" aria-modal="true" aria-label="Upgrade auf Pro">
    <header class="head">
      <span class="badge">PRO</span>
      <h3>Unbegrenzt Übungen mit TT Playbook Pro</h3>
      <p class="sub">
        Du hast deine {FREE_EXERCISE_LIMIT} Gratis-Übungen erstellt. Schalte Pro frei und speichere
        unbegrenzt.
      </p>
    </header>

    <ul class="features">
      <li>Unbegrenzte Übungen und Playlists</li>
      <li>Eigene Schlagart-Tags erstellen</li>
      <li>Mehrere Geräte synchronisieren <span class="soon">bald</span></li>
      <li>Frühe Features &amp; Trainer-Community</li>
    </ul>

    <div class="plans">
      <div class="plan">
        <span class="plan-name">Monatlich</span>
        <span class="price">9,90&nbsp;€</span>
        <span class="period">pro Monat, jederzeit kündbar</span>
        <button type="button" class="plan-btn secondary" disabled>Monatlich wählen</button>
      </div>

      <div class="plan popular">
        <span class="popular-badge">Beliebt</span>
        <span class="plan-name">Jährlich</span>
        <span class="price">99&nbsp;€</span>
        <span class="period">= 8,25&nbsp;€/Monat · 17&nbsp;% sparen</span>
        <button type="button" class="plan-btn primary" disabled>Jährlich wählen</button>
      </div>
    </div>

    <p class="note">
      Zahlung via Stripe — kommt bald. Keine In-App-Purchases, kein Store-Abzug.
    </p>

    <footer class="foot">
      <button type="button" class="text-btn" onclick={onClose}>Vielleicht später</button>
    </footer>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(8px);
    display: grid;
    place-items: center;
    z-index: 100;
  }
  .dialog {
    width: min(680px, 94vw);
    max-height: 90vh;
    overflow-y: auto;
    background: var(--bg-elevated);
    border-radius: 20px;
    padding: 28px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
  }
  .head {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
  .badge {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 2px;
    padding: 4px 10px;
    border-radius: 999px;
    background: var(--color-accent);
    color: #fff;
  }
  h3 {
    font-size: 22px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;
  }
  .sub {
    color: var(--color-text-secondary);
    margin: 0;
    font-size: 14px;
  }
  .features {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 0;
    padding: 0;
    color: var(--color-text-primary);
    font-size: 14px;
  }
  .features li {
    padding-left: 28px;
    position: relative;
  }
  .features li::before {
    content: '✓';
    position: absolute;
    left: 0;
    color: var(--color-accent);
    font-weight: 700;
  }
  .soon {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--bg-surface);
    color: var(--color-text-secondary);
    margin-left: 6px;
  }
  .plans {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .plan {
    background: var(--bg-surface);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    position: relative;
  }
  .plan.popular {
    border-color: var(--color-accent);
  }
  .popular-badge {
    position: absolute;
    top: -10px;
    right: 12px;
    background: var(--color-accent);
    color: #fff;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 10px;
    border-radius: 999px;
  }
  .plan-name {
    font-size: 13px;
    color: var(--color-text-secondary);
  }
  .price {
    font-size: 28px;
    font-weight: 700;
    color: var(--color-text-primary);
  }
  .period {
    font-size: 12px;
    color: var(--color-text-secondary);
  }
  .plan-btn {
    margin-top: 8px;
    padding: 10px 12px;
    border-radius: 10px;
    font-weight: 600;
    font-size: 14px;
  }
  .primary {
    background: var(--color-accent);
    color: #fff;
  }
  .secondary {
    background: var(--bg-elevated);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border);
  }
  .plan-btn[disabled] {
    opacity: 0.55;
    cursor: not-allowed;
  }
  .note {
    font-size: 12px;
    color: var(--color-text-secondary);
    margin: 0;
    text-align: center;
  }
  .foot {
    display: flex;
    justify-content: flex-start;
  }
  .text-btn {
    color: var(--color-text-secondary);
    font-size: 13px;
    padding: 6px 10px;
  }
  .text-btn:hover {
    color: var(--color-text-primary);
  }
</style>
