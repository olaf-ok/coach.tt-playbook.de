# Cloud-Sync Design

**Status:** Approved, ready for implementation plan
**Datum:** 2026-04-19
**Ziel:** Übungen, Playlists und persönliche Einstellungen auf Server speichern, damit sie geräteübergreifend verfügbar sind und bei Cache-Clear/Device-Wechsel nicht verloren gehen. Basis für Sharing-System (Folge-Spec).

---

## Kernentscheidungen

| Thema | Entscheidung |
|-------|--------------|
| Sync-Pattern | Cloud-Backup (Server = Wahrheit, Client = Cache), Last-Write-Wins pro Entity |
| Konflikt-Resolution | Timestamp-basiert, kein CRDT, kein Versions-Vektor |
| Zielgruppe | Alle User (Free + Pro, kein Pro-Gate) |
| Settings-Sync | Ja (Theme, Sprache, Billing-Currency); Ausnahmen explizit whitelist-basiert. Pro-Status kommt separat via `auth.init()` aus `users.pro_until` — nicht im Sync-Settings-Objekt |
| Storage-Backend | Bestehende SQLite (`server/auth/db.ts`), JSON-Blob pro Entity |
| Client-Storage | Bestehende IndexedDB via Dexie, Schema-Migration v3 → v4 |
| Trigger-Modell | Push: debounced 500ms nach Mutation · Pull: Login + Focus/Online-Event · Kein Polling |
| Offline-Verhalten | Persistente Push-Queue in IndexedDB, flush bei Reconnect |
| Delete-Semantik | Soft-Delete via `deletedAt`-Feld (verhindert Wiederauferstehung durch Offline-Queues) |
| Externe Vendors | Keine (kein Firebase/Supabase); alles auf bestehender Mittwald-Infra |

## Was NICHT im Scope ist

- **Sharing-System** (Spec 2, baut auf dieser Foundation auf)
- **JSON-Export/Import** (könnte später als Zusatz-Feature; nicht blockierend für Sync)
- **Binary-Daten** (Thumbnails werden aus Strokes regeneriert; Video-Support nicht geplant)
- **Conflict-Resolution-UI** (silent Last-Write-Wins reicht für Single-User-Multi-Device)
- **Team-Accounts / geteilte Workspaces** (Phase ≥2)
- **Realtime-Updates per WebSocket** (Fokus-Trigger reicht)

---

## Architektur

**Prinzip:** Client mutiert IndexedDB wie bisher. Dexie-Hooks automatisieren `updatedAt`-Stamps und queuen Änderungen. Sync-Client flushed Queue debounced an Server. Server hält kanonische Kopie, Client zieht Änderungen bei Focus/Login.

```
┌────────────────┐      POST /api/sync/push              ┌────────────────┐
│  Client        │ ─────────────────────────────────────▶│  Server        │
│  IndexedDB     │      GET  /api/sync/pull?since=ts     │  SQLite        │
│  (Dexie)       │ ◀─────────────────────────────────────│  (node:sqlite) │
│  + SyncClient  │      POST /api/sync/reset             │  + sync/*      │
└────────────────┘                                        └────────────────┘
```

**Neue Bausteine:**

```
server/sync/                    (NEU)
  db.ts                         Migration v3: sync_exercises, sync_playlists, sync_settings
  pull.ts                       getChangesSince(userId, since) → payload
  push.ts                       applyChanges(userId, payload) → {accepted, rejected}
  reset.ts                      resetUserData(userId)
  schema.ts                     Zod-Payload-Validierung

src/routes/api/sync/            (NEU)
  pull/+server.ts
  push/+server.ts
  reset/+server.ts

src/lib/sync/                   (NEU)
  client.svelte.ts              Reactive SyncClient mit Runes
  queue.ts                      Pure PushQueue (FIFO, dedupliziert)
  triggers.svelte.ts            Focus/Online/Login-Listener
  status.svelte.ts              Reactive Status-Store
  dbhooks.ts                    Dexie-Hooks: auto-updatedAt, soft-delete, enqueue
  settings-whitelist.ts         SYNCED_SETTING_KEYS constant
  initial-sync.ts               Ersteinrichtungs-Flow (Merge-Dialog-Logik)

src/lib/components/
  SyncStatusDot.svelte          Sidebar + MobileHeader Indikator
  SyncStatusPanel.svelte        Detail-Panel bei Tap
  InitialSyncMergeDialog.svelte Merge-Entscheidung bei Erstlogin
```

