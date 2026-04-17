# Auth-Backend Design

**Status:** Approved, ready for implementation plan
**Datum:** 2026-04-17
**Ziel:** Mock-Login in `/settings/account` durch echtes E-Mail/Passwort-Auth mit Session-Cookies ersetzen. Stripe-Integration folgt separat.

---

## Kernentscheidungen

| Thema | Entscheidung |
|-------|--------------|
| Mail-Service | Resend (3000/Monat gratis, REST-API) |
| Signup-Felder | E-Mail + Passwort (kein Name) |
| Session | Cookie + DB-Lookup (nicht JWT) |
| Session-Dauer | 30 Tage, sliding window |
| E-Mail-Verifikation | Double Opt-In (Pflicht vor Login) |
| Pro-Status | `users.pro_until`-Spalte (kein Offline-Token im MVP) |
| Passwort-Hashing | argon2id (Lib `argon2`) |
| Passwort-Minimum | 10 Zeichen, keine Komplexitätsregeln |
| DB | SQLite (better-sqlite3), Datei `./data/auth.db` |

## Was NICHT im Scope ist

- Stripe-Integration (separate Session, nach Auth)
- Signiertes Offline-Pro-Token (kommt mit Stripe)
- OAuth/Social-Login (Phase 2)
- Cloud-Sync der Übungen (Phase 2, IndexedDB bleibt gerätegebunden)
- i18n der Mails (nur DE im MVP)
- Forced-Signup-Screen (App bleibt für anonyme User voll nutzbar bis 5 Übungen)
- Device-Binding / "Aktive Sitzungen"-UI (Felder in DB vorhanden für Phase 2)

---

## Architektur

**Neue Bausteine:**

```
server/
  production.ts              (bestehend — SvelteKit + WS)
  auth/                      (NEU)
    db.ts                    better-sqlite3 connection + migrations
    password.ts              argon2id hash/verify
    sessions.ts              create/validate/refresh/delete
    tokens.ts                verification + reset tokens
    ratelimit.ts             in-memory + SQLite fallback
    mailer.ts                Resend-Wrapper (+ MAIL_MODE=console für Dev)
    schema.sql               users, sessions, tokens, rate_limits

src/routes/
  api/auth/                  (NEU — SvelteKit +server.ts)
    signup/+server.ts
    login/+server.ts
    logout/+server.ts
    request-reset/+server.ts
    reset-password/+server.ts
    resend-verification/+server.ts
    me/+server.ts
  verify-email/
    +page.svelte             Landing "Check deine Mails"
    [token]/+page.server.ts  Token-Einlösung → auto-login + redirect
  reset-password/
    [token]/+page.svelte     Neues-Passwort-Form
  settings/account/          (bestehend — Mock raus, echtes UI rein)

src/hooks.server.ts          (NEU — Cookie → event.locals.user)
src/app.d.ts                 (locals.user typen)

src/lib/auth/
  client.svelte.ts           Reactive Auth-State (ersetzt pro/status-Teil)
```

**Entscheidungen:**

1. **SvelteKit-native Endpoints** (`+server.ts`), kein separater Express-Server. `server/production.ts` wraps den SvelteKit-Handler eh schon — same-origin, keine CORS-Probleme.
2. **SQLite-Datei** in `./data/auth.db` (in `.gitignore`, Mittwald-SSH persistent). Separates File, damit später leicht zu Postgres migrierbar.
3. **`event.locals.user`** ist Single Source of Truth — `hooks.server.ts` liest Cookie, DB-Lookup, setzt `event.locals.user` (User oder `null`). Alle Endpoints + Pages lesen von dort.
4. **Mail-Versand fire-and-forget** — Signup-Response kommt sofort, Mail läuft im Hintergrund (`.catch(log)`). Resend-Delay blockt nicht.

---

## Datenmodell (SQLite)

```sql
CREATE TABLE users (
  id              TEXT PRIMARY KEY,          -- uuid v7
  email           TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash   TEXT NOT NULL,             -- argon2id
  email_verified  INTEGER NOT NULL DEFAULT 0,
  pro_until       INTEGER,                   -- unix ms, NULL = free
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL
);

CREATE TABLE sessions (
  token_hash    TEXT PRIMARY KEY,            -- sha256(token), nie raw
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at    INTEGER NOT NULL,
  expires_at    INTEGER NOT NULL,            -- sliding: refreshed on each request
  user_agent    TEXT,
  ip            TEXT
);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

CREATE TABLE verification_tokens (
  token_hash   TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at   INTEGER NOT NULL              -- +24h
);

CREATE TABLE reset_tokens (
  token_hash   TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at   INTEGER NOT NULL,             -- +1h
  used_at      INTEGER                       -- one-shot: NULL bis eingelöst
);

CREATE TABLE rate_limits (
  key         TEXT PRIMARY KEY,              -- z.B. 'login:ip:1.2.3.4'
  count       INTEGER NOT NULL,
  window_end  INTEGER NOT NULL
);
```

