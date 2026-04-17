import type { AuthDatabase } from '../auth/db';
import { findUserById, setStripeCustomerId } from '../auth/users';
import { getStripe } from './stripe';

// Returns the Stripe customer id for this user, creating a customer
// on demand (and persisting the id) if none exists yet.
export async function ensureStripeCustomer(
  db: AuthDatabase,
  userId: string,
): Promise<string> {
  const user = findUserById(db, userId);
  if (!user) throw new Error(`User ${userId} not found`);
  if (user.stripeCustomerId) return user.stripeCustomerId;

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email: user.email,
    metadata: { userId: user.id },
  });
  setStripeCustomerId(db, user.id, customer.id);
  return customer.id;
}