---

## Datenmodell

### Server — neue SQLite-Tabellen

```sql
CREATE TABLE sync_exercises (
  user_id      TEXT    NOT NULL,
  id           TEXT    NOT NULL,
  updated_at   INTEGER NOT NULL,    -- Client-Unix-ms
  deleted_at   INTEGER,             -- NULL = existent, sonst Soft-Delete-Zeitpunkt
  data         TEXT    NOT NULL,    -- JSON-Blob der Exercise
  PRIMARY KEY (user_id, id)
);
CREATE INDEX idx_sync_ex_updated ON sync_exercises(user_id, updated_at);

CREATE TABLE sync_playlists (
  user_id      TEXT    NOT NULL,
  id           TEXT    NOT NULL,
  updated_at   INTEGER NOT NULL,
  deleted_at   INTEGER,
  data         TEXT    NOT NULL,    -- JSON inkl. exerciseIds[]
  PRIMARY KEY (user_id, id)
);
CREATE INDEX idx_sync_pl_updated ON sync_playlists(user_id, updated_at);

CREATE TABLE sync_settings (
  user_id      TEXT    PRIMARY KEY,
  updated_at   INTEGER NOT NULL,
  data         TEXT    NOT NULL     -- JSON mit Theme, Language, etc.
);
```

**Warum JSON-Blob:** Exercise hat geschachtelte Strokes, Playlist referenziert Exercise-IDs. Server muss nie in den Feldern suchen — nur per-user-key lesen/schreiben. Normalisierte Spalten würden jede Datenmodell-Evolution zu einer SQL-Migration machen. Bei JSON bleibt's eine Code-Änderung am Client.

**Foreign Key:** Kein explizites `FOREIGN KEY (user_id) REFERENCES users(id)` — Account-Löschung triggert explizit `resetUserData(userId)` im Delete-Handler, damit auch Soft-Deletes hart weg sind.

### Client — IndexedDB-Migration v3 → v4

Dexie-Schema erweitert um zwei Felder pro syncbarer Entity:

```typescript
// src/lib/db/database.ts — Version 4
db.version(4).stores({
  exercises: 'id, name, updatedAt, deletedAt',
  playlists: 'id, name, updatedAt, deletedAt',
  settings:  'id, updatedAt'
}).upgrade(async tx => {
  const now = Date.now();
  await tx.table('exercises').toCollection().modify(e => {
    e.updatedAt ??= now;
    e.deletedAt ??= null;
  });
  await tx.table('playlists').toCollection().modify(p => {
    p.updatedAt ??= now;
    p.deletedAt ??= null;
  });
});
```

Idempotent via `??=`. Bestehende Rows bekommen `Date.now()` als Default — beim ersten Sync werden sie vom Server entweder übernommen oder überschrieben.

### Settings-Whitelist

```typescript
// src/lib/sync/settings-whitelist.ts
export const SYNCED_SETTING_KEYS = [
  'theme',              // 'auto' | 'light' | 'dark' — aktuell in localStorage via theme/store.svelte.ts
  'language',           // 'system' | 'de' | 'en' | 'es' — aktuell in localStorage via i18n/language-store
  'billingCurrency',    // 'eur' | 'usd' — aktuell in localStorage via billing/client.svelte
] as const;

export const LOCAL_ONLY_KEYS = [
  'tt-pairing-code',           // Device-gebunden
  'tt-mobile-hint-dismissed',  // Device-gebunden
  'tt-playbook-seeded',        // obsolet, bleibt
  'splash-shown',              // sessionStorage, egal
];
```

**Implementierung:** Die genannten Stores lesen/schreiben weiter lokal (wie bisher), werden aber um einen Sync-Hook erweitert: bei Änderung wird das zentrale `settings`-Objekt in Dexie aktualisiert (`{ theme, language, billingCurrency, updatedAt: Date.now() }`) → triggert Push. Beim Pull wird das Settings-Objekt angewendet → Stores bekommen neue Werte → localStorage wird aktualisiert.

Regel: **User-Präferenz = synced · Device-State = local.** Whitelist statt Blacklist, damit neue Keys explizit eingepflegt werden müssen.

---

## API-Endpoints

Alle unter `src/routes/api/sync/`, hinter Auth-Middleware (`event.locals.user.id` required oder 401).

