# Auth-Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** E-Mail/Passwort-Auth mit Session-Cookies ersetzt den Mock-Login, inkl. Double-Opt-In per Resend-Mail und Pro-Status aus der DB.

**Architecture:** SvelteKit-`+server.ts`-Endpoints + `hooks.server.ts` gegen eine SQLite-Datei (better-sqlite3) mit argon2id-Hashing. Cookie-Sessions (30d sliding, in DB gespeichert). Mail-Versand via Resend mit `MAIL_MODE=console`-Fallback für Dev.

**Tech Stack:** SvelteKit 2 (adapter-node, SPA mit ssr=false global), TypeScript, Vitest, better-sqlite3, argon2, resend, uuid v7.

**Referenzspec:** `docs/superpowers/specs/2026-04-17-auth-backend-design.md`

**Wichtige Vorbedingungen:**
- App ist global SPA (`src/routes/+layout.ts` setzt `ssr=false`). `+server.ts`-Endpoints laufen trotzdem server-seitig (sie sind reine Request-Handler, kein SSR).
- Bestehende Dateien, die ersetzt/entfernt werden: `src/lib/auth/mock-user.svelte.ts`, `src/lib/auth/mock-user-api.ts`, `src/lib/auth/mock-user.test.ts`, `src/lib/pro/status.svelte.ts` (Dev-Toggle-Teil), `src/routes/settings/account/+page.svelte` (Body wird neu geschrieben).
- Vitest-Config includet aktuell nur `src/**/*.{test,spec}.{js,ts}` — muss auf `server/**/*.{test,spec}.{js,ts}` erweitert werden (Task 1).

---

## Task 1: Projekt-Setup (Dependencies, Vitest-Config, Gitignore)

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`
- Modify: `.gitignore`
- Create: `data/.gitkeep`

- [ ] **Step 1: Dependencies installieren**

Run:
```bash
npm install better-sqlite3 argon2 resend uuid
npm install -D @types/better-sqlite3
```

Expected: `package.json` hat neue Einträge unter `dependencies` (better-sqlite3, argon2, resend, uuid) und `devDependencies` (@types/better-sqlite3). `node_modules` enthält kompilierte Native-Binaries für argon2 und better-sqlite3.

- [ ] **Step 2: Vitest-Config auf server/ erweitern**

Modify `vite.config.ts` — im `test`-Block:

```ts
test: {
  expect: { requireAssertions: true },
  environment: 'node',
  setupFiles: ['src/test-setup.ts'],
  include: [
    'src/**/*.{test,spec}.{js,ts}',
    'server/**/*.{test,spec}.{js,ts}'
  ],
  exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
}
```

- [ ] **Step 3: .gitignore ergänzen**

Füge folgende Zeilen in `.gitignore` hinzu (nach den bestehenden Einträgen):

```
# Auth-Datenbank (persistent, läuft mit)
data/auth.db
data/auth.db-journal
data/auth.db-wal
data/auth.db-shm
```

- [ ] **Step 4: data-Verzeichnis anlegen**

Run:
```bash
mkdir -p data && touch data/.gitkeep
```

- [ ] **Step 5: Smoke-Test dass Deps laden**

Create `server/auth/deps.smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

describe('auth deps smoke test', () => {
  it('better-sqlite3 kann in-memory DB öffnen', async () => {
    const BetterSqlite3 = (await import('better-sqlite3')).default;
    const db = new BetterSqlite3(':memory:');
    const result = db.prepare('SELECT 1 AS one').get() as { one: number };
    expect(result.one).toBe(1);
    db.close();
  });

  it('argon2 kann Passwort hashen und verifizieren', async () => {
    const argon2 = await import('argon2');
    const hash = await argon2.hash('test-password');
    expect(await argon2.verify(hash, 'test-password')).toBe(true);
    expect(await argon2.verify(hash, 'wrong')).toBe(false);
  });

  it('uuid exportiert v7', async () => {
    const { v7 } = await import('uuid');
    const id = v7();
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
  });
});
```

- [ ] **Step 6: Tests laufen lassen**

Run: `npx vitest run server/auth/deps.smoke.test.ts`
Expected: 3 passing tests.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vite.config.ts .gitignore data/ server/auth/deps.smoke.test.ts
git commit -m "feat(auth): setup deps, vitest server/ include, data dir"
```

---

## Task 2: DB-Connection + Schema-Migrationen (`server/auth/db.ts`)

**Files:**
- Create: `server/auth/db.ts`
- Create: `server/auth/schema.sql`
- Create: `server/auth/db.test.ts`

- [ ] **Step 1: Schema-SQL schreiben**

Create `server/auth/schema.sql`:

```sql
CREATE TABLE IF NOT EXISTS users (
  id              TEXT PRIMARY KEY,
  email           TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash   TEXT NOT NULL,
  email_verified  INTEGER NOT NULL DEFAULT 0,
  pro_until       INTEGER,
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash    TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at    INTEGER NOT NULL,
  expires_at    INTEGER NOT NULL,
  user_agent    TEXT,
  ip            TEXT
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS verification_tokens (
  token_hash   TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at   INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS reset_tokens (
  token_hash   TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at   INTEGER NOT NULL,
  used_at      INTEGER
);

CREATE TABLE IF NOT EXISTS rate_limits (
  key         TEXT PRIMARY KEY,
  count       INTEGER NOT NULL,
  window_end  INTEGER NOT NULL
);
```

- [ ] **Step 2: Failing Test für DB-Open schreiben**

Create `server/auth/db.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { openDatabase, type AuthDatabase } from './db';

describe('auth db', () => {
  let db: AuthDatabase;

  beforeEach(() => {
    db = openDatabase(':memory:');
  });

  afterEach(() => {
    db.close();
  });

  it('öffnet eine DB und legt das Schema an', () => {
    const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`).all() as { name: string }[];
    const names = tables.map(t => t.name);
    expect(names).toContain('users');
    expect(names).toContain('sessions');
    expect(names).toContain('verification_tokens');
    expect(names).toContain('reset_tokens');
    expect(names).toContain('rate_limits');
  });

  it('setzt user_version auf >= 1', () => {
    const row = db.prepare('PRAGMA user_version').get() as { user_version: number };
    expect(row.user_version).toBeGreaterThanOrEqual(1);
  });

  it('enforced foreign keys (CASCADE)', () => {
    db.prepare(`INSERT INTO users (id, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`).run('u1', 'x@y.de', 'h', 1, 1);
    db.prepare(`INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)`).run('th1', 'u1', 1, 1000);
    db.prepare(`DELETE FROM users WHERE id = ?`).run('u1');
    const rows = db.prepare(`SELECT * FROM sessions WHERE user_id = ?`).all('u1');
    expect(rows).toHaveLength(0);
  });

  it('ist idempotent (zweites openDatabase crasht nicht)', () => {
    const db2 = openDatabase(':memory:');
    expect(db2).toBeDefined();
    db2.close();
  });
});
```

- [ ] **Step 3: Test laufen lassen (FAIL erwartet)**

Run: `npx vitest run server/auth/db.test.ts`
Expected: FAIL — "Cannot find module './db'".

- [ ] **Step 4: DB-Modul implementieren**

Create `server/auth/db.ts`:

```ts
import BetterSqlite3 from 'better-sqlite3';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export type AuthDatabase = BetterSqlite3.Database;

const CURRENT_USER_VERSION = 1;

const MIGRATIONS: Record<number, string> = {
  1: readFileSync(resolve(__dirname, 'schema.sql'), 'utf8'),
};

export function openDatabase(path: string): AuthDatabase {
  const db = new BetterSqlite3(path);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  migrate(db);
  return db;
}

function migrate(db: AuthDatabase): void {
  const row = db.prepare('PRAGMA user_version').get() as { user_version: number };
  let version = row.user_version;
  while (version < CURRENT_USER_VERSION) {
    const next = version + 1;
    const sql = MIGRATIONS[next];
    if (!sql) throw new Error(`Missing migration for version ${next}`);
    db.exec('BEGIN');
    try {
      db.exec(sql);
      db.pragma(`user_version = ${next}`);
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
    version = next;
  }
}

let singleton: AuthDatabase | null = null;

export function getDatabase(): AuthDatabase {
  if (singleton) return singleton;
  const path = process.env.AUTH_DB_PATH ?? resolve(process.cwd(), 'data', 'auth.db');
  singleton = openDatabase(path);
  return singleton;
}

export function resetSingletonForTests(): void {
  if (singleton) {
    singleton.close();
    singleton = null;
  }
}
```

- [ ] **Step 5: Test passt**

Run: `npx vitest run server/auth/db.test.ts`
Expected: 4 passing tests.

- [ ] **Step 6: Commit**

```bash
git add server/auth/db.ts server/auth/schema.sql server/auth/db.test.ts
git commit -m "feat(auth): sqlite connection, schema migrations, fk cascade"
```

---

## Task 3: Password-Hashing (`server/auth/password.ts`)

**Files:**
- Create: `server/auth/password.ts`
- Create: `server/auth/password.test.ts`

- [ ] **Step 1: Failing Test schreiben**

Create `server/auth/password.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, DUMMY_HASH } from './password';

describe('password', () => {
  it('hasht und verifiziert korrektes Passwort', async () => {
    const hash = await hashPassword('correcthorsebatterystaple');
    expect(hash).toMatch(/^\$argon2id\$/);
    expect(await verifyPassword(hash, 'correcthorsebatterystaple')).toBe(true);
  });

  it('lehnt falsches Passwort ab', async () => {
    const hash = await hashPassword('richtig');
    expect(await verifyPassword(hash, 'falsch')).toBe(false);
  });

  it('produziert unterschiedliche Hashes bei gleichem Passwort (Salt)', async () => {
    const a = await hashPassword('same');
    const b = await hashPassword('same');
    expect(a).not.toBe(b);
    expect(await verifyPassword(a, 'same')).toBe(true);
    expect(await verifyPassword(b, 'same')).toBe(true);
  });

  it('verifyPassword gibt false bei ungültigem Hash-Format', async () => {
    expect(await verifyPassword('not-a-hash', 'anything')).toBe(false);
  });

  it('DUMMY_HASH ist ein gültiger argon2-Hash und verifiziert keinen realen Input', async () => {
    expect(DUMMY_HASH).toMatch(/^\$argon2id\$/);
    expect(await verifyPassword(DUMMY_HASH, 'random')).toBe(false);
  });
});
```

- [ ] **Step 2: Test läuft (FAIL)**

Run: `npx vitest run server/auth/password.test.ts`
Expected: FAIL "Cannot find module './password'".

- [ ] **Step 3: Implementierung**

Create `server/auth/password.ts`:

```ts
import argon2 from 'argon2';

// Pre-computed dummy hash to run verifyPassword against when the user doesn't exist,
// so login timing is identical whether or not the account is real.
export const DUMMY_HASH =
  '$argon2id$v=19$m=65536,t=3,p=4$ZHVtbXlzYWx0ZHVtbXlzYQ$KvxQzHxa4fLz4kXmFbB6T9T6KJgQNKqBnCvq6h2Qx9E';

export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, { type: argon2.argon2id });
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Test passt**

Run: `npx vitest run server/auth/password.test.ts`
Expected: 5 passing tests.

- [ ] **Step 5: Commit**

```bash
git add server/auth/password.ts server/auth/password.test.ts
git commit -m "feat(auth): argon2id hash + verify with dummy-hash for timing safety"
```

---

## Task 4: Token-Utilities (`server/auth/tokens.ts`)

**Files:**
- Create: `server/auth/tokens.ts`
- Create: `server/auth/tokens.test.ts`

- [ ] **Step 1: Failing Test schreiben**

Create `server/auth/tokens.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { generateToken, hashToken, constantTimeEquals } from './tokens';

describe('tokens', () => {
  it('generateToken produziert 43-Zeichen base64url (32 bytes)', () => {
    const t = generateToken();
    expect(t).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it('zwei Tokens sind (praktisch sicher) unterschiedlich', () => {
    const a = generateToken();
    const b = generateToken();
    expect(a).not.toBe(b);
  });

  it('hashToken produziert deterministischen sha256-hex', () => {
    const t = 'abc';
    expect(hashToken(t)).toBe(hashToken(t));
    expect(hashToken(t)).toHaveLength(64);
    expect(hashToken(t)).toMatch(/^[0-9a-f]{64}$/);
  });

  it('hashToken unterscheidet verschiedene Inputs', () => {
    expect(hashToken('a')).not.toBe(hashToken('b'));
  });

  it('constantTimeEquals ist true bei gleichen Strings', () => {
    expect(constantTimeEquals('foo', 'foo')).toBe(true);
  });

  it('constantTimeEquals ist false bei ungleichen', () => {
    expect(constantTimeEquals('foo', 'bar')).toBe(false);
    expect(constantTimeEquals('foo', 'foo2')).toBe(false);
  });
});
```

- [ ] **Step 2: FAIL**

