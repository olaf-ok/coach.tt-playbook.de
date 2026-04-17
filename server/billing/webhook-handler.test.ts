import { describe, it, expect } from 'vitest';
import { openDatabase } from '../auth/db';
import { createUser, findUserById, setStripeCustomerId } from '../auth/users';
import { handleStripeEvent } from './webhook-handler';
import type Stripe from 'stripe';

async function seedUser() {
  const db = openDatabase(':memory:');
  const user = await createUser(db, 'a@b.c', 'hash');
  return { db, user };
}

function evt<T>(type: string, object: T, id = 'evt_1'): Stripe.Event {
  return {
    id,
    type,
    api_version: '2024-11-20.acacia',
    created: Math.floor(Date.now() / 1000),
    data: { object: object as never },
    livemode: false,
    object: 'event',
    pending_webhooks: 0,
    request: { id: null, idempotency_key: null },
  } as Stripe.Event;
}

describe('handleStripeEvent', () => {
  it('checkout.session.completed links customer+subscription', async () => {
    const { db, user } = await seedUser();
    const session = {
      id: 'cs_1',
      object: 'checkout.session',
      metadata: { userId: user.id },
      customer: 'cus_1',
      subscription: 'sub_1',
    };
    await handleStripeEvent(db, evt('checkout.session.completed', session));
    const reloaded = findUserById(db, user.id);
    expect(reloaded?.stripeCustomerId).toBe('cus_1');
    expect(reloaded?.stripeSubscriptionId).toBe('sub_1');
    db.close();
  });

  it('customer.subscription.created sets proUntil and status', async () => {
    const { db, user } = await seedUser();
    setStripeCustomerId(db, user.id, 'cus_1');
    const sub = {
      id: 'sub_1',
      object: 'subscription',
      customer: 'cus_1',
      status: 'active',
      current_period_end: 1_700_000_000,
      metadata: { userId: user.id },
    };
    await handleStripeEvent(db, evt('customer.subscription.created', sub));
    const reloaded = findUserById(db, user.id);
    expect(reloaded?.stripeSubscriptionStatus).toBe('active');
    expect(reloaded?.proUntil).toBe(1_700_000_000 * 1000);
    db.close();
  });

  it('customer.subscription.updated renewal moves proUntil forward', async () => {
    const { db, user } = await seedUser();
    setStripeCustomerId(db, user.id, 'cus_1');
    const original = {
      id: 'sub_1',
      object: 'subscription',
      customer: 'cus_1',
      status: 'active',
      current_period_end: 1_700_000_000,
      metadata: { userId: user.id },
    };
    await handleStripeEvent(db, evt('customer.subscription.created', original));
    const renewed = { ...original, current_period_end: 1_710_000_000 };
    await handleStripeEvent(db, evt('customer.subscription.updated', renewed, 'evt_2'));
    const reloaded = findUserById(db, user.id);
    expect(reloaded?.proUntil).toBe(1_710_000_000 * 1000);
    db.close();
  });

  it('customer.subscription.deleted sets canceled but keeps proUntil', async () => {
    const { db, user } = await seedUser();
    setStripeCustomerId(db, user.id, 'cus_1');
    const sub = {
      id: 'sub_1',
      object: 'subscription',
      customer: 'cus_1',
      status: 'active',
      current_period_end: 1_700_000_000,
      metadata: { userId: user.id },
    };
    await handleStripeEvent(db, evt('customer.subscription.created', sub));
    const deleted = { ...sub, status: 'canceled' };
    await handleStripeEvent(db, evt('customer.subscription.deleted', deleted, 'evt_2'));
    const reloaded = findUserById(db, user.id);
    expect(reloaded?.stripeSubscriptionStatus).toBe('canceled');
    expect(reloaded?.proUntil).toBe(1_700_000_000 * 1000);
    db.close();
  });

  it('invoice.payment_failed marks past_due without changing proUntil', async () => {
    const { db, user } = await seedUser();
    setStripeCustomerId(db, user.id, 'cus_1');
    const subEvt = {
      id: 'sub_1',
      object: 'subscription',
      customer: 'cus_1',
      status: 'active',
      current_period_end: 1_700_000_000,
      metadata: { userId: user.id },
    };
    await handleStripeEvent(db, evt('customer.subscription.created', subEvt));
    const invoice = {
      id: 'in_1',
      object: 'invoice',
      customer: 'cus_1',
      subscription: 'sub_1',
    };
    await handleStripeEvent(db, evt('invoice.payment_failed', invoice, 'evt_2'));
    const reloaded = findUserById(db, user.id);
    expect(reloaded?.stripeSubscriptionStatus).toBe('past_due');
    expect(reloaded?.proUntil).toBe(1_700_000_000 * 1000);
    db.close();
  });

  it('unknown event types are ignored silently', async () => {
    const { db, user } = await seedUser();
    await handleStripeEvent(db, evt('charge.refunded', { id: 'ch_1' }));
    const reloaded = findUserById(db, user.id);
    expect(reloaded?.stripeSubscriptionStatus).toBeNull();
    db.close();
  });

  it('handles event when user lookup fails (no throw)', async () => {
    const { db } = await seedUser();
    const sub = {
      id: 'sub_x',
      object: 'subscription',
      customer: 'cus_unknown',
      status: 'active',
      current_period_end: 1_700_000_000,
      metadata: {},
    };
    await expect(
      handleStripeEvent(db, evt('customer.subscription.updated', sub)),
    ).resolves.not.toThrow();
    db.close();
  });
});