### `GET /api/sync/pull?since=<timestamp>`

**Request:** `?since=<unix-ms>` (optional; ohne → voller Snapshot)

**Response 200:**
```json
{
  "exercises": [{ "id": "...", "updatedAt": 123, "deletedAt": null, "data": {...} }, ...],
  "playlists": [{...}],
  "settings":  { "updatedAt": 123, "data": {...} } | null,
  "serverTime": 1713484800000
}
```

Liefert alle Rows des Users mit `updated_at > since` inkl. Soft-Deletes (Client lernt so von Löschungen). `serverTime` kommt für Debug-Logs, wird nicht als Clock-Source verwendet.

### `POST /api/sync/push`

**Request-Body:**
```json
{
  "exercises": [{ "id": "...", "updatedAt": 123, "deletedAt": null, "data": {...} }, ...],
  "playlists": [{...}],
  "settings":  { "updatedAt": 123, "data": {...} } | null
}
```

**Validierung (Zod):**
- `updatedAt`: Integer > 0, max. `Date.now() + 60_000` (Clock-Skew-Toleranz)
- `data`: Object, Max-Tiefe 10, Max-String-Längen pro Feld
- Gesamt-Payload: max. 5 MB

**Server-Logik pro Entity:**
```
IF existing.updated_at >= incoming.updatedAt  → rejected (neuere Version bereits da)
ELSE                                          → UPSERT, accepted
```

**Response 200:**
```json
{
  "accepted": { "exercises": ["id1", "id2"], "playlists": [...], "settings": true },
  "rejected": { "exercises": ["id3"], "playlists": [], "settings": false },
  "serverTime": 1713484800000
}
```

**Response 413** bei Payload-Überschreitung → Client splittet rekursiv in Halbsätze und retried.

### `POST /api/sync/reset`

**Request:** leer (userId via Session)

**Server:**
- Setzt `deleted_at = NOW()` auf alle Rows des Users (soft)
- Hard-Delete läuft cron-basiert nach 30 Tagen (Grace-Period für Panik-Reset-Regret)

**Response 200:** `{ serverTime: ... }`

Client macht danach voller Pull → IndexedDB wipe → frischer Zustand.

### Rate-Limits

Neue Actions im bestehenden `server/auth/ratelimit.ts`-System:

| Action | Limit | Grund |
|--------|-------|-------|
| `sync_pull` | 60/min | Fokus-Trigger kann häufig feuern |
| `sync_push` | 60/min | Debouncer limitiert eh clientseitig |
| `sync_reset` | 3/Stunde | Schutz gegen Missbrauch |

Bei Überschreitung: HTTP 429 mit `Retry-After`-Header. Client handled via Exponential Backoff.

---

## Client-Sync-Logik

### SyncClient (`client.svelte.ts`)

```typescript
class SyncClient {
  status = $state<'idle'|'pending'|'syncing'|'offline'|'error'>('idle');
  lastSyncAt = $state<number | null>(null);
  lastError = $state<string | null>(null);
  queueSize = $state(0);

  async init(userId: string) { /* resume queue, initial pull wenn neu */ }
  async pull(): Promise<void>  { /* GET /api/sync/pull?since=lastSyncAt */ }
  async push(): Promise<void>  { /* POST /api/sync/push mit Queue-Inhalt */ }
  async reset(): Promise<void> { /* POST /api/sync/reset + voller pull + wipe */ }

  private debouncedPush = debounce(() => this.push(), 500);
  private backoff = new ExponentialBackoff(1_000, 300_000); // 1s bis 5min
}
```

**Lifecycle:**
- `auth.init()` → wenn User eingeloggt, `sync.init(user.id)`
- Logout → `sync.clearLocal()` (IndexedDB + Queue wipe)
- Login mit anderem User-ID → Reset + fresh Pull

### PushQueue (`queue.ts`)

- Persistent in IndexedDB-Tabelle `syncQueue` (überlebt Browser-Crash)
- FIFO pro Entity-Typ, **dedupliziert per `(type, id)`** — nur letzte Version bleibt
- Flush: alles in einem Batch POST, bei Accept Queue leeren
- Bei 429/5xx: Queue behalten, Backoff, Retry

### Trigger (`triggers.svelte.ts`)