Run: `npx vitest run server/auth/tokens.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementierung**

Create `server/auth/tokens.ts`:

```ts
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';

export function generateToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function constantTimeEquals(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}
```

- [ ] **Step 4: Test passt**

Run: `npx vitest run server/auth/tokens.test.ts`
Expected: 6 passing.

- [ ] **Step 5: Commit**

```bash
git add server/auth/tokens.ts server/auth/tokens.test.ts
git commit -m "feat(auth): cryptographic token gen, sha256 hash, constant-time compare"
```

---

## Task 5: Session-Management (`server/auth/sessions.ts`)

**Files:**
- Create: `server/auth/sessions.ts`
- Create: `server/auth/sessions.test.ts`

- [ ] **Step 1: Failing Test**

Create `server/auth/sessions.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { openDatabase, type AuthDatabase } from './db';
import {
  createSession,
  validateAndRefreshSession,
  deleteSession,
  deleteAllUserSessions,
  SESSION_TTL_MS,
} from './sessions';

describe('sessions', () => {
  let db: AuthDatabase;

  beforeEach(() => {
    db = openDatabase(':memory:');
    db.prepare(`INSERT INTO users (id, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`)
      .run('u1', 'user@example.de', 'hash', 1, 1);
  });

  afterEach(() => db.close());

  it('createSession gibt raw Token zurück und speichert Hash', () => {
    const { token, expiresAt } = createSession(db, 'u1', { userAgent: 'test', ip: '127.0.0.1' });
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(expiresAt).toBeGreaterThan(Date.now());
    const rows = db.prepare(`SELECT * FROM sessions WHERE user_id = ?`).all('u1');
    expect(rows).toHaveLength(1);
  });

  it('validateAndRefreshSession gibt User zurück bei gültigem Token und verlängert expires', () => {
    const { token } = createSession(db, 'u1');
    const before = db.prepare(`SELECT expires_at FROM sessions`).get() as { expires_at: number };

    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 60_000);

    const user = validateAndRefreshSession(db, token);
    expect(user?.id).toBe('u1');
    expect(user?.email).toBe('user@example.de');

    const after = db.prepare(`SELECT expires_at FROM sessions`).get() as { expires_at: number };
    expect(after.expires_at).toBeGreaterThan(before.expires_at);

    vi.useRealTimers();
  });

  it('validateAndRefreshSession gibt null bei unbekanntem Token', () => {
    const user = validateAndRefreshSession(db, 'unknown-token');
    expect(user).toBeNull();
  });

  it('validateAndRefreshSession löscht abgelaufene Session', () => {
    const { token } = createSession(db, 'u1');
    db.prepare(`UPDATE sessions SET expires_at = ? WHERE user_id = ?`).run(Date.now() - 1000, 'u1');

    const user = validateAndRefreshSession(db, token);
    expect(user).toBeNull();
    const rows = db.prepare(`SELECT * FROM sessions WHERE user_id = ?`).all('u1');
    expect(rows).toHaveLength(0);
  });

  it('deleteSession entfernt Zeile', () => {
    const { token } = createSession(db, 'u1');
    deleteSession(db, token);
    expect(db.prepare(`SELECT * FROM sessions`).all()).toHaveLength(0);
  });

  it('deleteAllUserSessions entfernt alle Sessions des Users', () => {
    createSession(db, 'u1');
    createSession(db, 'u1');
    createSession(db, 'u1');
    deleteAllUserSessions(db, 'u1');
    expect(db.prepare(`SELECT * FROM sessions WHERE user_id = ?`).all('u1')).toHaveLength(0);
  });

  it('SESSION_TTL_MS ist 30 Tage', () => {
    expect(SESSION_TTL_MS).toBe(30 * 24 * 60 * 60 * 1000);
  });
});
```

- [ ] **Step 2: FAIL**

Run: `npx vitest run server/auth/sessions.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementierung**

Create `server/auth/sessions.ts`:

```ts
import type { AuthDatabase } from './db';
import { generateToken, hashToken } from './tokens';

export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export interface SessionUser {
  id: string;
  email: string;
  emailVerified: boolean;
  proUntil: number | null;
}

export interface CreateSessionOpts {
  userAgent?: string;
  ip?: string;
}

export function createSession(
  db: AuthDatabase,
  userId: string,
  opts: CreateSessionOpts = {},
): { token: string; expiresAt: number } {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const now = Date.now();
  const expiresAt = now + SESSION_TTL_MS;
  db.prepare(
    `INSERT INTO sessions (token_hash, user_id, created_at, expires_at, user_agent, ip)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(tokenHash, userId, now, expiresAt, opts.userAgent ?? null, opts.ip ?? null);
  return { token, expiresAt };
}

interface SessionRow {
  user_id: string;
  expires_at: number;
}

interface UserRow {
  id: string;
  email: string;
  email_verified: number;
  pro_until: number | null;
}

export function validateAndRefreshSession(db: AuthDatabase, token: string): SessionUser | null {
  const tokenHash = hashToken(token);
  const session = db.prepare(`SELECT user_id, expires_at FROM sessions WHERE token_hash = ?`).get(tokenHash) as
    | SessionRow
    | undefined;
  if (!session) return null;
  if (session.expires_at <= Date.now()) {
    db.prepare(`DELETE FROM sessions WHERE token_hash = ?`).run(tokenHash);
    return null;
  }
  const newExpires = Date.now() + SESSION_TTL_MS;
  db.prepare(`UPDATE sessions SET expires_at = ? WHERE token_hash = ?`).run(newExpires, tokenHash);
  const user = db.prepare(`SELECT id, email, email_verified, pro_until FROM users WHERE id = ?`).get(
    session.user_id,
  ) as UserRow | undefined;
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    emailVerified: user.email_verified === 1,
    proUntil: user.pro_until,
  };
}

export function deleteSession(db: AuthDatabase, token: string): void {
  db.prepare(`DELETE FROM sessions WHERE token_hash = ?`).run(hashToken(token));
}

export function deleteAllUserSessions(db: AuthDatabase, userId: string): void {
  db.prepare(`DELETE FROM sessions WHERE user_id = ?`).run(userId);
}
```

- [ ] **Step 4: Test passt**

Run: `npx vitest run server/auth/sessions.test.ts`
Expected: 7 passing.

- [ ] **Step 5: Commit**

```bash
git add server/auth/sessions.ts server/auth/sessions.test.ts
git commit -m "feat(auth): session create/validate/refresh/delete with 30d sliding ttl"
```

---

## Task 6: Rate-Limiting (`server/auth/ratelimit.ts`)

**Files:**
- Create: `server/auth/ratelimit.ts`
- Create: `server/auth/ratelimit.test.ts`

- [ ] **Step 1: Failing Test**

Create `server/auth/ratelimit.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { openDatabase, type AuthDatabase } from './db';
import { checkAndConsume, LIMITS } from './ratelimit';

describe('ratelimit', () => {
  let db: AuthDatabase;

  beforeEach(() => {
    db = openDatabase(':memory:');
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });

  afterEach(() => {
    db.close();
    vi.useRealTimers();
  });

  it('erlaubt Requests bis zum Limit', () => {
    for (let i = 0; i < LIMITS.login.max; i++) {
      expect(checkAndConsume(db, 'login', 'ip:1.2.3.4')).toBe(true);
    }
  });

  it('blockt nach Erreichen des Limits', () => {
    for (let i = 0; i < LIMITS.login.max; i++) {
      checkAndConsume(db, 'login', 'ip:1.2.3.4');
    }
    expect(checkAndConsume(db, 'login', 'ip:1.2.3.4')).toBe(false);
  });

  it('setzt nach Window-Ablauf zurück', () => {
    for (let i = 0; i < LIMITS.login.max; i++) {
      checkAndConsume(db, 'login', 'ip:1.2.3.4');
    }
    expect(checkAndConsume(db, 'login', 'ip:1.2.3.4')).toBe(false);

    vi.setSystemTime(Date.now() + LIMITS.login.windowMs + 1);
    expect(checkAndConsume(db, 'login', 'ip:1.2.3.4')).toBe(true);
  });

  it('trennt Keys (IP vs. Email)', () => {
    for (let i = 0; i < LIMITS.login.max; i++) {
      checkAndConsume(db, 'login', 'ip:1.2.3.4');
    }
    expect(checkAndConsume(db, 'login', 'email:foo@x.de')).toBe(true);
  });

  it('kennt Action-Typen signup, reset, resend, login', () => {
    expect(LIMITS.signup).toBeDefined();
    expect(LIMITS.reset).toBeDefined();
    expect(LIMITS.resendVerification).toBeDefined();
    expect(LIMITS.login).toBeDefined();
  });
});
```

- [ ] **Step 2: FAIL**

Run: `npx vitest run server/auth/ratelimit.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementierung**

Create `server/auth/ratelimit.ts`:

```ts
import type { AuthDatabase } from './db';

export type Action = 'login' | 'signup' | 'reset' | 'resendVerification';

interface Limit {
  max: number;
  windowMs: number;
}

export const LIMITS: Record<Action, Limit> = {
  login: { max: 5, windowMs: 15 * 60 * 1000 },
  signup: { max: 3, windowMs: 60 * 60 * 1000 },
  reset: { max: 3, windowMs: 60 * 60 * 1000 },
  resendVerification: { max: 3, windowMs: 60 * 60 * 1000 },
};

interface Row {
  count: number;
  window_end: number;
}

export function checkAndConsume(db: AuthDatabase, action: Action, key: string): boolean {
  const limit = LIMITS[action];
  const compositeKey = `${action}:${key}`;
  const now = Date.now();

  const row = db.prepare(`SELECT count, window_end FROM rate_limits WHERE key = ?`).get(compositeKey) as
    | Row
    | undefined;

  if (!row || row.window_end <= now) {
    db.prepare(
      `INSERT OR REPLACE INTO rate_limits (key, count, window_end) VALUES (?, 1, ?)`,
    ).run(compositeKey, now + limit.windowMs);
    return true;
  }

  if (row.count >= limit.max) return false;

  db.prepare(`UPDATE rate_limits SET count = count + 1 WHERE key = ?`).run(compositeKey);
  return true;
}
```

- [ ] **Step 4: Test passt**

Run: `npx vitest run server/auth/ratelimit.test.ts`
Expected: 5 passing.

- [ ] **Step 5: Commit**

```bash
git add server/auth/ratelimit.ts server/auth/ratelimit.test.ts
git commit -m "feat(auth): sqlite-backed rate limiter with per-action windows"
```

---

## Task 7: Mailer mit Console-Mode (`server/auth/mailer.ts`)

**Files:**
- Create: `server/auth/mailer.ts`
- Create: `server/auth/mailer.test.ts`

- [ ] **Step 1: Failing Test**

Create `server/auth/mailer.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { sendVerificationMail, sendResetMail } from './mailer';

describe('mailer (console mode)', () => {
  const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

  beforeEach(() => {
    logSpy.mockClear();
    process.env.MAIL_MODE = 'console';
    process.env.APP_URL = 'https://coach.tt-playbook.de';
  });

  afterEach(() => {
    delete process.env.MAIL_MODE;
    delete process.env.APP_URL;
  });

  it('sendVerificationMail loggt den Link in Console-Mode', async () => {
    await sendVerificationMail('user@example.de', 'tok-123');
    const joined = logSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(joined).toContain('user@example.de');
    expect(joined).toContain('https://coach.tt-playbook.de/verify-email/tok-123');
  });

  it('sendResetMail loggt den Reset-Link in Console-Mode', async () => {
    await sendResetMail('user@example.de', 'tok-456');
    const joined = logSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(joined).toContain('user@example.de');
    expect(joined).toContain('https://coach.tt-playbook.de/reset-password/tok-456');
  });

  it('kein Resend-Call ohne RESEND_API_KEY in Console-Mode', async () => {
    // Test verifiziert nur dass kein throw passiert — Resend wird nie importiert im console-Mode.
    await expect(sendVerificationMail('a@b.de', 't')).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: FAIL**

Run: `npx vitest run server/auth/mailer.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementierung**

Create `server/auth/mailer.ts`:

```ts
import { Resend } from 'resend';

const APP_URL = () => process.env.APP_URL ?? 'https://coach.tt-playbook.de';
const MAIL_FROM = () => process.env.MAIL_FROM ?? 'TT Playbook <noreply@tt-playbook.de>';
const MAIL_MODE = () => process.env.MAIL_MODE ?? 'resend';

let resendClient: Resend | null = null;
function getResend(): Resend {
  if (!resendClient) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error('RESEND_API_KEY not set');
    resendClient = new Resend(key);
  }
  return resendClient;
}

async function send(to: string, subject: string, text: string, html: string): Promise<void> {
  if (MAIL_MODE() === 'console') {
    console.log(`\n===== MAIL [${to}] =====\nSubject: ${subject}\n\n${text}\n=====\n`);
    return;
  }
  await getResend().emails.send({
    from: MAIL_FROM(),
    to,
    subject,
    text,
    html,
  });
}

export async function sendVerificationMail(email: string, token: string): Promise<void> {
  const url = `${APP_URL()}/verify-email/${token}`;
  const subject = 'Bestätige deine E-Mail für TT Playbook Trainer';
  const text = `Willkommen bei TT Playbook Trainer!

