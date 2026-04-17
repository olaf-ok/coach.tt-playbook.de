import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildCheckoutSessionParams, resolvePriceId } from './checkout';

describe('resolvePriceId', () => {
  beforeEach(() => {
    process.env.STRIPE_PRICE_MONTHLY_EUR = 'price_me';
    process.env.STRIPE_PRICE_MONTHLY_USD = 'price_mu';
    process.env.STRIPE_PRICE_YEARLY_EUR = 'price_ye';
    process.env.STRIPE_PRICE_YEARLY_USD = 'price_yu';
  });

  afterEach(() => {
    delete process.env.STRIPE_PRICE_MONTHLY_EUR;
    delete process.env.STRIPE_PRICE_MONTHLY_USD;
    delete process.env.STRIPE_PRICE_YEARLY_EUR;
    delete process.env.STRIPE_PRICE_YEARLY_USD;
  });

  it('returns the right env var per plan and currency', () => {
    expect(resolvePriceId('monthly', 'eur')).toBe('price_me');
    expect(resolvePriceId('monthly', 'usd')).toBe('price_mu');
    expect(resolvePriceId('yearly', 'eur')).toBe('price_ye');
    expect(resolvePriceId('yearly', 'usd')).toBe('price_yu');
  });

  it('throws when env var missing', () => {
    delete process.env.STRIPE_PRICE_MONTHLY_EUR;
    expect(() => resolvePriceId('monthly', 'eur')).toThrow(
      /STRIPE_PRICE_MONTHLY_EUR/,
    );
  });
});

describe('buildCheckoutSessionParams', () => {
  it('builds a subscription session with metadata and automatic tax', () => {
    const params = buildCheckoutSessionParams({
      customerId: 'cus_1',
      userId: 'u_1',
      priceId: 'price_xy',
      appUrl: 'https://example.test',
    });
    expect(params.mode).toBe('subscription');
    expect(params.customer).toBe('cus_1');
    expect(params.metadata).toEqual({ userId: 'u_1' });
    expect(params.subscription_data?.metadata).toEqual({ userId: 'u_1' });
    expect(params.line_items).toEqual([{ price: 'price_xy', quantity: 1 }]);
    expect(params.automatic_tax).toEqual({ enabled: true });
    expect(params.billing_address_collection).toBe('required');
    expect(params.success_url).toBe(
      'https://example.test/settings/account?checkout=success&session_id={CHECKOUT_SESSION_ID}',
    );
    expect(params.cancel_url).toBe(
      'https://example.test/settings/account?checkout=cancel',
    );
  });
});