| Trigger | Aktion |
|---|---|
| `sync.init()` mit User | voller Pull (since=0 oder lastSyncAt) |
| Dexie create/update/delete-Hook | `queue.enqueue()` → `debouncedPush()` |
| `window.addEventListener('focus')` | `push()` → dann `pull()` |
| `document.visibilitychange` → visible | wie focus |
| `window.addEventListener('online')` | Queue flush, dann pull |
| Settings-Mutation (Theme/Sprache) | wie Dexie-Hook |
| Manuell „Jetzt syncen" im Panel | synchrones push+pull mit Spinner |

**Kein Interval-Polling** — spart Server-Last. Fokus-Trigger fangen alle realen Szenarien.

### Dexie-Hooks (`dbhooks.ts`)

```typescript
db.exercises.hook('creating', (_pk, obj) => { obj.updatedAt = Date.now(); obj.deletedAt = null; });
db.exercises.hook('updating', (mod) => { mod.updatedAt = Date.now(); });
db.exercises.hook('deleting', (pk, obj, trans) => {
  trans.abort();
  db.exercises.update(pk, { deletedAt: Date.now(), updatedAt: Date.now() });
});
// nach jedem Hook zusätzlich:
// queue.enqueue({ type: 'exercise', id: pk })
```

**Code der Exercises/Playlists liest** bekommt zentrale Utilities:
- `activeExercises()` = `db.exercises.filter(e => e.deletedAt === null)`
- `activePlaylists()` = analog

Call-Sites in `/archive`, `/playlists`, Sidebar-Archiv etc. werden auf diese Utility umgestellt.

### Initial-Sync (`initial-sync.ts`)

Beim ersten Sync nach Deploy (`lastSyncAt` nicht gesetzt):

```
1. Pull vom Server (since=0)
2. localCount = await activeExercises().count() + activePlaylists().count()
3. serverCount = response.exercises.length + response.playlists.length
4. IF serverCount > 0 AND localCount > 0:
     → Zeige InitialSyncMergeDialog
       Options:
         [Beide behalten]       → Lokale bekommen fresh updatedAt, push
         [Nur Server behalten]  → Local wipe, apply server data
         [Nur Lokal behalten]   → Server-Daten ignorieren, push lokale
5. IF serverCount > 0 AND localCount == 0:
     → Apply server data silently
6. IF serverCount == 0 AND localCount > 0:
     → Alle lokalen bekommen updatedAt=Date.now(), push silently
7. IF beide 0: nothing to do
8. lastSyncAt = serverTime, normaler Sync-Modus
```

**Merge-Konflikt bei gleicher Exercise-ID** (sehr unwahrscheinlich, weil client-generierte UUIDs): Server gewinnt, lokale Kopie bekommt neue ID + Name-Suffix „(lokal)".

### Status-UI

**`SyncStatusDot`** in:
- Sidebar (Desktop): zwischen Logo und Tab-Icons, 8×8 px
- MobileHeader: rechts oben neben TV-Dot

**Farben:**
- grün → `idle` + `lastSyncAt < 2 min ago`
- blau pulsierend → `syncing`
- gelb → `pending` (Queue hat Einträge, wartet auf Flush)
- grau → `offline`
- rot → `error` (Tooltip mit Fehlermeldung)

**`SyncStatusPanel`** (öffnet bei Tap):
- Status-Text: „Synchronisiert", „Wird synchronisiert…", „Offline, 3 Änderungen warten", „Fehler — erneut versuchen"
- „Zuletzt synchronisiert vor X Min"
- [Jetzt synchronisieren]-Button
- [Dieses Gerät zurücksetzen]-Button mit Confirm-Dialog

**i18n-Keys:** ~12 neue in DE/EN/ES.

---

## Edge-Cases

