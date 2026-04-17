import { detectCurrency, type Currency } from './currency-detection';
import type { Plan } from './prices';

const STORAGE_KEY = 'tt-billing-currency';

function loadStoredCurrency(): Currency | null {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === 'eur' || raw === 'usd') return raw;
  return null;
}

class BillingState {
  currency = $state<Currency>('usd');

  init(): void {
    const stored = loadStoredCurrency();
    this.currency = stored ?? detectCurrency();
  }

  setCurrency(c: Currency): void {
    this.currency = c;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, c);
    }
  }

  async startCheckout(plan: Plan): Promise<void> {
    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ plan, currency: this.currency }),
    });
    if (!res.ok) {
      throw new Error(`Checkout failed (${res.status})`);
    }
    const body = await res.json();
    window.location.href = body.url;
  }

  async openPortal(): Promise<void> {
    const res = await fetch('/api/billing/portal', { method: 'POST' });
    if (!res.ok) {
      throw new Error(`Portal failed (${res.status})`);
    }
    const body = await res.json();
    window.location.href = body.url;
  }
}

export const billing = new BillingState();