Klick auf den folgenden Link, um deine E-Mail-Adresse zu bestätigen:
${url}

Der Link läuft in 24 Stunden ab.

Falls du dich nicht registriert hast, ignoriere diese Mail.`;
  const html = `<p>Willkommen bei TT Playbook Trainer!</p>
<p><a href="${url}">E-Mail bestätigen</a></p>
<p>Der Link läuft in 24 Stunden ab. Falls du dich nicht registriert hast, ignoriere diese Mail.</p>`;
  await send(email, subject, text, html);
}

export async function sendResetMail(email: string, token: string): Promise<void> {
  const url = `${APP_URL()}/reset-password/${token}`;
  const subject = 'Passwort zurücksetzen – TT Playbook Trainer';
  const text = `Du hast einen Passwort-Reset angefordert.

Klick auf den folgenden Link, um ein neues Passwort zu setzen:
${url}

Der Link läuft in 1 Stunde ab.

Falls du das nicht warst, ignoriere diese Mail — dein Passwort bleibt unverändert.`;
  const html = `<p>Du hast einen Passwort-Reset angefordert.</p>
<p><a href="${url}">Neues Passwort setzen</a></p>
<p>Der Link läuft in 1 Stunde ab. Falls du das nicht warst, ignoriere diese Mail.</p>`;
  await send(email, subject, text, html);
}
```

- [ ] **Step 4: Test passt**

Run: `npx vitest run server/auth/mailer.test.ts`
Expected: 3 passing.

- [ ] **Step 5: Commit**

```bash
git add server/auth/mailer.ts server/auth/mailer.test.ts
git commit -m "feat(auth): resend mailer with MAIL_MODE=console fallback for dev"
```

---

## Task 8: hooks.server.ts + app.d.ts (Auth-Middleware)

**Files:**
- Create: `src/hooks.server.ts`
- Modify: `src/app.d.ts`
- Create: `src/hooks.server.test.ts`

- [ ] **Step 1: app.d.ts User-Typ ergänzen**

Read current `src/app.d.ts` first, then modify. Replace whole content with:

```ts
import type { SessionUser } from '../server/auth/sessions';

declare global {
  namespace App {
    interface Locals {
      user: SessionUser | null;
    }
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface Error {}
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface PageData {}
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface PageState {}
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface Platform {}
  }
}

export {};
```

If the existing `app.d.ts` already has other types, merge — don't blindly overwrite.

- [ ] **Step 2: Failing Test für hooks**

Create `src/hooks.server.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('../server/auth/db', () => {
  const BetterSqlite3 = require('better-sqlite3');
  const memDb = new BetterSqlite3(':memory:');
  const schemaSql = require('node:fs').readFileSync(
    require('node:path').resolve(__dirname, '../server/auth/schema.sql'),
    'utf8',
  );
  memDb.pragma('foreign_keys = ON');
  memDb.exec(schemaSql);
  memDb.pragma('user_version = 1');
  return {
    getDatabase: () => memDb,
    resetSingletonForTests: () => {},
  };
});

import { handle } from './hooks.server';
import { getDatabase } from '../server/auth/db';
import { createSession } from '../server/auth/sessions';

function mkEvent(cookieHeader: string | null): any {
  const cookies = {
    get(name: string) {
      if (!cookieHeader) return undefined;
      const match = cookieHeader.match(new RegExp(`(^|;\\s*)${name}=([^;]*)`));
      return match ? match[2] : undefined;
    },
    delete: vi.fn(),
  };
  return {
    cookies,
    locals: {},
    request: new Request('http://localhost/'),
  };
}

describe('hooks.server', () => {
  beforeEach(() => {
    const db = getDatabase();
    db.exec(`DELETE FROM sessions; DELETE FROM users;`);
    db.prepare(
      `INSERT INTO users (id, email, password_hash, email_verified, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
    ).run('u1', 'user@example.de', 'hash', 1, 1, 1);
  });

  it('setzt locals.user = null ohne Cookie', async () => {
    const event = mkEvent(null);
    await handle({ event, resolve: async () => new Response('ok') });
    expect(event.locals.user).toBeNull();
  });

  it('setzt locals.user bei gültigem Cookie', async () => {
    const { token } = createSession(getDatabase(), 'u1');
    const event = mkEvent(`ttp_session=${token}`);
    await handle({ event, resolve: async () => new Response('ok') });
    expect(event.locals.user?.email).toBe('user@example.de');
  });

  it('setzt locals.user = null bei ungültigem Cookie', async () => {
    const event = mkEvent(`ttp_session=garbage`);
    await handle({ event, resolve: async () => new Response('ok') });
    expect(event.locals.user).toBeNull();
  });
});
```

- [ ] **Step 3: FAIL**

Run: `npx vitest run src/hooks.server.test.ts`
Expected: FAIL.

- [ ] **Step 4: Implementierung**

Create `src/hooks.server.ts`:

```ts
import type { Handle } from '@sveltejs/kit';
import { getDatabase } from '../server/auth/db';
import { validateAndRefreshSession } from '../server/auth/sessions';

const COOKIE_NAME = 'ttp_session';

export const handle: Handle = async ({ event, resolve }) => {
  const token = event.cookies.get(COOKIE_NAME);
  if (!token) {
    event.locals.user = null;
    return resolve(event);
  }
  const db = getDatabase();
  const user = validateAndRefreshSession(db, token);
  event.locals.user = user;
  if (!user) {
    event.cookies.delete(COOKIE_NAME, { path: '/' });
  }
  return resolve(event);
};
```

- [ ] **Step 5: Test passt**

Run: `npx vitest run src/hooks.server.test.ts`
Expected: 3 passing.

- [ ] **Step 6: svelte-check sauber**

Run: `npm run check`
Expected: 0 errors, 0 warnings.

- [ ] **Step 7: Commit**

```bash
git add src/hooks.server.ts src/app.d.ts src/hooks.server.test.ts
git commit -m "feat(auth): hooks.server reads session cookie into locals.user"
```

---

## Task 9: `/api/auth/signup` Endpoint + Cookie-Helper

**Files:**
- Create: `server/auth/cookies.ts`
- Create: `server/auth/users.ts`
- Create: `src/routes/api/auth/signup/+server.ts`
- Create: `server/auth/users.test.ts`
- Create: `src/routes/api/auth/signup/signup.test.ts`

- [ ] **Step 1: Cookie-Helper erstellen**

Create `server/auth/cookies.ts`:

```ts
import type { Cookies } from '@sveltejs/kit';
import { SESSION_TTL_MS } from './sessions';

export const SESSION_COOKIE_NAME = 'ttp_session';

export function setSessionCookie(cookies: Cookies, token: string): void {
  cookies.set(SESSION_COOKIE_NAME, token, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

export function clearSessionCookie(cookies: Cookies): void {
  cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
}
```

- [ ] **Step 2: Failing Test für users-Helper**

Create `server/auth/users.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { openDatabase, type AuthDatabase } from './db';
import { createUser, findUserByEmail, markEmailVerified, updatePasswordHash, EMAIL_REGEX } from './users';

describe('users', () => {
  let db: AuthDatabase;
  beforeEach(() => {
    db = openDatabase(':memory:');
  });
  afterEach(() => db.close());

  it('createUser legt neuen User mit uuid-id an', async () => {
    const user = await createUser(db, 'user@example.de', 'argon-hash');
    expect(user.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(user.email).toBe('user@example.de');
    expect(user.emailVerified).toBe(false);
  });

  it('findUserByEmail ist case-insensitiv', async () => {
    await createUser(db, 'User@Example.de', 'h');
    const found = findUserByEmail(db, 'user@example.de');
    expect(found?.email).toBe('User@Example.de');
  });

  it('findUserByEmail gibt null bei unbekannter Mail', () => {
    expect(findUserByEmail(db, 'nope@x.de')).toBeNull();
  });

  it('createUser wirft bei Duplicate', async () => {
    await createUser(db, 'dup@x.de', 'h');
    await expect(createUser(db, 'DUP@x.de', 'h')).rejects.toThrow();
  });

  it('markEmailVerified setzt flag und gibt User zurück', async () => {
    const u = await createUser(db, 'v@x.de', 'h');
    markEmailVerified(db, u.id);
    const refreshed = findUserByEmail(db, 'v@x.de');
    expect(refreshed?.emailVerified).toBe(true);
  });

  it('updatePasswordHash überschreibt Hash', async () => {
    const u = await createUser(db, 'p@x.de', 'old');
    updatePasswordHash(db, u.id, 'new');
    const row = db.prepare(`SELECT password_hash FROM users WHERE id = ?`).get(u.id) as { password_hash: string };
    expect(row.password_hash).toBe('new');
  });

  it('EMAIL_REGEX erkennt gültige und ungültige Adressen', () => {
    expect(EMAIL_REGEX.test('a@b.de')).toBe(true);
    expect(EMAIL_REGEX.test('not-an-email')).toBe(false);
    expect(EMAIL_REGEX.test('a@b')).toBe(false);
  });
});
```

- [ ] **Step 3: FAIL**

Run: `npx vitest run server/auth/users.test.ts`
Expected: FAIL.

- [ ] **Step 4: Implementierung users.ts**

Create `server/auth/users.ts`:

```ts
import { v7 as uuidv7 } from 'uuid';
import type { AuthDatabase } from './db';

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  emailVerified: boolean;
  proUntil: number | null;
}

interface Row {
  id: string;
  email: string;
  password_hash: string;
  email_verified: number;
  pro_until: number | null;
}

function rowToUser(row: Row): UserRecord {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    emailVerified: row.email_verified === 1,
    proUntil: row.pro_until,
  };
}

export async function createUser(
  db: AuthDatabase,
  email: string,
  passwordHash: string,
): Promise<UserRecord> {
  const id = uuidv7();
  const now = Date.now();
  db.prepare(
    `INSERT INTO users (id, email, password_hash, email_verified, pro_until, created_at, updated_at)
     VALUES (?, ?, ?, 0, NULL, ?, ?)`,
  ).run(id, email, passwordHash, now, now);
  return { id, email, passwordHash, emailVerified: false, proUntil: null };
}

export function findUserByEmail(db: AuthDatabase, email: string): UserRecord | null {
  const row = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email) as Row | undefined;
  return row ? rowToUser(row) : null;
}

export function findUserById(db: AuthDatabase, id: string): UserRecord | null {
  const row = db.prepare(`SELECT * FROM users WHERE id = ?`).get(id) as Row | undefined;
  return row ? rowToUser(row) : null;
}

export function markEmailVerified(db: AuthDatabase, userId: string): void {
  db.prepare(`UPDATE users SET email_verified = 1, updated_at = ? WHERE id = ?`).run(Date.now(), userId);
}

export function updatePasswordHash(db: AuthDatabase, userId: string, newHash: string): void {
  db.prepare(`UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?`).run(newHash, Date.now(), userId);
}
```

- [ ] **Step 5: users-Test passt**

Run: `npx vitest run server/auth/users.test.ts`
Expected: 7 passing.

- [ ] **Step 6: Verification-Token-Helper ergänzen**

Create `server/auth/verification.ts`:

```ts
import type { AuthDatabase } from './db';
import { generateToken, hashToken } from './tokens';

export const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

export function createVerificationToken(db: AuthDatabase, userId: string): string {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = Date.now() + VERIFICATION_TTL_MS;
  db.prepare(
    `INSERT INTO verification_tokens (token_hash, user_id, expires_at) VALUES (?, ?, ?)`,
  ).run(tokenHash, userId, expiresAt);
  return token;
}

export function consumeVerificationToken(db: AuthDatabase, token: string): string | null {
  const tokenHash = hashToken(token);
  const row = db
    .prepare(`SELECT user_id, expires_at FROM verification_tokens WHERE token_hash = ?`)
    .get(tokenHash) as { user_id: string; expires_at: number } | undefined;
  if (!row || row.expires_at <= Date.now()) return null;
  db.prepare(`DELETE FROM verification_tokens WHERE token_hash = ?`).run(tokenHash);
  return row.user_id;
}
```

- [ ] **Step 7: Failing Test für signup-Endpoint**

Create `src/routes/api/auth/signup/signup.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// In-memory DB mock for the whole api test suite
vi.mock('../../../../../server/auth/db', async () => {
  const BetterSqlite3 = (await import('better-sqlite3')).default;
  const fs = await import('node:fs');
  const path = await import('node:path');
  const memDb = new BetterSqlite3(':memory:');
  const schemaSql = fs.readFileSync(path.resolve(__dirname, '../../../../../server/auth/schema.sql'), 'utf8');
  memDb.pragma('foreign_keys = ON');
  memDb.exec(schemaSql);
  memDb.pragma('user_version = 1');
  return { getDatabase: () => memDb, resetSingletonForTests: () => {} };
});

