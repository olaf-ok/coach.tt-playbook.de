import type Stripe from 'stripe';

export type Plan = 'monthly' | 'yearly';
export type Currency = 'eur' | 'usd';

function envVar(plan: Plan, currency: Currency): string {
  return `STRIPE_PRICE_${plan.toUpperCase()}_${currency.toUpperCase()}`;
}

export function resolvePriceId(plan: Plan, currency: Currency): string {
  const name = envVar(plan, currency);
  const value = process.env[name];
  if (!value) throw new Error(`Env var ${name} is not set`);
  return value;
}

export interface CheckoutParamsInput {
  customerId: string;
  userId: string;
  priceId: string;
  appUrl: string;
}

export function buildCheckoutSessionParams(
  input: CheckoutParamsInput,
): Stripe.Checkout.SessionCreateParams {
  return {
    mode: 'subscription',
    customer: input.customerId,
    line_items: [{ price: input.priceId, quantity: 1 }],
    metadata: { userId: input.userId },
    subscription_data: { metadata: { userId: input.userId } },
    automatic_tax: { enabled: true },
    billing_address_collection: 'required',
    customer_update: { address: 'auto', name: 'auto' },
    allow_promotion_codes: false,
    success_url: `${input.appUrl}/settings/account?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${input.appUrl}/settings/account?checkout=cancel`,
  };
}
