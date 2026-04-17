# Stripe Billing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stripe-Abonnements live schalten — Checkout für Neu-Abos, Webhook zum Aktualisieren von `users.proUntil`, Customer Portal für Kündigung/Zahlungsmittel/Rechnungen, Paywall-Dialog verdrahtet mit EUR/USD via Timezone-Detection.

**Architecture:** Neuer Domain-Ordner `server/billing/` (analog zu `server/auth/`). Reine Webhook-Handler-Logik ohne Stripe-SDK-Calls (nur DB-Writes) → leicht testbar. Frontend bekommt `src/lib/billing/` mit Currency-Detection (pure), Price-Display-Konstanten und Reactive-Billing-Client (analog zu `auth/client.svelte.ts`).

**Tech Stack:** `stripe` Node-SDK, node:sqlite (bereits im Einsatz), SvelteKit API-Routes, Svelte 5 Runes.

**Prerequisite:** Stripe-Dashboard muss vor Task 15 manuell konfiguriert sein (Produkt + 4 Prices + Stripe Tax + Customer Portal + Webhook-Endpoint). Genaue Schritte im Spec (`docs/superpowers/specs/2026-04-17-stripe-billing-design.md`, Section „Stripe-Dashboard Setup").

---

## File Structure

**Neu (Server):**
- `server/billing/stripe.ts` — Singleton für Stripe-SDK-Instance
- `server/billing/events-log.ts` — Idempotenz-Helper für `stripe_events`-Tabelle
- `server/billing/customers.ts` — User ↔ Stripe-Customer-Mapping-Helpers
- `server/billing/checkout.ts` — Checkout-Session-Config-Builder (pure, testbar)
- `server/billing/webhook-handler.ts` — Event-Dispatch-Logik (pure, testbar ohne Stripe-SDK)
- `server/billing/portal.ts` — Portal-Session-URL-Erzeugung
- `server/billing/*.test.ts` — colocated Unit-Tests

**Neu (API-Routes):**
- `src/routes/api/billing/checkout/+server.ts`
- `src/routes/api/billing/webhook/+server.ts`
- `src/routes/api/billing/portal/+server.ts`

**Neu (Frontend):**
- `src/lib/billing/currency-detection.ts` + `.test.ts` (pure)
- `src/lib/billing/prices.ts` (Anzeige-Konstanten)
- `src/lib/billing/client.svelte.ts` (Reactive-Client)

**Modifiziert:**
- `server/auth/schema.ts` — neuer Schema-Export `SCHEMA_V2`
- `server/auth/db.ts` — Migration auf v2
- `server/auth/users.ts` — neue Helpers: `setStripeCustomerId`, `updateSubscriptionFields`, `findUserByStripeCustomerId`, `listUsers` um `stripeSubscriptionStatus` ergänzt
- `src/lib/paywall/PaywallDialog.svelte` — Plan-Buttons ruft `billing.startCheckout`, Currency-Switch
- `src/routes/settings/account/+page.svelte` — „Abo verwalten"-Button, Query-Param-Handling
- `src/routes/admin/users/+page.svelte` — Subscription-Status-Chip
- `src/routes/api/admin/users/+server.ts` — neue Felder in Response
- `messages/{de,en,es}.json` — neue Billing-Keys
- `.env.example` — neue Stripe-ENV-Vars

---

## Task 1: Dependency + Environment-Skelett

**Files:**
- Modify: `~/Developer/tt-playbook-trainer/package.json`
- Modify: `~/Developer/tt-playbook-trainer/.env.example`

- [ ] **Step 1: Stripe-SDK installieren**

Run:
```bash
cd ~/Developer/tt-playbook-trainer && npm install stripe
```
Expected: `stripe` (aktuelle stabile Version) in `dependencies`. Keine native-gyp-Warnungen.

- [ ] **Step 2: Verify es gibt keinen Build-Konflikt**

Run:
```bash
cd ~/Developer/tt-playbook-trainer && npx svelte-kit sync && npx svelte-check
```
Expected: 0 Errors / 0 Warnings.

- [ ] **Step 3: `.env.example` erweitern**

Die Datei aktuell enthält Auth-Variablen. Neuen Block unten anhängen:

```bash
# Stripe billing
STRIPE_SECRET_KEY=sk_test_REPLACE
STRIPE_WEBHOOK_SECRET=whsec_REPLACE
STRIPE_PRICE_MONTHLY_EUR=price_REPLACE
STRIPE_PRICE_MONTHLY_USD=price_REPLACE
STRIPE_PRICE_YEARLY_EUR=price_REPLACE
STRIPE_PRICE_YEARLY_USD=price_REPLACE
```

Die bestehende `APP_URL` wird für Return-URLs weiterverwendet, kein neuer Var.

- [ ] **Step 4: Commit**

```bash
cd ~/Developer/tt-playbook-trainer && git add package.json package-lock.json .env.example && git commit -m "deps(billing): add stripe sdk and env var skeleton"
```

---

## Task 2: DB-Migration v2 (Stripe-Spalten + stripe_events)

**Files:**
- Modify: `server/auth/schema.ts`
- Modify: `server/auth/schema.sql` (Referenz)
- Modify: `server/auth/db.ts`
- Test: `server/auth/db.test.ts` (erweitern)

- [ ] **Step 1: Failing Test schreiben**

`server/auth/db.test.ts` erweitern — nach den bestehenden Tests einen neuen `describe`-Block hinzufügen:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { openDatabase } from './db';

describe('db migration v2 (stripe fields)', () => {
  it('adds stripe columns to users table', () => {
    const db = openDatabase(':memory:');
    const cols = db
      .prepare(`PRAGMA table_info(users)`)
      .all() as Array<{ name: string }>;
    const names = cols.map((c) => c.name);
    expect(names).toContain('stripe_customer_id');
    expect(names).toContain('stripe_subscription_id');
    expect(names).toContain('stripe_subscription_status');
  });

  it('creates stripe_events table for idempotency', () => {
    const db = openDatabase(':memory:');
    const row = db
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='stripe_events'`)
      .get();
    expect(row).toBeDefined();
  });

  it('creates unique index on stripe_customer_id', () => {
    const db = openDatabase(':memory:');
    const row = db
      .prepare(
        `SELECT name FROM sqlite_master WHERE type='index' AND name='idx_users_stripe_customer_id'`,
      )
      .get();
    expect(row).toBeDefined();
  });

  it('user_version is 2 after migration', () => {
    const db = openDatabase(':memory:');
    const row = db.prepare('PRAGMA user_version').get() as { user_version: number };
    expect(row.user_version).toBe(2);
  });
});
```

- [ ] **Step 2: Tests laufen, verify fail**

Run:
```bash
cd ~/Developer/tt-playbook-trainer && npx vitest run server/auth/db.test.ts
```
Expected: 4 neue Tests fail mit „does not contain stripe_customer_id" / `user_version` ist 1 / `stripe_events` existiert nicht.

- [ ] **Step 3: Schema-v2 ergänzen**

`server/auth/schema.ts` — neuen Export unter SCHEMA_V1 hinzufügen:

```typescript
export const SCHEMA_V2 = `
ALTER TABLE users ADD COLUMN stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN stripe_subscription_id TEXT;
ALTER TABLE users ADD COLUMN stripe_subscription_status TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_stripe_customer_id
  ON users(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS stripe_events (
  event_id    TEXT PRIMARY KEY,
  created_at  INTEGER NOT NULL
);
`;
```

- [ ] **Step 4: `schema.sql` analog erweitern (Referenz)**

Am Ende von `server/auth/schema.sql` anfügen (genau der gleiche SQL-Text wie `SCHEMA_V2` im Step 3).

- [ ] **Step 5: Migration in `db.ts` eintragen**

`server/auth/db.ts` — zwei Änderungen:

Import-Zeile erweitern:
```typescript
import { SCHEMA_V1, SCHEMA_V2 } from './schema';
```

Version und Migrations-Map anpassen:
```typescript
const CURRENT_USER_VERSION = 2;

const MIGRATIONS: Record<number, string> = {
  1: SCHEMA_V1,
  2: SCHEMA_V2,
};
```

- [ ] **Step 6: Tests laufen, verify pass**

Run:
```bash
cd ~/Developer/tt-playbook-trainer && npx vitest run server/auth/db.test.ts
```
Expected: alle Tests grün (inkl. bestehende).

- [ ] **Step 7: Commit**

```bash
cd ~/Developer/tt-playbook-trainer && git add server/auth/schema.ts server/auth/schema.sql server/auth/db.ts server/auth/db.test.ts && git commit -m "feat(db): migration v2 adds stripe columns and events table"
```

---

## Task 3: User-Helpers für Stripe-Felder

**Files:**
- Modify: `server/auth/users.ts`
- Modify: `server/auth/users.test.ts`

- [ ] **Step 1: Failing Tests schreiben**

`server/auth/users.test.ts` erweitern — neuen Test-Block am Ende:

```typescript
import {
  setStripeCustomerId,
  updateSubscriptionFields,
  findUserByStripeCustomerId,
} from './users';

describe('stripe user helpers', () => {
  it('setStripeCustomerId persists customer id', async () => {
    const db = openDatabase(':memory:');
    const user = await createUser(db, 'a@b.c', 'hash');
    setStripeCustomerId(db, user.id, 'cus_123');
    const found = findUserByStripeCustomerId(db, 'cus_123');
    expect(found?.id).toBe(user.id);
  });

  it('findUserByStripeCustomerId returns null for unknown id', () => {
    const db = openDatabase(':memory:');
    expect(findUserByStripeCustomerId(db, 'cus_nope')).toBeNull();
  });

  it('updateSubscriptionFields writes subscription id, status and proUntil', async () => {
    const db = openDatabase(':memory:');
    const user = await createUser(db, 'a@b.c', 'hash');
    updateSubscriptionFields(db, user.id, {
      subscriptionId: 'sub_1',
      status: 'active',
      proUntil: 1_700_000_000_000,
    });
    const reloaded = findUserById(db, user.id);
    expect(reloaded?.proUntil).toBe(1_700_000_000_000);
  });

  it('updateSubscriptionFields with proUntil=null leaves proUntil unchanged when null passed', async () => {
    // This is the cancellation case: status changes to 'canceled' but proUntil stays
    // so the user keeps Pro until their paid period ends.
    const db = openDatabase(':memory:');
    const user = await createUser(db, 'a@b.c', 'hash');
    updateSubscriptionFields(db, user.id, {
      subscriptionId: 'sub_1',
      status: 'active',
      proUntil: 1_700_000_000_000,
    });
    updateSubscriptionFields(db, user.id, {
      subscriptionId: 'sub_1',
      status: 'canceled',
      proUntil: null,
    });
    const reloaded = findUserById(db, user.id);
    expect(reloaded?.proUntil).toBe(1_700_000_000_000);
  });

  it('listUsers returns stripeSubscriptionStatus', async () => {
    const db = openDatabase(':memory:');
    const user = await createUser(db, 'a@b.c', 'hash');
    updateSubscriptionFields(db, user.id, {
      subscriptionId: 'sub_1',
      status: 'active',
      proUntil: 1_700_000_000_000,
    });
    const summaries = listUsers(db);
    expect(summaries[0].stripeSubscriptionStatus).toBe('active');
  });
});
```

- [ ] **Step 2: Tests laufen, verify fail**

Run:
```bash
cd ~/Developer/tt-playbook-trainer && npx vitest run server/auth/users.test.ts
```
Expected: 5 neue Tests fail („setStripeCustomerId is not a function" etc.).

- [ ] **Step 3: Helper implementieren**

`server/auth/users.ts` — an den bestehenden `UserRecord`-Typ das Feld `stripeSubscriptionStatus` ergänzen und folgende Funktionen neu hinzufügen (unten anfügen, nicht ersetzen):

`UserRecord` erweitern:
```typescript
export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  emailVerified: boolean;
  proUntil: number | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripeSubscriptionStatus: string | null;
}

interface Row {
  id: string;
  email: string;
  password_hash: string;
  email_verified: number;
  pro_until: number | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_subscription_status: string | null;
}

function rowToUser(row: Row): UserRecord {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    emailVerified: !!row.email_verified,
    proUntil: row.pro_until,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    stripeSubscriptionStatus: row.stripe_subscription_status,
  };
}
```

`UserSummary` + `listUsers` anpassen:
```typescript
export interface UserSummary {
  id: string;
  email: string;
  emailVerified: boolean;
  proUntil: number | null;
  createdAt: number;
  stripeSubscriptionStatus: string | null;
}

interface SummaryRow {
  id: string;
  email: string;
  email_verified: number;
  pro_until: number | null;
  created_at: number;
  stripe_subscription_status: string | null;
}

export function listUsers(db: AuthDatabase): UserSummary[] {
  const rows = db
    .prepare(
      `SELECT id, email, email_verified, pro_until, created_at, stripe_subscription_status
       FROM users ORDER BY created_at DESC`,
    )
    .all() as unknown as SummaryRow[];
  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    emailVerified: !!r.email_verified,
    proUntil: r.pro_until,
    createdAt: r.created_at,
    stripeSubscriptionStatus: r.stripe_subscription_status,
  }));
}
```

Neue Funktionen unten anfügen:
```typescript
export function setStripeCustomerId(db: AuthDatabase, userId: string, customerId: string): void {
  db.prepare(
    `UPDATE users SET stripe_customer_id = ?, updated_at = ? WHERE id = ?`,
  ).run(customerId, Date.now(), userId);
}

export function findUserByStripeCustomerId(
  db: AuthDatabase,
  customerId: string,
): UserRecord | null {
  const row = db
    .prepare(`SELECT * FROM users WHERE stripe_customer_id = ?`)
    .get(customerId) as Row | undefined;
  return row ? rowToUser(row) : null;
}

export interface SubscriptionUpdate {
  subscriptionId: string;
  status: string;
  proUntil: number | null; // null = do NOT change proUntil
}

export function updateSubscriptionFields(
  db: AuthDatabase,
  userId: string,
  update: SubscriptionUpdate,
): void {
  if (update.proUntil === null) {
    db.prepare(
      `UPDATE users
       SET stripe_subscription_id = ?,
           stripe_subscription_status = ?,
           updated_at = ?
       WHERE id = ?`,
    ).run(update.subscriptionId, update.status, Date.now(), userId);
  } else {
    db.prepare(
      `UPDATE users
       SET stripe_subscription_id = ?,
           stripe_subscription_status = ?,
           pro_until = ?,
           updated_at = ?
       WHERE id = ?`,
    ).run(update.subscriptionId, update.status, update.proUntil, Date.now(), userId);
  }
}
```

- [ ] **Step 4: Tests laufen, verify pass**

Run:
```bash
cd ~/Developer/tt-playbook-trainer && npx vitest run server/auth/users.test.ts
```
Expected: alle Tests grün (inkl. bestehende).

- [ ] **Step 5: Full test suite als Regression-Check**

Run:
```bash
cd ~/Developer/tt-playbook-trainer && npx vitest run
```
Expected: alle Tests grün — Änderungen am `UserRecord`-Typ dürfen nichts brechen.

- [ ] **Step 6: Commit**

```bash
cd ~/Developer/tt-playbook-trainer && git add server/auth/users.ts server/auth/users.test.ts && git commit -m "feat(users): helpers for stripe customer and subscription fields"
```

---

## Task 4: Stripe-Events Idempotenz-Helper

**Files:**
- Create: `server/billing/events-log.ts`
- Create: `server/billing/events-log.test.ts`

- [ ] **Step 1: Failing Test schreiben**

`server/billing/events-log.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { openDatabase } from '../auth/db';
import { markEventProcessed } from './events-log';

describe('stripe events idempotency', () => {
  it('returns true on first call for an event id', () => {
    const db = openDatabase(':memory:');
    expect(markEventProcessed(db, 'evt_1', 1_000)).toBe(true);
  });

  it('returns false on duplicate event id', () => {
    const db = openDatabase(':memory:');
    expect(markEventProcessed(db, 'evt_1', 1_000)).toBe(true);
    expect(markEventProcessed(db, 'evt_1', 1_000)).toBe(false);
  });

  it('different ids are independent', () => {
    const db = openDatabase(':memory:');
    expect(markEventProcessed(db, 'evt_1', 1_000)).toBe(true);
    expect(markEventProcessed(db, 'evt_2', 2_000)).toBe(true);
  });
});
```

- [ ] **Step 2: Tests laufen, verify fail**

Run:
```bash
cd ~/Developer/tt-playbook-trainer && npx vitest run server/billing/events-log.test.ts
```
Expected: fail mit „Cannot find module './events-log'".

- [ ] **Step 3: Implementieren**

`server/billing/events-log.ts`:

```typescript
import type { AuthDatabase } from '../auth/db';

/**
 * Returns true if this is the first time we see this event id
 * (caller should proceed with handling), false if it's a duplicate
 * (caller should skip). Stripe retries webhooks with the same event id.
 */
export function markEventProcessed(
  db: AuthDatabase,
  eventId: string,
  createdAtMs: number,
): boolean {
  const result = db
    .prepare(`INSERT OR IGNORE INTO stripe_events (event_id, created_at) VALUES (?, ?)`)
    .run(eventId, createdAtMs);
  return result.changes > 0;
}
```

Hinweis zum `changes`-Typ: `better-sqlite3` liefert `number`, `node:sqlite` liefert in neuen Versionen `number | bigint`. Die bestehende Codebase castet bei Bedarf mit `Number(...)`. Hier reicht `> 0`, weil `bigint` Vergleich mit `number 0` in TypeScript korrekt typ-toleriert wird zur Laufzeit, aber `strict` erfordert expliziten Cast. Sicherer:

```typescript
return Number(result.changes) > 0;
```

- [ ] **Step 4: Tests laufen, verify pass**

Run:
```bash
cd ~/Developer/tt-playbook-trainer && npx vitest run server/billing/events-log.test.ts
```
Expected: 3 Tests grün.

- [ ] **Step 5: Commit**

```bash
cd ~/Developer/tt-playbook-trainer && git add server/billing/events-log.ts server/billing/events-log.test.ts && git commit -m "feat(billing): idempotency helper for stripe webhook events"
```

---

## Task 5: Stripe-SDK-Singleton

**Files:**
- Create: `server/billing/stripe.ts`

Kein Unit-Test — dünner Wrapper um einen Konstruktor, Fehler-Fall ist Env-Var-Missing.

- [ ] **Step 1: Implementieren**

`server/billing/stripe.ts`:

```typescript
import Stripe from 'stripe';

let singleton: Stripe | null = null;

export function getStripe(): Stripe {
  if (singleton) return singleton;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  singleton = new Stripe(key, {
    // Locked API version: keeps the webhook event shape stable.
    apiVersion: '2024-11-20.acacia',
    typescript: true,
  });
  return singleton;
}

export function resetStripeForTests(): void {
  singleton = null;
}
```

Hinweis: Die exakte `apiVersion` muss beim Setzen der neuesten Stripe-Package-Version geprüft werden (Typings enthalten zulässige Versions-Literale). Falls `'2024-11-20.acacia'` nicht typ-validiert: Wert entfernen, Stripe nutzt dann die im SDK eingebaute Default-Version.

- [ ] **Step 2: svelte-check laufen**

Run:
```bash
cd ~/Developer/tt-playbook-trainer && npx svelte-check
```
Expected: 0 Errors / 0 Warnings.

- [ ] **Step 3: Commit**

```bash
cd ~/Developer/tt-playbook-trainer && git add server/billing/stripe.ts && git commit -m "feat(billing): stripe sdk singleton"
```

---

## Task 6: Customer-Helpers

**Files:**
- Create: `server/billing/customers.ts`

Eine reine Orchestrierung: „findUser + ruft Stripe-API + speichert ID". Unit-Test wäre SDK-Mocking-lastig ohne großen Mehrwert. Wir testen es integrativ via Checkout-Endpoint (Task 10) manuell.

- [ ] **Step 1: Implementieren**

`server/billing/customers.ts`:

```typescript
import type { AuthDatabase } from '../auth/db';
import { findUserById, setStripeCustomerId } from '../auth/users';
import { getStripe } from './stripe';

/**
 * Returns the Stripe customer id for this user, creating a customer
 * on demand (and persisting the id) if none exists yet.
 */
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
```

- [ ] **Step 2: svelte-check laufen**

Run:
```bash
cd ~/Developer/tt-playbook-trainer && npx svelte-check
```
Expected: 0 Errors / 0 Warnings.

- [ ] **Step 3: Commit**

```bash
cd ~/Developer/tt-playbook-trainer && git add server/billing/customers.ts && git commit -m "feat(billing): ensureStripeCustomer helper"
```

---

## Task 7: Checkout-Session-Builder (pure)

**Files:**
- Create: `server/billing/checkout.ts`
- Create: `server/billing/checkout.test.ts`

- [ ] **Step 1: Failing Test schreiben**

`server/billing/checkout.test.ts`:

```typescript
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
```

- [ ] **Step 2: Tests laufen, verify fail**

Run:
```bash
cd ~/Developer/tt-playbook-trainer && npx vitest run server/billing/checkout.test.ts
```
Expected: fail mit „Cannot find module './checkout'".

- [ ] **Step 3: Implementieren**

`server/billing/checkout.ts`:

```typescript
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
```

- [ ] **Step 4: Tests laufen, verify pass**

Run:
```bash
cd ~/Developer/tt-playbook-trainer && npx vitest run server/billing/checkout.test.ts
```
Expected: alle Tests grün.

- [ ] **Step 5: Commit**

```bash
cd ~/Developer/tt-playbook-trainer && git add server/billing/checkout.ts server/billing/checkout.test.ts && git commit -m "feat(billing): pure checkout session builder"
```

---

## Task 8: Webhook-Handler (pure, testbar ohne Stripe-SDK)

**Files:**
- Create: `server/billing/webhook-handler.ts`
- Create: `server/billing/webhook-handler.test.ts`

Der Handler ist eine reine Funktion: nimmt ein Stripe.Event und eine DB, schreibt die DB. Keine Netzwerk-Calls, kein Stripe-SDK (nur Types). Dadurch sind alle Fälle mit reinem Fixture-Event testbar.

- [ ] **Step 1: Failing Tests schreiben**

`server/billing/webhook-handler.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { openDatabase } from '../auth/db';
import { createUser, findUserById, setStripeCustomerId } from '../auth/users';
import { handleStripeEvent } from './webhook-handler';
import type Stripe from 'stripe';

async function seedUser(db = openDatabase(':memory:')) {
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
  it('checkout.session.completed links customer+subscription and sets proUntil', async () => {
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
  });

  it('customer.subscription.created sets proUntil and status from subscription', async () => {
    const { db, user } = await seedUser();
    setStripeCustomerId(db, user.id, 'cus_1');
    const sub = {
      id: 'sub_1',
      object: 'subscription',
      customer: 'cus_1',
      status: 'active',
      current_period_end: 1_700_000_000, // seconds
      metadata: { userId: user.id },
    };
    await handleStripeEvent(db, evt('customer.subscription.created', sub));
    const reloaded = findUserById(db, user.id);
    expect(reloaded?.stripeSubscriptionStatus).toBe('active');
    expect(reloaded?.proUntil).toBe(1_700_000_000 * 1000);
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
  });

  it('customer.subscription.deleted sets status canceled but keeps proUntil', async () => {
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
    expect(reloaded?.proUntil).toBe(1_700_000_000 * 1000); // unchanged
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
  });

  it('unknown event types are ignored silently', async () => {
    const { db, user } = await seedUser();
    await handleStripeEvent(db, evt('charge.refunded', { id: 'ch_1' }));
    const reloaded = findUserById(db, user.id);
    expect(reloaded?.stripeSubscriptionStatus).toBeNull();
  });

  it('handles event when user lookup fails (log and skip, no throw)', async () => {
    const { db } = await seedUser();
    const sub = {
      id: 'sub_x',
      object: 'subscription',
      customer: 'cus_unknown',
      status: 'active',
      current_period_end: 1_700_000_000,
      metadata: {}, // no userId, no known customer
    };
    await expect(
      handleStripeEvent(db, evt('customer.subscription.updated', sub)),
    ).resolves.not.toThrow();
  });
});
```

- [ ] **Step 2: Tests laufen, verify fail**

Run:
```bash
cd ~/Developer/tt-playbook-trainer && npx vitest run server/billing/webhook-handler.test.ts
```
Expected: fail mit „Cannot find module './webhook-handler'".

- [ ] **Step 3: Implementieren**

`server/billing/webhook-handler.ts`:

```typescript
import type Stripe from 'stripe';
import type { AuthDatabase } from '../auth/db';
import { findUserByStripeCustomerId, updateSubscriptionFields } from '../auth/users';
import { setStripeCustomerId } from '../auth/users';

/**
 * Stripe webhook event dispatcher. Pure function — no network calls,
 * no SDK calls, only reads/writes the given db. Testable with plain
 * event fixtures.
 *
 * Unknown event types are silently ignored (returning 200 from the route).
 * Unknown user lookups are also silently skipped — the endpoint will still
 * 200 so Stripe does not retry forever.
 */
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
      // Ignore unrelated events — Stripe sends many we did not subscribe to.
      return;
  }
}

function userIdFromMetadata(metadata: Stripe.Metadata | null | undefined): string | null {
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

function handleCheckoutCompleted(db: AuthDatabase, session: Stripe.Checkout.Session): void {
  const customerId = typeof session.customer === 'string' ? session.customer : null;
  const subscriptionId = typeof session.subscription === 'string' ? session.subscription : null;
  const userId = resolveUserId(db, session.metadata, customerId);

  if (!userId || !customerId || !subscriptionId) return;

  // Store the customer id and subscription id; proUntil and status will be
  // set by the companion customer.subscription.created event. We only write
  // the fields we know for sure at this point.
  setStripeCustomerId(db, userId, customerId);
  updateSubscriptionFields(db, userId, {
    subscriptionId,
    status: 'active',
    proUntil: null, // do not touch — subscription.created will set it
  });
}

function handleSubscriptionUpsert(db: AuthDatabase, sub: Stripe.Subscription): void {
  const customerId = typeof sub.customer === 'string' ? sub.customer : null;
  const userId = resolveUserId(db, sub.metadata, customerId);
  if (!userId) return;

  updateSubscriptionFields(db, userId, {
    subscriptionId: sub.id,
    status: sub.status,
    proUntil: sub.current_period_end * 1000,
  });
}

function handleSubscriptionDeleted(db: AuthDatabase, sub: Stripe.Subscription): void {
  const customerId = typeof sub.customer === 'string' ? sub.customer : null;
  const userId = resolveUserId(db, sub.metadata, customerId);
  if (!userId) return;

  // Keep proUntil untouched: the user already paid for the period,
  // they remain Pro until it expires naturally.
  updateSubscriptionFields(db, userId, {
    subscriptionId: sub.id,
    status: 'canceled',
    proUntil: null,
  });
}

function handleInvoicePaymentFailed(db: AuthDatabase, invoice: Stripe.Invoice): void {
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
```

- [ ] **Step 4: Tests laufen, verify pass**

Run:
```bash
cd ~/Developer/tt-playbook-trainer && npx vitest run server/billing/webhook-handler.test.ts
```
Expected: alle 7 Tests grün.

- [ ] **Step 5: Commit**

```bash
cd ~/Developer/tt-playbook-trainer && git add server/billing/webhook-handler.ts server/billing/webhook-handler.test.ts && git commit -m "feat(billing): pure webhook handler for subscription events"
```

---

## Task 9: Portal-Session-Helper

**Files:**
- Create: `server/billing/portal.ts`

Keine Unit-Tests — dünner Wrapper um einen Stripe-SDK-Call.

- [ ] **Step 1: Implementieren**

`server/billing/portal.ts`:

```typescript
import { getStripe } from './stripe';

export async function createPortalSession(
  customerId: string,
  returnUrl: string,
): Promise<string> {
  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session.url;
}
```

- [ ] **Step 2: svelte-check**

Run:
```bash
cd ~/Developer/tt-playbook-trainer && npx svelte-check
```
Expected: 0 Errors / 0 Warnings.

- [ ] **Step 3: Commit**

```bash
cd ~/Developer/tt-playbook-trainer && git add server/billing/portal.ts && git commit -m "feat(billing): createPortalSession helper"
```

---

## Task 10: `POST /api/billing/checkout`

**Files:**
- Create: `src/routes/api/billing/checkout/+server.ts`

Rate-Limit-Infrastruktur existiert bereits in `server/auth/ratelimit.ts` — wir benutzen sie.

- [ ] **Step 1: Endpoint implementieren**

`src/routes/api/billing/checkout/+server.ts`:

```typescript
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDatabase } from '../../../../../server/auth/db';
import { checkRateLimit } from '../../../../../server/auth/ratelimit';
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

  const limit = checkRateLimit(getDatabase(), `billing-checkout:${locals.user.id}`, {
    max: 5,
    windowMs: 60_000,
  });
  if (!limit.allowed) throw error(429, 'Zu viele Versuche');

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

  const db = getDatabase();
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
```

Vorher checken: wie ist `checkRateLimit` genau exportiert? Falls die Signatur abweicht, entsprechend anpassen. Prüfe dazu:

```bash
cd ~/Developer/tt-playbook-trainer && head -40 server/auth/ratelimit.ts
```

Signatur muss ein Objekt oder Funktion zurückgeben, die ein `.allowed`-Flag hat. Falls die bestehende API anders heißt (z.B. `consumeRateLimit` mit `{ blocked, retryAfter }`), die Semantik im Endpoint-Code entsprechend anpassen — das Verhalten („5 pro Minute, bei Überschreitung 429") bleibt gleich.

- [ ] **Step 2: svelte-check**

Run:
```bash
cd ~/Developer/tt-playbook-trainer && npx svelte-check
```
Expected: 0 Errors / 0 Warnings.

- [ ] **Step 3: Commit**

```bash
cd ~/Developer/tt-playbook-trainer && git add src/routes/api/billing/checkout/+server.ts && git commit -m "feat(billing): POST /api/billing/checkout endpoint"
```

---

## Task 11: `POST /api/billing/webhook`

**Files:**
- Create: `src/routes/api/billing/webhook/+server.ts`

Der Endpoint muss den **raw body** lesen (Stripe-Signatur-Verifikation), nicht `request.json()`. Bei SvelteKit: `await request.arrayBuffer()` → `Buffer`.

- [ ] **Step 1: Endpoint implementieren**

`src/routes/api/billing/webhook/+server.ts`:

```typescript
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
    // Return 500 so Stripe retries. The event id was recorded in stripe_events
    // already — on retry we would skip it. To allow retry on error, delete
    // the log row on error.
    db.prepare(`DELETE FROM stripe_events WHERE event_id = ?`).run(event.id);
    const msg = err instanceof Error ? err.message : 'unknown';
    return new Response(`handler error: ${msg}`, { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};
```

- [ ] **Step 2: svelte-check**

Run:
```bash
cd ~/Developer/tt-playbook-trainer && npx svelte-check
```
Expected: 0 Errors / 0 Warnings.

- [ ] **Step 3: Commit**

```bash
cd ~/Developer/tt-playbook-trainer && git add src/routes/api/billing/webhook/+server.ts && git commit -m "feat(billing): POST /api/billing/webhook endpoint with signature verify"
```

---

## Task 12: `POST /api/billing/portal`

**Files:**
- Create: `src/routes/api/billing/portal/+server.ts`

- [ ] **Step 1: Endpoint implementieren**

`src/routes/api/billing/portal/+server.ts`:

```typescript
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDatabase } from '../../../../../server/auth/db';
import { findUserById } from '../../../../../server/auth/users';
import { createPortalSession } from '../../../../../server/billing/portal';

export const POST: RequestHandler = async ({ locals }) => {
  if (!locals.user) throw error(401, 'Nicht angemeldet');

  const db = getDatabase();
  const user = findUserById(db, locals.user.id);
  if (!user?.stripeCustomerId) {
    throw error(400, 'Kein Abo zum Verwalten');
  }

  const appUrl = process.env.APP_URL;
  if (!appUrl) throw error(500, 'APP_URL nicht konfiguriert');

  const url = await createPortalSession(user.stripeCustomerId, `${appUrl}/settings/account`);
  return json({ url });
};
```

- [ ] **Step 2: svelte-check**

Run:
```bash
cd ~/Developer/tt-playbook-trainer && npx svelte-check
```
Expected: 0 Errors / 0 Warnings.

- [ ] **Step 3: Commit**

```bash
cd ~/Developer/tt-playbook-trainer && git add src/routes/api/billing/portal/+server.ts && git commit -m "feat(billing): POST /api/billing/portal endpoint"
```

---

## Task 13: Currency-Detection (Frontend, pure)

**Files:**
- Create: `src/lib/billing/currency-detection.ts`
- Create: `src/lib/billing/currency-detection.test.ts`

- [ ] **Step 1: Failing Test schreiben**

`src/lib/billing/currency-detection.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { timezoneToCurrency } from './currency-detection';

describe('timezoneToCurrency', () => {
  it('maps Europe/* to EUR', () => {
    expect(timezoneToCurrency('Europe/Berlin')).toBe('eur');
    expect(timezoneToCurrency('Europe/Madrid')).toBe('eur');
    expect(timezoneToCurrency('Europe/Paris')).toBe('eur');
  });

  it('maps America/* to USD (incl. Costa Rica)', () => {
    expect(timezoneToCurrency('America/Costa_Rica')).toBe('usd');
    expect(timezoneToCurrency('America/New_York')).toBe('usd');
    expect(timezoneToCurrency('America/Mexico_City')).toBe('usd');
  });

  it('maps Asia/* and Africa/* to USD', () => {
    expect(timezoneToCurrency('Asia/Tokyo')).toBe('usd');
    expect(timezoneToCurrency('Africa/Nairobi')).toBe('usd');
  });

  it('falls back to USD for unknown/empty', () => {
    expect(timezoneToCurrency('')).toBe('usd');
    expect(timezoneToCurrency('UTC')).toBe('usd');
  });
});
```

- [ ] **Step 2: Tests laufen, verify fail**

Run:
```bash
cd ~/Developer/tt-playbook-trainer && npx vitest run src/lib/billing/currency-detection.test.ts
```
Expected: fail — Modul fehlt.

- [ ] **Step 3: Implementieren**

`src/lib/billing/currency-detection.ts`:

```typescript
export type Currency = 'eur' | 'usd';

/**
 * Returns the default currency for a given IANA timezone string.
 * Europe/* -> EUR, everything else -> USD. Deliberately conservative:
 * users from non-Eurozone regions can override via the switch link.
 */
export function timezoneToCurrency(tz: string): Currency {
  if (tz.startsWith('Europe/')) return 'eur';
  return 'usd';
}

export function detectCurrency(): Currency {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
    return timezoneToCurrency(tz);
  } catch {
    return 'usd';
  }
}
```

- [ ] **Step 4: Tests laufen, verify pass**

Run:
```bash
cd ~/Developer/tt-playbook-trainer && npx vitest run src/lib/billing/currency-detection.test.ts
```
Expected: alle Tests grün.

- [ ] **Step 5: Commit**

```bash
cd ~/Developer/tt-playbook-trainer && git add src/lib/billing/currency-detection.ts src/lib/billing/currency-detection.test.ts && git commit -m "feat(billing): timezone-based currency detection"
```

---

## Task 14: Price-Display-Konstanten + Billing-Client

**Files:**
- Create: `src/lib/billing/prices.ts`
- Create: `src/lib/billing/client.svelte.ts`

- [ ] **Step 1: `prices.ts` schreiben**

`src/lib/billing/prices.ts`:

```typescript
import type { Currency } from './currency-detection';

export type Plan = 'monthly' | 'yearly';

export const PRICE_DISPLAY: Record<Plan, Record<Currency, string>> = {
  monthly: { eur: '9,90 €', usd: '$14.90' },
  yearly: { eur: '99 €', usd: '$149' },
};

export const CURRENCY_LABEL: Record<Currency, string> = {
  eur: 'EUR',
  usd: 'USD',
};
```

- [ ] **Step 2: `client.svelte.ts` schreiben**

`src/lib/billing/client.svelte.ts`:

```typescript
import { detectCurrency, type Currency } from './currency-detection';
import type { Plan } from './prices';

const STORAGE_KEY = 'tt-billing-currency';

function loadStoredCurrency(): Currency | null {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === 'eur' || raw === 'usd') return raw;
  return null;
}

class BillingState {
  currency = $state<Currency>('usd');

  init(): void {
    const stored = loadStoredCurrency();
    this.currency = stored ?? detectCurrency();
  }

  setCurrency(c: Currency): void {
    this.currency = c;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, c);
    }
  }

  async startCheckout(plan: Plan): Promise<void> {
    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ plan, currency: this.currency }),
    });
    if (!res.ok) {
      throw new Error(`Checkout failed (${res.status})`);
    }
    const body = await res.json();
    window.location.href = body.url;
  }

  async openPortal(): Promise<void> {
    const res = await fetch('/api/billing/portal', { method: 'POST' });
    if (!res.ok) {
      throw new Error(`Portal failed (${res.status})`);
    }
    const body = await res.json();
    window.location.href = body.url;
  }
}

export const billing = new BillingState();
```

- [ ] **Step 3: In Root-Layout initialisieren**

Datei finden und editieren: `src/routes/+layout.svelte`. Im `onMount`-Block, nach der bestehenden `theme.init()` / `auth.init()` / etc., die Zeile `billing.init();` einfügen.

Wenn das Layout noch keinen `onMount`-Block für Client-State-Init hat: das Muster aus `auth.init()` übernehmen. Im Zweifel erst den Block mit:

```bash
cd ~/Developer/tt-playbook-trainer && grep -n "auth.init" src/routes/+layout.svelte
```

…lokalisieren und direkt danach `billing.init();` ergänzen. Import oben ergänzen:

```typescript
import { billing } from '$lib/billing/client.svelte';
```

- [ ] **Step 4: svelte-check + Tests**

Run:
```bash
cd ~/Developer/tt-playbook-trainer && npx svelte-check && npx vitest run
```
Expected: 0 Errors / 0 Warnings, alle Tests grün.

- [ ] **Step 5: Commit**

```bash
cd ~/Developer/tt-playbook-trainer && git add src/lib/billing/prices.ts src/lib/billing/client.svelte.ts src/routes/+layout.svelte && git commit -m "feat(billing): reactive billing client with currency override"
```

---

## Task 15: PaywallDialog an Billing verdrahten

**Files:**
- Modify: `src/lib/paywall/PaywallDialog.svelte` (oder genauer Pfad — erst bestätigen)

- [ ] **Step 1: Bestehenden PaywallDialog lokalisieren**

Run:
```bash
cd ~/Developer/tt-playbook-trainer && grep -rln "PaywallDialog" src/
```
Expected: der konkrete Pfad. Annahme: `src/lib/paywall/PaywallDialog.svelte`.

- [ ] **Step 2: Datei lesen und umbauen**

Imports oben ergänzen:

```typescript
import { billing } from '$lib/billing/client.svelte';
import { PRICE_DISPLAY, CURRENCY_LABEL } from '$lib/billing/prices';
import type { Plan } from '$lib/billing/prices';
import { m } from '$lib/paraglide/messages';
```

Im `<script>`-Abschnitt Handler hinzufügen:

```typescript
let loading = $state(false);
let error = $state<string | null>(null);

async function subscribe(plan: Plan) {
  loading = true;
  error = null;
  try {
    await billing.startCheckout(plan);
    // Redirect happens in startCheckout — if we get here something went wrong.
  } catch (e) {
    error = e instanceof Error ? e.message : 'Checkout failed';
    loading = false;
  }
}

function switchCurrency() {
  billing.setCurrency(billing.currency === 'eur' ? 'usd' : 'eur');
}
```

Im Template: die beiden Plan-Karten mit dynamischen Preisen + Click-Handler versehen. Der bestehende Dialog-Code zeigt wahrscheinlich schon Monats- und Jahrespreis. Ersetze die fixen EUR-Strings durch `PRICE_DISPLAY.monthly[billing.currency]` bzw. `PRICE_DISPLAY.yearly[billing.currency]`. Plan-Klick → `subscribe('monthly')` / `subscribe('yearly')`.

Unterhalb der Plan-Karten einen Currency-Switch-Link ergänzen:

```svelte
<button
  type="button"
  class="currency-switch"
  onclick={switchCurrency}
>
  {m.billing_currency_switch({
    currency: CURRENCY_LABEL[billing.currency === 'eur' ? 'usd' : 'eur'],
  })}
</button>
```

Falls `m.billing_currency_switch` noch nicht existiert: erst Task 17 machen (i18n-Keys), dann hier darauf zurückkommen. Alternativ für diesen Schritt einen deutschen Literal verwenden (`Preise in {…} anzeigen`) und in Task 17 auf `m.*` umstellen.

Error-Banner oben im Dialog:

```svelte
{#if error}
  <div class="error-banner">{error}</div>
{/if}
```

Loading-Indikator: Plan-Buttons `disabled={loading}`.

- [ ] **Step 3: svelte-check + Tests**

Run:
```bash
cd ~/Developer/tt-playbook-trainer && npx svelte-check && npx vitest run
```
Expected: 0 Errors / 0 Warnings, alle Tests grün.

- [ ] **Step 4: Commit**

```bash
cd ~/Developer/tt-playbook-trainer && git add src/lib/paywall/PaywallDialog.svelte && git commit -m "feat(paywall): wire plan buttons to stripe checkout with currency switch"
```

---

## Task 16: Settings/Account — Abo verwalten + Checkout-Redirect-Handling

**Files:**
- Modify: `src/routes/settings/account/+page.svelte`

- [ ] **Step 1: Bestehende Datei lesen**

Run:
```bash
cd ~/Developer/tt-playbook-trainer && cat src/routes/settings/account/+page.svelte | head -60
```

- [ ] **Step 2: Portal-Button + Query-Param-Handler einbauen**

Imports oben ergänzen:
```typescript
import { billing } from '$lib/billing/client.svelte';
import { page } from '$app/stores';
import { goto } from '$app/navigation';
import { m } from '$lib/paraglide/messages';
```

Im `<script>`-Block:
```typescript
let portalLoading = $state(false);
let toast = $state<{ kind: 'ok' | 'info' | 'error'; msg: string } | null>(null);

async function openPortal() {
  portalLoading = true;
  try {
    await billing.openPortal();
  } catch (e) {
    toast = { kind: 'error', msg: e instanceof Error ? e.message : 'Portal failed' };
    portalLoading = false;
  }
}

// Handle ?checkout=success / ?checkout=cancel after Stripe redirect.
$effect(() => {
  const status = $page.url.searchParams.get('checkout');
  if (status === 'success') {
    toast = { kind: 'ok', msg: m.billing_checkout_success_toast() };
    auth.init(); // re-fetch user so isPro flips
    // Strip the query param so refresh doesn't re-toast.
    goto('/settings/account', { replaceState: true });
  } else if (status === 'cancel') {
    toast = { kind: 'info', msg: m.billing_checkout_cancel_toast() };
    goto('/settings/account', { replaceState: true });
  }
});
```

Hinweis: `auth` aus `$lib/auth/client.svelte` muss bereits importiert sein (Bestandscode).

Im Template, im Pro-Benutzer-Abschnitt, direkt neben/unter dem Logout-Button:

```svelte
{#if auth.isPro}
  <button
    type="button"
    class="btn-secondary"
    onclick={openPortal}
    disabled={portalLoading}
  >
    {m.billing_portal_button()}
  </button>
{/if}
```

Toast-Komponente oberhalb des Haupt-Contents:

```svelte
{#if toast}
  <div class="toast toast-{toast.kind}">{toast.msg}</div>
{/if}
```

Bestehende Toast-Patterns in der App nachschlagen und die Markup-Struktur genau übernehmen, damit das Styling passt:

```bash
cd ~/Developer/tt-playbook-trainer && grep -rln "toast" src/ | head
```

- [ ] **Step 3: svelte-check**

Run:
```bash
cd ~/Developer/tt-playbook-trainer && npx svelte-check
```
Expected: 0 Errors / 0 Warnings.

- [ ] **Step 4: Commit**

```bash
cd ~/Developer/tt-playbook-trainer && git add src/routes/settings/account/+page.svelte && git commit -m "feat(account): portal button + checkout redirect handling"
```

---

## Task 17: i18n-Keys für Billing (DE/EN/ES)

**Files:**
- Modify: `messages/de.json`
- Modify: `messages/en.json`
- Modify: `messages/es.json`

Paraglide kompiliert neue Keys zu `m.<key>()`. Keys in allen drei Sprachen parallel.

- [ ] **Step 1: Keys in `messages/de.json` ergänzen**

Neue Keys (an passender alphabetischer Stelle einfügen, oder am Ende):

```json
{
  "billing_currency_switch": "Preise in {currency} anzeigen",
  "billing_checkout_success_toast": "Vielen Dank — Pro ist jetzt aktiv.",
  "billing_checkout_cancel_toast": "Checkout abgebrochen.",
  "billing_checkout_failed_toast": "Checkout konnte nicht gestartet werden.",
  "billing_portal_button": "Abo verwalten",
  "billing_portal_failed_toast": "Abo-Verwaltung nicht verfügbar."
}
```

- [ ] **Step 2: Keys in `messages/en.json`**

```json
{
  "billing_currency_switch": "Show prices in {currency}",
  "billing_checkout_success_toast": "Thanks — Pro is now active.",
  "billing_checkout_cancel_toast": "Checkout cancelled.",
  "billing_checkout_failed_toast": "Could not start checkout.",
  "billing_portal_button": "Manage subscription",
  "billing_portal_failed_toast": "Subscription management unavailable."
}
```

- [ ] **Step 3: Keys in `messages/es.json`**

```json
{
  "billing_currency_switch": "Mostrar precios en {currency}",
  "billing_checkout_success_toast": "Gracias — Pro está activo.",
  "billing_checkout_cancel_toast": "Pago cancelado.",
  "billing_checkout_failed_toast": "No se pudo iniciar el pago.",
  "billing_portal_button": "Gestionar suscripción",
  "billing_portal_failed_toast": "Gestión de suscripción no disponible."
}
```

- [ ] **Step 4: Paraglide-Sync + Build-Check**

Run:
```bash
cd ~/Developer/tt-playbook-trainer && npx svelte-kit sync && npx svelte-check
```
Expected: keine Errors, generierte Paraglide-Module enthalten die neuen Keys. Falls es warnt „message missing in locale X" → exakte Keys auch dort anlegen.

- [ ] **Step 5: Commit**

```bash
cd ~/Developer/tt-playbook-trainer && git add messages/de.json messages/en.json messages/es.json && git commit -m "i18n(billing): add keys for paywall currency switch and portal/toast copy"
```

---

## Task 18: Admin-Panel Subscription-Status-Chip

**Files:**
- Modify: `src/routes/admin/users/+page.svelte`

Die `listUsers`-Response enthält nach Task 3 bereits `stripeSubscriptionStatus`. Wir rendern es nur noch.

- [ ] **Step 1: Interface erweitern**

In `src/routes/admin/users/+page.svelte`, das `AdminUser`-Interface erweitern:

```typescript
interface AdminUser {
  id: string;
  email: string;
  emailVerified: boolean;
  proUntil: number | null;
  createdAt: number;
  stripeSubscriptionStatus: string | null;
}
```

- [ ] **Step 2: Badge im Template ergänzen**

In der `.meta`-Section, neben den bestehenden Badges:

```svelte
{#if u.stripeSubscriptionStatus}
  <span class="badge subscription subscription-{u.stripeSubscriptionStatus}">
    {u.stripeSubscriptionStatus}
  </span>
{/if}
```

CSS-Block unten ergänzen (am Ende des `<style>`-Blocks):

```css
.badge.subscription {
  text-transform: uppercase;
  letter-spacing: 0.6px;
  font-weight: 600;
}
.badge.subscription-active {
  background: var(--color-success);
  color: #fff;
}
.badge.subscription-past_due {
  background: var(--color-danger);
  color: #fff;
}
.badge.subscription-canceled {
  background: var(--bg-elevated);
  color: var(--color-text-secondary);
}
```

- [ ] **Step 3: svelte-check**

Run:
```bash
cd ~/Developer/tt-playbook-trainer && npx svelte-check
```
Expected: 0 Errors / 0 Warnings.

- [ ] **Step 4: Commit**

```bash
cd ~/Developer/tt-playbook-trainer && git add src/routes/admin/users/+page.svelte && git commit -m "feat(admin): display stripe subscription status chip per user"
```

---

## Task 19: Full-Test-Lauf + Build

**Kein Code-Change** — nur Verifizierung, dass alle Änderungen zusammen funktionieren.

- [ ] **Step 1: Alle Tests**

Run:
```bash
cd ~/Developer/tt-playbook-trainer && npx vitest run
```
Expected: alle Tests grün. Zähler sollte um ~20 gegenüber Ausgangsstand (159) gewachsen sein.

- [ ] **Step 2: svelte-check**

Run:
```bash
cd ~/Developer/tt-playbook-trainer && npx svelte-check
```
Expected: 0 Errors / 0 Warnings.

- [ ] **Step 3: Production-Build**

Run:
```bash
cd ~/Developer/tt-playbook-trainer && NODE_OPTIONS='--max-old-space-size=1024' npx vite build
```
Expected: Build läuft durch, `build/`-Output aktualisiert.

Falls einer der Schritte fehlschlägt: zurück zu dem Task, wo der Bug entstanden ist. Keine schnellen Patches hier.

- [ ] **Step 4: Falls alles grün: Lokaler Smoke-Test mit Stripe-CLI**

Nur lokal — braucht `stripe`-CLI (`brew install stripe/stripe-cli/stripe`) und eingeloggtes Test-Mode-Account.

In Terminal 1:
```bash
cd ~/Developer/tt-playbook-trainer && npm run dev
```

In Terminal 2:
```bash
stripe listen --forward-to localhost:5173/api/billing/webhook
```
→ Stripe-CLI druckt ein `whsec_…`. Das in `.env` (lokal) als `STRIPE_WEBHOOK_SECRET` eintragen, Dev-Server neu starten.

Dann:
- Test-User anlegen, einloggen
- Paywall triggern (6. Übung speichern)
- Auf „Monatsplan" klicken → Redirect zu Stripe Checkout
- Test-Karte `4242 4242 4242 4242`, beliebiges Datum / CVV / PLZ
- Zurück-Redirect → Success-Toast, Pro-Status sollte aktiv sein
- `/settings/account` → „Abo verwalten" → Stripe Portal öffnet sich

Falls ok: kein Commit nötig, aber im Projektstatus festhalten.

---

## Task 20: Produktive Deploy-Vorbereitung

**Kein Code-Change im Repo** — Dokumentation der manuellen Deploy-Schritte.

- [ ] **Step 1: Stripe-Dashboard-Setup (Test-Mode)**

Exakt wie im Spec-Dokument `Section: Stripe-Dashboard Setup`:

1. Produkt „Pro" anlegen
2. 4 Prices (EUR/USD × monthly/yearly) mit Tax-Behaviour **inclusive**
3. Stripe Tax aktivieren, mindestens DE-Registrierung
4. Customer Portal konfigurieren, Return-URL `https://coach.tt-playbook.de/settings/account`
5. Noch kein Webhook-Endpoint, kommt nach Deploy

- [ ] **Step 2: Push auf Mittwald**

```bash
cd ~/Developer/tt-playbook-trainer && git push mittwald main
```
Wartet auf Post-receive-Hook → Build + Restart.

- [ ] **Step 3: `.env` auf Mittwald aktualisieren**

Auf dem Server:
```bash
ssh mittwald-tt
```
Dann in `/home/p-np5mfc/html/nj-playbook-trainer/.env` anhängen:
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_PLACEHOLDER   # wird in Schritt 4 gefüllt
STRIPE_PRICE_MONTHLY_EUR=price_...
STRIPE_PRICE_MONTHLY_USD=price_...
STRIPE_PRICE_YEARLY_EUR=price_...
STRIPE_PRICE_YEARLY_USD=price_...
```
Restart via `mw app update --entrypoint …` wie bisher.

- [ ] **Step 4: Webhook-Endpoint in Stripe anlegen**

- URL: `https://coach.tt-playbook.de/api/billing/webhook`
- Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
- Signing-Secret kopieren → `.env` auf Server aktualisieren, erneut Restart.

- [ ] **Step 5: Test-Mode-E2E auf Live-Domain**

Auf `coach.tt-playbook.de`:
- Einloggen (oder neuen Test-User anlegen)
- Paywall triggern
- Test-Karte `4242 4242 4242 4242`
- Nach Zahlung: Success-Toast, Pro-Badge, `/settings/account` → Portal
- Portal → Abo kündigen → Webhook `customer.subscription.deleted` → Status sollte im Admin-Panel `canceled` sein, `proUntil` bleibt stehen

- [ ] **Step 6: Live-Keys umstellen**

Wenn alle Test-Mode-Szenarien sauber laufen:
- Neue Live-Produkte + Prices in Stripe (unter „Live mode" toggeln)
- `.env` auf Server: Live-Keys + neue Price-IDs
- Live-Webhook-Endpoint anlegen, Signing-Secret in `.env`
- Restart

- [ ] **Step 7: Echter Kauf als Final-Test**

Mit eigener Karte einmal 9,90 € kaufen, sofort über Portal kündigen, via Stripe-Dashboard refunden. Damit ist der gesamte End-to-End-Pfad im Live-Mode einmal durchgelaufen.

---

## Post-Implementation

Nach erfolgreichem Live-Test: `context/project-state.md` um Abschnitt „Stripe-Billing (Datum)" ergänzen — analog zum Auth-Backend-Abschnitt. Wichtigste Punkte: Live-Keys rotiert, Webhook-URL, Price-IDs im Server.env, offene Follow-ups (Offline-Token, Team-Lizenzen etc.) nicht vergessen.

## Self-Review

**Spec-Coverage:**
- Stripe-Setup → Task 20 ✓
- DB-Schema → Task 2 ✓
- User-Helpers → Task 3 ✓
- Checkout-Endpoint → Task 7 + Task 10 ✓
- Webhook-Handler → Task 8 + Task 11 ✓
- Portal-Endpoint → Task 9 + Task 12 ✓
- Currency-Detection → Task 13 ✓
- Billing-Client → Task 14 ✓
- Paywall-Verdrahtung → Task 15 ✓
- Settings/Account → Task 16 ✓
- i18n-Keys → Task 17 ✓
- Admin-Panel → Task 18 ✓
- Idempotenz → Task 4 ✓
- Stripe-SDK-Wrapper → Task 5 ✓
- Customer-Helper → Task 6 ✓
- Tests + Build → Task 19 ✓

**Typ-Konsistenz geprüft:**
- `Currency` als `'eur' | 'usd'` durchgängig (currency-detection, prices, checkout, client)
- `Plan` als `'monthly' | 'yearly'` durchgängig
- `updateSubscriptionFields({ proUntil: null })` dokumentiert: belässt proUntil unverändert. Konsistent verwendet in `handleSubscriptionDeleted` + `handleInvoicePaymentFailed`
- Rate-Limit-API muss bei Task 10 an bestehende Signatur angepasst werden — Hinweis steht dort

**Placeholder-Scan:** keine TBDs, keine „add error handling", keine „similar to Task N".