vi.mock('../../../../../server/auth/mailer', () => ({
  sendVerificationMail: vi.fn(async () => {}),
  sendResetMail: vi.fn(async () => {}),
}));

import { POST } from './+server';
import { getDatabase } from '../../../../../server/auth/db';
import { sendVerificationMail } from '../../../../../server/auth/mailer';

function mkRequest(body: Record<string, unknown>, ip = '1.2.3.4'): any {
  return {
    request: new Request('http://localhost/api/auth/signup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    getClientAddress: () => ip,
    cookies: { set: vi.fn(), delete: vi.fn(), get: () => undefined },
  };
}

describe('POST /api/auth/signup', () => {
  beforeEach(() => {
    getDatabase().exec(`DELETE FROM users; DELETE FROM verification_tokens; DELETE FROM rate_limits;`);
    (sendVerificationMail as any).mockClear();
  });

  it('legt User an und sendet Verification-Mail', async () => {
    const res = await POST(mkRequest({ email: 'a@b.de', password: 'passpasspass' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toMatch(/bestätigung/i);

    const rows = getDatabase().prepare(`SELECT * FROM users`).all() as any[];
    expect(rows).toHaveLength(1);
    expect(rows[0].email).toBe('a@b.de');

    expect(sendVerificationMail).toHaveBeenCalledWith('a@b.de', expect.any(String));
  });

  it('lehnt zu kurzes Passwort ab (400)', async () => {
    const res = await POST(mkRequest({ email: 'a@b.de', password: 'short' }));
    expect(res.status).toBe(400);
  });

  it('lehnt ungültige E-Mail ab (400)', async () => {
    const res = await POST(mkRequest({ email: 'not-an-email', password: 'passpasspass' }));
    expect(res.status).toBe(400);
  });

  it('bei existierender Mail: generic 200, KEIN zweiter User', async () => {
    await POST(mkRequest({ email: 'dup@b.de', password: 'passpasspass' }));
    (sendVerificationMail as any).mockClear();

    const res = await POST(mkRequest({ email: 'dup@b.de', password: 'other-pass-1234' }));
    expect(res.status).toBe(200);

    const rows = getDatabase().prepare(`SELECT * FROM users`).all() as any[];
    expect(rows).toHaveLength(1);
  });

  it('rate-limited nach 3 Versuchen pro IP (429)', async () => {
    for (let i = 0; i < 3; i++) {
      await POST(mkRequest({ email: `u${i}@x.de`, password: 'passpasspass' }, '9.9.9.9'));
    }
    const res = await POST(mkRequest({ email: 'u9@x.de', password: 'passpasspass' }, '9.9.9.9'));
    expect(res.status).toBe(429);
  });
});
```

- [ ] **Step 8: FAIL**

Run: `npx vitest run src/routes/api/auth/signup/signup.test.ts`
Expected: FAIL — Module './+server' not found.

- [ ] **Step 9: Implementierung Signup-Endpoint**

Create `src/routes/api/auth/signup/+server.ts`:

```ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDatabase } from '../../../../../server/auth/db';
import { hashPassword } from '../../../../../server/auth/password';
import { createUser, findUserByEmail, EMAIL_REGEX } from '../../../../../server/auth/users';
import { createVerificationToken } from '../../../../../server/auth/verification';
import { sendVerificationMail } from '../../../../../server/auth/mailer';
import { checkAndConsume } from '../../../../../server/auth/ratelimit';

const GENERIC_OK = { message: 'Bestätigungs-Mail verschickt, falls die Adresse gültig ist.' };

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
  const ip = getClientAddress();
  const db = getDatabase();

  if (!checkAndConsume(db, 'signup', `ip:${ip}`)) {
    return json({ error: 'Zu viele Versuche, bitte später erneut.' }, { status: 429 });
  }

  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Ungültiger Request-Body.' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!EMAIL_REGEX.test(email)) {
    return json({ error: 'Ungültige E-Mail-Adresse.' }, { status: 400 });
  }
  if (password.length < 10) {
    return json({ error: 'Passwort muss mindestens 10 Zeichen lang sein.' }, { status: 400 });
  }

  const existing = findUserByEmail(db, email);
  if (existing) {
    // Keine DB-Writes, Response trotzdem generic. Bestehender User ignoriert.
    return json(GENERIC_OK);
  }

  const hash = await hashPassword(password);
  const user = await createUser(db, email, hash);
  const token = createVerificationToken(db, user.id);

  sendVerificationMail(email, token).catch((err) => {
    console.error('sendVerificationMail failed:', err);
  });

  return json(GENERIC_OK);
};
```

- [ ] **Step 10: Test passt**

Run: `npx vitest run src/routes/api/auth/signup/signup.test.ts`
Expected: 5 passing.

- [ ] **Step 11: Commit**

```bash
git add server/auth/cookies.ts server/auth/users.ts server/auth/users.test.ts server/auth/verification.ts src/routes/api/auth/signup/+server.ts src/routes/api/auth/signup/signup.test.ts
git commit -m "feat(auth): POST /api/auth/signup with rate-limit + generic response"
```

---

## Task 10: `/verify-email/[token]` Endpoint (GET, Page-Redirect)

Der Endpoint ist ein GET-Handler als `+server.ts`, der den Token verifiziert, Cookie setzt und auf `/draw` redirected. Die Frontend-Seite `/verify-email/[token]/+page.svelte` ist nicht nötig — SvelteKit kann auf derselben Route API-Handler und Page haben, aber für unseren SPA-Flow reicht ein reiner Redirect-Handler.

Wir nutzen eine API-Route: `GET /api/auth/verify-email?token=...` — und die `/verify-email/[token]/+page.svelte` lädt sie beim Mount (client-side), weil `ssr=false` global gesetzt ist. Das entkoppelt Routing-Page (Landing) von API-Call.

**Files:**
- Create: `src/routes/api/auth/verify-email/+server.ts`
- Create: `src/routes/api/auth/verify-email/verify-email.test.ts`

- [ ] **Step 1: Failing Test**

Create `src/routes/api/auth/verify-email/verify-email.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../../../../server/auth/db', async () => {
  const BetterSqlite3 = (await import('better-sqlite3')).default;
  const fs = await import('node:fs');
  const path = await import('node:path');
  const memDb = new BetterSqlite3(':memory:');
  const schemaSql = fs.readFileSync(path.resolve(__dirname, '../../../../../server/auth/schema.sql'), 'utf8');
  memDb.pragma('foreign_keys = ON');
  memDb.exec(schemaSql);
  memDb.pragma('user_version = 1');
  return { getDatabase: () => memDb, resetSingletonForTests: () => {} };
});

import { POST } from './+server';
import { getDatabase } from '../../../../../server/auth/db';
import { createUser } from '../../../../../server/auth/users';
import { createVerificationToken } from '../../../../../server/auth/verification';

function mkRequest(body: Record<string, unknown>): any {
  const cookies = {
    set: vi.fn(),
    delete: vi.fn(),
    get: () => undefined,
  };
  return {
    request: new Request('http://localhost/api/auth/verify-email', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    getClientAddress: () => '1.2.3.4',
    cookies,
  };
}

describe('POST /api/auth/verify-email', () => {
  beforeEach(() => {
    getDatabase().exec(`DELETE FROM users; DELETE FROM verification_tokens; DELETE FROM sessions;`);
  });

  it('verifiziert, setzt Cookie, gibt User zurück', async () => {
    const user = await createUser(getDatabase(), 'v@x.de', 'hash');
    const token = createVerificationToken(getDatabase(), user.id);

    const event = mkRequest({ token });
    const res = await POST(event);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.user.email).toBe('v@x.de');
    expect(body.user.emailVerified).toBe(true);
    expect(event.cookies.set).toHaveBeenCalledWith('ttp_session', expect.any(String), expect.any(Object));
  });

  it('400 bei ungültigem Token', async () => {
    const res = await POST(mkRequest({ token: 'invalid' }));
    expect(res.status).toBe(400);
  });

  it('400 bei abgelaufenem Token', async () => {
    const user = await createUser(getDatabase(), 'e@x.de', 'hash');
    const token = createVerificationToken(getDatabase(), user.id);
    getDatabase().prepare(`UPDATE verification_tokens SET expires_at = 1 WHERE user_id = ?`).run(user.id);

    const res = await POST(mkRequest({ token }));
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: FAIL**

Run: `npx vitest run src/routes/api/auth/verify-email/verify-email.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementierung**

Create `src/routes/api/auth/verify-email/+server.ts`:

```ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDatabase } from '../../../../../server/auth/db';
import { consumeVerificationToken } from '../../../../../server/auth/verification';
import { markEmailVerified, findUserById } from '../../../../../server/auth/users';
import { createSession } from '../../../../../server/auth/sessions';
import { setSessionCookie } from '../../../../../server/auth/cookies';

export const POST: RequestHandler = async ({ request, cookies, getClientAddress }) => {
  let body: { token?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Ungültiger Request-Body.' }, { status: 400 });
  }
  const token = typeof body.token === 'string' ? body.token : '';
  if (!token) return json({ error: 'Link ungültig oder abgelaufen.' }, { status: 400 });

  const db = getDatabase();
  const userId = consumeVerificationToken(db, token);
  if (!userId) return json({ error: 'Link ungültig oder abgelaufen.' }, { status: 400 });

  markEmailVerified(db, userId);
  const user = findUserById(db, userId);
  if (!user) return json({ error: 'User nicht gefunden.' }, { status: 400 });

  const { token: sessionToken } = createSession(db, userId, {
    userAgent: request.headers.get('user-agent') ?? undefined,
    ip: getClientAddress(),
  });
  setSessionCookie(cookies, sessionToken);

  return json({
    user: {
      id: user.id,
      email: user.email,
      emailVerified: true,
      proUntil: user.proUntil,
    },
  });
};
```

- [ ] **Step 4: Test passt**

Run: `npx vitest run src/routes/api/auth/verify-email/verify-email.test.ts`
Expected: 3 passing.

- [ ] **Step 5: Commit**

```bash
git add src/routes/api/auth/verify-email/
git commit -m "feat(auth): POST /api/auth/verify-email consumes token and auto-logs in"
```

---

## Task 11: `/api/auth/resend-verification`

**Files:**
- Create: `src/routes/api/auth/resend-verification/+server.ts`
- Create: `src/routes/api/auth/resend-verification/resend.test.ts`

- [ ] **Step 1: Test schreiben**

Create `src/routes/api/auth/resend-verification/resend.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../../../../server/auth/db', async () => {
  const BetterSqlite3 = (await import('better-sqlite3')).default;
  const fs = await import('node:fs');
  const path = await import('node:path');
  const memDb = new BetterSqlite3(':memory:');
  const schemaSql = fs.readFileSync(path.resolve(__dirname, '../../../../../server/auth/schema.sql'), 'utf8');
  memDb.pragma('foreign_keys = ON');
  memDb.exec(schemaSql);
  memDb.pragma('user_version = 1');
  return { getDatabase: () => memDb, resetSingletonForTests: () => {} };
});
vi.mock('../../../../../server/auth/mailer', () => ({
  sendVerificationMail: vi.fn(async () => {}),
  sendResetMail: vi.fn(async () => {}),
}));

import { POST } from './+server';
import { getDatabase } from '../../../../../server/auth/db';
import { createUser } from '../../../../../server/auth/users';
import { sendVerificationMail } from '../../../../../server/auth/mailer';

function mkRequest(body: Record<string, unknown>): any {
  return {
    request: new Request('http://localhost/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    getClientAddress: () => '1.2.3.4',
  };
}

describe('POST /api/auth/resend-verification', () => {
  beforeEach(() => {
    getDatabase().exec(`DELETE FROM users; DELETE FROM verification_tokens; DELETE FROM rate_limits;`);
    (sendVerificationMail as any).mockClear();
  });

  it('sendet Mail bei unverifiziertem User', async () => {
    await createUser(getDatabase(), 'u@x.de', 'h');
    const res = await POST(mkRequest({ email: 'u@x.de' }));
    expect(res.status).toBe(200);
    expect(sendVerificationMail).toHaveBeenCalled();
  });

  it('sendet KEINE Mail bei bereits verifiziertem User (generic 200)', async () => {
    const u = await createUser(getDatabase(), 'v@x.de', 'h');
    getDatabase().prepare(`UPDATE users SET email_verified = 1 WHERE id = ?`).run(u.id);
    const res = await POST(mkRequest({ email: 'v@x.de' }));
    expect(res.status).toBe(200);
    expect(sendVerificationMail).not.toHaveBeenCalled();
  });

  it('sendet KEINE Mail bei unbekanntem User (generic 200)', async () => {
    const res = await POST(mkRequest({ email: 'nope@x.de' }));
    expect(res.status).toBe(200);
    expect(sendVerificationMail).not.toHaveBeenCalled();
  });

  it('429 nach 3 Versuchen pro Email', async () => {
    for (let i = 0; i < 3; i++) await POST(mkRequest({ email: 'rl@x.de' }));
    const res = await POST(mkRequest({ email: 'rl@x.de' }));
    expect(res.status).toBe(429);
  });
});
```

- [ ] **Step 2: Implementierung**

Create `src/routes/api/auth/resend-verification/+server.ts`:

```ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDatabase } from '../../../../../server/auth/db';
import { findUserByEmail, EMAIL_REGEX } from '../../../../../server/auth/users';
import { createVerificationToken } from '../../../../../server/auth/verification';
import { sendVerificationMail } from '../../../../../server/auth/mailer';
import { checkAndConsume } from '../../../../../server/auth/ratelimit';

const GENERIC_OK = { message: 'Falls registriert, wurde eine Bestätigungs-Mail verschickt.' };

export const POST: RequestHandler = async ({ request }) => {
  let body: { email?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Ungültiger Request-Body.' }, { status: 400 });
  }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!EMAIL_REGEX.test(email)) return json(GENERIC_OK);

  const db = getDatabase();
  if (!checkAndConsume(db, 'resendVerification', `email:${email}`)) {
    return json({ error: 'Zu viele Versuche, bitte später erneut.' }, { status: 429 });
  }

  const user = findUserByEmail(db, email);
  if (user && !user.emailVerified) {
    const token = createVerificationToken(db, user.id);
    sendVerificationMail(email, token).catch((err) => console.error('sendVerificationMail failed:', err));
  }
  return json(GENERIC_OK);
};
```

- [ ] **Step 3: Tests grün**

Run: `npx vitest run src/routes/api/auth/resend-verification/`
Expected: 4 passing.

- [ ] **Step 4: Commit**

```bash
git add src/routes/api/auth/resend-verification/
git commit -m "feat(auth): POST /api/auth/resend-verification with generic response"
```

---

## Task 12: `/api/auth/login`

**Files:**
- Create: `src/routes/api/auth/login/+server.ts`
- Create: `src/routes/api/auth/login/login.test.ts`

- [ ] **Step 1: Test schreiben**

Create `src/routes/api/auth/login/login.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../../../../server/auth/db', async () => {
  const BetterSqlite3 = (await import('better-sqlite3')).default;
  const fs = await import('node:fs');
  const path = await import('node:path');
  const memDb = new BetterSqlite3(':memory:');
  const schemaSql = fs.readFileSync(path.resolve(__dirname, '../../../../../server/auth/schema.sql'), 'utf8');
  memDb.pragma('foreign_keys = ON');
  memDb.exec(schemaSql);
  memDb.pragma('user_version = 1');
  return { getDatabase: () => memDb, resetSingletonForTests: () => {} };
});

