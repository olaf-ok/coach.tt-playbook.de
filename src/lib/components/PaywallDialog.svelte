<script lang="ts">
  import { FREE_EXERCISE_LIMIT } from '$lib/pro/status.svelte';
  import { m } from '$lib/paraglide/messages';
  import { billing } from '$lib/billing/client.svelte';
  import { PRICE_DISPLAY, type Plan } from '$lib/billing/prices';

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();

  let loading = $state(false);
  let error = $state<string | null>(null);

  function handleBackdrop(e: MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  async function subscribe(plan: Plan) {
    loading = true;
    error = null;
    try {
      await billing.startCheckout(plan);
      // startCheckout redirects to Stripe; reaching here means it failed.
    } catch (e) {
      error = e instanceof Error ? e.message : m.billing_checkout_failed_toast();
      loading = false;
    }
  }

</script>

<div class="backdrop" onclick={handleBackdrop} role="presentation">
  <div class="dialog" role="dialog" aria-modal="true" aria-label={m.paywall_aria_label()}>
    <header class="head">
      <span class="badge">{m.paywall_badge()}</span>
      <h3>{m.paywall_title()}</h3>
      <p class="sub">{m.paywall_sub({ limit: FREE_EXERCISE_LIMIT })}</p>
    </header>

    <ul class="features">
      <li>{m.paywall_feature_unlimited()}</li>
      <li>{m.paywall_feature_multidevice()} <span class="soon">{m.common_soon()}</span></li>
    </ul>

    {#if error}
      <div class="error-banner" role="alert">{error}</div>
    {/if}

    <div class="plans">
      <div class="plan">
        <span class="plan-name">{m.paywall_plan_monthly()}</span>
        <span class="price">{PRICE_DISPLAY.monthly[billing.currency]}</span>
        <span class="period">{m.paywall_plan_monthly_period()}</span>
        <button
          type="button"
          class="plan-btn secondary"
          disabled={loading}
          onclick={() => subscribe('monthly')}
        >
          {m.paywall_plan_monthly_select()}
        </button>
      </div>

      <div class="plan popular">
        <span class="popular-badge">{m.paywall_popular_badge()}</span>
        <span class="plan-name">{m.paywall_plan_yearly()}</span>
        <span class="price">{PRICE_DISPLAY.yearly[billing.currency]}</span>
        <span class="period">{m.paywall_plan_yearly_period()}</span>
        <button
          type="button"
          class="plan-btn primary"
          disabled={loading}
          onclick={() => subscribe('yearly')}
        >
          {m.paywall_plan_yearly_select()}
        </button>
      </div>
    </div>

    <p class="note">{m.paywall_note()}</p>

    <p class="legal-links">
      <a href="/legal/terms" target="_blank" rel="noopener">{m.legal_terms_link()}</a>
      <span aria-hidden="true"> · </span>
      <a href="/legal/privacy" target="_blank" rel="noopener">{m.legal_privacy_link()}</a>
    </p>

    <footer class="foot">
      <button type="button" class="text-btn" onclick={onClose}>{m.paywall_later()}</button>
      <a
        href="/settings/account"
        class="text-btn account-link"
        onclick={onClose}
      >
        {m.paywall_existing_account()}
      </a>
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
  .legal-links {
    margin: 0;
    text-align: center;
    font-size: 12px;
    color: var(--color-text-secondary);
  }
  .legal-links a {
    color: var(--color-text-secondary);
    text-decoration: underline;
  }
  .legal-links a:hover {
    color: var(--color-text-primary);
  }
  .foot {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .account-link {
    text-decoration: none;
  }
  .text-btn {
    color: var(--color-text-secondary);
    font-size: 13px;
    padding: 6px 10px;
  }
  .text-btn:hover {
    color: var(--color-text-primary);
  }
  .error-banner {
    background: color-mix(in oklab, var(--color-danger) 18%, transparent);
    color: var(--color-danger);
    border: 1px solid var(--color-danger);
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 13px;
  }
</style>
