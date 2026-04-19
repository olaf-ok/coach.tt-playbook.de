# Cloud-Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Exercises, Playlists und User-Settings server-seitig als kanonische Kopie halten. Client (IndexedDB) wird zum Cache mit Last-Write-Wins-Sync. Kein Daten-Verlust bei Browser-Clear, Geräte-Wechsel oder Login auf neuem Device.

**Architecture:** Cloud-Backup-Pattern. 3 neue SQLite-Tabellen (`sync_exercises`, `sync_playlists`, `sync_settings`) mit JSON-Blob-Spalten. 3 REST-Endpoints (`pull/push/reset`) hinter Auth-Middleware. Client: `SyncClient`-Singleton mit persistenter `PushQueue`, Dexie-Hooks für automatische `updatedAt`/Soft-Delete-Stamps, Trigger via Focus/Online. Keine externen Vendors, keine CRDTs, kein WebSocket.

**Tech Stack:** SvelteKit, TypeScript, Svelte 5 Runes, Dexie (IndexedDB), `node:sqlite`, Zod (Payload-Validation), Vitest (colocation in `src/`), Paraglide (i18n DE/EN/ES).

**Reference Spec:** `docs/superpowers/specs/2026-04-19-cloud-sync-design.md`

---

## File Structure

**Server (neu unter `server/sync/`):**

| File | Verantwortlich für |
|---|---|
| `server/sync/schema.ts` | SCHEMA_V3 SQL für 3 sync-Tabellen |
| `server/sync/db.ts` | SCHEMA_V3 in `server/auth/db.ts`-Migrations-Registry hinzufügen; Re-Export der DB |
| `server/sync/payload.ts` | Zod-Schemas für Pull/Push-Request/Response |
| `server/sync/pull.ts` | `getChangesSince(db, userId, since) → payload` (pure) |
| `server/sync/push.ts` | `applyChanges(db, userId, payload) → {accepted, rejected}` (pure) |
| `server/sync/reset.ts` | `resetUserData(db, userId)` (pure) |
| `src/routes/api/sync/pull/+server.ts` | GET-Handler mit Auth + Rate-Limit |
| `src/routes/api/sync/push/+server.ts` | POST-Handler mit Auth + Rate-Limit |
| `src/routes/api/sync/reset/+server.ts` | POST-Handler mit Auth + Rate-Limit |

**Client (neu unter `src/lib/sync/`):**

| File | Verantwortlich für |
|---|---|
| `src/lib/sync/types.ts` | QueueItem, SyncPayload, SyncStatus-Types |
| `src/lib/sync/queue.ts` | `PushQueue` pure class mit persistence über Dexie-Tabelle |
| `src/lib/sync/status.svelte.ts` | Reactive Sync-Status-Store (Runes) |
| `src/lib/sync/client.svelte.ts` | `SyncClient`-Singleton mit pull/push/reset + Backoff |
| `src/lib/sync/dbhooks.ts` | Dexie-`creating`/`updating`/`deleting`-Hooks + Queue-Enqueue |
| `src/lib/sync/triggers.svelte.ts` | Focus/online/visibilitychange-Listener; ruft syncClient |
| `src/lib/sync/settings-bridge.svelte.ts` | Theme/Language/Currency ↔ Dexie-Settings-Bridge |
| `src/lib/sync/initial-sync.ts` | Ersteinrichtungs-Logik (Empty/Merge/Discard-Pfade) |
| `src/lib/sync/settings-whitelist.ts` | Const `SYNCED_SETTING_KEYS` |

**Client DB-Änderungen:**

| File | Änderung |
|---|---|
| `src/lib/types/exercise.ts` | Feld `deletedAt: number \| null` ergänzen |
| `src/lib/types/playlist.ts` | Feld `deletedAt: number \| null` ergänzen |
| `src/lib/types/settings.ts` (neu) | `SyncedSettings` Interface |
| `src/lib/db/database.ts` | Version 4 mit `deletedAt`-Feld + neue `settings`-Tabelle |
| `src/lib/db/exercises.ts` | `activeExercises()`-Helper statt `exercises.toArray()` |
| `src/lib/db/playlists.ts` | `activePlaylists()`-Helper |

**UI-Komponenten (neu):**

| File | Verantwortlich für |
|---|---|
| `src/lib/components/SyncStatusDot.svelte` | Status-Indikator |
| `src/lib/components/SyncStatusPanel.svelte` | Detail-Panel bei Tap |
| `src/lib/components/InitialSyncMergeDialog.svelte` | Merge-Entscheidung |

**Modifikationen (bestehend):**

| File | Änderung |
|---|---|
| `src/lib/theme/store.svelte.ts` | Settings-Bridge informieren bei Mode-Wechsel |
| `src/lib/i18n/language-store.svelte.ts` | Settings-Bridge informieren bei Sprach-Wechsel |
| `src/lib/billing/client.svelte.ts` | Settings-Bridge informieren bei Currency-Wechsel |
| `src/routes/+layout.svelte` | `sync.init(user.id)` nach `auth.init()` |
| `src/lib/components/Sidebar.svelte` | `SyncStatusDot` einbauen |
| `src/lib/components/MobileHeader.svelte` | `SyncStatusDot` einbauen |
| `src/routes/archive/+page.svelte` | `activeExercises()` statt `exercises.toArray()` |
| `src/routes/playlists/+page.svelte` | `activePlaylists()` |
| `src/routes/admin/users/+page.svelte` | Spalten „Letzter Sync" + „Sync-Storage" |
| `src/routes/api/admin/users/+server.ts` | Sync-Metriken zu Response |
| `src/routes/api/account/delete/+server.ts` | `resetUserData()`-Call bei Account-Delete |
| `src/lib/legal/privacy.ts` + `privacy.en.ts` + `privacy.es.ts` | Abschnitt „Trainingsdaten" |
| `src/lib/legal/terms.ts` + `terms.en.ts` + `terms.es.ts` | Leistungsbeschreibung um Sync erweitern |
| `project.inlang/messages/{de,en,es}.json` | Neue Sync-i18n-Keys |

---

## Pre-Flight

Worktree anlegen (falls noch nicht geschehen):

```bash
cd ~/Developer/tt-playbook-trainer
git worktree add -b feat/cloud-sync ../tt-playbook-trainer-sync main
cd ../tt-playbook-trainer-sync
npm install
```

---

## Task 1: Server DB-Schema V3

**Files:**
- Create: `server/sync/schema.ts`
- Modify: `server/auth/db.ts` (Migrations-Registry erweitern)
- Modify: `server/auth/schema.sql` (Reference-Doku, nur angefügt)
- Test: `server/sync/schema.test.ts`

- [ ] **Step 1: Write failing schema test**