**Detail-Entscheidungen:**

- **Nur Token-Hashes in DB**, keine Klartexte. Raw-Token wird einmal generiert, im Cookie/Mail gesendet, sofort vergessen. DB-Leak → keine Sessions übernehmbar.
- **`email COLLATE NOCASE`** — case-insensitive Unique.
- **uuid v7** (zeit-sortiert, gute Index-Performance) für alle IDs.
- **`pro_until` als INTEGER** (unix ms), nicht Boolean — ermöglicht Stripe-Ablaufdatum ohne Schema-Änderung. `pro_until > Date.now()` = aktiv.
- **`ON DELETE CASCADE`** — User-Löschung räumt Sessions + Tokens mit.
- **Migrations:** `PRAGMA user_version` + Array von SQL-Blöcken in `db.ts`. Keine Lib (Knex/Drizzle) — bei diesem Scope Overkill.

---

## API-Endpoints

Alle unter `src/routes/api/auth/*/+server.ts`, JSON in/out, Cookies via SvelteKit-`cookies`.

### `POST /api/auth/signup`

```
Request:  { email, password }
Response: 200 { message: "Bestätigungs-Mail verschickt" }  // immer generic
```

Flow:
1. Rate-Limit IP (3/h) → 429 wenn überschritten
2. Validate (RFC-Email-Format, password ≥ 10) → 400
3. Existiert `users.email`? → 200 generic + Mail "jemand hat mit deiner Mail versucht zu registrieren, logge dich ein" (kein Enumeration-Leak)
4. Sonst: User anlegen, `email_verified=0`, `pro_until=null`
5. verification_token (32 random bytes, base64url), hash in DB, `expires=+24h`
6. Mail async senden, nicht blockierend

### `GET /verify-email/[token]` (SvelteKit-Page)

In `+page.server.ts`:
1. Token-Hash in `verification_tokens`? (`expires > now`)
2. Wenn ja: `users.email_verified=1`, Token löschen, Session erzeugen (auto-login), Cookie setzen, redirect `/draw` mit Success-Toast
3. Wenn nein: Error-Page "Link ungültig oder abgelaufen" + Button "Neue Mail anfordern"

### `POST /api/auth/resend-verification`

```
Request:  { email }
Response: 200 generic (immer)
```

Flow:
1. Rate-Limit Email (3/h) → 429
2. User by email (nur wenn existiert und `!email_verified`): neuen Token + Mail
3. Always 200 generic

### `POST /api/auth/login`

```
Request:  { email, password }
Response: 200 { user: { id, email, proUntil, emailVerified } }
          401 { error: "E-Mail oder Passwort falsch" }
          403 { error: "Bitte bestätige zuerst deine E-Mail", canResend: true }
          429 { error: "Zu viele Versuche, bitte warten" }
```

Flow:
1. Rate-Limit IP (5/15min) UND Email (5/15min) → 429
2. User aus DB by email
3. `argon2.verify()` — auch bei fehlendem User Dummy-Hash prüfen (Timing-Attack-Schutz)
4. `email_verified=0` → 403
5. Session erzeugen: token=32 random bytes, tokenHash=sha256, `expires=+30d`
6. Cookie: name=`ttp_session`, value=raw-token, `httpOnly; secure; sameSite=lax; maxAge=30d; path=/`

### `POST /api/auth/logout`

```
Response: 200 { ok: true }
```

Flow:
1. Cookie lesen, tokenHash berechnen
2. `sessions`-Zeile DELETE
3. Cookie löschen

### `POST /api/auth/request-reset`

```
Request:  { email }
Response: 200 { message: "Falls registriert, haben wir einen Link geschickt" }
          429 wenn Rate-Limit
```

Flow:
1. Rate-Limit Email (3/h) → 429
2. User by email. Falls existiert: reset_token, `expires=+1h`, Mail
3. Always 200 generic

### `POST /api/auth/reset-password`

```
Request:  { token, newPassword }
Response: 200 { user: {...} }
          400 { error: "Link ungültig oder abgelaufen" }
```