import { POST } from './+server';
import { getDatabase } from '../../../../../server/auth/db';
import { createUser, markEmailVerified } from '../../../../../server/auth/users';
import { hashPassword } from '../../../../../server/auth/password';

function mkRequest(body: Record<string, unknown>, ip = '1.2.3.4'): any {
  return {
    request: new Request('http://localhost/', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'user-agent': 'vitest' },
      body: JSON.stringify(body),
    }),
    getClientAddress: () => ip,
    cookies: { set: vi.fn(), delete: vi.fn(), get: () => undefined },
  };
}

async function seedUser(email: string, password: string, verified = true) {
  const hash = await hashPassword(password);
  const u = await createUser(getDatabase(), email, hash);
  if (verified) markEmailVerified(getDatabase(), u.id);
  return u;
}

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    getDatabase().exec(`DELETE FROM users; DELETE FROM sessions; DELETE FROM rate_limits;`);
  });

  it('erfolgreicher Login setzt Cookie, gibt User', async () => {
    await seedUser('ok@x.de', 'passpasspass');
    const event = mkRequest({ email: 'ok@x.de', password: 'passpasspass' });
    const res = await POST(event);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.email).toBe('ok@x.de');
    expect(event.cookies.set).toHaveBeenCalledWith('ttp_session', expect.any(String), expect.any(Object));
  });

  it('401 bei falschem Passwort', async () => {
    await seedUser('p@x.de', 'passpasspass');
    const res = await POST(mkRequest({ email: 'p@x.de', password: 'wrong' }));
    expect(res.status).toBe(401);
  });

  it('401 bei unbekannter E-Mail (generic)', async () => {
    const res = await POST(mkRequest({ email: 'nope@x.de', password: 'irrelevant' }));
    expect(res.status).toBe(401);
  });

  it('403 bei unverifizierter Mail', async () => {
    await seedUser('unv@x.de', 'passpasspass', false);
    const res = await POST(mkRequest({ email: 'unv@x.de', password: 'passpasspass' }));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.canResend).toBe(true);
  });

  it('429 nach 5 falschen Versuchen (Email-Rate-Limit)', async () => {
    await seedUser('rl@x.de', 'passpasspass');
    for (let i = 0; i < 5; i++) {
      await POST(mkRequest({ email: 'rl@x.de', password: 'wrong' }, '5.5.5.5'));
    }
    const res = await POST(mkRequest({ email: 'rl@x.de', password: 'wrong' }, '5.5.5.5'));
    expect(res.status).toBe(429);
  });

  it('Timing-Angleich: unbekannte Mail ≈ bekannte Mail mit falschem Passwort', async () => {
    await seedUser('timing@x.de', 'passpasspass');
    const t1 = performance.now();
    await POST(mkRequest({ email: 'timing@x.de', password: 'wrong' }, '7.7.7.7'));
    const d1 = performance.now() - t1;

    getDatabase().exec(`DELETE FROM rate_limits`);

    const t2 = performance.now();
    await POST(mkRequest({ email: 'unknown-user@x.de', password: 'wrong' }, '8.8.8.8'));
    const d2 = performance.now() - t2;

    // Beide Pfade führen argon2 aus → Differenz klein (argon2 ~30ms, Toleranz 200ms).
    expect(Math.abs(d1 - d2)).toBeLessThan(200);
  });
});
```

- [ ] **Step 2: Implementierung**

Create `src/routes/api/auth/login/+server.ts`:

```ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDatabase } from '../../../../../server/auth/db';
import { findUserByEmail, EMAIL_REGEX } from '../../../../../server/auth/users';
import { verifyPassword, DUMMY_HASH } from '../../../../../server/auth/password';
import { createSession } from '../../../../../server/auth/sessions';
import { setSessionCookie } from '../../../../../server/auth/cookies';
import { checkAndConsume } from '../../../../../server/auth/ratelimit';

export const POST: RequestHandler = async ({ request, cookies, getClientAddress }) => {
  const ip = getClientAddress();
  const db = getDatabase();

  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Ungültiger Request-Body.' }, { status: 400 });
  }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!EMAIL_REGEX.test(email) || password.length === 0) {
    return json({ error: 'E-Mail oder Passwort falsch.' }, { status: 401 });
  }

  if (!checkAndConsume(db, 'login', `ip:${ip}`) || !checkAndConsume(db, 'login', `email:${email}`)) {
    return json({ error: 'Zu viele Versuche, bitte später erneut.' }, { status: 429 });
  }

  const user = findUserByEmail(db, email);
  // Timing-attack protection: run argon2.verify regardless.
  const hashForCompare = user?.passwordHash ?? DUMMY_HASH;
  const ok = await verifyPassword(hashForCompare, password);

  if (!user || !ok) {
    return json({ error: 'E-Mail oder Passwort falsch.' }, { status: 401 });
  }

  if (!user.emailVerified) {
    return json(
      { error: 'Bitte bestätige zuerst deine E-Mail.', canResend: true },
      { status: 403 },
    );
  }

  const { token } = createSession(db, user.id, {
    userAgent: request.headers.get('user-agent') ?? undefined,
    ip,
  });
  setSessionCookie(cookies, token);

  return json({
    user: {
      id: user.id,
      email: user.email,
      emailVerified: true,
      proUntil: user.proUntil,
    },
  });
};
```

- [ ] **Step 3: Tests grün**

Run: `npx vitest run src/routes/api/auth/login/`
Expected: 6 passing.

- [ ] **Step 4: Commit**

```bash
git add src/routes/api/auth/login/
git commit -m "feat(auth): POST /api/auth/login with timing-safe + rate-limit + 403 unverified"
```

---

## Task 13: `/api/auth/logout` + `/api/auth/me`

**Files:**
- Create: `src/routes/api/auth/logout/+server.ts`
- Create: `src/routes/api/auth/logout/logout.test.ts`
- Create: `src/routes/api/auth/me/+server.ts`
- Create: `src/routes/api/auth/me/me.test.ts`

- [ ] **Step 1: logout-Test**

Create `src/routes/api/auth/logout/logout.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../../../../server/auth/db', async () => {
  const BetterSqlite3 = (await import('better-sqlite3')).default;
  const fs = await import('node:fs');
  const path = await import('node:path');
  const memDb = new BetterSqlite3(':memory:');
  const schemaSql = fs.readFileSync(path.resolve(__dirname, '../../../../../server/auth/schema.sql'), 'utf8');
  memDb.pragma('foreign_keys = ON');
  memDb.exec(schemaSql);
  memDb.pragma('user_version = 1');
  return { getDatabase: () => memDb, resetSingletonForTests: () => {} };
});

import { POST } from './+server';
import { getDatabase } from '../../../../../server/auth/db';
import { createUser } from '../../../../../server/auth/users';
import { createSession } from '../../../../../server/auth/sessions';

describe('POST /api/auth/logout', () => {
  beforeEach(() => {
    getDatabase().exec(`DELETE FROM users; DELETE FROM sessions;`);
  });

  it('löscht Session und Cookie', async () => {
    const u = await createUser(getDatabase(), 'l@x.de', 'h');
    const { token } = createSession(getDatabase(), u.id);

    const cookies = {
      get: (name: string) => (name === 'ttp_session' ? token : undefined),
      set: vi.fn(),
      delete: vi.fn(),
    };
    const event: any = { cookies };
    const res = await POST(event);
    expect(res.status).toBe(200);
    expect(cookies.delete).toHaveBeenCalledWith('ttp_session', { path: '/' });
    const rows = getDatabase().prepare(`SELECT * FROM sessions`).all();
    expect(rows).toHaveLength(0);
  });

  it('200 auch ohne bestehende Session', async () => {
    const cookies = { get: () => undefined, set: vi.fn(), delete: vi.fn() };
    const event: any = { cookies };
    const res = await POST(event);
    expect(res.status).toBe(200);
  });
});
```

- [ ] **Step 2: logout-Impl**

Create `src/routes/api/auth/logout/+server.ts`:

```ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDatabase } from '../../../../../server/auth/db';
import { deleteSession } from '../../../../../server/auth/sessions';
import { SESSION_COOKIE_NAME, clearSessionCookie } from '../../../../../server/auth/cookies';

export const POST: RequestHandler = async ({ cookies }) => {
  const token = cookies.get(SESSION_COOKIE_NAME);
  if (token) {
    deleteSession(getDatabase(), token);
  }
  clearSessionCookie(cookies);
  return json({ ok: true });
};
```

- [ ] **Step 3: me-Test**

Create `src/routes/api/auth/me/me.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { GET } from './+server';

function mkEvent(user: any): any {
  return { locals: { user } };
}

