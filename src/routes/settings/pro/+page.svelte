<script lang="ts">
  import { auth } from '$lib/auth/client.svelte';
  import { billing } from '$lib/billing/client.svelte';
  import { PRICE_DISPLAY, type Plan } from '$lib/billing/prices';
  import { FREE_EXERCISE_LIMIT } from '$lib/pro/status.svelte';
  import { m } from '$lib/paraglide/messages';

  let checkoutBusy = $state(false);
  let portalBusy = $state(false);
  let error = $state<string | null>(null);

  async function subscribe(plan: Plan) {
    checkoutBusy = true;
    error = null;
    try {
      await billing.startCheckout(plan);
    } catch (e) {
      error = e instanceof Error ? e.message : m.billing_checkout_failed_toast();
      checkoutBusy = false;
    }
  }

  async function openPortal() {
    portalBusy = true;
    error = null;
    try {
      await billing.openPortal();
    } catch (e) {
      error = e instanceof Error ? e.message : m.billing_portal_failed_toast();
      portalBusy = false;
    }
  }

</script>

<section class="pro">
  <h2>{m.settings_pro_title()}</h2>

  <div class="status-card" class:is-pro={auth.isPro}>
    <div class="status">
      <span class="badge">{auth.isPro ? m.settings_pro_badge_pro() : m.settings_pro_badge_free()}</span>
      <div>
        <p class="label">{m.settings_pro_current_plan()}</p>
        <p class="desc">
          {#if auth.isPro}
            {m.settings_pro_pro_desc()}
          {:else}
            {m.settings_pro_free_desc({ limit: FREE_EXERCISE_LIMIT })}
          {/if}
        </p>
      </div>
    </div>
  </div>

  <div class="features">
    <h3>{m.settings_pro_features_title()}</h3>
    <ul>
      <li>{m.settings_pro_feature_unlimited()}</li>
      <li>{m.settings_pro_feature_custom_tags()}</li>
      <li>{m.settings_pro_feature_multidevice()}</li>
    </ul>
  </div>

  {#if error}
    <div class="error-banner" role="alert">{error}</div>
  {/if}

  {#if auth.isPro}
    <div class="cta-row">
      <button
        type="button"
        class="btn-secondary"
        onclick={openPortal}
        disabled={portalBusy}
      >
        {m.billing_portal_button()}
      </button>
    </div>
  {:else if !auth.user}
    <div class="signin-hint">
      <p>{m.settings_pro_signin_hint()}</p>
      <a href="/settings/account" class="btn-primary">{m.account_tab_login()}</a>
    </div>
  {:else}
    <div class="plans">
      <button
        type="button"
        class="plan"
        disabled={checkoutBusy}
        onclick={() => subscribe('monthly')}
      >
        <span class="plan-name">{m.paywall_plan_monthly()}</span>
        <span class="price">{PRICE_DISPLAY.monthly[billing.currency]}</span>
        <span class="period">{m.paywall_plan_monthly_period()}</span>
        <span class="plan-cta">{m.paywall_plan_monthly_select()}</span>
      </button>

      <button
        type="button"
        class="plan popular"
        disabled={checkoutBusy}
        onclick={() => subscribe('yearly')}
      >
        <span class="popular-badge">{m.paywall_popular_badge()}</span>
        <span class="plan-name">{m.paywall_plan_yearly()}</span>
        <span class="price">{PRICE_DISPLAY.yearly[billing.currency]}</span>
        <span class="period">{m.paywall_plan_yearly_period()}</span>
        <span class="plan-cta">{m.paywall_plan_yearly_select()}</span>
      </button>
    </div>

  {/if}
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
  .plans {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .plan {
    position: relative;
    background: var(--bg-surface);
    border: 1px solid var(--color-border);
    border-radius: 14px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
    color: var(--color-text-primary);
    cursor: pointer;
    transition: transform 0.2s, border-color 0.2s;
    text-align: left;
  }
  .plan:hover:not([disabled]) {
    transform: translateY(-2px);
    border-color: var(--color-accent);
  }
  .plan[disabled] {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .plan.popular {
    border-color: var(--color-accent);
  }
  .popular-badge {
    position: absolute;
    top: -10px;
    right: 14px;
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
  .plan-cta {
    margin-top: 10px;
    font-size: 14px;
    font-weight: 600;
    color: var(--color-accent);
  }
  .cta-row {
    display: flex;
    justify-content: flex-start;
  }
  .btn-secondary {
    padding: 12px 20px;
    background: var(--bg-elevated);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-button);
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
  }
  .btn-secondary:hover:not([disabled]) {
    background: var(--color-accent);
    color: #fff;
    border-color: var(--color-accent);
  }
  .btn-secondary[disabled] {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .signin-hint {
    padding: 20px;
    background: var(--bg-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-panel);
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  .signin-hint p {
    margin: 0;
    color: var(--color-text-primary);
    font-size: 14px;
  }
  .btn-primary {
    display: inline-block;
    padding: 10px 18px;
    background: var(--color-accent);
    color: #fff;
    border-radius: var(--radius-button);
    font-size: 14px;
    font-weight: 600;
    text-decoration: none;
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