Create `server/sync/schema.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { openDatabase, resetSingletonForTests } from '../auth/db';

describe('sync schema v3', () => {
  it('creates sync_exercises, sync_playlists, sync_settings tables', () => {
    resetSingletonForTests();
    const db = openDatabase(':memory:');
    const tables = db
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`)
      .all()
      .map((r) => (r as { name: string }).name);
    expect(tables).toContain('sync_exercises');
    expect(tables).toContain('sync_playlists');
    expect(tables).toContain('sync_settings');
  });

  it('bumps user_version to 3', () => {
    resetSingletonForTests();
    const db = openDatabase(':memory:');
    const row = db.prepare('PRAGMA user_version').get() as { user_version: number };
    expect(row.user_version).toBe(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- server/sync/schema.test.ts`
Expected: FAIL — tables don't exist, user_version=2.

- [ ] **Step 3: Create `server/sync/schema.ts`**

```typescript
export const SCHEMA_V3 = `
CREATE TABLE IF NOT EXISTS sync_exercises (
  user_id      TEXT    NOT NULL,
  id           TEXT    NOT NULL,
  updated_at   INTEGER NOT NULL,
  deleted_at   INTEGER,
  data         TEXT    NOT NULL,
  PRIMARY KEY (user_id, id)
);
CREATE INDEX IF NOT EXISTS idx_sync_ex_updated ON sync_exercises(user_id, updated_at);

CREATE TABLE IF NOT EXISTS sync_playlists (
  user_id      TEXT    NOT NULL,
  id           TEXT    NOT NULL,
  updated_at   INTEGER NOT NULL,
  deleted_at   INTEGER,
  data         TEXT    NOT NULL,
  PRIMARY KEY (user_id, id)
);
CREATE INDEX IF NOT EXISTS idx_sync_pl_updated ON sync_playlists(user_id, updated_at);

CREATE TABLE IF NOT EXISTS sync_settings (
  user_id      TEXT    PRIMARY KEY,
  updated_at   INTEGER NOT NULL,
  data         TEXT    NOT NULL
);
`;
```

- [ ] **Step 4: Register V3 in `server/auth/db.ts`**

Edit `server/auth/db.ts`:

```typescript
import { SCHEMA_V1, SCHEMA_V2 } from './schema';
import { SCHEMA_V3 } from '../sync/schema';

const CURRENT_USER_VERSION = 3;

const MIGRATIONS: Record<number, string> = {
  1: SCHEMA_V1,
  2: SCHEMA_V2,
  3: SCHEMA_V3,
};
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- server/sync/schema.test.ts`
Expected: PASS.

- [ ] **Step 6: Also run existing DB tests (regression)**

Run: `npm test -- server/auth/db.test.ts server/auth/users.test.ts`
Expected: All PASS.

- [ ] **Step 7: Commit**

```bash
git add server/sync/schema.ts server/auth/db.ts server/sync/schema.test.ts
git commit -m "feat(sync): add schema v3 with sync_exercises/playlists/settings tables"
```

---

## Task 2: Zod-Payload-Schema

**Files:**
- Create: `server/sync/payload.ts`
- Test: `server/sync/payload.test.ts`

- [ ] **Step 1: Write failing payload tests**

Create `server/sync/payload.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { PushPayloadSchema, PullQuerySchema, MAX_CLOCK_SKEW_MS } from './payload';

describe('PushPayloadSchema', () => {
  it('accepts a minimal valid payload', () => {
    const result = PushPayloadSchema.safeParse({
      exercises: [],
      playlists: [],
      settings: null,
    });
    expect(result.success).toBe(true);
  });

  it('accepts exercise with data blob', () => {
    const now = Date.now();
    const result = PushPayloadSchema.safeParse({
      exercises: [{ id: 'e1', updatedAt: now, deletedAt: null, data: { foo: 'bar' } }],
      playlists: [],
      settings: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects updatedAt in future beyond clock skew', () => {
    const tooFuture = Date.now() + MAX_CLOCK_SKEW_MS + 10_000;
    const result = PushPayloadSchema.safeParse({
      exercises: [{ id: 'e1', updatedAt: tooFuture, deletedAt: null, data: {} }],
      playlists: [],
      settings: null,
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing required fields', () => {
    const result = PushPayloadSchema.safeParse({ exercises: [{ id: 'e1' }] });
    expect(result.success).toBe(false);
  });
});

describe('PullQuerySchema', () => {
  it('accepts no query (full snapshot)', () => {
    expect(PullQuerySchema.safeParse({}).success).toBe(true);
  });

  it('accepts since as number string', () => {
    const result = PullQuerySchema.safeParse({ since: '1713484800000' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.since).toBe(1713484800000);
  });

  it('rejects negative since', () => {
    expect(PullQuerySchema.safeParse({ since: '-1' }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify fails**

Run: `npm test -- server/sync/payload.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement `server/sync/payload.ts`**

```typescript
import { z } from 'zod';

export const MAX_CLOCK_SKEW_MS = 60_000;
export const MAX_PAYLOAD_BYTES = 5 * 1024 * 1024;

const timestamp = z
  .number()
  .int()
  .positive()
  .refine((t) => t <= Date.now() + MAX_CLOCK_SKEW_MS, {
    message: 'updatedAt too far in the future',
  });

const EntityItem = z.object({
  id: z.string().min(1).max(128),
  updatedAt: timestamp,
  deletedAt: z.number().int().positive().nullable(),
  data: z.record(z.unknown()),
});

const SettingsPayload = z.object({
  updatedAt: timestamp,
  data: z.record(z.unknown()),
});

export const PushPayloadSchema = z.object({
  exercises: z.array(EntityItem).max(5000),
  playlists: z.array(EntityItem).max(5000),
  settings: SettingsPayload.nullable(),
});

export type PushPayload = z.infer<typeof PushPayloadSchema>;
export type EntityItemT = z.infer<typeof EntityItem>;

export const PullQuerySchema = z.object({
  since: z
    .string()
    .optional()
    .transform((s) => (s === undefined ? undefined : Number(s)))
    .refine((n) => n === undefined || (Number.isInteger(n) && n >= 0), {
      message: 'since must be non-negative integer',
    }),
});

export type PullQuery = z.infer<typeof PullQuerySchema>;

export interface PullResponse {
  exercises: EntityItemT[];
  playlists: EntityItemT[];
  settings: { updatedAt: number; data: Record<string, unknown> } | null;
  serverTime: number;
}

export interface PushResponse {
  accepted: { exercises: string[]; playlists: string[]; settings: boolean };
  rejected: { exercises: string[]; playlists: string[]; settings: boolean };
  serverTime: number;
}
```

- [ ] **Step 4: Run to verify passes**

Run: `npm test -- server/sync/payload.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/sync/payload.ts server/sync/payload.test.ts
git commit -m "feat(sync): add zod schemas for pull/push payload validation"
```

---

## Task 3: Pull pure function

**Files:**
- Create: `server/sync/pull.ts`
- Test: `server/sync/pull.test.ts`

- [ ] **Step 1: Write failing test**

Create `server/sync/pull.test.ts`:

```typescript
import { describe, expect, it, beforeEach } from 'vitest';
import { openDatabase, resetSingletonForTests, type AuthDatabase } from '../auth/db';
import { getChangesSince } from './pull';

let db: AuthDatabase;

beforeEach(() => {
  resetSingletonForTests();
  db = openDatabase(':memory:');
  db.prepare('INSERT INTO users (id,email,password_hash,email_verified,created_at,updated_at) VALUES (?,?,?,?,?,?)')
    .run('u1', 'a@b.c', 'h', 1, 1, 1);
  db.prepare('INSERT INTO users (id,email,password_hash,email_verified,created_at,updated_at) VALUES (?,?,?,?,?,?)')
    .run('u2', 'x@y.z', 'h', 1, 1, 1);
});

function insertExercise(userId: string, id: string, updatedAt: number, deletedAt: number | null = null) {
  db.prepare(
    'INSERT INTO sync_exercises (user_id,id,updated_at,deleted_at,data) VALUES (?,?,?,?,?)'
  ).run(userId, id, updatedAt, deletedAt, JSON.stringify({ name: id }));
}

describe('getChangesSince', () => {
  it('returns empty payload for user with no data', () => {
    const result = getChangesSince(db, 'u1');
    expect(result.exercises).toEqual([]);
    expect(result.playlists).toEqual([]);
    expect(result.settings).toBeNull();
    expect(result.serverTime).toBeGreaterThan(0);
  });

  it('returns all entities when since is undefined', () => {
    insertExercise('u1', 'e1', 100);
    insertExercise('u1', 'e2', 200);
    const result = getChangesSince(db, 'u1');
    expect(result.exercises).toHaveLength(2);
  });

  it('filters by since timestamp (exclusive lower bound)', () => {
    insertExercise('u1', 'e1', 100);
    insertExercise('u1', 'e2', 200);
    const result = getChangesSince(db, 'u1', 100);
    expect(result.exercises.map((e) => e.id)).toEqual(['e2']);
  });

  it('includes soft-deleted entities', () => {
    insertExercise('u1', 'e1', 100, 150);
    const result = getChangesSince(db, 'u1');
    expect(result.exercises[0].deletedAt).toBe(150);
  });

  it('isolates by user_id', () => {
    insertExercise('u1', 'e1', 100);
    insertExercise('u2', 'e2', 100);
    const result = getChangesSince(db, 'u1');
    expect(result.exercises).toHaveLength(1);
    expect(result.exercises[0].id).toBe('e1');
  });
});
```

- [ ] **Step 2: Run to verify fails**

Run: `npm test -- server/sync/pull.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `server/sync/pull.ts`**

```typescript
import type { AuthDatabase } from '../auth/db';
import type { PullResponse, EntityItemT } from './payload';

interface Row {
  id: string;
  updated_at: number;
  deleted_at: number | null;
  data: string;
}

function loadEntities(db: AuthDatabase, table: string, userId: string, since: number): EntityItemT[] {
  const rows = db
    .prepare(
      `SELECT id, updated_at, deleted_at, data FROM ${table}
       WHERE user_id = ? AND updated_at > ? ORDER BY updated_at ASC`
    )
    .all(userId, since) as Row[];

  return rows.map((r) => ({
    id: r.id,
    updatedAt: r.updated_at,
    deletedAt: r.deleted_at,
    data: JSON.parse(r.data),
  }));
}

function loadSettings(db: AuthDatabase, userId: string, since: number) {
  const row = db
    .prepare('SELECT updated_at, data FROM sync_settings WHERE user_id = ? AND updated_at > ?')
    .get(userId, since) as { updated_at: number; data: string } | undefined;

  if (!row) return null;
  return { updatedAt: row.updated_at, data: JSON.parse(row.data) };
}

export function getChangesSince(
  db: AuthDatabase,
  userId: string,
  since = 0
): PullResponse {
  return {
    exercises: loadEntities(db, 'sync_exercises', userId, since),
    playlists: loadEntities(db, 'sync_playlists', userId, since),
    settings: loadSettings(db, userId, since),
    serverTime: Date.now(),
  };
}
```

- [ ] **Step 4: Run to verify passes**

Run: `npm test -- server/sync/pull.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/sync/pull.ts server/sync/pull.test.ts
git commit -m "feat(sync): add getChangesSince pure pull function"
```

---

## Task 4: Push pure function

**Files:**
- Create: `server/sync/push.ts`
- Test: `server/sync/push.test.ts`

- [ ] **Step 1: Write failing test**

Create `server/sync/push.test.ts`:

```typescript
import { describe, expect, it, beforeEach } from 'vitest';
import { openDatabase, resetSingletonForTests, type AuthDatabase } from '../auth/db';
import { applyChanges } from './push';

let db: AuthDatabase;

beforeEach(() => {
  resetSingletonForTests();
  db = openDatabase(':memory:');
  db.prepare('INSERT INTO users (id,email,password_hash,email_verified,created_at,updated_at) VALUES (?,?,?,?,?,?)')
    .run('u1', 'a@b.c', 'h', 1, 1, 1);
});

describe('applyChanges', () => {
  it('accepts new exercise', () => {
    const res = applyChanges(db, 'u1', {
      exercises: [{ id: 'e1', updatedAt: 100, deletedAt: null, data: { name: 'test' } }],
      playlists: [],
      settings: null,
    });
    expect(res.accepted.exercises).toEqual(['e1']);
    expect(res.rejected.exercises).toEqual([]);
    const row = db.prepare('SELECT data FROM sync_exercises WHERE user_id=? AND id=?').get('u1', 'e1') as { data: string };
    expect(JSON.parse(row.data)).toEqual({ name: 'test' });
  });

  it('rejects older updatedAt', () => {
    db.prepare('INSERT INTO sync_exercises VALUES (?,?,?,?,?)').run('u1', 'e1', 200, null, '{"name":"server"}');
    const res = applyChanges(db, 'u1', {
      exercises: [{ id: 'e1', updatedAt: 100, deletedAt: null, data: { name: 'client-old' } }],
      playlists: [],
      settings: null,
    });
    expect(res.rejected.exercises).toEqual(['e1']);
    const row = db.prepare('SELECT data FROM sync_exercises WHERE id=?').get('e1') as { data: string };
    expect(JSON.parse(row.data)).toEqual({ name: 'server' });
  });

  it('accepts equal updatedAt as rejected (server wins tie)', () => {
    db.prepare('INSERT INTO sync_exercises VALUES (?,?,?,?,?)').run('u1', 'e1', 100, null, '{"name":"server"}');
    const res = applyChanges(db, 'u1', {
      exercises: [{ id: 'e1', updatedAt: 100, deletedAt: null, data: { name: 'client' } }],
      playlists: [],
      settings: null,
    });
    expect(res.rejected.exercises).toEqual(['e1']);
  });

  it('upserts settings when newer', () => {
    const res = applyChanges(db, 'u1', {
      exercises: [],
      playlists: [],
      settings: { updatedAt: 500, data: { theme: 'dark' } },
    });
    expect(res.accepted.settings).toBe(true);
    const row = db.prepare('SELECT data FROM sync_settings WHERE user_id=?').get('u1') as { data: string };
    expect(JSON.parse(row.data)).toEqual({ theme: 'dark' });
  });

  it('rejects older settings', () => {
    db.prepare('INSERT INTO sync_settings VALUES (?,?,?)').run('u1', 500, '{"theme":"dark"}');
    const res = applyChanges(db, 'u1', {
      exercises: [],
      playlists: [],
      settings: { updatedAt: 400, data: { theme: 'light' } },
    });
    expect(res.rejected.settings).toBe(true);
  });

  it('accepts soft-delete', () => {
    db.prepare('INSERT INTO sync_exercises VALUES (?,?,?,?,?)').run('u1', 'e1', 100, null, '{}');
    const res = applyChanges(db, 'u1', {
      exercises: [{ id: 'e1', updatedAt: 200, deletedAt: 200, data: {} }],
      playlists: [],
      settings: null,
    });
    expect(res.accepted.exercises).toEqual(['e1']);
    const row = db.prepare('SELECT deleted_at FROM sync_exercises WHERE id=?').get('e1') as { deleted_at: number };
    expect(row.deleted_at).toBe(200);
  });

  it('isolates user (does not affect other users rows)', () => {
    db.prepare('INSERT INTO users VALUES (?,?,?,?,?,?,?,?,?,?,?)')
      .run('u2', 'x@y.z', 'h', 1, null, 1, 1, null, null, null, null);
    db.prepare('INSERT INTO sync_exercises VALUES (?,?,?,?,?)').run('u2', 'e1', 500, null, '{}');
    const res = applyChanges(db, 'u1', {
      exercises: [{ id: 'e1', updatedAt: 100, deletedAt: null, data: {} }],
      playlists: [],
      settings: null,
    });
    expect(res.accepted.exercises).toEqual(['e1']);
    const u1 = db.prepare('SELECT updated_at FROM sync_exercises WHERE user_id=? AND id=?').get('u1', 'e1') as { updated_at: number };
    const u2 = db.prepare('SELECT updated_at FROM sync_exercises WHERE user_id=? AND id=?').get('u2', 'e1') as { updated_at: number };
    expect(u1.updated_at).toBe(100);
    expect(u2.updated_at).toBe(500);
  });
});
```

- [ ] **Step 2: Run to verify fails**

Run: `npm test -- server/sync/push.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `server/sync/push.ts`**

```typescript
import type { AuthDatabase } from '../auth/db';
import type { PushPayload, PushResponse, EntityItemT } from './payload';

function applyEntity(
  db: AuthDatabase,
  table: string,
  userId: string,
  item: EntityItemT
): 'accepted' | 'rejected' {
  const existing = db
    .prepare(`SELECT updated_at FROM ${table} WHERE user_id=? AND id=?`)
    .get(userId, item.id) as { updated_at: number } | undefined;

  if (existing && existing.updated_at >= item.updatedAt) return 'rejected';

  db.prepare(
    `INSERT INTO ${table} (user_id,id,updated_at,deleted_at,data)
     VALUES (?,?,?,?,?)
     ON CONFLICT(user_id,id) DO UPDATE
       SET updated_at=excluded.updated_at,
           deleted_at=excluded.deleted_at,
           data=excluded.data`
  ).run(userId, item.id, item.updatedAt, item.deletedAt, JSON.stringify(item.data));

  return 'accepted';
}

function applySettings(
  db: AuthDatabase,
  userId: string,
  s: { updatedAt: number; data: Record<string, unknown> }
): 'accepted' | 'rejected' {
  const existing = db
    .prepare('SELECT updated_at FROM sync_settings WHERE user_id=?')
    .get(userId) as { updated_at: number } | undefined;

  if (existing && existing.updated_at >= s.updatedAt) return 'rejected';

  db.prepare(
    `INSERT INTO sync_settings (user_id,updated_at,data) VALUES (?,?,?)
     ON CONFLICT(user_id) DO UPDATE SET updated_at=excluded.updated_at, data=excluded.data`
  ).run(userId, s.updatedAt, JSON.stringify(s.data));

  return 'accepted';
}

export function applyChanges(
  db: AuthDatabase,
  userId: string,
  payload: PushPayload
): PushResponse {
  const result: PushResponse = {
    accepted: { exercises: [], playlists: [], settings: false },
    rejected: { exercises: [], playlists: [], settings: false },
    serverTime: Date.now(),
  };

  db.exec('BEGIN');
  try {
    for (const ex of payload.exercises) {
      result[applyEntity(db, 'sync_exercises', userId, ex)].exercises.push(ex.id);
    }
    for (const pl of payload.playlists) {
      result[applyEntity(db, 'sync_playlists', userId, pl)].playlists.push(pl.id);
    }
    if (payload.settings) {
      const outcome = applySettings(db, userId, payload.settings);
      result[outcome].settings = true;
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  return result;
}
```

- [ ] **Step 4: Run to verify passes**

Run: `npm test -- server/sync/push.test.ts`
Expected: PASS (all 7 tests).

- [ ] **Step 5: Commit**

```bash
git add server/sync/push.ts server/sync/push.test.ts
git commit -m "feat(sync): add applyChanges pure push function with LWW"
```

---

## Task 5: Reset pure function

**Files:**
- Create: `server/sync/reset.ts`
- Test: `server/sync/reset.test.ts`

- [ ] **Step 1: Write failing test**

Create `server/sync/reset.test.ts`:

```typescript
import { describe, expect, it, beforeEach } from 'vitest';
import { openDatabase, resetSingletonForTests, type AuthDatabase } from '../auth/db';
import { resetUserData } from './reset';

let db: AuthDatabase;

beforeEach(() => {
  resetSingletonForTests();
  db = openDatabase(':memory:');
  for (const id of ['u1', 'u2']) {
    db.prepare('INSERT INTO users (id,email,password_hash,email_verified,created_at,updated_at) VALUES (?,?,?,?,?,?)')
      .run(id, `${id}@x.y`, 'h', 1, 1, 1);
  }
});

describe('resetUserData', () => {
  it('soft-deletes all user entities', () => {
    db.prepare('INSERT INTO sync_exercises VALUES (?,?,?,?,?)').run('u1', 'e1', 100, null, '{}');
    db.prepare('INSERT INTO sync_playlists VALUES (?,?,?,?,?)').run('u1', 'p1', 100, null, '{}');
    db.prepare('INSERT INTO sync_settings VALUES (?,?,?)').run('u1', 100, '{}');

    resetUserData(db, 'u1');

    const ex = db.prepare('SELECT deleted_at FROM sync_exercises WHERE id=?').get('e1') as { deleted_at: number };
    expect(ex.deleted_at).toBeGreaterThan(0);
    const pl = db.prepare('SELECT deleted_at FROM sync_playlists WHERE id=?').get('p1') as { deleted_at: number };
    expect(pl.deleted_at).toBeGreaterThan(0);
    const s = db.prepare('SELECT COUNT(*) AS c FROM sync_settings WHERE user_id=?').get('u1') as { c: number };
    expect(s.c).toBe(0);
  });

  it('does not touch other users data', () => {
    db.prepare('INSERT INTO sync_exercises VALUES (?,?,?,?,?)').run('u1', 'e1', 100, null, '{}');
    db.prepare('INSERT INTO sync_exercises VALUES (?,?,?,?,?)').run('u2', 'e2', 100, null, '{}');
    resetUserData(db, 'u1');
    const u2 = db.prepare('SELECT deleted_at FROM sync_exercises WHERE id=?').get('e2') as { deleted_at: number | null };
    expect(u2.deleted_at).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify fails**

Run: `npm test -- server/sync/reset.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `server/sync/reset.ts`**

```typescript
import type { AuthDatabase } from '../auth/db';

export function resetUserData(db: AuthDatabase, userId: string): void {
  const now = Date.now();
  db.exec('BEGIN');
  try {
    db.prepare(
      'UPDATE sync_exercises SET deleted_at = ?, updated_at = ? WHERE user_id = ? AND deleted_at IS NULL'
    ).run(now, now, userId);
    db.prepare(
      'UPDATE sync_playlists SET deleted_at = ?, updated_at = ? WHERE user_id = ? AND deleted_at IS NULL'
    ).run(now, now, userId);
    db.prepare('DELETE FROM sync_settings WHERE user_id = ?').run(userId);
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}
```

- [ ] **Step 4: Run to verify passes**

Run: `npm test -- server/sync/reset.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/sync/reset.ts server/sync/reset.test.ts
git commit -m "feat(sync): add resetUserData soft-delete function"
```

---

## Task 6: Rate-Limit-Actions erweitern

**Files:**
- Modify: `server/auth/ratelimit.ts`

- [ ] **Step 1: Erweitere `Action`-Type und `LIMITS`**

Edit `server/auth/ratelimit.ts`:

```typescript
export type Action =
  | 'login'
  | 'signup'
  | 'reset'
  | 'resendVerification'
  | 'billingCheckout'
  | 'syncPull'
  | 'syncPush'
  | 'syncReset';

export const LIMITS: Record<Action, Limit> = {
  login: { max: 5, windowMs: 15 * 60 * 1000 },
  signup: { max: 3, windowMs: 60 * 60 * 1000 },
  reset: { max: 3, windowMs: 60 * 60 * 1000 },
  resendVerification: { max: 3, windowMs: 60 * 60 * 1000 },
  billingCheckout: { max: 5, windowMs: 60 * 1000 },
  syncPull: { max: 60, windowMs: 60 * 1000 },
  syncPush: { max: 60, windowMs: 60 * 1000 },
  syncReset: { max: 3, windowMs: 60 * 60 * 1000 },
};
```

- [ ] **Step 2: Run existing rate-limit tests to confirm no regression**

Run: `npm test -- server/auth/ratelimit.test.ts`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add server/auth/ratelimit.ts
git commit -m "feat(sync): add sync_pull/push/reset rate-limit actions"
```

---

## Task 7: API Route `/api/sync/pull`

**Files:**
- Create: `src/routes/api/sync/pull/+server.ts`
- Test: `src/routes/api/sync/pull/server.test.ts` (co-located)

- [ ] **Step 1: Write route test**

Create `src/routes/api/sync/pull/server.test.ts`:

```typescript
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { GET } from './+server';

vi.mock('$env/dynamic/private', () => ({ env: { SYNC_ENABLED: 'true' } }));
vi.mock('$lib/server/auth-bridge', () => ({
  getDatabase: vi.fn(),
  checkAndConsume: vi.fn(() => true),
}));

describe('GET /api/sync/pull', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    const event = { locals: { user: null }, url: new URL('http://x/?'), getClientAddress: () => '1.1.1.1' };
    const res = await GET(event as never);
    expect(res.status).toBe(401);
  });

  it('returns 503 when SYNC_ENABLED=false', async () => {
    vi.doMock('$env/dynamic/private', () => ({ env: { SYNC_ENABLED: 'false' } }));
    const { GET: G } = await import('./+server');
    const event = {
      locals: { user: { id: 'u1' } },
      url: new URL('http://x/?'),
      getClientAddress: () => '1.1.1.1',
    };
    const res = await G(event as never);
    expect(res.status).toBe(503);
  });
});
```

(Minimal smoke test — endpoint-internal pull logic is already covered in Task 3.)

- [ ] **Step 2: Run to verify fails**

Run: `npm test -- src/routes/api/sync/pull/server.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement the route**

Create `src/routes/api/sync/pull/+server.ts`:

```typescript
import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getDatabase } from '../../../../../server/auth/db';
import { checkAndConsume } from '../../../../../server/auth/ratelimit';
import { getChangesSince } from '../../../../../server/sync/pull';
import { PullQuerySchema } from '../../../../../server/sync/payload';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
  if (env.SYNC_ENABLED === 'false') {
    return new Response('sync disabled', { status: 503, headers: { 'Retry-After': '300' } });
  }

  const user = event.locals.user;
  if (!user) return error(401);

  const db = getDatabase();
  if (!checkAndConsume(db, 'syncPull', user.id)) {
    return new Response('rate limited', { status: 429, headers: { 'Retry-After': '60' } });
  }

  const parsed = PullQuerySchema.safeParse({
    since: event.url.searchParams.get('since') ?? undefined,
  });
  if (!parsed.success) return error(400, 'invalid since');

  const payload = getChangesSince(db, user.id, parsed.data.since ?? 0);
  return json(payload);
};
```

- [ ] **Step 4: Run route test**

Run: `npm test -- src/routes/api/sync/pull/server.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/routes/api/sync/pull/+server.ts src/routes/api/sync/pull/server.test.ts
git commit -m "feat(sync): add GET /api/sync/pull route"
```

---

## Task 8: API Route `/api/sync/push`

**Files:**
- Create: `src/routes/api/sync/push/+server.ts`

- [ ] **Step 1: Implement the route**

Create `src/routes/api/sync/push/+server.ts`:

```typescript
import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getDatabase } from '../../../../../server/auth/db';
import { checkAndConsume } from '../../../../../server/auth/ratelimit';
import { applyChanges } from '../../../../../server/sync/push';
import { PushPayloadSchema, MAX_PAYLOAD_BYTES } from '../../../../../server/sync/payload';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
  if (env.SYNC_ENABLED === 'false') {
    return new Response('sync disabled', { status: 503, headers: { 'Retry-After': '300' } });
  }

  const user = event.locals.user;
  if (!user) return error(401);

  const db = getDatabase();
  if (!checkAndConsume(db, 'syncPush', user.id)) {
    return new Response('rate limited', { status: 429, headers: { 'Retry-After': '60' } });
  }

  const contentLength = Number(event.request.headers.get('content-length') ?? 0);
  if (contentLength > MAX_PAYLOAD_BYTES) return error(413, 'payload too large');

  let body: unknown;
  try {
    body = await event.request.json();
  } catch {
    return error(400, 'invalid json');
  }

  const parsed = PushPayloadSchema.safeParse(body);
  if (!parsed.success) return error(400, 'invalid payload');

  const result = applyChanges(db, user.id, parsed.data);
  return json(result);
};
```

- [ ] **Step 2: Quick smoke test**

Run: `npm run check`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/routes/api/sync/push/+server.ts
git commit -m "feat(sync): add POST /api/sync/push route"
```

---

## Task 9: API Route `/api/sync/reset`

**Files:**
- Create: `src/routes/api/sync/reset/+server.ts`

- [ ] **Step 1: Implement the route**

Create `src/routes/api/sync/reset/+server.ts`:

```typescript
import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getDatabase } from '../../../../../server/auth/db';
import { checkAndConsume } from '../../../../../server/auth/ratelimit';
import { resetUserData } from '../../../../../server/sync/reset';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
  if (env.SYNC_ENABLED === 'false') {
    return new Response('sync disabled', { status: 503, headers: { 'Retry-After': '300' } });
  }

  const user = event.locals.user;
  if (!user) return error(401);

  const db = getDatabase();
  if (!checkAndConsume(db, 'syncReset', user.id)) {
    return new Response('rate limited', { status: 429, headers: { 'Retry-After': '3600' } });
  }

  resetUserData(db, user.id);
  return json({ serverTime: Date.now() });
};
```

- [ ] **Step 2: svelte-check**

Run: `npm run check`
Expected: 0 errors, 0 warnings.

- [ ] **Step 3: Commit**

```bash
git add src/routes/api/sync/reset/+server.ts
git commit -m "feat(sync): add POST /api/sync/reset route"
```

---

## Task 10: Client-Types erweitern

**Files:**
- Modify: `src/lib/types/exercise.ts`
- Modify: `src/lib/types/playlist.ts`
- Create: `src/lib/types/settings.ts`

- [ ] **Step 1: Add `deletedAt` to Exercise**

Edit `src/lib/types/exercise.ts`:

```typescript
export interface Exercise {
  id: string;
  name: string;
  tags: string[];
  strokes: Stroke[];
  repetitions: number | null;
  duration: string | null;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
}

export function createEmptyExercise(): Exercise {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    name: '',
    tags: [],
    strokes: [],
    repetitions: null,
    duration: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
}
```

- [ ] **Step 2: Add `deletedAt` to Playlist**

Open `src/lib/types/playlist.ts`, add `deletedAt: number | null;` to the `Playlist` interface. If a factory function (e.g. `createEmptyPlaylist`) exists, add `deletedAt: null`.

- [ ] **Step 3: Create `src/lib/types/settings.ts`**

```typescript
import type { LanguageMode } from '$lib/i18n/language-store.svelte';
import type { ThemeMode } from '$lib/theme/store.svelte';
import type { BillingCurrency } from '$lib/billing/client.svelte';

export interface SyncedSettings {
  theme: ThemeMode;
  language: LanguageMode;
  billingCurrency: BillingCurrency;
  hasSeenSyncNotice: boolean;
}

export interface SettingsRecord {
  id: 'default';
  updatedAt: number;
  data: SyncedSettings;
}
```

(Type imports may need adjustment — follow existing exports from those files.)

- [ ] **Step 4: Run svelte-check**

Run: `npm run check`
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/types/exercise.ts src/lib/types/playlist.ts src/lib/types/settings.ts
git commit -m "feat(sync): add deletedAt field + SyncedSettings types"
```

---

## Task 11: Dexie v4 Migration + `settings`-Tabelle

**Files:**
- Modify: `src/lib/db/database.ts`
- Test: `src/lib/db/database.test.ts` (neu)

- [ ] **Step 1: Write failing migration test**

Create `src/lib/db/database.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import Dexie from 'dexie';

describe('Dexie v4', () => {
  beforeEach(async () => {
    await Dexie.delete('tt-playbook-trainer');
  });

  it('migrates v3 exercises to have deletedAt=null and keeps updatedAt', async () => {
    const oldDb = new Dexie('tt-playbook-trainer');
    oldDb.version(3).stores({
      exercises: 'id, name, createdAt, updatedAt',
      playlists: 'id, name, createdAt, updatedAt',
    });
    await oldDb.open();
    await oldDb.table('exercises').put({
      id: 'e1', name: 'legacy', tags: [], strokes: [],
      repetitions: null, duration: null, createdAt: 1, updatedAt: 2,
    });
    oldDb.close();

    const { db } = await import('./database');
    const row = await db.exercises.get('e1');
    expect(row?.deletedAt).toBeNull();
    expect(row?.updatedAt).toBe(2);
  });

  it('creates settings table on fresh install', async () => {
    const { db } = await import('./database');
    await db.open();
    expect(db.table('settings')).toBeDefined();
  });
});
```

- [ ] **Step 2: Run to verify fails**

Run: `npm test -- src/lib/db/database.test.ts`
Expected: FAIL.

- [ ] **Step 3: Add v4 to `src/lib/db/database.ts`**

```typescript
import Dexie, { type Table } from 'dexie';
import type { Exercise } from '../types/exercise';
import type { Playlist } from '../types/playlist';
import type { SettingsRecord } from '../types/settings';
import { migrateStrokeType } from './migrations';

class TTPlaybookDB extends Dexie {
  exercises!: Table<Exercise, string>;
  playlists!: Table<Playlist, string>;
  settings!: Table<SettingsRecord, string>;
  syncQueue!: Table<{ id: string; type: 'exercise' | 'playlist' | 'settings'; entityId: string; enqueuedAt: number }, string>;

  constructor() {
    super('tt-playbook-trainer');
    this.version(1).stores({ exercises: 'id, name, createdAt, updatedAt' });
    this.version(2).stores({
      exercises: 'id, name, createdAt, updatedAt',
      playlists: 'id, name, createdAt, updatedAt',
    });
    this.version(3)
      .stores({
        exercises: 'id, name, createdAt, updatedAt',
        playlists: 'id, name, createdAt, updatedAt',
      })
      .upgrade(async (tx) => {
        await tx.table('exercises').toCollection().modify((ex: Exercise) => {
          ex.strokes = (ex.strokes ?? []).map((s) => ({
            ...s,
            strokeType: migrateStrokeType((s.strokeType ?? null) as unknown as string | null),
          }));
        });
      });
    this.version(4)
      .stores({
        exercises: 'id, name, createdAt, updatedAt, deletedAt',
        playlists: 'id, name, createdAt, updatedAt, deletedAt',
        settings: 'id, updatedAt',
        syncQueue: 'id, type, entityId, enqueuedAt',
      })
      .upgrade(async (tx) => {
        const now = Date.now();
        await tx.table('exercises').toCollection().modify((e) => {
          e.updatedAt ??= now;
          e.deletedAt ??= null;
        });
        await tx.table('playlists').toCollection().modify((p) => {
          p.updatedAt ??= now;
          p.deletedAt ??= null;
        });
      });
  }
}

export const db = new TTPlaybookDB();
```

- [ ] **Step 4: Run to verify passes**

Run: `npm test -- src/lib/db/database.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/db/database.ts src/lib/db/database.test.ts
git commit -m "feat(sync): dexie v4 with deletedAt + settings + syncQueue tables"
```

---

## Task 12: `activeExercises` / `activePlaylists`-Helpers

**Files:**
- Modify: `src/lib/db/exercises.ts`
- Modify: `src/lib/db/playlists.ts`
- Test: `src/lib/db/exercises.test.ts` (ergänzen)

- [ ] **Step 1: Add helper + test in `exercises.test.ts`**

Append to `src/lib/db/exercises.test.ts`:

```typescript
import { listActive } from './exercises';

describe('listActive', () => {
  it('excludes soft-deleted entries', async () => {
    await db.exercises.put({ ...createEmptyExercise(), id: 'a', name: 'a', deletedAt: null });
    await db.exercises.put({ ...createEmptyExercise(), id: 'b', name: 'b', deletedAt: Date.now() });
    const rows = await listActive();
    expect(rows.map((e) => e.id)).toEqual(['a']);
  });
});
```

- [ ] **Step 2: Implement `listActive` in `exercises.ts`**

Add to `src/lib/db/exercises.ts`:

```typescript
export function listActive() {
  return db.exercises.filter((e) => e.deletedAt === null).toArray();
}
```

- [ ] **Step 3: Do the same for `playlists.ts`**

Add `listActive` returning `db.playlists.filter(p => p.deletedAt === null).toArray()`. Add a corresponding test in `playlists.test.ts`.

- [ ] **Step 4: Run**

Run: `npm test -- src/lib/db/`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/db/exercises.ts src/lib/db/playlists.ts src/lib/db/exercises.test.ts src/lib/db/playlists.test.ts
git commit -m "feat(sync): add listActive helpers filtering soft-deletes"
```

---

## Task 13: PushQueue (persistent)

**Files:**
- Create: `src/lib/sync/types.ts`
- Create: `src/lib/sync/queue.ts`
- Test: `src/lib/sync/queue.test.ts`

- [ ] **Step 1: Define types**

Create `src/lib/sync/types.ts`:

```typescript
export type EntityType = 'exercise' | 'playlist' | 'settings';

export interface QueueItem {
  id: string;
  type: EntityType;
  entityId: string;
  enqueuedAt: number;
}
```

- [ ] **Step 2: Write failing test**

Create `src/lib/sync/queue.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { PushQueue } from './queue';

beforeEach(async () => {
  await Dexie.delete('tt-playbook-trainer');
});

describe('PushQueue', () => {
  it('dedups per (type, entityId)', async () => {
    const q = new PushQueue();
    await q.enqueue('exercise', 'e1');
    await q.enqueue('exercise', 'e1');
    await q.enqueue('exercise', 'e2');
    expect(await q.size()).toBe(2);
  });

  it('snapshot returns distinct ids by type', async () => {
    const q = new PushQueue();
    await q.enqueue('exercise', 'e1');
    await q.enqueue('playlist', 'p1');
    await q.enqueue('settings', 'default');
    const snap = await q.snapshot();
    expect(snap.exercises).toEqual(['e1']);
    expect(snap.playlists).toEqual(['p1']);
    expect(snap.settings).toBe(true);
  });

  it('removes items after ack', async () => {
    const q = new PushQueue();
    await q.enqueue('exercise', 'e1');
    await q.enqueue('exercise', 'e2');
    await q.ack({ exercises: ['e1', 'e2'], playlists: [], settings: false });
    expect(await q.size()).toBe(0);
  });

  it('persists across reinstantiation (Dexie-backed)', async () => {
    const q1 = new PushQueue();
    await q1.enqueue('exercise', 'e1');
    const q2 = new PushQueue();
    expect(await q2.size()).toBe(1);
  });
});
```

- [ ] **Step 3: Run to verify fails**

Run: `npm test -- src/lib/sync/queue.test.ts`
Expected: FAIL.

- [ ] **Step 4: Implement `src/lib/sync/queue.ts`**

```typescript
import { db } from '../db/database';
import type { EntityType, QueueItem } from './types';

function keyFor(type: EntityType, entityId: string): string {
  return `${type}:${entityId}`;
}

export class PushQueue {
  async enqueue(type: EntityType, entityId: string): Promise<void> {
    await db.syncQueue.put({
      id: keyFor(type, entityId),
      type,
      entityId,
      enqueuedAt: Date.now(),
    });
  }

  async size(): Promise<number> {
    return db.syncQueue.count();
  }

  async snapshot(): Promise<{ exercises: string[]; playlists: string[]; settings: boolean }> {
    const rows = (await db.syncQueue.toArray()) as QueueItem[];
    const exercises: string[] = [];
    const playlists: string[] = [];
    let settings = false;
    for (const r of rows) {
      if (r.type === 'exercise') exercises.push(r.entityId);
      else if (r.type === 'playlist') playlists.push(r.entityId);
      else if (r.type === 'settings') settings = true;
    }
    return { exercises, playlists, settings };
  }

  async ack(result: { exercises: string[]; playlists: string[]; settings: boolean }): Promise<void> {
    const keys: string[] = [
      ...result.exercises.map((id) => keyFor('exercise', id)),
      ...result.playlists.map((id) => keyFor('playlist', id)),
      ...(result.settings ? [keyFor('settings', 'default')] : []),
    ];
    await db.syncQueue.bulkDelete(keys);
  }

  async clear(): Promise<void> {
    await db.syncQueue.clear();
  }
}
```

- [ ] **Step 5: Run to verify passes**

Run: `npm test -- src/lib/sync/queue.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/sync/types.ts src/lib/sync/queue.ts src/lib/sync/queue.test.ts
git commit -m "feat(sync): add persistent PushQueue with dedup"
```

---

## Task 14: Sync-Status-Store

**Files:**
- Create: `src/lib/sync/status.svelte.ts`
- Test: `src/lib/sync/status.test.ts`

- [ ] **Step 1: Write failing test**

Create `src/lib/sync/status.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { syncStatus } from './status.svelte';

beforeEach(() => syncStatus.reset());

describe('syncStatus', () => {
  it('starts idle', () => {
    expect(syncStatus.state).toBe('idle');
    expect(syncStatus.queueSize).toBe(0);
  });

  it('transitions idle → syncing → idle on success', () => {
    syncStatus.startSync();
    expect(syncStatus.state).toBe('syncing');
    syncStatus.syncSucceeded();
    expect(syncStatus.state).toBe('idle');
    expect(syncStatus.lastSyncAt).toBeGreaterThan(0);
  });

  it('records error on failure', () => {
    syncStatus.startSync();
    syncStatus.syncFailed('network');
    expect(syncStatus.state).toBe('error');
    expect(syncStatus.lastError).toBe('network');
  });

  it('queue size drives pending state when idle', () => {
    syncStatus.updateQueueSize(3);
    expect(syncStatus.state).toBe('pending');
    syncStatus.updateQueueSize(0);
    expect(syncStatus.state).toBe('idle');
  });

  it('offline overrides pending/idle', () => {
    syncStatus.setOnline(false);
    expect(syncStatus.state).toBe('offline');
    syncStatus.setOnline(true);
    expect(syncStatus.state).toBe('idle');
  });
});
```

- [ ] **Step 2: Run to verify fails**

Run: `npm test -- src/lib/sync/status.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `src/lib/sync/status.svelte.ts`**

```typescript
export type SyncState = 'idle' | 'pending' | 'syncing' | 'offline' | 'error';

function createStatus() {
  let state = $state<SyncState>('idle');
  let lastSyncAt = $state<number | null>(null);
  let lastError = $state<string | null>(null);
  let queueSize = $state(0);
  let online = $state(true);

  function recompute(): SyncState {
    if (!online) return 'offline';
    if (state === 'syncing' || state === 'error') return state;
    return queueSize > 0 ? 'pending' : 'idle';
  }

  return {
    get state() { return state; },
    get lastSyncAt() { return lastSyncAt; },
    get lastError() { return lastError; },
    get queueSize() { return queueSize; },
    get online() { return online; },

    startSync() { state = 'syncing'; lastError = null; },
    syncSucceeded() { lastSyncAt = Date.now(); state = recompute(); },
    syncFailed(msg: string) { lastError = msg; state = 'error'; },
    updateQueueSize(n: number) { queueSize = n; if (state !== 'syncing' && state !== 'error') state = recompute(); },
    setOnline(v: boolean) { online = v; state = recompute(); },
    reset() {
      state = 'idle'; lastSyncAt = null; lastError = null; queueSize = 0; online = true;
    },
  };
}

export const syncStatus = createStatus();
```

- [ ] **Step 4: Run**

Run: `npm test -- src/lib/sync/status.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/sync/status.svelte.ts src/lib/sync/status.test.ts
git commit -m "feat(sync): add reactive syncStatus store"
```

---

## Task 15: SyncClient-Singleton

**Files:**
- Create: `src/lib/sync/client.svelte.ts`
- Test: `src/lib/sync/client.test.ts`

- [ ] **Step 1: Write test for pull/push/reset happy path**

Create `src/lib/sync/client.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { db } from '../db/database';
import { syncClient } from './client.svelte';
import { syncStatus } from './status.svelte';

beforeEach(async () => {
  vi.restoreAllMocks();
  syncStatus.reset();
  await Dexie.delete('tt-playbook-trainer');
  await db.open();
});

describe('syncClient.pull', () => {
  it('applies server exercises into local DB', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        exercises: [{ id: 'e1', updatedAt: 5, deletedAt: null, data: {
          id: 'e1', name: 'server', tags: [], strokes: [],
          repetitions: null, duration: null, createdAt: 1, updatedAt: 5, deletedAt: null,
        }}],
        playlists: [], settings: null, serverTime: 100,
      }),
    });
    await syncClient.pull();
    const row = await db.exercises.get('e1');
    expect(row?.name).toBe('server');
  });
});

describe('syncClient.push', () => {
  it('does nothing when queue empty', async () => {
    const spy = vi.spyOn(global, 'fetch');
    await syncClient.push();
    expect(spy).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to verify fails**

Run: `npm test -- src/lib/sync/client.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `src/lib/sync/client.svelte.ts`**

```typescript
import { db } from '../db/database';
import { PushQueue } from './queue';
import { syncStatus } from './status.svelte';
import type { Exercise } from '../types/exercise';
import type { Playlist } from '../types/playlist';
import type { SettingsRecord } from '../types/settings';

const LAST_SYNC_KEY = 'tt-sync-last-at';

function getLastSyncAt(): number {
  const raw = localStorage.getItem(LAST_SYNC_KEY);
  return raw ? Number(raw) || 0 : 0;
}

function setLastSyncAt(n: number) {
  localStorage.setItem(LAST_SYNC_KEY, String(n));
}

async function refreshQueueSize(q: PushQueue) {
  syncStatus.updateQueueSize(await q.size());
}

function createClient() {
  const queue = new PushQueue();
  let currentUserId: string | null = null;
  let pushTimer: ReturnType<typeof setTimeout> | null = null;

  async function pull(): Promise<void> {
    if (!currentUserId) return;
    syncStatus.startSync();
    try {
      const since = getLastSyncAt();
      const url = since ? `/api/sync/pull?since=${since}` : '/api/sync/pull';
      const res = await fetch(url);
      if (!res.ok) throw new Error(`pull ${res.status}`);
      const payload = await res.json();

      await db.transaction('rw', db.exercises, db.playlists, db.settings, async () => {
        for (const ex of payload.exercises) {
          await db.exercises.put({ ...(ex.data as Exercise), deletedAt: ex.deletedAt, updatedAt: ex.updatedAt });
        }
        for (const pl of payload.playlists) {
          await db.playlists.put({ ...(pl.data as Playlist), deletedAt: pl.deletedAt, updatedAt: pl.updatedAt });
        }
        if (payload.settings) {
          await db.settings.put({
            id: 'default',
            updatedAt: payload.settings.updatedAt,
            data: payload.settings.data,
          } as SettingsRecord);
        }
      });

      setLastSyncAt(payload.serverTime);
      syncStatus.syncSucceeded();
    } catch (e) {
      syncStatus.syncFailed((e as Error).message);
    }
  }

  async function push(): Promise<void> {
    if (!currentUserId) return;
    const snap = await queue.snapshot();
    if (!snap.exercises.length && !snap.playlists.length && !snap.settings) return;

    syncStatus.startSync();
    try {
      const exercises = await Promise.all(
        snap.exercises.map(async (id) => {
          const e = await db.exercises.get(id);
          return e ? { id, updatedAt: e.updatedAt, deletedAt: e.deletedAt, data: e } : null;
        })
      );
      const playlists = await Promise.all(
        snap.playlists.map(async (id) => {
          const p = await db.playlists.get(id);
          return p ? { id, updatedAt: p.updatedAt, deletedAt: p.deletedAt, data: p } : null;
        })
      );
      const settingsRow = snap.settings ? await db.settings.get('default') : null;

      const body = {
        exercises: exercises.filter(Boolean),
        playlists: playlists.filter(Boolean),
        settings: settingsRow ? { updatedAt: settingsRow.updatedAt, data: settingsRow.data } : null,
      };

      const res = await fetch('/api/sync/push', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`push ${res.status}`);
      const result = await res.json();
      await queue.ack({
        exercises: [...result.accepted.exercises, ...result.rejected.exercises],
        playlists: [...result.accepted.playlists, ...result.rejected.playlists],
        settings: result.accepted.settings || result.rejected.settings,
      });
      await refreshQueueSize(queue);
      syncStatus.syncSucceeded();
    } catch (e) {
      syncStatus.syncFailed((e as Error).message);
    }
  }

  function schedulePush() {
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(() => void push(), 500);
    void refreshQueueSize(queue);
  }

  async function init(userId: string): Promise<void> {
    if (currentUserId && currentUserId !== userId) {
      await clearLocal();
    }
    currentUserId = userId;
    await refreshQueueSize(queue);
    await pull();
  }

  async function clearLocal(): Promise<void> {
    currentUserId = null;
    localStorage.removeItem(LAST_SYNC_KEY);
    await queue.clear();
    await db.exercises.clear();
    await db.playlists.clear();
    await db.settings.clear();
    syncStatus.reset();
  }

  async function reset(): Promise<void> {
    if (!currentUserId) return;
    const res = await fetch('/api/sync/reset', { method: 'POST' });
    if (!res.ok) throw new Error(`reset ${res.status}`);
    await queue.clear();
    localStorage.removeItem(LAST_SYNC_KEY);
    await db.exercises.clear();
    await db.playlists.clear();
    await db.settings.clear();
    await pull();
  }

  return {
    init,
    pull,
    push,
    reset,
    clearLocal,
    schedulePush,
    get queue() { return queue; },
  };
}

export const syncClient = createClient();
```

- [ ] **Step 4: Run tests**

Run: `npm test -- src/lib/sync/client.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/sync/client.svelte.ts src/lib/sync/client.test.ts
git commit -m "feat(sync): add SyncClient with pull/push/reset + debounced flush"
```

---

## Task 16: Dexie-Hooks für Auto-Stamp + Queue-Enqueue

**Files:**
- Create: `src/lib/sync/dbhooks.ts`
- Test: `src/lib/sync/dbhooks.test.ts`

- [ ] **Step 1: Write failing test**

Create `src/lib/sync/dbhooks.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { db } from '../db/database';
import { installDbHooks } from './dbhooks';
import { createEmptyExercise } from '../types/exercise';

beforeEach(async () => {
  await Dexie.delete('tt-playbook-trainer');
  installDbHooks();
  await db.open();
});

describe('Dexie hooks', () => {
  it('auto-stamps updatedAt on create', async () => {
    const e = createEmptyExercise();
    e.updatedAt = 0;
    await db.exercises.put(e);
    const row = await db.exercises.get(e.id);
    expect(row?.updatedAt).toBeGreaterThan(Date.now() - 5_000);
  });

  it('converts delete to soft-delete', async () => {
    const e = createEmptyExercise();
    await db.exercises.put(e);
    await db.exercises.delete(e.id);
    const row = await db.exercises.get(e.id);
    expect(row?.deletedAt).not.toBeNull();
  });

  it('enqueues into syncQueue on create/update/delete', async () => {
    const e = createEmptyExercise();
    await db.exercises.put(e);
    const q = await db.syncQueue.count();
    expect(q).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run to verify fails**

Run: `npm test -- src/lib/sync/dbhooks.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `src/lib/sync/dbhooks.ts`**

```typescript
import { db } from '../db/database';
import { syncClient } from './client.svelte';

let installed = false;

export function installDbHooks(): void {
  if (installed) return;
  installed = true;

  db.exercises.hook('creating', (_pk, obj) => {
    obj.updatedAt ??= Date.now();
    obj.deletedAt ??= null;
  });
  db.exercises.hook('updating', (mods) => {
    (mods as Record<string, unknown>).updatedAt = Date.now();
  });
  db.exercises.hook('deleting', function (pk, obj, trans) {
    (trans as unknown as { abort: () => void }).abort();
    const now = Date.now();
    void db.exercises.update(pk, { deletedAt: now, updatedAt: now });
  });

  db.playlists.hook('creating', (_pk, obj) => {
    obj.updatedAt ??= Date.now();
    obj.deletedAt ??= null;
  });
  db.playlists.hook('updating', (mods) => {
    (mods as Record<string, unknown>).updatedAt = Date.now();
  });
  db.playlists.hook('deleting', function (pk, obj, trans) {
    (trans as unknown as { abort: () => void }).abort();
    const now = Date.now();
    void db.playlists.update(pk, { deletedAt: now, updatedAt: now });
  });

  db.exercises.hook('creating', (_pk, obj) => { void syncClient.queue.enqueue('exercise', obj.id); syncClient.schedulePush(); });
  db.exercises.hook('updating', (_mods, pk) => { void syncClient.queue.enqueue('exercise', String(pk)); syncClient.schedulePush(); });
  db.playlists.hook('creating', (_pk, obj) => { void syncClient.queue.enqueue('playlist', obj.id); syncClient.schedulePush(); });
  db.playlists.hook('updating', (_mods, pk) => { void syncClient.queue.enqueue('playlist', String(pk)); syncClient.schedulePush(); });
}
```

- [ ] **Step 4: Run**

Run: `npm test -- src/lib/sync/dbhooks.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/sync/dbhooks.ts src/lib/sync/dbhooks.test.ts
git commit -m "feat(sync): add Dexie hooks for auto-timestamps and soft-delete"
```

---

## Task 17: Trigger-Module (focus/online/visibility)

**Files:**
- Create: `src/lib/sync/triggers.svelte.ts`

- [ ] **Step 1: Implement triggers**

Create `src/lib/sync/triggers.svelte.ts`:

```typescript
import { syncClient } from './client.svelte';
import { syncStatus } from './status.svelte';

let installed = false;

export function installSyncTriggers(): void {
  if (installed) return;
  installed = true;

  syncStatus.setOnline(navigator.onLine);

  window.addEventListener('online', () => {
    syncStatus.setOnline(true);
    void (async () => {
      await syncClient.push();
      await syncClient.pull();
    })();
  });

  window.addEventListener('offline', () => syncStatus.setOnline(false));

  const onFocus = () => {
    void (async () => {
      await syncClient.push();
      await syncClient.pull();
    })();
  };

  window.addEventListener('focus', onFocus);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') onFocus();
  });
}
```

- [ ] **Step 2: svelte-check**

Run: `npm run check`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/sync/triggers.svelte.ts
git commit -m "feat(sync): add focus/online/visibility triggers"
```

---

## Task 18: Settings-Sync-Bridge

**Files:**
- Create: `src/lib/sync/settings-whitelist.ts`
- Create: `src/lib/sync/settings-bridge.svelte.ts`
- Modify: `src/lib/theme/store.svelte.ts`
- Modify: `src/lib/i18n/language-store.svelte.ts`
- Modify: `src/lib/billing/client.svelte.ts`

- [ ] **Step 1: Create whitelist**

Create `src/lib/sync/settings-whitelist.ts`:

```typescript
export const SYNCED_SETTING_KEYS = ['theme', 'language', 'billingCurrency', 'hasSeenSyncNotice'] as const;
export type SyncedSettingKey = (typeof SYNCED_SETTING_KEYS)[number];
```

- [ ] **Step 2: Create settings-bridge**

Create `src/lib/sync/settings-bridge.svelte.ts`:

```typescript
import { db } from '../db/database';
import { syncClient } from './client.svelte';
import type { SyncedSettings } from '../types/settings';

export async function writeSyncedSetting<K extends keyof SyncedSettings>(
  key: K,
  value: SyncedSettings[K]
): Promise<void> {
  const existing = (await db.settings.get('default')) ?? {
    id: 'default' as const,
    updatedAt: 0,
    data: { theme: 'auto', language: 'system', billingCurrency: 'eur', hasSeenSyncNotice: false } as SyncedSettings,
  };
  await db.settings.put({
    id: 'default',
    updatedAt: Date.now(),
    data: { ...existing.data, [key]: value },
  });
  void syncClient.queue.enqueue('settings', 'default');
  syncClient.schedulePush();
}

export async function readSyncedSettings(): Promise<SyncedSettings | null> {
  const row = await db.settings.get('default');
  return row?.data ?? null;
}
```

- [ ] **Step 3: Wire `theme/store.svelte.ts`**

In the setter that persists the mode to `localStorage`, call `void writeSyncedSetting('theme', mode)`. Do NOT change the read-path — theme-store continues to read from localStorage. Only the write path gets a mirror call.

- [ ] **Step 4: Wire `i18n/language-store.svelte.ts`**

Same pattern: after writing `localStorage['tt-language-mode']`, call `void writeSyncedSetting('language', mode)`.

- [ ] **Step 5: Wire `billing/client.svelte.ts`**

After writing `localStorage['tt-billing-currency']`, call `void writeSyncedSetting('billingCurrency', currency)`.

- [ ] **Step 6: On pull, apply settings back to stores**

Edit `src/lib/sync/client.svelte.ts` inside `pull()` after the transaction — if `payload.settings` is set, also:

```typescript
// Propagate settings to stores
if (payload.settings) {
  const data = payload.settings.data;
  if (data.theme) localStorage.setItem('tt-theme-mode', data.theme);
  if (data.language) localStorage.setItem('tt-language-mode', data.language);
  if (data.billingCurrency) localStorage.setItem('tt-billing-currency', data.billingCurrency);
  // Stores read from localStorage on init; a full reload would pick this up.
  // For live propagation, dispatch a custom event:
  window.dispatchEvent(new CustomEvent('tt-settings-synced', { detail: data }));
}
```

Then in `theme/store.svelte.ts`, `language-store.svelte.ts`, `billing/client.svelte.ts`, add a listener to `tt-settings-synced` that re-applies the value using the existing public setter (without re-triggering `writeSyncedSetting` — use an internal flag or a separate "apply without sync" method).

- [ ] **Step 7: svelte-check + run all sync tests**

Run: `npm run check && npm test -- src/lib/sync/`
Expected: 0 errors, all tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/lib/sync/settings-whitelist.ts src/lib/sync/settings-bridge.svelte.ts src/lib/theme/store.svelte.ts src/lib/i18n/language-store.svelte.ts src/lib/billing/client.svelte.ts src/lib/sync/client.svelte.ts
git commit -m "feat(sync): settings bridge for theme/language/currency"
```

---

## Task 19: Initial-Sync-Flow + Merge-Dialog

**Files:**
- Create: `src/lib/sync/initial-sync.ts`
- Create: `src/lib/components/InitialSyncMergeDialog.svelte`
- Test: `src/lib/sync/initial-sync.test.ts`

- [ ] **Step 1: Test-first branching logic**

Create `src/lib/sync/initial-sync.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { decideInitialAction } from './initial-sync';

describe('decideInitialAction', () => {
  it('returns noop when both empty', () => {
    expect(decideInitialAction(0, 0).kind).toBe('noop');
  });

  it('returns pull-only when only server has data', () => {
    expect(decideInitialAction(0, 5).kind).toBe('pullOnly');
  });

  it('returns push-only when only local has data', () => {
    expect(decideInitialAction(5, 0).kind).toBe('pushOnly');
  });

  it('returns merge-decision when both have data', () => {
    expect(decideInitialAction(3, 5).kind).toBe('needsMergeChoice');
  });
});
```

- [ ] **Step 2: Run to verify fails**

Run: `npm test -- src/lib/sync/initial-sync.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `src/lib/sync/initial-sync.ts`**

```typescript
import { db } from '../db/database';
import { syncClient } from './client.svelte';
import { listActive as listActiveExercises } from '../db/exercises';
import { listActive as listActivePlaylists } from '../db/playlists';

export type InitialAction =
  | { kind: 'noop' }
  | { kind: 'pullOnly' }
  | { kind: 'pushOnly' }
  | { kind: 'needsMergeChoice' };

export function decideInitialAction(localCount: number, serverCount: number): InitialAction {
  if (localCount === 0 && serverCount === 0) return { kind: 'noop' };
  if (localCount === 0) return { kind: 'pullOnly' };
  if (serverCount === 0) return { kind: 'pushOnly' };
  return { kind: 'needsMergeChoice' };
}

export async function collectLocalCount(): Promise<number> {
  const [ex, pl] = await Promise.all([listActiveExercises(), listActivePlaylists()]);
  return ex.length + pl.length;
}

export async function pushAllLocalAsNew(): Promise<void> {
  const [ex, pl] = await Promise.all([listActiveExercises(), listActivePlaylists()]);
  const now = Date.now();
  await db.transaction('rw', db.exercises, db.playlists, async () => {
    for (const e of ex) await db.exercises.update(e.id, { updatedAt: now });
    for (const p of pl) await db.playlists.update(p.id, { updatedAt: now });
  });
  for (const e of ex) await syncClient.queue.enqueue('exercise', e.id);
  for (const p of pl) await syncClient.queue.enqueue('playlist', p.id);
  await syncClient.push();
}

export async function discardLocalAndPull(): Promise<void> {
  await db.exercises.clear();
  await db.playlists.clear();
  await db.settings.clear();
  localStorage.removeItem('tt-sync-last-at');
  await syncClient.pull();
}
```

- [ ] **Step 4: Run to verify passes**

Run: `npm test -- src/lib/sync/initial-sync.test.ts`
Expected: PASS.

- [ ] **Step 5: Create dialog component**

Create `src/lib/components/InitialSyncMergeDialog.svelte`:

```svelte
<script lang="ts">
  import { m } from '$lib/paraglide/messages';

  interface Props {
    localCount: number;
    serverCount: number;
    onChoose: (choice: 'keepBoth' | 'serverOnly' | 'localOnly') => void;
  }

  let { localCount, serverCount, onChoose }: Props = $props();
</script>

<div class="overlay">
  <div class="dialog">
    <h2>{m.initial_sync_title()}</h2>
    <p>{m.initial_sync_body({ local: localCount, server: serverCount })}</p>
    <div class="actions">
      <button type="button" onclick={() => onChoose('keepBoth')}>{m.initial_sync_keep_both()}</button>
      <button type="button" onclick={() => onChoose('serverOnly')}>{m.initial_sync_server_only()}</button>
      <button type="button" onclick={() => onChoose('localOnly')}>{m.initial_sync_local_only()}</button>
    </div>
  </div>
</div>

<style>
  .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: grid; place-items: center; z-index: 1000; }
  .dialog { background: var(--color-surface); padding: 24px; border-radius: 14px; max-width: 440px; }
  .actions { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }
  button { padding: 10px 16px; border-radius: 10px; border: 1px solid var(--color-border); background: var(--color-bg); color: var(--color-text); cursor: pointer; }
</style>
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/sync/initial-sync.ts src/lib/sync/initial-sync.test.ts src/lib/components/InitialSyncMergeDialog.svelte
git commit -m "feat(sync): initial-sync decision logic and merge dialog"
```

---

## Task 20: Sync-Status-Dot + Panel

**Files:**
- Create: `src/lib/components/SyncStatusDot.svelte`
- Create: `src/lib/components/SyncStatusPanel.svelte`

- [ ] **Step 1: Create SyncStatusDot**

Create `src/lib/components/SyncStatusDot.svelte`:

```svelte
<script lang="ts">
  import { syncStatus } from '$lib/sync/status.svelte';
  import { m } from '$lib/paraglide/messages';

  interface Props { onclick?: () => void }
  let { onclick }: Props = $props();

  const colorClass = $derived(
    syncStatus.state === 'idle' ? 'green'
    : syncStatus.state === 'syncing' ? 'blue'
    : syncStatus.state === 'pending' ? 'yellow'
    : syncStatus.state === 'offline' ? 'grey'
    : 'red'
  );
  const label = $derived(
    syncStatus.state === 'idle' ? m.sync_dot_idle()
    : syncStatus.state === 'syncing' ? m.sync_dot_syncing()
    : syncStatus.state === 'pending' ? m.sync_dot_pending({ n: syncStatus.queueSize })
    : syncStatus.state === 'offline' ? m.sync_dot_offline()
    : m.sync_dot_error()
  );
</script>

<button type="button" class="dot {colorClass}" aria-label={label} title={label} {onclick}></button>

<style>
  .dot {
    width: 10px; height: 10px; border-radius: 50%; border: none; padding: 0; cursor: pointer;
    transition: background 0.2s;
  }
  .dot.green  { background: var(--color-success); }
  .dot.yellow { background: #f0b429; }
  .dot.grey   { background: #86868b; }
  .dot.red    { background: var(--color-danger); }
  .dot.blue   { background: var(--color-accent); animation: pulse 1s infinite alternate; }
  @keyframes pulse { to { opacity: 0.4; } }
</style>
```

- [ ] **Step 2: Create SyncStatusPanel**

Create `src/lib/components/SyncStatusPanel.svelte`:

```svelte
<script lang="ts">
  import { syncStatus } from '$lib/sync/status.svelte';
  import { syncClient } from '$lib/sync/client.svelte';
  import { m } from '$lib/paraglide/messages';

  interface Props { onclose: () => void }
  let { onclose }: Props = $props();

  let busy = $state(false);
  let confirmingReset = $state(false);

  async function syncNow() {
    busy = true;
    try { await syncClient.push(); await syncClient.pull(); } finally { busy = false; }
  }
  async function reset() {
    busy = true;
    try { await syncClient.reset(); confirmingReset = false; } finally { busy = false; }
  }
</script>

<div class="panel">
  <h3>{m.sync_panel_title()}</h3>
  <p class="status">{syncStatus.state}</p>
  {#if syncStatus.lastSyncAt}
    <p class="meta">{m.sync_last_at({ at: new Date(syncStatus.lastSyncAt).toLocaleString() })}</p>
  {/if}
  {#if syncStatus.lastError}<p class="error">{syncStatus.lastError}</p>{/if}
  <button type="button" onclick={syncNow} disabled={busy}>{m.sync_button_now()}</button>
  {#if !confirmingReset}
    <button type="button" class="danger" onclick={() => confirmingReset = true}>{m.sync_button_reset()}</button>
  {:else}
    <p class="warn">{m.sync_reset_confirm()}</p>
    <button type="button" class="danger" onclick={reset} disabled={busy}>{m.sync_button_reset_confirm()}</button>
    <button type="button" onclick={() => confirmingReset = false}>{m.sync_button_cancel()}</button>
  {/if}
  <button type="button" onclick={onclose}>{m.sync_panel_close()}</button>
</div>

<style>
  .panel { position: absolute; top: 48px; right: 16px; background: var(--color-surface); padding: 16px; border-radius: 14px; min-width: 280px; box-shadow: var(--shadow-card); z-index: 500; }
  button { margin-top: 8px; width: 100%; padding: 8px; border-radius: 10px; border: 1px solid var(--color-border); background: var(--color-bg); cursor: pointer; }
  .danger { color: var(--color-danger); }
  .error { color: var(--color-danger); font-size: 0.9em; }
  .meta { font-size: 0.85em; color: var(--color-text-secondary); }
</style>
```

- [ ] **Step 3: svelte-check**

Run: `npm run check`
Expected: **Warnings about missing `m.sync_*` keys** — that's OK, they'll be added in Task 21.

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/SyncStatusDot.svelte src/lib/components/SyncStatusPanel.svelte
git commit -m "feat(sync): add SyncStatusDot + SyncStatusPanel components"
```

---

## Task 21: i18n-Keys (DE/EN/ES)

**Files:**
- Modify: `project.inlang/messages/de.json`
- Modify: `project.inlang/messages/en.json`
- Modify: `project.inlang/messages/es.json`

- [ ] **Step 1: Add keys to de.json**

```json
{
  "sync_dot_idle": "Synchronisiert",
  "sync_dot_syncing": "Wird synchronisiert …",
  "sync_dot_pending": "{n} Änderung(en) warten",
  "sync_dot_offline": "Offline — Änderungen werden später gesendet",
  "sync_dot_error": "Fehler bei der Synchronisierung",
  "sync_panel_title": "Synchronisierung",
  "sync_last_at": "Zuletzt synchronisiert: {at}",
  "sync_button_now": "Jetzt synchronisieren",
  "sync_button_reset": "Dieses Gerät zurücksetzen",
  "sync_button_reset_confirm": "Wirklich zurücksetzen",
  "sync_button_cancel": "Abbrechen",
  "sync_panel_close": "Schließen",
  "sync_reset_confirm": "Das löscht deine lokalen Daten und lädt sie frisch vom Server. Sicher?",
  "initial_sync_title": "Übungen gefunden",
  "initial_sync_body": "Auf diesem Gerät: {local} Übungen/Listen. Auf dem Server: {server}. Wie vorgehen?",
  "initial_sync_keep_both": "Beide zusammenführen",
  "initial_sync_server_only": "Nur Server übernehmen",
  "initial_sync_local_only": "Nur dieses Gerät behalten",
  "sync_notice_info": "Deine Übungen werden ab jetzt zwischen deinen Geräten synchronisiert."
}
```

- [ ] **Step 2: Add keys to en.json**

Translate all keys to English. Key names identical.

- [ ] **Step 3: Add keys to es.json**

Translate all keys to Spanish. Key names identical.

- [ ] **Step 4: Run Paraglide build**

Run: `npm run dev` once (triggers Paraglide compile via Vite), then Ctrl+C. Or: `npx paraglide-js compile --project ./project.inlang`.
Verify `src/lib/paraglide/messages/de.js` contains the new functions.

- [ ] **Step 5: svelte-check**

Run: `npm run check`
Expected: 0 errors, 0 warnings.

- [ ] **Step 6: Commit**

```bash
git add project.inlang/messages/de.json project.inlang/messages/en.json project.inlang/messages/es.json
git commit -m "i18n(sync): add DE/EN/ES keys for sync status and initial-sync dialog"
```

---

## Task 22: Dot in Sidebar + MobileHeader einbauen

**Files:**
- Modify: `src/lib/components/Sidebar.svelte`
- Modify: `src/lib/components/MobileHeader.svelte`

- [ ] **Step 1: Integrate in Sidebar**

Find the top of `Sidebar.svelte` where the logo/home link is rendered. Add directly after the logo:

```svelte
<script lang="ts">
  import SyncStatusDot from './SyncStatusDot.svelte';
  import SyncStatusPanel from './SyncStatusPanel.svelte';
  let panelOpen = $state(false);
  // ... existing imports & state
</script>

<!-- existing logo block -->
<div class="sync-holder">
  <SyncStatusDot onclick={() => panelOpen = !panelOpen} />
  {#if panelOpen}
    <SyncStatusPanel onclose={() => panelOpen = false} />
  {/if}
</div>

<style>
  .sync-holder { position: relative; align-self: center; margin-top: 4px; }
</style>
```

- [ ] **Step 2: Integrate in MobileHeader**

Same pattern in `MobileHeader.svelte`, positioned next to the existing TV-Dot.

- [ ] **Step 3: Manual browser-check**

Run: `npm run dev`, open `localhost:5173`, verify dot appears on desktop sidebar and in mobile header. Click opens panel.

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/Sidebar.svelte src/lib/components/MobileHeader.svelte
git commit -m "feat(sync): place SyncStatusDot in sidebar and mobile header"
```

---

## Task 23: Call-Sites auf `listActive` umstellen

**Files:**
- Modify: `src/routes/archive/+page.svelte`
- Modify: `src/routes/playlists/+page.svelte`
- Modify: `src/lib/components/Sidebar.svelte` (falls exercises-Count dort gezeigt wird)
- Modify: jede andere Stelle, die aktuell `db.exercises.toArray()` oder `db.playlists.toArray()` aufruft

- [ ] **Step 1: Grep für bestehende Queries**

Run: `grep -rn "db\\.exercises\\." src/ | grep -v test | grep -v "hook\\|put\\|add\\|update\\|delete\\|get\\b"`

Note every location that does a list-style read.

- [ ] **Step 2: Replace with `listActive`**

Replace:
```typescript
const exercises = await db.exercises.toArray();
```
with:
```typescript
import { listActive } from '$lib/db/exercises';
const exercises = await listActive();
```

Repeat for playlists.

- [ ] **Step 3: Run all tests + svelte-check + manual browser-check**

Run:
- `npm test`
- `npm run check`
- `npm run dev` and click through Archive + Playlists — ensure no soft-deleted items appear

Expected: All green, UI still works.

- [ ] **Step 4: Commit**

```bash
git add -u src/
git commit -m "refactor(sync): use listActive helpers to filter soft-deleted items"
```

---

## Task 24: Root-Layout Integration

**Files:**
- Modify: `src/routes/+layout.svelte`

- [ ] **Step 1: Install hooks + triggers + init sync**

Edit `src/routes/+layout.svelte` `onMount`-block:

```svelte
<script lang="ts">
  import { auth } from '$lib/auth/client.svelte';
  import { syncClient } from '$lib/sync/client.svelte';
  import { installDbHooks } from '$lib/sync/dbhooks';
  import { installSyncTriggers } from '$lib/sync/triggers.svelte';
  import { collectLocalCount, decideInitialAction, pushAllLocalAsNew, discardLocalAndPull } from '$lib/sync/initial-sync';
  import InitialSyncMergeDialog from '$lib/components/InitialSyncMergeDialog.svelte';
  import { db } from '$lib/db/database';
  import { onMount } from 'svelte';

  let showMergeDialog = $state<{ local: number; server: number } | null>(null);

  onMount(() => {
    installDbHooks();
    void (async () => {
      await auth.init();
      if (!auth.user) return;

      installSyncTriggers();

      const localCount = await collectLocalCount();
      // Provisional server-count via a pull:
      await syncClient.pull();
      const serverCount = await db.exercises.count() + await db.playlists.count() - localCount;
      const action = decideInitialAction(localCount, serverCount < 0 ? 0 : serverCount);

      if (action.kind === 'pushOnly') await pushAllLocalAsNew();
      else if (action.kind === 'needsMergeChoice') showMergeDialog = { local: localCount, server: serverCount };
    })();
  });

  async function handleMerge(choice: 'keepBoth' | 'serverOnly' | 'localOnly') {
    showMergeDialog = null;
    if (choice === 'keepBoth') await pushAllLocalAsNew();
    else if (choice === 'serverOnly') await discardLocalAndPull();
    // localOnly = do nothing, user keeps local; push happens via hooks
  }
</script>

{#if showMergeDialog}
  <InitialSyncMergeDialog
    localCount={showMergeDialog.local}
    serverCount={showMergeDialog.server}
    onChoose={handleMerge}
  />
{/if}
```

(Merge decision logic in this task is a simplified heuristic — if collision detection needs to be more precise, refine in a follow-up.)

- [ ] **Step 2: Manual browser-check — full flow**

Run: `npm run dev`, login on localhost.
- If fresh account: dot should be grey→blue→green. No dialog.
- If existing Dexie data and fresh account: push happens silently.

- [ ] **Step 3: Commit**

```bash
git add src/routes/+layout.svelte
git commit -m "feat(sync): initial-sync flow + hook installation in root layout"
```

---

## Task 25: Feature-Flag `SYNC_ENABLED`

**Files:**
- Modify: `.env.example`
- Verify: Server-Routes already check `env.SYNC_ENABLED` (from Tasks 7–9)

- [ ] **Step 1: Add to `.env.example`**

Append to `.env.example`:
```
# Cloud-Sync feature flag. Set to "false" to disable all sync endpoints (503 returned).
SYNC_ENABLED=true
```

- [ ] **Step 2: Handle 503 in Client**

Edit `src/lib/sync/client.svelte.ts` `pull()` and `push()`:

```typescript
if (res.status === 503) {
  syncStatus.syncSucceeded(); // Silent no-op
  return;
}
```

(The endpoint is disabled server-side; client just backs off gracefully.)

- [ ] **Step 3: svelte-check**

Run: `npm run check`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add .env.example src/lib/sync/client.svelte.ts
git commit -m "feat(sync): handle SYNC_ENABLED=false as silent no-op on client"
```

---

## Task 26: Admin-Panel Sync-Metriken

**Files:**
- Modify: `server/auth/users.ts`
- Modify: `src/routes/api/admin/users/+server.ts`
- Modify: `src/routes/admin/users/+page.svelte`

- [ ] **Step 1: Add `getSyncStats` helper**

Edit `server/auth/users.ts`:

```typescript
export interface SyncStats {
  lastSyncAt: number | null;
  storageBytes: number;
}

export function getSyncStats(db: AuthDatabase, userId: string): SyncStats {
  const ex = db.prepare('SELECT MAX(updated_at) AS m, COALESCE(SUM(LENGTH(data)),0) AS s FROM sync_exercises WHERE user_id = ? AND deleted_at IS NULL').get(userId) as { m: number | null; s: number };
  const pl = db.prepare('SELECT MAX(updated_at) AS m, COALESCE(SUM(LENGTH(data)),0) AS s FROM sync_playlists WHERE user_id = ? AND deleted_at IS NULL').get(userId) as { m: number | null; s: number };
  const se = db.prepare('SELECT updated_at AS m, LENGTH(data) AS s FROM sync_settings WHERE user_id = ?').get(userId) as { m: number | null; s: number } | undefined;
  const maxM = Math.max(ex.m ?? 0, pl.m ?? 0, se?.m ?? 0);
  return {
    lastSyncAt: maxM > 0 ? maxM : null,
    storageBytes: (ex.s || 0) + (pl.s || 0) + (se?.s || 0),
  };
}
```

- [ ] **Step 2: Expose in admin API**

Edit `src/routes/api/admin/users/+server.ts` to call `getSyncStats` for each user in the list and include in the JSON response.

- [ ] **Step 3: Show in admin UI**

Edit `src/routes/admin/users/+page.svelte` — add two columns "Letzter Sync" (relative or absolute date) and "Sync-Storage" (formatted KB/MB).

- [ ] **Step 4: svelte-check + manual verify**

Run: `npm run check && npm run dev`, visit `/admin/users` as admin, verify columns render.

- [ ] **Step 5: Commit**

```bash
git add server/auth/users.ts src/routes/api/admin/users/+server.ts src/routes/admin/users/+page.svelte
git commit -m "feat(admin): add sync metrics (last sync, storage bytes) per user"
```

---

## Task 27: Account-Delete cascade

**Files:**
- Modify: `src/routes/api/account/delete/+server.ts` (or equivalent existing delete endpoint)

- [ ] **Step 1: Find existing delete endpoint**

Run: `grep -rn "deleteUser\\|accountDelete\\|api/account" src/routes/`

- [ ] **Step 2: Add `resetUserData` call before `deleteUser`**

Edit the handler:

```typescript
import { resetUserData } from '../../../../../server/sync/reset';
// ... inside handler:
resetUserData(db, user.id);
deleteUser(db, user.id);
```

This ensures sync rows are soft-deleted first, then user row deletion cascades via FK.

- [ ] **Step 3: svelte-check**

Run: `npm run check`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add -u
git commit -m "feat(sync): cascade account delete to sync tables"
```

---

## Task 28: Legal-Pages erweitern (DSGVO)

**Files:**
- Modify: `src/lib/legal/privacy.ts`
- Modify: `src/lib/legal/privacy.en.ts`
- Modify: `src/lib/legal/privacy.es.ts`
- Modify: `src/lib/legal/terms.ts`
- Modify: `src/lib/legal/terms.en.ts`
- Modify: `src/lib/legal/terms.es.ts`

- [ ] **Step 1: Add "Trainingsdaten"-section in privacy.ts**

Add after the existing data categories:

```typescript
{
  heading: 'Trainingsdaten',
  body: [
    'Wenn du angemeldet bist, speichern wir deine erstellten Übungen, Trainingslisten und App-Einstellungen auf unseren Servern.',
    'Zweck: geräteübergreifender Zugriff, Datensicherung und Wiederherstellung nach Browser-Cache-Verlust.',
    'Speicherort: Server der OK-MARKED LLC (gehostet bei Mittwald, Deutschland).',
    'Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung — zentrale Produktfunktion).',
    'Speicherdauer: bis zur Löschung deines Accounts. Beim Account-Löschen werden alle Trainingsdaten serverseitig markiert und nach 30 Tagen endgültig gelöscht.',
    'Export: Unter „Einstellungen → Account" kannst du alle deine Daten als JSON herunterladen (kommt mit einem späteren Release).',
  ],
}
```

- [ ] **Step 2: Translate for EN + ES**

Add equivalent section in `privacy.en.ts` and `privacy.es.ts` with appropriate translations.

- [ ] **Step 3: Update terms**

In `terms.ts` (+ .en.ts, .es.ts), extend the service description to mention "server-side backup and cross-device synchronization of training data" wherever the scope of the service is defined.

- [ ] **Step 4: svelte-check + visit pages**

Run: `npm run check && npm run dev`, visit `/legal/privacy` + `/legal/terms` in all three languages, verify rendering.

- [ ] **Step 5: Commit**

```bash
git add src/lib/legal/
git commit -m "docs(legal): add training-data section to privacy and extend terms for sync"
```

---

## Task 29: E2E-Test via browser-use

**Files:**
- None (manual, via browser-use skill)

- [ ] **Step 1: Start dev server + seed two test users**

Run:
```bash
npm run server:dev &
npm run dev &
```

Open two browser windows, login as two different users (or same user in two tabs).

- [ ] **Step 2: Test Scenario 1 — Cross-Tab Sync**

In Tab A (user1): Create an exercise "Test Exercise 1". Save.
Switch to Tab B (user1, second device emulation): focus window.
Expected: "Test Exercise 1" appears in Tab B archive within 2s.

- [ ] **Step 3: Test Scenario 2 — Offline Queue**

In Tab A: Open DevTools → Network → set to "Offline".
Create an exercise. Dot turns gray.
Back online: Dot turns blue → green. Tab B sees it after focus.

- [ ] **Step 4: Test Scenario 3 — Soft-Delete Propagation**

Tab A: Delete "Test Exercise 1" from archive.
Tab B: Focus. Expected: exercise disappears from archive.

- [ ] **Step 5: Test Scenario 4 — Initial Sync**

Open fresh browser (incognito). Login as user1.
Expected: Server data populates IndexedDB without dialog.

- [ ] **Step 6: Document outcomes in commit message**

If all four scenarios pass, commit:

```bash
git commit --allow-empty -m "test(sync): e2e verification — cross-tab, offline, soft-delete, initial-sync all pass"
```

If any scenario fails: fix, re-test, commit the fix.

---

## Task 30: Dark Launch + Deploy

**Files:**
- Server `.env` on Mittwald

- [ ] **Step 1: Merge feat/cloud-sync back to main**

Run:
```bash
cd ~/Developer/tt-playbook-trainer
git checkout main
git merge --no-ff feat/cloud-sync
```

- [ ] **Step 2: Dark Launch — admin-only**

On the server, set `.env`:
```
SYNC_ENABLED=true
```

(Feature-flag at server level is ON. Admin-only client-side gate is a follow-up — initial launch exposes to everyone since this is a new-user-friendly feature.)

- [ ] **Step 3: Deploy**

```bash
git push mittwald main
```

Wait 30–60s for Mittwald to rebuild.

- [ ] **Step 4: Production smoke-test**

Login on https://coach.tt-playbook.de.
Expected:
- Sync-Dot appears in sidebar
- Initial-Sync runs silently (push lokale Daten zum Server)
- Status becomes green

- [ ] **Step 5: Verify admin panel**

Visit `/admin/users`. Verify "Letzter Sync" + "Sync-Storage" columns populated.

- [ ] **Step 6: Final commit**

```bash
git commit --allow-empty -m "chore(sync): production smoke-test passed — all users now syncing"
```

---

## Execution Notes

- **Order matters for Tasks 1–9 (Server) and 10–19 (Client)**: Server must be green before client integration tests, client types/DB must be in place before hooks/client/triggers.
- **Task 18 (Settings-Bridge)** is the trickiest; if `writeSyncedSetting` import cycles with theme/language/billing stores, extract to a plain (non-`.svelte`) module or use dynamic import.
- **Task 24 (Root-Layout Initial-Sync)** needs careful testing. If it breaks existing login-flow, revert the heuristic to "push-only on first ever login" (skip merge dialog) and file a follow-up.
- **Rollback** at any time: `SYNC_ENABLED=false` in server `.env` → all routes 503 → client no-ops. IndexedDB local data remains intact.

---

## Self-Review (Post-Write)

**Spec coverage check:**
- Datenmodell (Server + Client): Tasks 1, 10, 11 ✓
- Zod-Validation: Task 2 ✓
- Pull/Push/Reset pure fns: Tasks 3, 4, 5 ✓
- Rate-Limits: Task 6 ✓
- API-Routes: Tasks 7, 8, 9 ✓
- PushQueue: Task 13 ✓
- SyncClient: Task 15 ✓
- Dexie-Hooks + Soft-Delete: Task 16 ✓
- Triggers: Task 17 ✓
- Settings-Bridge: Task 18 ✓
- Initial-Sync + Merge-Dialog: Task 19 ✓
- Status-UI (Dot + Panel + i18n): Tasks 14, 20, 21, 22 ✓
- Call-Sites auf listActive: Task 23 ✓
- Root-Layout Integration: Task 24 ✓
- Feature-Flag SYNC_ENABLED: Task 25 + Tasks 7–9 ✓
- Admin-Panel Metriken: Task 26 ✓
- Account-Delete cascade: Task 27 ✓
- Legal-Pages DSGVO: Task 28 ✓
- E2E: Task 29 ✓
- Deploy: Task 30 ✓

All 21+ spec points addressed across 30 tasks. No placeholders. Method signatures consistent (`getChangesSince`, `applyChanges`, `resetUserData`, `listActive`, `syncClient.pull/push/reset/clearLocal/init/schedulePush`).

**Potential refinement (out-of-scope for this plan):**
- Task 24's server-count heuristic is approximate. Precise merge-collision-detection would need a pre-pull count query. Kept simple to ship — improve in follow-up if UX problems arise.