Flow:
1. Token-Hash in `reset_tokens`? `used_at=NULL`, `expires > now`
2. Validate password ≥ 10
3. `users.password_hash` updaten, `reset_tokens.used_at=now`
4. **ALLE** Sessions des Users löschen (Sicherheit: potentieller Angreifer wird ausgeloggt)
5. Neue Session + Cookie (auto-login), Response enthält User

### `GET /api/auth/me`

```
Response: 200 { user: { id, email, proUntil, emailVerified } }
          401 wenn keine Session
```

Flow:
1. `event.locals.user` (gesetzt durch hooks.server.ts)
2. `null` → 401
3. User-Objekt zurückgeben (ohne password_hash)

### `src/hooks.server.ts` (Auth-Middleware)

Bei jedem Request:
1. Cookie `ttp_session` lesen
2. tokenHash berechnen → `sessions`-Lookup
3. Expired? → DELETE, `event.locals.user = null`
4. Gültig? → `expires_at = now + 30d` (sliding), `event.locals.user = { id, email, proUntil, emailVerified }`

---

## Mail-Flows (Resend)

**Setup:**
- `npm i resend`
- Env in Mittwald-App-Config: `RESEND_API_KEY`, `MAIL_FROM="TT Playbook <noreply@tt-playbook.de>"`, `APP_URL="https://coach.tt-playbook.de"`
- DNS: DKIM + SPF + Return-Path-CNAME für `tt-playbook.de` (Records aus Resend-Dashboard in Mittwald-DNS eintragen)

**Templates** (als TypeScript-Template-Strings in `mailer.ts`, HTML + Plaintext-Fallback):

### Signup-Verifikation
```
Subject: Bestätige deine E-Mail für TT Playbook Trainer
Body:    Willkommen! Klick auf den Link, um deine E-Mail zu bestätigen.
         [Button: E-Mail bestätigen] → ${APP_URL}/verify-email/${token}
         Link läuft in 24 Stunden ab.
         Falls du das nicht warst, ignoriere diese Mail.
```

### Passwort-Reset
```
Subject: Passwort zurücksetzen – TT Playbook Trainer
Body:    Du hast einen Passwort-Reset angefordert.
         [Button: Neues Passwort setzen] → ${APP_URL}/reset-password/${token}
         Link läuft in 1 Stunde ab.
         Falls du das nicht warst, ignoriere diese Mail — dein Passwort bleibt unverändert.
```

**Design:** Minimal, textlastig (schützt gegen Spam-Filter, rendert überall gleich). Absender "TT Playbook" (nicht "noreply"), from `noreply@tt-playbook.de`.

**Async-Pattern:**
```ts
sendVerificationMail(user.email, token).catch(err => {
  console.error('Mail send failed:', err);
});
return json({ message: "..." });
```

**Mail-Sprache:** Nur DE im MVP. Accept-Language-Auswertung + EN/ES-Templates sind YAGNI für den aktuellen Scope.

**Resend-Webhooks** (`email.bounced`, `email.complained`): **nicht im MVP**. Einbauen wenn Bounce-Rate auffällt.

**Lokales Dev:** `MAIL_MODE=console` Env-Flag — `mailer.ts` schreibt `console.log(link)` statt Resend-Call. Keine Dev-API-Aufrufe, kein Spam-Risiko.

---

## Frontend-Integration

### Auth-Client (`src/lib/auth/client.svelte.ts`)

Ersetzt Teile von `src/lib/pro/status.svelte.ts`:

```ts
class AuthState {
  user = $state<User | null>(null);
  loading = $state(true);

  async init() {
    const res = await fetch('/api/auth/me');
    this.user = res.ok ? (await res.json()).user : null;
    this.loading = false;
  }
  get isPro() {
    return !!this.user?.proUntil && this.user.proUntil > Date.now();
  }
  async login(email, password) { /* POST + set this.user */ }
  async logout() { /* POST + this.user = null */ }
  async signup(email, password) { /* POST, user bleibt null bis Verify */ }
}
export const auth = new AuthState();
```

- Root-Layout (`+layout.svelte`) ruft `auth.init()` on mount
- Grep-Replace: `proStatus.isPro` → `auth.isPro` überall
- Dev-Toggle `proStatus.setPro()` in `/settings/pro` **raus** — in Dev reicht echter Signup mit `MAIL_MODE=console`

### UI-Seiten

**`/settings/account` (komplett neu):**
- **Eingeloggt:** E-Mail + Verified-Badge, Ausloggen-Button, Passwort-ändern-Link, Pro-Status ("Pro bis TT.MM.JJJJ" oder "Free")
- **Ausgeloggt:** Tab-Switcher "Anmelden | Registrieren", E-Mail + Passwort-Form, "Passwort vergessen?"-Link

