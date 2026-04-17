# Stripe Billing — Design

**Datum:** 2026-04-17
**Status:** Draft (Brainstorming-Abschluss)
**Voraussetzung:** Auth-Backend live (Commit `f6c1992`), Admin-Panel live (Commit `1744fd8`)

## Ziel

Echte Bezahlung via Stripe einführen: Nutzer kann ein Pro-Abo (monatlich oder jährlich) über Stripe Checkout abschließen, Abo über Stripe Customer Portal verwalten (kündigen, Zahlungsmittel wechseln, Rechnungen anzeigen), und die App hält `users.proUntil` über Webhook-Events aktuell.

Das ersetzt nur noch den Bezahlvorgang — das Admin-Panel mit `proUntil`-Setzen bleibt weiterhin aktiv (für Support-Fälle und Review-User).

## Scope

**Im Scope:**

- Stripe Checkout (hosted, Redirect) für Neu-Abonnement
- Webhook-Endpoint, der Subscription-Events verarbeitet und `users.proUntil` + Subscription-Metadaten aktualisiert
- Customer Portal (hosted) für Kündigung, Zahlungsmittel-Wechsel, Rechnungsanzeige
- Paywall-Dialog verdrahtet: Plan-Buttons starten Checkout mit passender Price-ID
- Währungs-Auswahl EUR / USD via Browser-Timezone + manueller Override
- Stripe Tax aktiviert (automatische EU-OSS + Reverse Charge + Rechnungs-PDFs)

**Nicht im Scope (späterer Spec):**

- Offline-Pro-Token (signiertes JWT mit 35/400 Tagen Gültigkeit)
- Lokales Pro-Caching für Nutzung ohne Internet
- Dunning-UI (Stripe übernimmt komplett per E-Mail)
- Rabatt-Codes, Team-Lizenzen, Geschenk-Abos
- Native App-Store-Käufe

## Business-Entscheidungen

| Thema | Entscheidung |
|---|---|
| Checkout-Flow | Stripe Checkout (hosted, Redirect) |
| Trial | Kein Zeit-Trial. Freemium-Limit (5 Übungen) IST der Trial |
| Kündigung | Stripe Customer Portal (§312k BGB-konform) |
| Steuern | Stripe Tax aktiv, Tax-Behaviour auf jeder Price **Inclusive** (Brutto-Preis) |
| Währungen | EUR + USD |
| Preise EUR | 9,90 € / Monat, 99 € / Jahr |
| Preise USD | $14.90 / Monat, $149 / Jahr |
| Währungs-Auswahl | Default aus Browser-Timezone, manueller Override-Link |

## Architektur

### Daten-Flow (Happy Path)

```
User klickt "Abonnieren" im PaywallDialog
  → POST /api/billing/checkout  { plan: 'monthly'|'yearly', currency: 'eur'|'usd' }
  → Server: Customer finden/anlegen, Checkout-Session erzeugen
  → Response: { url }
  → Client redirect zu checkout.stripe.com

User zahlt in Stripe
  → Stripe POST /api/billing/webhook (signiert)
  → Server verifiziert Signatur, Idempotenz-Check, aktualisiert User-Row
  → Stripe redirect zu /settings/account?checkout=success
  → auth.refresh() lädt Pro-Status neu → UI schaltet um
```

### Stripe Dashboard — manuelles Setup

**Produkt „Pro" + 4 Prices:**

| Intervall | Währung | Betrag | ENV-Var |
|---|---|---|---|
| Monat | EUR | 9,90 | `STRIPE_PRICE_MONTHLY_EUR` |
| Monat | USD | 14,90 | `STRIPE_PRICE_MONTHLY_USD` |
| Jahr | EUR | 99,00 | `STRIPE_PRICE_YEARLY_EUR` |
| Jahr | USD | 149,00 | `STRIPE_PRICE_YEARLY_USD` |

Tax-Behaviour auf jeder Price: **Inclusive** — der Anzeigepreis enthält die MwSt.

**Stripe Tax:** Dashboard → Tax → aktivieren. Registrierungen: DE (weitere EU-Länder bei Bedarf), USA je nach Umsatzentwicklung.

**Customer Portal:** Dashboard → Customer Portal → Configure. Features: Cancel subscription (`cancel_at_period_end`), Update payment method, View invoices. Return-URL `https://coach.tt-playbook.de/settings/account`.