describe('GET /api/auth/me', () => {
  it('200 mit User, wenn locals.user gesetzt', async () => {
    const res = await GET(mkEvent({ id: 'u1', email: 'a@b.de', emailVerified: true, proUntil: null }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.email).toBe('a@b.de');
  });

  it('401 ohne User', async () => {
    const res = await GET(mkEvent(null));
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 4: me-Impl**

Create `src/routes/api/auth/me/+server.ts`:

```ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.user) return json({ error: 'not authenticated' }, { status: 401 });
  return json({ user: locals.user });
};
```

- [ ] **Step 5: Tests grün**

Run: `npx vitest run src/routes/api/auth/logout/ src/routes/api/auth/me/`
Expected: 4 passing.

- [ ] **Step 6: Commit**

```bash
git add src/routes/api/auth/logout/ src/routes/api/auth/me/
git commit -m "feat(auth): logout + me endpoints"
```

---

## Task 14: `/api/auth/request-reset` + `/api/auth/reset-password`

**Files:**
- Create: `server/auth/reset.ts` (Reset-Token-Helper)
- Create: `src/routes/api/auth/request-reset/+server.ts`
- Create: `src/routes/api/auth/request-reset/request-reset.test.ts`
- Create: `src/routes/api/auth/reset-password/+server.ts`
- Create: `src/routes/api/auth/reset-password/reset-password.test.ts`

- [ ] **Step 1: reset.ts (Helper)**

Create `server/auth/reset.ts`:

```ts
import type { AuthDatabase } from './db';
import { generateToken, hashToken } from './tokens';

export const RESET_TTL_MS = 60 * 60 * 1000;

export function createResetToken(db: AuthDatabase, userId: string): string {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = Date.now() + RESET_TTL_MS;
  db.prepare(
    `INSERT INTO reset_tokens (token_hash, user_id, expires_at, used_at) VALUES (?, ?, ?, NULL)`,
  ).run(tokenHash, userId, expiresAt);
  return token;
}

export function consumeResetToken(db: AuthDatabase, token: string): string | null {
  const tokenHash = hashToken(token);
  const row = db
    .prepare(`SELECT user_id, expires_at, used_at FROM reset_tokens WHERE token_hash = ?`)
    .get(tokenHash) as { user_id: string; expires_at: number; used_at: number | null } | undefined;
  if (!row) return null;
  if (row.used_at !== null) return null;
  if (row.expires_at <= Date.now()) return null;
  db.prepare(`UPDATE reset_tokens SET used_at = ? WHERE token_hash = ?`).run(Date.now(), tokenHash);
  return row.user_id;
}
```

- [ ] **Step 2: request-reset Test**

Create `src/routes/api/auth/request-reset/request-reset.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../../../../server/auth/db', async () => {
  const BetterSqlite3 = (await import('better-sqlite3')).default;
  const fs = await import('node:fs');
  const path = await import('node:path');
  const memDb = new BetterSqlite3(':memory:');
  const schemaSql = fs.readFileSync(path.resolve(__dirname, '../../../../../server/auth/schema.sql'), 'utf8');
  memDb.pragma('foreign_keys = ON');
  memDb.exec(schemaSql);
  memDb.pragma('user_version = 1');
  return { getDatabase: () => memDb, resetSingletonForTests: () => {} };
});
vi.mock('../../../../../server/auth/mailer', () => ({
  sendVerificationMail: vi.fn(async () => {}),
  sendResetMail: vi.fn(async () => {}),
}));

import { POST } from './+server';
import { getDatabase } from '../../../../../server/auth/db';
import { createUser } from '../../../../../server/auth/users';
import { sendResetMail } from '../../../../../server/auth/mailer';

function mkRequest(body: Record<string, unknown>): any {
  return {
    request: new Request('http://localhost/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    getClientAddress: () => '1.2.3.4',
  };
}

describe('POST /api/auth/request-reset', () => {
  beforeEach(() => {
    getDatabase().exec(`DELETE FROM users; DELETE FROM reset_tokens; DELETE FROM rate_limits;`);
    (sendResetMail as any).mockClear();
  });

  it('sendet Reset-Mail bei bekannter Mail', async () => {
    await createUser(getDatabase(), 'r@x.de', 'h');
    const res = await POST(mkRequest({ email: 'r@x.de' }));
    expect(res.status).toBe(200);
    expect(sendResetMail).toHaveBeenCalled();
  });

  it('generic 200 bei unbekannter Mail ohne Mail-Send', async () => {
    const res = await POST(mkRequest({ email: 'nope@x.de' }));
    expect(res.status).toBe(200);
    expect(sendResetMail).not.toHaveBeenCalled();
  });

  it('429 nach 3 Versuchen pro Email', async () => {
    for (let i = 0; i < 3; i++) await POST(mkRequest({ email: 'rl@x.de' }));
    const res = await POST(mkRequest({ email: 'rl@x.de' }));
    expect(res.status).toBe(429);
  });
});
```

- [ ] **Step 3: request-reset Impl**

Create `src/routes/api/auth/request-reset/+server.ts`:

```ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDatabase } from '../../../../../server/auth/db';
import { findUserByEmail, EMAIL_REGEX } from '../../../../../server/auth/users';
import { createResetToken } from '../../../../../server/auth/reset';
import { sendResetMail } from '../../../../../server/auth/mailer';
import { checkAndConsume } from '../../../../../server/auth/ratelimit';

const GENERIC_OK = { message: 'Falls registriert, wurde ein Reset-Link verschickt.' };

export const POST: RequestHandler = async ({ request }) => {
  let body: { email?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Ungültiger Request-Body.' }, { status: 400 });
  }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!EMAIL_REGEX.test(email)) return json(GENERIC_OK);

  const db = getDatabase();
  if (!checkAndConsume(db, 'reset', `email:${email}`)) {
    return json({ error: 'Zu viele Versuche, bitte später erneut.' }, { status: 429 });
  }

  const user = findUserByEmail(db, email);
  if (user) {
    const token = createResetToken(db, user.id);
    sendResetMail(email, token).catch((err) => console.error('sendResetMail failed:', err));
  }
  return json(GENERIC_OK);
};
```

- [ ] **Step 4: reset-password Test**

Create `src/routes/api/auth/reset-password/reset-password.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../../../../server/auth/db', async () => {
  const BetterSqlite3 = (await import('better-sqlite3')).default;
  const fs = await import('node:fs');
  const path = await import('node:path');
  const memDb = new BetterSqlite3(':memory:');
  const schemaSql = fs.readFileSync(path.resolve(__dirname, '../../../../../server/auth/schema.sql'), 'utf8');
  memDb.pragma('foreign_keys = ON');
  memDb.exec(schemaSql);
  memDb.pragma('user_version = 1');
  return { getDatabase: () => memDb, resetSingletonForTests: () => {} };
});

import { POST } from './+server';
import { getDatabase } from '../../../../../server/auth/db';
import { createUser, markEmailVerified } from '../../../../../server/auth/users';
import { createResetToken } from '../../../../../server/auth/reset';
import { createSession } from '../../../../../server/auth/sessions';
import { hashPassword, verifyPassword } from '../../../../../server/auth/password';

function mkRequest(body: Record<string, unknown>): any {
  return {
    request: new Request('http://localhost/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    getClientAddress: () => '1.2.3.4',
    cookies: { set: vi.fn(), delete: vi.fn(), get: () => undefined },
  };
}

describe('POST /api/auth/reset-password', () => {
  beforeEach(() => {
    getDatabase().exec(`DELETE FROM users; DELETE FROM sessions; DELETE FROM reset_tokens;`);
  });

  it('setzt neues Passwort, löscht ALLE alten Sessions, auto-login', async () => {
    const hash = await hashPassword('oldpasspass');
    const u = await createUser(getDatabase(), 'r@x.de', hash);
    markEmailVerified(getDatabase(), u.id);
    createSession(getDatabase(), u.id);
    createSession(getDatabase(), u.id);
    const token = createResetToken(getDatabase(), u.id);

    const event = mkRequest({ token, newPassword: 'newpasspass' });
    const res = await POST(event);
    expect(res.status).toBe(200);

    // altes Passwort invalide
    const row = getDatabase().prepare(`SELECT password_hash FROM users WHERE id = ?`).get(u.id) as any;
    expect(await verifyPassword(row.password_hash, 'newpasspass')).toBe(true);
    expect(await verifyPassword(row.password_hash, 'oldpasspass')).toBe(false);

    // Nur noch die neue Session (andere wurden gelöscht)
    const sessions = getDatabase().prepare(`SELECT * FROM sessions WHERE user_id = ?`).all(u.id);
    expect(sessions).toHaveLength(1);

    expect(event.cookies.set).toHaveBeenCalledWith('ttp_session', expect.any(String), expect.any(Object));
  });

  it('400 bei ungültigem Token', async () => {
    const res = await POST(mkRequest({ token: 'invalid', newPassword: 'newpasspass' }));
    expect(res.status).toBe(400);
  });

  it('400 bei zu kurzem Passwort', async () => {
    const u = await createUser(getDatabase(), 's@x.de', 'h');
    const token = createResetToken(getDatabase(), u.id);
    const res = await POST(mkRequest({ token, newPassword: 'short' }));
    expect(res.status).toBe(400);
  });

  it('400 bei bereits-verwendetem Token (one-shot)', async () => {
    const u = await createUser(getDatabase(), 'o@x.de', 'h');
    const token = createResetToken(getDatabase(), u.id);
    await POST(mkRequest({ token, newPassword: 'firstfirst' }));
    const res = await POST(mkRequest({ token, newPassword: 'secondsecond' }));
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 5: reset-password Impl**

Create `src/routes/api/auth/reset-password/+server.ts`:

```ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDatabase } from '../../../../../server/auth/db';
import { consumeResetToken } from '../../../../../server/auth/reset';
import { findUserById, updatePasswordHash } from '../../../../../server/auth/users';
import { hashPassword } from '../../../../../server/auth/password';
import { createSession, deleteAllUserSessions } from '../../../../../server/auth/sessions';
import { setSessionCookie } from '../../../../../server/auth/cookies';

export const POST: RequestHandler = async ({ request, cookies, getClientAddress }) => {
  let body: { token?: unknown; newPassword?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Ungültiger Request-Body.' }, { status: 400 });
  }
  const token = typeof body.token === 'string' ? body.token : '';
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

  if (newPassword.length < 10) {
    return json({ error: 'Passwort muss mindestens 10 Zeichen lang sein.' }, { status: 400 });
  }

  const db = getDatabase();
  const userId = consumeResetToken(db, token);
  if (!userId) return json({ error: 'Link ungültig oder abgelaufen.' }, { status: 400 });

  const newHash = await hashPassword(newPassword);
  updatePasswordHash(db, userId, newHash);
  deleteAllUserSessions(db, userId);

  const user = findUserById(db, userId);
  if (!user) return json({ error: 'User nicht gefunden.' }, { status: 400 });

  const { token: sessionToken } = createSession(db, userId, {
    userAgent: request.headers.get('user-agent') ?? undefined,
    ip: getClientAddress(),
  });
  setSessionCookie(cookies, sessionToken);

  return json({
    user: { id: user.id, email: user.email, emailVerified: user.emailVerified, proUntil: user.proUntil },
  });
};
```

- [ ] **Step 6: Tests grün**

Run: `npx vitest run src/routes/api/auth/request-reset/ src/routes/api/auth/reset-password/ server/auth/reset`
Expected: 7 passing (3+4, reset-helper implicit durch Endpoint-Tests abgedeckt).

- [ ] **Step 7: Commit**

```bash
git add server/auth/reset.ts src/routes/api/auth/request-reset/ src/routes/api/auth/reset-password/
git commit -m "feat(auth): request-reset + reset-password endpoints, invalidate all sessions"
```

---

## Task 15: Frontend Auth-Client (`src/lib/auth/client.svelte.ts`)

**Files:**
- Create: `src/lib/auth/client.svelte.ts`

**Hinweis:** Keine Unit-Tests für diese Datei. Die Klasse verwendet Svelte-5-Runes (`$state`), die außerhalb der Svelte-Compile-Pipeline nicht funktionieren. Die Logik wird im Rahmen des E2E-Smokes (Task 23/24) mit abgedeckt. Falls später doch Unit-Tests gewünscht: Business-Logik (isPro-Getter) in eine Rune-freie Pure-Funktion extrahieren und die isoliert testen.

- [ ] **Step 1: Implementierung**

Create `src/lib/auth/client.svelte.ts`:

```ts
export interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  proUntil: number | null;
}

class AuthState {
  user = $state<AuthUser | null>(null);
  loading = $state(true);

  get isPro(): boolean {
    return !!this.user?.proUntil && this.user.proUntil > Date.now();
  }

  async init(): Promise<void> {
    this.loading = true;
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const body = await res.json();
        this.user = body.user as AuthUser;
      } else {
        this.user = null;
      }
    } catch {
      this.user = null;
    } finally {
      this.loading = false;
    }
  }

  async signup(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: body.error ?? 'Unbekannter Fehler' };
    }
    return { ok: true };
  }

  async login(email: string, password: string): Promise<{ ok: boolean; error?: string; canResend?: boolean }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      const body = await res.json();
      this.user = body.user;
      return { ok: true };
    }
    const body = await res.json().catch(() => ({}));
    return { ok: false, error: body.error ?? 'Login fehlgeschlagen', canResend: body.canResend };
  }

  async logout(): Promise<void> {
    await fetch('/api/auth/logout', { method: 'POST' });
    this.user = null;
  }

  async requestReset(email: string): Promise<void> {
    await fetch('/api/auth/request-reset', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email }),
    });
  }

  async resendVerification(email: string): Promise<void> {
    await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email }),
    });
  }

  // for tests only
  _reset(): void {
    this.user = null;
    this.loading = true;
  }
}

export const auth = new AuthState();
```

- [ ] **Step 2: svelte-check**

Run: `npm run check`
Expected: 0 errors, 0 warnings.

- [ ] **Step 3: Commit**

```bash
git add src/lib/auth/client.svelte.ts
git commit -m "feat(auth): reactive auth client (init/signup/login/logout/reset/resend)"
```

---

## Task 16: `/verify-email` Landing-Pages

**Files:**
- Create: `src/routes/verify-email/+page.svelte`
- Create: `src/routes/verify-email/[token]/+page.svelte`

- [ ] **Step 1: Landing ohne Token**

Create `src/routes/verify-email/+page.svelte`:

```svelte
<script lang="ts">
  import { auth } from '$lib/auth/client.svelte';
  import { page } from '$app/stores';

  const email = $derived($page.url.searchParams.get('email') ?? '');
  let sending = $state(false);
  let sent = $state(false);

  async function resend() {
    if (!email) return;
    sending = true;
    await auth.resendVerification(email);
    sending = false;
    sent = true;
  }