**`/verify-email` (ohne Token, Landing nach Signup):**
- "Check deine Mails! Wir haben einen Link an *o…@x.de* geschickt."
- Button "Mail erneut senden" → POST `/api/auth/resend-verification`

**`/verify-email/[token]` (SvelteKit-Page mit `+page.server.ts`):**
- Server-Side Token-Check, Cookie setzen, redirect `/draw` wenn ok; Error-Page wenn expired

**`/reset-password/[token]` (neu):**
- Neues Passwort + Wiederholung, on submit → POST → auto-login → redirect `/draw`

**`PaywallDialog.svelte`:**
- "Bereits ein Konto? Anmelden" → Link `/settings/account`
- Upgrade-Button zeigt "Bald verfügbar" (echte Stripe-Integration = nächste Session)

### Protected Routes

**Keine.** Die App bleibt voll nutzbar für anonyme User (Zeichnen, IndexedDB, TV-Pairing, bis 5 Übungen). Login ist nur für Pro-Features. Kein Forced-Signup-Screen beim ersten Öffnen. Passt zur bestehenden Paywall-UX.

### IndexedDB + Auth

Übungen bleiben **lokal pro Gerät**. Kein Cloud-Sync im MVP. Eingeloggt ≠ Daten überall. Cloud-Sync = Phase 2. Auth dient hier ausschließlich Pro-Status + (später) Stripe-Rechnung. **Wichtig zu dokumentieren**, damit Nutzer kein falsches Mental-Model bekommen.

---

## Security-Defaults

- **Hashing:** argon2id (`argon2` npm, native). OWASP-Standard 2026, memory-hard, resistent gegen GPU-Brute-Force.
- **Passwort-Policy:** min. 10 Zeichen, keine Komplexitätsregeln. OWASP: Länge schlägt Komplexität.
- **Rate-Limiting** (pro IP + pro E-Mail separat):
  - Login: 5/15min, dann 15min Sperre
  - Signup: 3/h pro IP
  - Reset: 3/h pro E-Mail
  - Resend-Verification: 3/h pro E-Mail
  - Implementierung: in-memory Map mit SQLite-Fallback für Neustart-Resilienz
- **Token-Gültigkeit:**
  - Session: 30d sliding
  - E-Mail-Verifikation: 24h
  - Passwort-Reset: 1h, one-shot (`used_at` gesetzt → nicht mehr einlösbar)
- **Enumeration-Schutz:**
  - Login-Error: identische Meldung bei "User fehlt" und "Passwort falsch"
  - Signup-Response bei existierender Mail: generic "Bestätigungs-Mail verschickt" (echte Mail geht an bestehenden User mit anderem Inhalt)
  - Reset-Request-Response: generic "Falls registriert, haben wir einen Link geschickt"
- **Timing-Attack-Schutz:** Dummy-argon2-Verify bei fehlendem User (sonst verrät Response-Zeit Existenz)
- **Cookie:** `httpOnly; secure; sameSite=lax; path=/` — kein JS-Zugriff, nur HTTPS, keine Cross-Site-Leaks
- **SQL-Injection:** Alle Queries via prepared Statements (better-sqlite3 default)
- **Password-Reset invalidiert ALLE Sessions** des Users (potentieller Angreifer wird ausgeloggt)

---

## Testing-Strategie

### Unit-Tests (Vitest, colocation in `src/` und `server/`)

- `server/auth/password.test.ts` — argon2 hash+verify, Salt-Uniqueness
- `server/auth/tokens.test.ts` — Token-Generierung, Entropie, sha256, Expiry
- `server/auth/sessions.test.ts` — create/validate/refresh/delete, Sliding-Window, Cleanup
- `server/auth/ratelimit.test.ts` — Counter-Logik, Window-Rotation, Multi-Key
- `server/auth/db.test.ts` — Migrations idempotent, Schema-Version-Check
- `src/lib/auth/client.svelte.test.ts` — isPro-Getter, Mocked-fetch für init/login/logout

### Integration-Tests (Vitest mit in-memory SQLite)

- `server/auth/integration/signup.test.ts` — Full-Flow inkl. Mail-Mock-Call; doppelter Signup → generic Response
- `server/auth/integration/login.test.ts` — verified → Session; unverified → 403; wrong-password → 401; Rate-Limit nach 5 Versuchen
- `server/auth/integration/reset.test.ts` — request → Token → reset mit Token → alte Sessions weg, neue Session da
- `server/auth/integration/verify.test.ts` — Happy-Path + expired + already-used