**Webhook-Endpoint (erst nach Deploy):**

- URL: `https://coach.tt-playbook.de/api/billing/webhook`
- Events:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`
- Signing Secret → `STRIPE_WEBHOOK_SECRET`

### DB-Schema-Erweiterung

Neue Spalten auf `users`:

```sql
ALTER TABLE users ADD COLUMN stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN stripe_subscription_id TEXT;
ALTER TABLE users ADD COLUMN stripe_subscription_status TEXT;
-- proUntil existiert bereits (INTEGER, Millisekunden, nullable)

CREATE UNIQUE INDEX idx_users_stripe_customer_id
  ON users(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
```

Felder:

- `stripe_customer_id` (`cus_…`) — lazy beim ersten Checkout erzeugt, bleibt bei Kündigung erhalten (Re-Subscription nutzt denselben Customer)
- `stripe_subscription_id` (`sub_…`) — aktive oder zuletzt aktive Subscription, `null` wenn nie abonniert
- `stripe_subscription_status` — `active | past_due | canceled | incomplete | trialing | unpaid`, direkt aus Stripe-Event. Debug + Admin-Panel-Anzeige
- `proUntil` — unverändert, gesetzt aus `subscription.current_period_end * 1000`

Neue Tabelle für Webhook-Idempotenz:

```sql
CREATE TABLE IF NOT EXISTS stripe_events (
  event_id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL
);
```

Vor Processing: `INSERT OR IGNORE INTO stripe_events(event_id, created_at) VALUES (?, ?)`. Wenn `changes === 0` → Event wurde schon verarbeitet, skip.

Migration als neuer Schritt in `server/auth/db.ts`-Migration-Layer, idempotent.

### Admin-Panel-Erweiterung

`listUsers` liefert zusätzlich `stripeSubscriptionStatus`. UI zeigt kleinen Status-Chip neben dem Pro-Badge — Debugging-Hilfe bei Support-Fällen.

## Server-Endpoints

### `POST /api/billing/checkout`

**Auth:** erforderlich (401 sonst)
**Body:** `{ plan: 'monthly' | 'yearly', currency: 'eur' | 'usd' }`
**Rate-Limit:** 5 / Minute pro User

**Ablauf:**

1. Input validieren, Price-ID aus ENV auswählen
2. Wenn `user.stripe_customer_id` null → Stripe-Customer anlegen mit `email = user.email`, `metadata.userId = user.id`, Customer-ID in DB speichern
3. Checkout-Session erzeugen:
   - `mode: 'subscription'`
   - `line_items: [{ price: <priceId>, quantity: 1 }]`
   - `customer: user.stripe_customer_id`
   - `metadata: { userId: user.id }`
   - `subscription_data: { metadata: { userId: user.id } }` (doppelte Absicherung fürs Webhook-Matching)
   - `automatic_tax: { enabled: true }`
   - `billing_address_collection: 'required'`
   - `customer_update: { address: 'auto', name: 'auto' }`
   - `success_url: ${PUBLIC_APP_URL}/settings/account?checkout=success&session_id={CHECKOUT_SESSION_ID}`
   - `cancel_url: ${PUBLIC_APP_URL}/settings/account?checkout=cancel`
   - `allow_promotion_codes: false` (MVP)
4. Response `{ url: session.url }`

### `POST /api/billing/webhook`

**Auth:** keine (öffentlich, aber signiert)
**Content-Type:** `application/json`, Raw-Body nötig

**Ablauf:**

1. Raw-Body lesen via `await request.arrayBuffer()` → `Buffer.from()`
2. Signatur verifizieren: `stripe.webhooks.constructEvent(rawBody, request.headers.get('stripe-signature'), STRIPE_WEBHOOK_SECRET)` — bei Fehler 400
3. Idempotenz: `INSERT OR IGNORE INTO stripe_events(event_id, created_at) VALUES (event.id, event.created * 1000)`. Wenn `changes === 0` → 200 und raus
4. Event-spezifisch (alle innerhalb einer Transaktion):
   - `checkout.session.completed`:
     - `session = event.data.object`
     - User via `session.metadata.userId` finden (Fallback: `session.customer_email`)
     - Subscription expandieren (eigener API-Call wenn nicht inline): `subscriptions.retrieve(session.subscription)`
     - `stripe_customer_id`, `stripe_subscription_id` auf User setzen
     - `proUntil = subscription.current_period_end * 1000`
     - `stripe_subscription_status = subscription.status`
   - `customer.subscription.created` / `customer.subscription.updated`:
     - User via `subscription.metadata.userId` (Fallback: via `stripe_customer_id`)
     - `proUntil = current_period_end * 1000`, `stripe_subscription_status = status`
     - **Bei Renewal**: `current_period_end` rückt nach vorn → Pro verlängert sich automatisch
   - `customer.subscription.deleted`:
     - User finden, `stripe_subscription_status = 'canceled'`
     - **`proUntil` bleibt unverändert** — User ist bis Perioden-Ende Pro (Stripe hat das Datum nicht geändert, nur den Status)
   - `invoice.payment_failed`:
     - User finden, `stripe_subscription_status = 'past_due'`
     - `proUntil` unverändert (Stripe-Dunning macht Retries über mehrere Tage, triggert am Ende ggf. `subscription.deleted`)
5. Response 200 `{ received: true }`. Unbekannte Events werden mit 200 ignoriert.

### `POST /api/billing/portal`

**Auth:** erforderlich + `stripe_customer_id` muss gesetzt sein (400 sonst)
**Body:** leer

**Ablauf:**

1. Portal-Session via `stripe.billingPortal.sessions.create({ customer, return_url: '/settings/account' })`
2. Response `{ url: session.url }`

## Frontend

### Neues Modul `src/lib/billing/`

**`currency-detection.ts`** — pure:

```ts
export function timezoneToCurrency(tz: string): 'eur' | 'usd' {
  if (tz.startsWith('Europe/')) return 'eur';
  return 'usd'; // America/*, Asia/*, Pacific/*, Africa/*, default
}
```

Unit-getestet mit Cases: `Europe/Berlin` → eur, `America/Costa_Rica` → usd, `Asia/Tokyo` → usd, `Atlantic/Reykjavik` (Island, EUR-nah aber nicht in Eurozone) → usd (bewusst Default).

**`prices.ts`** — Anzeige-Konstanten (nicht Wahrheit, die steht in Stripe):

```ts
export const PRICE_DISPLAY = {
  monthly: { eur: '9,90 €', usd: '$14.90' },
  yearly:  { eur: '99 €',   usd: '$149' },
};
```

**`client.svelte.ts`** — Reactive-Billing-Client:

- `currency = $state<'eur' | 'usd'>` — initial aus `localStorage['tt-billing-currency']` oder `timezoneToCurrency(Intl.DateTimeFormat().resolvedOptions().timeZone)`
- `setCurrency(c)` → State + localStorage
- `async startCheckout(plan: 'monthly' | 'yearly')` → POST `/api/billing/checkout`, redirect via `window.location.href = res.url`
- `async openPortal()` → POST `/api/billing/portal`, redirect

### `PaywallDialog.svelte` anpassen

- Zwei Plan-Karten mit Preisen aus `PRICE_DISPLAY[plan][billing.currency]`
- Link unter den Plänen: „Preise in {other-currency}" → ruft `billing.setCurrency(…)`, re-rendert
- Click auf Plan-Karte → `billing.startCheckout(plan)`
- Loading-State während Stripe-Roundtrip

### `/settings/account` anpassen

- Bei `auth.isPro === true`: zusätzlicher Button „Abo verwalten" → `billing.openPortal()`
- Query-Param-Handler:
  - `?checkout=success` → grüner Toast (i18n: „Vielen Dank, Pro ist aktiv!"), `auth.refresh()`, URL sauber machen
  - `?checkout=cancel` → neutraler Toast (i18n: „Checkout abgebrochen")

### i18n

Neue Keys in `messages/{de,en,es}.json`:

- `billing_paywall_monthly`, `billing_paywall_yearly`
- `billing_currency_switch_eur`, `billing_currency_switch_usd`
- `billing_checkout_success_toast`, `billing_checkout_cancel_toast`
- `billing_portal_button`
- `billing_checkout_failed_toast`

## Environment-Variablen

Neu:

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_MONTHLY_EUR=price_...
STRIPE_PRICE_MONTHLY_USD=price_...
STRIPE_PRICE_YEARLY_EUR=price_...
STRIPE_PRICE_YEARLY_USD=price_...
PUBLIC_APP_URL=https://coach.tt-playbook.de   # evtl. schon da
```

Test-Mode: `sk_test_…` + `whsec_…` (Stripe-CLI-generiert) für lokale Entwicklung.

## Dependencies

Neu: `stripe` (offizielles Node-SDK). Prebuilts, keine native-gyp-Probleme, kompatibel mit Mittwald-Node-Umgebung.

## Testing

### Unit-Tests (colocated in `src/`)

- `currency-detection.test.ts` — Timezone-Input → erwartete Währung
- `webhook-handler.test.ts` — jedes unterstützte Event mit Mock-DB, Assertions auf User-Row nach Verarbeitung, Idempotenz-Test
- `billing-session.test.ts` — Checkout-Session-Builder: welche Price-ID bei welcher Combo, Metadata korrekt gesetzt

### Lokaler E2E

- `stripe listen --forward-to localhost:5173/api/billing/webhook` → signed Test-Events lokal
- Stripe Test-Karten:
  - `4242 4242 4242 4242` — Success
  - `4000 0000 0000 0002` — Decline
  - `4000 0025 0000 3155` — 3DS required
- Happy Path: Signup → Paywall-Trigger → Checkout → Success-Toast → Pro-UI → Portal öffnen
- Fehlerpfad: Checkout abbrechen → Cancel-Toast, kein DB-Write

### Prod-E2E

- Zuerst Test-Mode-Keys auf Live-Domain durchspielen
- Dann ein realer 9,90-€-Kauf mit eigener Karte → sofort kündigen → Refund via Dashboard
- Mindestens einen Renewal-Test via Stripe-CLI `trigger customer.subscription.updated`

## Deploy-Reihenfolge (Mittwald)

1. Code pushen — App läuft, aber Billing-Endpoints liefern 500 bis ENV-Vars gesetzt
2. Stripe-Dashboard: Produkt + 4 Prices anlegen → Price-IDs notieren
3. `.env` auf Server erweitern (Stripe-Keys, Price-IDs), scp'en, App-Restart via `mw app update --entrypoint`
4. Webhook-Endpoint in Stripe-Dashboard anlegen → Signing-Secret in `.env` ergänzen, erneut Restart
5. Test-Kauf mit Test-Mode-Keys durchspielen
6. Auf Live-Keys umschalten, erneut Restart, kleiner echter Kauf als Final-Check

## Offene Risiken / bekannte Limitationen

- **Timezone-Detection nicht 100 % akkurat** — VPN-Nutzer oder Laptop-im-Ausland können falsche Currency sehen. Override-Link löst das, Edge-Case ist selten.
- **`proUntil` bei Kündigung bleibt stehen** — bewusst, damit Stripe-Periode korrekt ausgespielt wird. Cronjob zum „Ablaufen lassen" nicht nötig, weil `auth.isPro` auf `proUntil > Date.now()` prüft.
- **Webhook-Ausfall bedeutet verzögerte Pro-Aktivierung** — Success-Redirect zeigt Toast, aber DB-Update kommt erst mit Webhook. Mitigation: Success-Handler ruft `auth.refresh()` mit 2-Sekunden-Retry. Bei weiter unvermitteltem Fail: Admin-Panel-Fallback.
- **Preis-Änderungen** — neue Price-IDs in Stripe anlegen, ENV-Vars aktualisieren, Bestandskunden behalten ihre alte Price-ID (Stripe-Standard).
- **Kein Upgrade/Downgrade-Path in-app** — Portal handhabt das. Explizites UI kommt wenn User es nachfragen.

## Out-of-Scope-Bestätigung

Explizit NICHT in diesem Spec (kommt in Folge-Specs):

- Offline-Pro-Token (signiertes JWT)
- Lokales Pro-Caching für Flugmodus-Nutzung
- Proration bei Plan-Wechsel
- Rabatt-/Gutscheincodes
- Team-Abos (mehrere User pro Subscription)
- In-App-Purchases über App-Stores
- Bounce-Handling für fehlgeschlagene Rechnungsmails (Resend-Webhook)