</script>

<section class="page">
  <h1>Check deine Mails</h1>
  <p>Wir haben einen Bestätigungs-Link an <strong>{email || 'deine Adresse'}</strong> geschickt.</p>
  <p class="muted">Klicke auf den Link in der Mail, um dein Konto zu aktivieren. Der Link läuft in 24 Stunden ab.</p>

  {#if email}
    <button type="button" onclick={resend} disabled={sending || sent}>
      {#if sent}Erneut gesendet{:else if sending}Wird gesendet…{:else}Mail erneut senden{/if}
    </button>
  {/if}
</section>

<style>
  .page {
    padding: 32px;
    max-width: 520px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  h1 {
    font-size: 24px;
    font-weight: 600;
    margin: 0;
    color: var(--color-text-primary);
  }
  .muted {
    color: var(--color-text-secondary);
    font-size: 14px;
    margin: 0;
  }
  button {
    padding: 10px 14px;
    background: var(--color-accent);
    color: #fff;
    border-radius: var(--radius-button);
    font-weight: 500;
    align-self: flex-start;
  }
  button[disabled] {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
```

- [ ] **Step 2: Token-Seite**

Create `src/routes/verify-email/[token]/+page.svelte`:

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { auth } from '$lib/auth/client.svelte';

  let state = $state<'loading' | 'error'>('loading');
  let errorMessage = $state('');

  onMount(async () => {
    const token = $page.params.token;
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (res.ok) {
        const body = await res.json();
        auth.user = body.user;
        await goto('/draw');
        return;
      }
      const body = await res.json().catch(() => ({}));
      errorMessage = body.error ?? 'Link ungültig oder abgelaufen.';
      state = 'error';
    } catch {
      errorMessage = 'Verbindung fehlgeschlagen.';
      state = 'error';
    }
  });
</script>

<section class="page">
  {#if state === 'loading'}
    <p>E-Mail wird bestätigt…</p>
  {:else}
    <h1>Bestätigung fehlgeschlagen</h1>
    <p>{errorMessage}</p>
    <a href="/verify-email">Neue Bestätigungs-Mail anfordern</a>
  {/if}
</section>

<style>
  .page {
    padding: 32px;
    max-width: 520px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  h1 {
    font-size: 22px;
    font-weight: 600;
    color: var(--color-text-primary);
  }
  a {
    color: var(--color-accent);
  }
</style>
```

- [ ] **Step 3: svelte-check sauber**

Run: `npm run check`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/routes/verify-email/
git commit -m "feat(auth): verify-email landing + token page with auto-login"
```

---

## Task 17: `/reset-password/[token]` Seite

**Files:**
- Create: `src/routes/reset-password/[token]/+page.svelte`

- [ ] **Step 1: Seite schreiben**

Create `src/routes/reset-password/[token]/+page.svelte`:

```svelte
<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { auth } from '$lib/auth/client.svelte';

  let password = $state('');
  let confirm = $state('');
  let busy = $state(false);
  let error = $state<string | null>(null);

  const canSubmit = $derived(password.length >= 10 && password === confirm && !busy);

  async function submit(e: Event) {
    e.preventDefault();
    if (!canSubmit) return;
    busy = true;
    error = null;
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token: $page.params.token, newPassword: password }),
      });
      if (res.ok) {
        const body = await res.json();
        auth.user = body.user;
        await goto('/draw');
        return;
      }
      const body = await res.json().catch(() => ({}));
      error = body.error ?? 'Zurücksetzen fehlgeschlagen.';
    } catch {
      error = 'Verbindung fehlgeschlagen.';
    } finally {
      busy = false;
    }
  }
</script>

