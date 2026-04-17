import Stripe from 'stripe';

let singleton: Stripe | null = null;

export function getStripe(): Stripe {
  if (singleton) return singleton;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  singleton = new Stripe(key, {
    // Locked API version: must match the version configured for the webhook endpoint
    // in the Stripe Dashboard. We pin acacia because it still exposes
    // current_period_end directly on Subscription; later versions moved it onto
    // SubscriptionItem and would require restructuring the webhook handler.
    apiVersion: '2024-11-20.acacia',
    typescript: true,
  });
  return singleton;
}

export function resetStripeForTests(): void {
  singleton = null;
}
