import type { RequestHandler } from './$types';
import { getDatabase } from '../../../../../server/auth/db';
import { getStripe } from '../../../../../server/billing/stripe';
import { markEventProcessed } from '../../../../../server/billing/events-log';
import { handleStripeEvent } from '../../../../../server/billing/webhook-handler';

export const POST: RequestHandler = async ({ request }) => {
  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return new Response('missing signature', { status: 400 });
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return new Response('webhook secret not configured', { status: 500 });
  }

  const rawBody = Buffer.from(await request.arrayBuffer());
  const stripe = getStripe();

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    return new Response(`signature verification failed: ${msg}`, { status: 400 });
  }

  const db = getDatabase();
  const fresh = markEventProcessed(db, event.id, event.created * 1000);
  if (!fresh) {
    return new Response(JSON.stringify({ received: true, duplicate: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    await handleStripeEvent(db, event);
  } catch (err) {
    // Allow Stripe to retry: clear the idempotency log row so the next attempt
    // is processed fresh instead of being skipped as a duplicate.
    db.prepare(`DELETE FROM stripe_events WHERE event_id = ?`).run(event.id);
    const msg = err instanceof Error ? err.message : 'unknown';
    return new Response(`handler error: ${msg}`, { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};