| Fall | Verhalten |
|---|---|
| Zwei Tabs desselben Users | Beide pushen eigene Mutationen, pullen bei Fokus. Last-Write-Wins. |
| Browser-Cache-Clear | IndexedDB weg. Re-Login → Initial-Sync holt alles zurück. |
| Logout-Re-Login gleicher User | Wipe + fresh Pull. |
| Login anderer User gleicher Browser | Wipe + fresh Pull für neuen User. |
| 401 beim Sync (Session expired) | Auth-Middleware redirectet eh. Sync pausiert bis Re-Login. |
| 5xx-Server-Error | Exponential Backoff 1s → 5min. Status bleibt `error` mit Retry. |
| Payload >5 MB | Server 413 → Client rekursiv halbieren (`exercises[0..n/2]`, `exercises[n/2..n]`). |
| Clock-Skew (Client-Uhr falsch) | Server verwirft `updatedAt > now+60s`. Client bekommt `rejected`, loggt Warnung. |
| Offline beim Save | Queue speichert persistent. Online-Event triggert flush. |
| Sync-Error bei partial push | Server akzeptiert was geht, rejected Rest. Client entfernt **beide** aus Queue (Rejected heißt: Server hat neuere Version → wird beim nächsten Pull ohnehin übernommen). |
| User löscht Account | Route `/api/account/delete` triggert `resetUserData()` + User-Zeile-Delete + Session-Delete. |

---

## Migration bestehender User-Daten

**Bestandslage:** Nach Deploy haben alle existierenden User (Olaf + Test-Accounts + frühe Beta-User) IndexedDB-Übungen, aber keinen Server-State.

**Ablauf:**

1. Deploy macht Client-Code mit Sync aktiv
2. User loggt sich ein → `auth.init()` → `sync.init()` → `initialSync()`
3. Server-Pull: `serverCount === 0`
4. Lokal-Check: `localCount > 0`
5. → Alle lokalen bekommen `updatedAt = Date.now()`, `deletedAt = null`
6. → Push in einem (ggf. gesplitteten) Batch
7. `lastSyncAt` = serverTime
8. Ab jetzt normaler Sync-Modus

**Keine User-Aktion nötig.** Dialog erscheint nur wenn sowohl Server als auch Client nicht-leer sind (Cross-Device-Szenario, bei dem User bereits auf zweitem Gerät Daten angelegt hat).

**Rollback:** Env-Var `SYNC_ENABLED=false` → Server gibt 503 auf Sync-Endpoints → Client fällt in Lokal-Only-Modus zurück, IndexedDB unberührt, keine Daten-Verluste.

---

## DSGVO / Legal-Pages-Update

**Neue Datenkategorie in Privacy-Policy:** "Trainingsdaten"

- **Was:** Übungen (Zeichnungen, Namen, Schritte), Playlists (Namen, Zuordnungen), Einstellungen (Theme, Sprache, Währung)
- **Zweck:** Geräteübergreifender Zugriff, Datensicherung, Wiederherstellung nach Cache-Verlust
- **Speicherort:** Server OK-MARKED LLC (gehostet bei Mittwald, Deutschland)
- **Speicherdauer:** bis Account-Löschung (User-Aktion), dann kaskadierende Löschung aller `sync_*`-Rows + 30-Tage-Grace auf Soft-Delete
- **Rechtsgrundlage:** Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung — zentrale Produktfunktion)
- **Daten-Export:** `/settings/account` bekommt „Alle meine Daten exportieren" → JSON-Download (Exercises + Playlists + Settings)
- **Daten-Löschung:** Account-Löschung (bereits vorhanden) löscht ab jetzt auch Sync-Tabellen

**Keine explizite Opt-In-Hürde** — Sync ist zentrale Produktfunktion, nicht optional-trackend. Einmaliger Info-Toast beim ersten Sync-Event:

> „Deine Übungen werden ab jetzt zwischen deinen Geräten synchronisiert. Mehr in den Datenschutzbestimmungen."

Dismissable, nicht blockend. Flag `hasSeenSyncNotice` im synced Settings-Objekt.

**Legal-Pages-Änderungen:**
- `src/lib/legal/privacy.ts` + `privacy.en.ts` + `privacy.es.ts` — neuer Abschnitt „Trainingsdaten" (3 Sprachen)
- `src/lib/legal/terms.ts` — Erweiterung der Leistungsbeschreibung um „Server-seitige Datensicherung"
- Anwalts-Review steht eh auf Todo-Liste

---

## Tests

**Server-Tests (Vitest, Node-Env, In-Memory-SQLite):**

| Datei | Coverage |
|---|---|
| `server/sync/db.test.ts` | Schema-Migration v2→v3, Idempotenz, Unique-Constraint |
| `server/sync/pull.test.ts` | Leerer User, seit-Filter, Soft-Deletes sichtbar, User-Isolation |
| `server/sync/push.test.ts` | Accept bei neuerer Version, Reject bei älterer, Settings-Upsert, Clock-Skew-Grenze |
| `server/sync/reset.test.ts` | Soft-Delete aller User-Rows, andere User unberührt |
| `server/sync/schema.test.ts` | Zod-Validation (happy + boundary + adversarial) |

