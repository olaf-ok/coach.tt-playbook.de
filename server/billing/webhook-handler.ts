import type Stripe from 'stripe';
import type { AuthDatabase } from '../auth/db';
import {
  findUserByStripeCustomerId,
  setStripeCustomerId,
  updateSubscriptionFields,
} from '../auth/users';

// Stripe webhook event dispatcher. Pure function — no network calls,
// no SDK calls, only reads/writes the given db. Testable with plain
// event fixtures.
//
// Unknown event types are silently ignored (route still returns 200).
// Unknown user lookups are also silently skipped — Stripe should not retry forever.
export async function handleStripeEvent(
  db: AuthDatabase,
  event: Stripe.Event,
): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed':
      handleCheckoutCompleted(db, event.data.object as Stripe.Checkout.Session);
      return;

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      handleSubscriptionUpsert(db, event.data.object as Stripe.Subscription);
      return;

    case 'customer.subscription.deleted':
      handleSubscriptionDeleted(db, event.data.object as Stripe.Subscription);
      return;

    case 'invoice.payment_failed':
      handleInvoicePaymentFailed(db, event.data.object as Stripe.Invoice);
      return;

    default:
      return;
  }
}

function userIdFromMetadata(
  metadata: Stripe.Metadata | null | undefined,
): string | null {
  if (!metadata) return null;
  const id = metadata['userId'];
  return typeof id === 'string' && id.length > 0 ? id : null;
}

function resolveUserId(
  db: AuthDatabase,
  metadata: Stripe.Metadata | null | undefined,
  customerId: string | null,
): string | null {
  const metaId = userIdFromMetadata(metadata);
  if (metaId) return metaId;
  if (customerId) {
    const user = findUserByStripeCustomerId(db, customerId);
    if (user) return user.id;
  }
  return null;
}

function handleCheckoutCompleted(
  db: AuthDatabase,
  session: Stripe.Checkout.Session,
): void {
  const customerId = typeof session.customer === 'string' ? session.customer : null;
  const subscriptionId =
    typeof session.subscription === 'string' ? session.subscription : null;
  const userId = resolveUserId(db, session.metadata, customerId);

  if (!userId || !customerId || !subscriptionId) return;

  // Store the customer id and subscription id; proUntil and final status will be
  // set by the companion customer.subscription.created event.
  setStripeCustomerId(db, userId, customerId);
  updateSubscriptionFields(db, userId, {
    subscriptionId,
    status: 'active',
    proUntil: null,
  });
}

function handleSubscriptionUpsert(
  db: AuthDatabase,
  sub: Stripe.Subscription,
): void {
  const customerId = typeof sub.customer === 'string' ? sub.customer : null;
  const userId = resolveUserId(db, sub.metadata, customerId);
  if (!userId) return;

  updateSubscriptionFields(db, userId, {
    subscriptionId: sub.id,
    status: sub.status,
    proUntil: sub.current_period_end * 1000,
  });
}

function handleSubscriptionDeleted(
  db: AuthDatabase,
  sub: Stripe.Subscription,
): void {
  const customerId = typeof sub.customer === 'string' ? sub.customer : null;
  const userId = resolveUserId(db, sub.metadata, customerId);
  if (!userId) return;

  // Keep proUntil untouched: the user already paid for the period
  // and remains Pro until it expires naturally.
  updateSubscriptionFields(db, userId, {
    subscriptionId: sub.id,
    status: 'canceled',
    proUntil: null,
  });
}

function handleInvoicePaymentFailed(
  db: AuthDatabase,
  invoice: Stripe.Invoice,
): void {
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : null;
  if (!customerId) return;
  const user = findUserByStripeCustomerId(db, customerId);
  if (!user || !user.stripeSubscriptionId) return;

  updateSubscriptionFields(db, user.id, {
    subscriptionId: user.stripeSubscriptionId,
    status: 'past_due',
    proUntil: null,
  });
}
