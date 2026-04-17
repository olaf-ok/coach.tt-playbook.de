import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDatabase } from '../../../../../server/auth/db';
import { checkAndConsume } from '../../../../../server/auth/ratelimit';
import { ensureStripeCustomer } from '../../../../../server/billing/customers';
import { getStripe } from '../../../../../server/billing/stripe';
import {
  buildCheckoutSessionParams,
  resolvePriceId,
  type Currency,
  type Plan,
} from '../../../../../server/billing/checkout';

const PLANS: Plan[] = ['monthly', 'yearly'];
const CURRENCIES: Currency[] = ['eur', 'usd'];

interface Body {
  plan?: string;
  currency?: string;
}

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) throw error(401, 'Nicht angemeldet');

  const db = getDatabase();
  if (!checkAndConsume(db, 'billingCheckout', `user:${locals.user.id}`)) {
    throw error(429, 'Zu viele Versuche');
  }

  let body: Body;
  try {
    body = await request.json();
  } catch {
    throw error(400, 'Ungültiger Request-Body');
  }

  const plan = body.plan;
  const currency = body.currency;
  if (!plan || !PLANS.includes(plan as Plan)) throw error(400, 'Ungültiger plan');
  if (!currency || !CURRENCIES.includes(currency as Currency)) {
    throw error(400, 'Ungültige currency');
  }

  const appUrl = process.env.APP_URL;
  if (!appUrl) throw error(500, 'APP_URL nicht konfiguriert');

  const customerId = await ensureStripeCustomer(db, locals.user.id);
  const priceId = resolvePriceId(plan as Plan, currency as Currency);

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create(
    buildCheckoutSessionParams({
      customerId,
      userId: locals.user.id,
      priceId,
      appUrl,
    }),
  );

  if (!session.url) throw error(500, 'Stripe lieferte keine Session-URL');
  return json({ url: session.url });
};