**Client-Tests (Vitest, jsdom + fake-indexeddb):**

| Datei | Coverage |
|---|---|
| `src/lib/sync/queue.test.ts` | FIFO, Dedup, Persistence-Roundtrip |
| `src/lib/sync/status.test.ts` | State-Transitions, Backoff, Error-Recovery |
| `src/lib/sync/dbhooks.test.ts` | Auto-updatedAt bei create/update, Soft-Delete-Conversion |
| `src/lib/sync/initial-sync.test.ts` | 4 Branches (leer/leer, leer/lokal, server/leer, beide) |

**E2E via browser-use (zwei Browser-Tabs):**

1. Tab A erstellt Exercise → Tab B Fokus-Wechsel → Exercise sichtbar
2. Tab A offline → Exercise ändern → Queue-Indikator gelb → online → grün
3. Tab A löscht Exercise → Tab B Pull → Exercise weg
4. Initial-Sync: fresh Browser mit bestehendem Account → Pull bringt alles

**Ziel:** +~30 Tests (aktuell 185 → ~215).

---

## Rollout

**Phase 1 — Dark Launch (nach Deploy, ~30 Min)**
- Endpoints live
- Client-seitiger Feature-Flag: Sync aktiviert **nur für `ADMIN_EMAILS`**
- Olaf testet iPad + Desktop-Browser + Mobile, prüft Initial-Sync, Merge-Dialog

**Phase 2 — Public Rollout**
- Feature-Flag raus (oder Env-Var `SYNC_ENABLED=true`)
- Nächste Login alle Bestandsuser triggern Initial-Sync automatisch

**Feature-Flag-Implementation:**
- Env-Var `SYNC_ENABLED` (default `true` ab Phase 2)
- Wenn `false`: Server-Endpoints liefern 503 mit `Retry-After: 300`
- Client-Code detected 503 → fällt zurück auf lokal-only, ohne Fehler-Popup

**Rollback:** `SYNC_ENABLED=false` setzen, App-Restart. Lokale IndexedDB-Daten bleiben, nichts geht verloren.

---

## Monitoring

- Sync-Errors im bestehenden `/tmp/app.log` via `console.error` im Handler
- Admin-Panel `/admin/users` bekommt zwei neue Spalten:
  - „Letzter Sync" (Datum oder „nie")
  - „Sync-Storage" (Summe der JSON-Blob-Größen, z.B. „12 KB")
- Keine externen Error-Tracker

---

## Offene Folgepunkte (für Spec 2: Sharing oder später)

- **Sharing-System** (Spec 2) baut auf `sync_exercises`/`sync_playlists`-Tabellen direkt auf. Share-Records sind separate Tabelle mit Referenz `(user_id, entity_id)`.
- **JSON-Export** (`/settings/account` → „Daten exportieren") kann parallel zu Sharing oder später.
- **Binary-Daten / Video** (wenn Coach's-Eye-Feature kommt) — explizit nicht in MVP. Braucht Object-Storage statt SQLite-Blob.
- **Storage-Limits** — falls User 10k Übungen anlegt, beobachten. Derzeit keine Limits (unrealistische Größe).
- **Offline-Queue-Visibility** — „3 Änderungen warten auf Sync" ist sichtbar, aber Detail-Liste („was genau?") nicht. Bei Bedarf Phase 2.

---

## Aufwand-Schätzung

| Block | Tasks | Tage |
|---|---|---|
| Server (DB, Endpoints, Tests) | 5 Tasks | 1,5 |
| Client (Sync-Client, Queue, Hooks, Tests) | 6 Tasks | 1,5 |
| Status-UI (Dot, Panel, i18n) | 3 Tasks | 0,5 |
| Initial-Sync-Flow + Merge-Dialog | 2 Tasks | 0,5 |
| Legal-Pages + DSGVO-Update | 1 Task | 0,5 |
| E2E via browser-use | 1 Task | 0,5 |
| Rollout + Admin-Panel-Erweiterung | 1 Task | 0,25 |
| **Gesamt** | **~19 Tasks** | **~4–4,5 Tage** |

Dauert länger wenn Code-Reviews Gaps finden — Plan-Schritt liefert genaue Task-Aufschlüsselung.