### Mail-Mock

```ts
// vitest.setup.ts
vi.mock('./mailer', () => ({
  sendVerificationMail: vi.fn(),
  sendResetMail: vi.fn(),
}));
```

Tests prüfen `expect(sendVerificationMail).toHaveBeenCalledWith(email, expect.any(String))`.

### E2E via browser-use (nach Deploy)

Ein Smoke-Flow pro Haupt-Pfad:

1. **Signup + Verify + Login-Loop** — Signup → Verify-Landing → (Dev: Link aus Console) → verify-email/[token] → eingeloggt → logout → re-login → OK
2. **Passwort-Reset** — request-reset → (Dev: Link aus Console) → reset-password → neues Passwort → login mit neuem Passwort OK
3. **Paywall-Trigger** — 5 Übungen speichern → 6. → PaywallDialog → Login-Link → Login → `isPro=false` (Stripe fehlt noch, Dialog bleibt)
4. **Session-Persistence** — Eingeloggt → Refresh → `/api/auth/me` gibt User; Incognito → 401

### Security-spezifische Tests

- **Timing-Attack:** Login-Zeit `unknown-email` ≈ `known-email-wrong-password` (±50ms Toleranz)
- **Enumeration:** Signup mit existierender vs. neuer Mail → gleiche Response-Struktur + ≈ Response-Zeit

### Was NICHT getestet wird (bewusst)

- Echte Resend-API (immer gemockt, kein Dev-Spam)
- DNS/SPF/DKIM (manuell via MXToolbox nach Setup)
- Argon2-Security-Eigenschaften (Lib vertrauen)
- Session-Hijack bei gestohlenem Cookie (by design bis Device-Binding kommt, dokumentiert als bekannt)

---

## Abhängigkeiten

**Neue npm-Pakete:**
- `better-sqlite3` (DB)
- `argon2` (Hashing, native)
- `resend` (Mail-API)
- `uuid` (v7-IDs)
- `@types/better-sqlite3` (dev)

**Keine** neuen Frameworks (kein Lucia/better-auth, kein express, kein CORS-Handling).

---

## Deploy-Aspekte

- **Neue Env-Vars in Mittwald:** `RESEND_API_KEY`, `MAIL_FROM`, `APP_URL`. Kein `SESSION_SECRET` nötig — Session-Token sind cryptographic-random, Cookie trägt den raw-Token, DB speichert `sha256(token)` als Lookup-Key. Keine Signatur, kein Secret zu managen.
- **SQLite-Datei** `./data/auth.db` muss auf Mittwald persistent sein (Pfad mit App-Working-Directory abstimmen)
- **DNS-Records** für Resend (DKIM/SPF/Return-Path) in Mittwald-DNS eintragen — einmaliger Setup-Schritt, dokumentieren
- **Build** bleibt wie bisher (`NODE_OPTIONS=--max-old-space-size=1024 npx vite build`), kein Extra-Step
- **Post-Receive-Hook** keine Änderung — `npm install` zieht neue Deps automatisch

---

## Bekannte Limitationen / Follow-ups

- **IndexedDB-Daten nicht gerätübergreifend** — nach Login auf zweitem Gerät fehlen Übungen. Cloud-Sync = Phase 2.
- **Keine "Aktive Sitzungen"-UI** — `sessions.user_agent` + `ip` werden gespeichert, aber nicht angezeigt. Phase 2.
- **Kein OAuth** (Google/Apple-Sign-in) — Phase 2.
- **Mail-Sprache nur DE** — EN/ES kommt wenn internationale Signups auftauchen.
- **Pro-Status nur online prüfbar** — kein signiertes Offline-Token im MVP. Kommt mit Stripe-Integration.
- **Session-Hijack** bei gestohlenem Cookie möglich (bis Device-Binding kommt).

---

## Offene Punkte für Implementation-Plan

Der anschließende Implementation-Plan (`writing-plans`) muss klären:

1. Task-Reihenfolge (DB-Setup → Password/Tokens/Sessions → Endpoints → Hooks → Frontend)
2. Build-Kompatibilität von `argon2` und `better-sqlite3` (native Bindings) mit Mittwald-Node-Version 25.4.0
3. DNS-Setup-Prozedur für Resend (manueller Schritt, braucht Timing-Fenster im Plan)
4. Erstes lokales Dev-Setup: `data/auth.db` bei ersten Start seeden
5. Migration-Strategie für bestehende Mock-Login-User (falls vorhanden): vermutlich einfach verwerfen (nur Dev-Daten)
