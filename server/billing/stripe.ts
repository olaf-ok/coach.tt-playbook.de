import Stripe from 'stripe';

let singleton: Stripe | null = null;

export function getStripe(): Stripe {
  if (singleton) return singleton;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  // No apiVersion pin in the SDK: it defaults to LatestApiVersion, which is
  // what we want for outbound calls. The Stripe Dashboard webhook endpoint
  // must be configured for API version 2024-11-20.acacia so the inbound
  // event payloads still expose current_period_end directly on Subscription
  // (later versions moved that field onto SubscriptionItem).
  singleton = new Stripe(key, { typescript: true });
  return singleton;
}

export function resetStripeForTests(): void {
  singleton = null;
}