<section class="page">
  <h1>Neues Passwort setzen</h1>
  <form onsubmit={submit}>
    <label>
      <span>Neues Passwort (min. 10 Zeichen)</span>
      <input type="password" bind:value={password} autocomplete="new-password" minlength="10" required />
    </label>
    <label>
      <span>Passwort wiederholen</span>
      <input type="password" bind:value={confirm} autocomplete="new-password" minlength="10" required />
    </label>
    {#if password && confirm && password !== confirm}
      <p class="error">Passwörter stimmen nicht überein.</p>
    {/if}
    {#if error}<p class="error">{error}</p>{/if}
    <button type="submit" disabled={!canSubmit}>
      {busy ? 'Wird gespeichert…' : 'Passwort setzen'}
    </button>
  </form>
</section>

<style>
  .page {
    padding: 32px;
    max-width: 520px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  h1 {
    font-size: 22px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;
  }
  form {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  span {
    font-size: 13px;
    color: var(--color-text-secondary);
  }
  input {
    padding: 10px 12px;
    background: var(--bg-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-button);
    color: var(--color-text-primary);
    font-size: 15px;
  }
  button {
    padding: 12px 16px;
    background: var(--color-accent);
    color: #fff;
    border-radius: var(--radius-button);
    font-weight: 600;
  }
  button[disabled] {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .error {
    color: var(--color-danger);
    font-size: 13px;
    margin: 0;
  }
</style>
```

- [ ] **Step 2: svelte-check**

Run: `npm run check`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/routes/reset-password/
git commit -m "feat(auth): reset-password page with auto-login after success"
```

---

## Task 18: `/settings/account` Umbau (Mock raus, echter Flow rein)

**Files:**
- Modify: `src/routes/settings/account/+page.svelte`
- Delete: `src/lib/auth/mock-user.svelte.ts`
- Delete: `src/lib/auth/mock-user-api.ts`
- Delete: `src/lib/auth/mock-user.test.ts`

- [ ] **Step 1: `/settings/account/+page.svelte` komplett neu**

Replace entire content of `src/routes/settings/account/+page.svelte` with:

```svelte
<script lang="ts">
  import { goto } from '$app/navigation';
  import { auth } from '$lib/auth/client.svelte';

  type Mode = 'login' | 'signup' | 'forgot';
  let mode = $state<Mode>('login');
  let email = $state('');
  let password = $state('');
  let busy = $state(false);
  let error = $state<string | null>(null);
  let info = $state<string | null>(null);

  const emailValid = $derived(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  const canSubmit = $derived(
    mode === 'forgot'
      ? emailValid && !busy
      : emailValid && password.length >= 10 && !busy,
  );

  function initial(e: string): string {
    return (e[0] ?? '?').toUpperCase();
  }

  function formatPro(proUntil: number | null): string {
    if (!proUntil || proUntil <= Date.now()) return 'Free';
    const d = new Date(proUntil);
    return `Pro bis ${d.toLocaleDateString('de-DE')}`;
  }

  async function submit(e: Event) {
    e.preventDefault();
    if (!canSubmit) return;
    error = null;
    info = null;
    busy = true;
    try {
      if (mode === 'login') {
        const res = await auth.login(email, password);
        if (!res.ok) {
          error = res.error ?? 'Login fehlgeschlagen';
          if (res.canResend) error += ' (Mail erneut senden?)';
        } else {
          email = '';
          password = '';
        }
      } else if (mode === 'signup') {
        const res = await auth.signup(email, password);
        if (!res.ok) {
          error = res.error ?? 'Registrierung fehlgeschlagen';
        } else {
          goto(`/verify-email?email=${encodeURIComponent(email)}`);
        }
      } else if (mode === 'forgot') {
        await auth.requestReset(email);
        info = 'Falls registriert, haben wir einen Reset-Link geschickt.';
      }
    } finally {
      busy = false;
    }
  }

  async function logout() {
    await auth.logout();
  }
</script>

<section class="account">
  <header class="head">
    <h2>Account</h2>
  </header>

  {#if auth.user}
    <div class="profile">
      <div class="avatar">{initial(auth.user.email)}</div>
      <div class="email">{auth.user.email}</div>
      {#if !auth.user.emailVerified}
        <span class="badge warning">E-Mail unbestätigt</span>
      {/if}
      <span class="badge" class:pro={auth.isPro}>{formatPro(auth.user.proUntil)}</span>
    </div>

    <div class="actions">
      <button type="button" class="btn danger" onclick={logout}>Ausloggen</button>
    </div>
  {:else}
    <div class="tabs" role="tablist">
      <button class:active={mode === 'login'} onclick={() => (mode = 'login')}>Anmelden</button>
      <button class:active={mode === 'signup'} onclick={() => (mode = 'signup')}>Registrieren</button>
    </div>

    <form onsubmit={submit}>
      <label>
        <span>E-Mail</span>
        <input type="email" bind:value={email} autocomplete="email" required />
      </label>
      {#if mode !== 'forgot'}
        <label>
          <span>Passwort (min. 10 Zeichen)</span>
          <input
            type="password"
            bind:value={password}
            autocomplete={mode === 'login' ? 'current-password' : 'new-password'}
            minlength="10"
            required
          />
        </label>
      {/if}
      {#if error}<p class="error">{error}</p>{/if}
      {#if info}<p class="info">{info}</p>{/if}
      <button type="submit" class="btn primary" disabled={!canSubmit}>
        {#if busy}Wird verarbeitet…{:else if mode === 'login'}Anmelden{:else if mode === 'signup'}Registrieren{:else}Reset-Link senden{/if}
      </button>
      {#if mode === 'login'}
        <p class="link">
          <button type="button" class="linkbtn" onclick={() => (mode = 'forgot')}>Passwort vergessen?</button>
        </p>
      {/if}
      {#if mode === 'forgot'}
        <p class="link">
          <button type="button" class="linkbtn" onclick={() => (mode = 'login')}>Zurück zum Login</button>
        </p>
      {/if}
    </form>
  {/if}
</section>

<style>
  .account { padding: 32px; max-width: 520px; display: flex; flex-direction: column; gap: 20px; }
  .head h2 { font-size: 22px; font-weight: 600; color: var(--color-text-primary); margin: 0; }
  .profile {
    display: flex; flex-direction: column; align-items: flex-start; gap: 8px;
    padding: 20px; background: var(--bg-surface);
    border: 1px solid var(--color-border); border-radius: var(--radius-panel);
  }
  .avatar {
    width: 56px; height: 56px; border-radius: 50%;
    background: var(--color-accent); color: #fff;
    font-size: 22px; font-weight: 600; display: grid; place-items: center;
  }
  .email { font-size: 18px; font-weight: 500; color: var(--color-text-primary); }
  .badge {
    font-size: 12px; padding: 4px 10px; border-radius: 999px;
    background: var(--bg-elevated); color: var(--color-text-secondary);
    letter-spacing: 1px; text-transform: uppercase;
  }
  .badge.pro { background: var(--color-success); color: #fff; }
  .badge.warning { background: var(--color-danger); color: #fff; }
  .tabs {
    display: flex; gap: 4px; padding: 4px;
    background: var(--bg-surface); border-radius: var(--radius-button);
    border: 1px solid var(--color-border); align-self: flex-start;
  }
  .tabs button {
    padding: 8px 16px; border-radius: 6px; background: transparent;
    color: var(--color-text-secondary); font-size: 14px; font-weight: 500;
  }
  .tabs button.active { background: var(--bg-elevated); color: var(--color-text-primary); }
  form { display: flex; flex-direction: column; gap: 14px; }
  label { display: flex; flex-direction: column; gap: 6px; }
  label span { font-size: 13px; color: var(--color-text-secondary); }
  input {
    padding: 10px 12px; background: var(--bg-surface);
    border: 1px solid var(--color-border); border-radius: var(--radius-button);
    color: var(--color-text-primary); font-size: 15px;
  }
  .btn {
    padding: 12px 16px; border-radius: var(--radius-button);
    font-weight: 600; font-size: 15px;
  }
  .btn.primary { background: var(--color-accent); color: #fff; }
  .btn.danger { background: var(--color-danger); color: #fff; }
  .btn[disabled] { opacity: 0.5; cursor: not-allowed; }
  .error { color: var(--color-danger); font-size: 13px; margin: 0; }
  .info { color: var(--color-text-secondary); font-size: 13px; margin: 0; }
  .link { margin: 0; font-size: 13px; }
  .linkbtn {
    background: none; color: var(--color-accent); padding: 0;
    text-decoration: underline; cursor: pointer;
  }
</style>
```

- [ ] **Step 2: Root-Layout initialisiert auth**

Read `src/routes/+layout.svelte`. Add to the imports:

```svelte
import { auth } from '$lib/auth/client.svelte';
```

And inside `onMount(async () => { ... })`, after `theme.init()` add:

```svelte
await auth.init();
```

- [ ] **Step 3: Alte Mock-Dateien löschen**

Run:
```bash
rm src/lib/auth/mock-user.svelte.ts
rm src/lib/auth/mock-user-api.ts
rm src/lib/auth/mock-user.test.ts
```

- [ ] **Step 4: svelte-check**

Run: `npm run check`
Expected: 0 errors. Falls Fehler durch Imports: alle Stellen finden und durch `auth`-Client ersetzen. Grep:

```bash
grep -r "mock-user" src/
grep -r "mockUser" src/
```

Expected: No results.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(auth): settings/account uses real auth client, delete mock-user"
```

---

## Task 19: ProStatus auf auth-Client umstellen, Dev-Toggle entfernen

**Files:**
- Modify: `src/lib/pro/status.svelte.ts`
- Modify: `src/routes/settings/pro/+page.svelte`
- Grep + Modify: alle Verwendungen von `proStatus.isPro`

- [ ] **Step 1: Verwendungen finden**

Run:
```bash
grep -rn "proStatus" src/ | grep -v ".test.ts"
```

Note: FREE_EXERCISE_LIMIT bleibt erhalten. `proStatus.isPro` wird durch `auth.isPro` ersetzt. `proStatus.set` / `proStatus.toggle` entfallen.

- [ ] **Step 2: Ersetzung**

In jeder gefundenen Datei (außer `src/lib/pro/status.svelte.ts` selbst):
- Import `import { proStatus } from '$lib/pro/status.svelte';` ersetzen durch `import { auth } from '$lib/auth/client.svelte';` (oder beide, falls `FREE_EXERCISE_LIMIT` auch gebraucht wird → `import { FREE_EXERCISE_LIMIT } from '$lib/pro/status.svelte';`)
- `proStatus.isPro` → `auth.isPro`

- [ ] **Step 3: status.svelte.ts auf nur-noch-Konstante reduzieren**

Replace content of `src/lib/pro/status.svelte.ts` with:

```ts
export const FREE_EXERCISE_LIMIT = 5;
```

- [ ] **Step 4: `/settings/pro` Dev-Toggle entfernen**

Read `src/routes/settings/pro/+page.svelte` first. Dann den Dev-Toggle-Button (der `proStatus.toggle()` aufruft) entfernen. Den Rest der Seite (Plan-Anzeige, Features-Liste) beibehalten, aber jetzt liest sie `auth.isPro`. Bei Free-User Hinweis: "Upgrade folgt in Kürze" (Stripe-Integration kommt separat).

Konkreter Diff-Hinweis: Entferne den gesamten `<button onclick={proStatus.toggle}>…</button>` Block; ersetze die Status-Anzeige durch `{#if auth.isPro} Pro aktiv {:else} Free {/if}`.

- [ ] **Step 5: svelte-check**

Run: `npm run check`
Expected: 0 errors.

- [ ] **Step 6: Test-Suite**

Run: `npm run test`
Expected: Alle Tests grün. Falls `mock-user.test.ts` noch referenziert wird: bereits gelöscht in Task 18.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor(pro): replace proStatus.isPro with auth.isPro, remove dev toggle"
```

---

## Task 20: PaywallDialog Anmelden-Link

**Files:**
- Modify: `src/lib/components/PaywallDialog.svelte` (oder wo der Dialog liegt)

- [ ] **Step 1: Stelle finden**

Run:
```bash
grep -rn "Anmelden" src/lib/components/ | grep -i paywall
grep -rn "PaywallDialog" src/
```

- [ ] **Step 2: Link-Ziel anpassen**

Der bestehende "Bereits ein Konto? Anmelden"-Link (laut project-state seit `2026-04-15` vorhanden) zeigt wahrscheinlich auf `/settings/account`. Falls ja: Nichts zu tun außer verifizieren. Falls anders: Link-href korrigieren.

Falls ein Click-Handler zum Dialog-Close fehlt, ergänzen:

```svelte
<a href="/settings/account" onclick={() => (open = false)}>Bereits ein Konto? Anmelden</a>
```

- [ ] **Step 3: Upgrade-Button-Hinweis**

Der Upgrade-Button im Dialog soll (bis Stripe integriert ist) zeigen: "Bald verfügbar" oder einen Hinweis-Text. Konkreter Stellenhinweis nach `grep`.

- [ ] **Step 4: svelte-check + Commit**

```bash
npm run check
git add -A
git commit -m "feat(paywall): login link points to /settings/account, upgrade disabled pending stripe"
```

---

## Task 21: Production-Server initialisiert DB-Datei beim Start

**Files:**
- Modify: `server/production.ts`

- [ ] **Step 1: DB-Init in production.ts**

Read `server/production.ts`. Ergänze oben (nach imports, vor `const PORT = ...`):

```ts
import { getDatabase } from './auth/db';

// Trigger DB open + migrations at boot
try {
  getDatabase();
  console.log('[auth] database initialized');
} catch (err) {
  console.error('[auth] database init failed:', err);
  process.exit(1);
}
```

Das stellt sicher dass das Schema migriert ist, bevor Requests reinkommen.

- [ ] **Step 2: Lokaler Smoke**

Run:
```bash
rm -f data/auth.db
npm run dev
```

Dann im Browser `http://localhost:5173/settings/account` öffnen. Erwartung: Seite lädt, Login/Signup-Form da. Nach Signup mit `a@b.de` / `passpasspass` wird in der Terminal-Console der Verify-Link geloggt (Dev-Mode, `MAIL_MODE=console` default-ish, siehe Step 3).

- [ ] **Step 3: Dev Env-Setup dokumentieren**

Create `.env.example`:

```
# Auth backend
RESEND_API_KEY=
MAIL_FROM="TT Playbook <noreply@tt-playbook.de>"
APP_URL=http://localhost:5173
MAIL_MODE=console
AUTH_DB_PATH=./data/auth.db
```

Run:
```bash
cp .env.example .env
```

Vite lädt `.env`-Variablen automatisch für server-side Code (in Hooks + +server.ts). Bei Production auf Mittwald werden sie über `mw` gesetzt (siehe Task 23).

- [ ] **Step 4: Commit**

```bash
git add server/production.ts .env.example
git commit -m "chore(auth): init db on boot, add .env.example"
```

---

## Task 22: Deploy-Prep: Resend-Domain, Mittwald-Env-Vars, DNS

**Files:**
- Create: `docs/superpowers/deploy-auth-setup.md` (Deploy-Runbook, kein Code)

- [ ] **Step 1: Runbook schreiben**

Create `docs/superpowers/deploy-auth-setup.md`:

```markdown
# Auth-Deploy Setup (Mittwald)

Ausführen BEVOR der erste Auth-Endpoint live geht.

## 1. Resend-Domain verifizieren

1. https://resend.com/domains → "Add Domain" → `tt-playbook.de`
2. Resend zeigt 3 DNS-Records (SPF/TXT, DKIM/TXT, Return-Path/CNAME). Notieren.
3. Records in Mittwald-DNS anlegen (mStudio → Domain → DNS-Einstellungen ODER via `mw` CLI).
4. In Resend "Verify" klicken. Dauert manchmal 10-60 Min bis DNS propagiert.
5. Verifizieren via `dig TXT tt-playbook.de` und `dig TXT resend._domainkey.tt-playbook.de`.

## 2. API-Key erzeugen

1. Resend-Dashboard → "API Keys" → "Create". Domain: `tt-playbook.de`.
2. Scope: Only "Sending access" (keine Full-Access).
3. Kopieren — wird nur einmal angezeigt.

## 3. Env-Vars auf Mittwald setzen

```bash
mw app environment update <app-id> RESEND_API_KEY "re_xxx..."
mw app environment update <app-id> MAIL_FROM "TT Playbook <noreply@tt-playbook.de>"
mw app environment update <app-id> APP_URL "https://coach.tt-playbook.de"
mw app environment update <app-id> AUTH_DB_PATH "/home/p-np5mfc/nj-playbook-trainer/data/auth.db"
```

App-ID siehe `project-state.md`.

## 4. SQLite-Datei-Pfad verifizieren

SSH auf Mittwald:
```bash
ssh mittwald-tt
cd /home/p-np5mfc/nj-playbook-trainer
mkdir -p data
ls -la data/
```

## 5. App neu starten

```bash
mw app update <app-id> --entrypoint "sh -c 'npm start >/tmp/app.log 2>&1'"
```

## 6. Test-Mail

Auf https://coach.tt-playbook.de/settings/account registrieren mit echter Adresse. Mail sollte binnen 10 s ankommen. Falls nicht: `ssh mittwald-tt` und `tail /tmp/app.log` prüfen.

## 7. Spam-Check

MXToolbox.com/deliverability → Mail an eigene Adresse schicken, Test-Link öffnen → verifizieren dass SPF/DKIM/DMARC PASS.
```

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/deploy-auth-setup.md
git commit -m "docs: auth deploy runbook (resend domain, env vars, dns)"
```

---

## Task 23: Gesamttest-Run + Lokaler E2E-Smoke

- [ ] **Step 1: Alle Tests laufen**

Run: `npm run test`
Expected: Alle Tests grün (erwartete Größenordnung: ~110-120 Tests total, inkl. neue ~35 Auth-Tests).

- [ ] **Step 2: Type-Check**

Run: `npm run check`
Expected: 0 errors, 0 warnings.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: Build erfolgreich. Die `build/handler.js` enthält alle Auth-Endpoints.

- [ ] **Step 4: Lokaler Smoke mit browser-use**

Run: `npm run dev` (separates Terminal).

Using the browser-use skill:
1. Öffne `http://localhost:5173/settings/account`
2. Wechsle auf "Registrieren", gib `test1@example.de` + `testpasspass` ein, submit
3. Beobachte Terminal → Verify-Link wird ge`console.log`t
4. Öffne den Link manuell in Browser → Redirect auf `/draw`, eingeloggt
5. Logout → wieder auf `/settings/account` → Mode "Anmelden" → mit gleichen Credentials rein → eingeloggt
6. "Passwort vergessen" → Reset-Link im Terminal → klicken → neues Passwort setzen → auto-eingeloggt
7. Mit altem Passwort Login versuchen → 401 (weil Passwort gewechselt)
8. Mit neuem Passwort Login → OK

- [ ] **Step 5: Falls Fehler auftreten**

Dokumentieren + beheben. Re-run `npm run test`. Wenn alles passt: nächster Step.

- [ ] **Step 6: Commit**

Falls im Schritt 4 kleinere Fixes nötig waren:
```bash
git add -A
git commit -m "fix(auth): smoke-test findings from local e2e"
```

Sonst kein Extra-Commit.

---

## Task 24: Deploy + Production-E2E

- [ ] **Step 1: DNS + Env bereit**

Sicherstellen dass Task 22 komplett durchgelaufen ist (Resend verifiziert, Env-Vars auf Mittwald gesetzt).

- [ ] **Step 2: Deploy**

```bash
git push mittwald main
```

Mittwald post-receive-Hook baut automatisch, `NODE_OPTIONS=--max-old-space-size=1024 npx vite build` + restart.

- [ ] **Step 3: Log-Check**

```bash
ssh mittwald-tt 'tail -50 /tmp/app.log'
```

Expected: `[auth] database initialized` + `TT Playbook Trainer läuft auf Port …`.

- [ ] **Step 4: Native-Build-Verifikation**

Falls `better-sqlite3` oder `argon2` Build-Fehler werfen:
- `ssh mittwald-tt`
- `cd nj-playbook-trainer && node -e 'require("better-sqlite3")'` → should not throw
- Falls doch: `npm rebuild better-sqlite3 argon2 --build-from-source` auf dem Server

- [ ] **Step 5: E2E über Production via browser-use**

1. `https://coach.tt-playbook.de/settings/account` → Registrierung mit eigener Mail (`info@olaf-kranz.de`) + Passwort
2. Verify-Mail kommt real an (Resend) → Link klicken → eingeloggt
3. Paywall testen: 5 Übungen speichern → 6. Versuch zeigt PaywallDialog
4. Logout → erneut Login → Pro-Status korrekt (noch Free, weil kein Stripe)

- [ ] **Step 6: Cleanup + Project-State-Update**

Das Plan-Execution-Resultat wird im nächsten Update der `project-state.md` festgehalten (das macht die verification-before-completion-Skill oder ein manueller Edit).

- [ ] **Step 7: Final-Commit**

Falls im E2E letzte Tweaks nötig:
```bash
git add -A
git commit -m "fix(auth): production e2e findings"
git push mittwald main
```

---

## Abschluss

Nach Task 24 ist der Auth-Backend-MVP live:
- Signup mit Double Opt-In
- Login/Logout via Session-Cookie (30d sliding)
- Passwort-Reset via Mail-Link
- Pro-Status aus `users.pro_until` (noch manuell in DB setzbar; Stripe folgt separat)
- Mock-Login komplett entfernt

**Nächster Schritt (separate Session):** Stripe-Integration — Checkout + Webhook setzt `pro_until`.
