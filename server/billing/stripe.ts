import Stripe from 'stripe';

let singleton: Stripe | null = null;

export function getStripe(): Stripe {
  if (singleton) return singleton;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  singleton = new Stripe(key, {
    // Locked API version: keeps the webhook event shape stable across SDK upgrades.
    apiVersion: '2026-03-25.dahlia',
    typescript: true,
  });
  return singleton;
}

export function resetStripeForTests(): void {
  singleton = null;
}
