# Phase B — Archiv + Playlists Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gespeicherte Übungen in einer Archiv-Ansicht durchsuchen, filtern und verwalten; Übungen zu Playlists zusammenstellen und in Reihenfolge bringen.

**Architecture:** SvelteKit-Filesystem-Routing ersetzt die hardcodierte Tab-Variable (Sidebar-Links statt Buttons, `$page.url.pathname` bestimmt aktiven Tab). Zweite Dexie-Tabelle `playlists` via Schema-Upgrade auf Version 2 — Playlist hält geordnetes Array `exerciseIds: string[]`, Übungen bleiben unverändert. Thumbnails im Archiv werden zur Laufzeit aus dem bestehenden `StrokeRenderer`/`TableRenderer` in eine kleine readonly-Konva-Stage gerendert (kein persistierter PNG-Blob).

**Tech Stack:** SvelteKit, Svelte 5 Runes, TypeScript (strict), Dexie, Konva, Vitest (Node-Projekt für DB/Logik), Browser-use CLI für manuelle End-to-End-Smoketests.

---

## Design-Referenz (Stitch)

Die UI folgt den in Google Stitch erstellten Mockups (Projekt `249198729158242555` — "TT Playbook Trainer"). Die drei UI-Haupttasks (Archiv-Grid, Playlists-Route, Phase-B-Abschluss) enthalten einen **expliziten Visual-Check-Step** — Stitch-Screen daneben öffnen, Layout/Abstände/Farben gegen Mockup abgleichen. Bei allen übrigen UI-Tasks ebenfalls kurz prüfen, bevor committed wird. Der Code bleibt handgeschrieben in Svelte mit den CSS-Variablen aus Phase A (kein HTML/CSS-Import aus Stitch — Stitch nutzt Utility-CSS, wir nutzen klassische Tokens).

| Screen in Stitch           | Relevant für Tasks        |
| -------------------------- | ------------------------- |
| Zeichnen                   | 1 (Sidebar)               |
| Archiv                     | 7, 8, 9, 10, 11, 12       |
| Playlists                  | 13, 14, 15, 16            |
| Einstellungen / TV / Pro   | Phase D/E (nicht Phase B) |

URL: `https://stitch.withgoogle.com/projects/249198729158242555`

---

## File Structure

**Neu:**
- `src/routes/+page.svelte` *(umbauen)* — Redirect-Stub auf `/draw`
- `src/routes/draw/+page.svelte` — bisheriger Zeichnen-Inhalt (1:1 verschoben)
- `src/routes/archive/+page.svelte` — Archiv-Grid
- `src/routes/archive/+page.ts` — lädt Exercises via `listAllExercises()`
- `src/routes/playlists/+page.svelte` — Playlist-Übersicht + Detail (zweispaltig, Split-View)
- `src/routes/playlists/+page.ts` — lädt Playlists + Exercises
- `src/lib/types/playlist.ts` — `Playlist`-Interface + `createEmptyPlaylist()`
- `src/lib/db/playlists.ts` — `savePlaylist` / `loadPlaylist` / `deletePlaylist` / `listAllPlaylists`
- `src/lib/db/playlists.test.ts` — Vitest (colocation)
- `src/lib/components/ExerciseThumbnail.svelte` — kleine readonly-Konva-Stage (Tisch + Pfeile skaliert)
- `src/lib/components/ExerciseCard.svelte` — Archiv-Card (Thumbnail, Name, Meta, Overflow-Menü)
- `src/lib/components/PlaylistListItem.svelte` — linke Playlist-Liste im Split-View
- `src/lib/components/PlaylistDetail.svelte` — rechte Seite: Header + sortierbare Exercise-Liste
- `src/lib/components/AddExerciseDialog.svelte` — Dialog zum Zuordnen von Übungen
- `src/lib/components/OverflowMenu.svelte` — wiederverwendbares 3-Punkte-Menü (Rename/Duplicate/Delete)
- `src/lib/db/playlistOps.test.ts` — Tests für Reorder/Add/Remove-Helpers

**Geändert:**
- `src/lib/db/database.ts` — Version 2, `playlists`-Tabelle ergänzen
- `src/lib/components/Sidebar.svelte` — `<button>` → `<a href>`, `activeTab` aus `$page.url.pathname`
- `src/routes/+layout.svelte` — `activeTab`-Prop entfernen (Sidebar regelt selbst)

---

## Task 1: Sidebar auf Routing umstellen

**Files:**
- Modify: `src/lib/components/Sidebar.svelte`
- Modify: `src/routes/+layout.svelte`

- [ ] **Step 1: Test schreiben für aktives Tab anhand des Pfads**

Erstelle `src/lib/components/Sidebar.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { pathToTabId } from './sidebar-utils';

describe('pathToTabId', () => {
  it('mapt / auf draw', () => {
    expect(pathToTabId('/')).toBe('draw');
  });
  it('mapt /draw auf draw', () => {
    expect(pathToTabId('/draw')).toBe('draw');
  });
  it('mapt /archive auf archive', () => {
    expect(pathToTabId('/archive')).toBe('archive');
  });
  it('mapt /playlists und /playlists/:id auf playlists', () => {
    expect(pathToTabId('/playlists')).toBe('playlists');
    expect(pathToTabId('/playlists/abc')).toBe('playlists');
  });
  it('unbekannter Pfad → null', () => {
    expect(pathToTabId('/foo')).toBeNull();
  });
});
```

- [ ] **Step 2: Test ausführen — rot**

Run: `npm run test:unit -- --run src/lib/components/Sidebar.test.ts`
Expected: FAIL `Cannot find module './sidebar-utils'`

- [ ] **Step 3: Hilfsfunktion implementieren**

Erstelle `src/lib/components/sidebar-utils.ts`:

```typescript
export type TabId = 'draw' | 'archive' | 'playlists';

export function pathToTabId(pathname: string): TabId | null {
  if (pathname === '/' || pathname.startsWith('/draw')) return 'draw';
  if (pathname.startsWith('/archive')) return 'archive';
  if (pathname.startsWith('/playlists')) return 'playlists';
  return null;
}
```

- [ ] **Step 4: Test grün**

Run: `npm run test:unit -- --run src/lib/components/Sidebar.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Sidebar auf Links umbauen**

Ersetze `src/lib/components/Sidebar.svelte` vollständig:

```svelte
<script lang="ts">
  import { page } from '$app/stores';
  import { pathToTabId, type TabId } from './sidebar-utils';

  const topTabs: Array<{ id: TabId; href: string; label: string; icon: string }> = [
    { id: 'draw', href: '/draw', label: 'Zeichnen', icon: '✎' },
    { id: 'archive', href: '/archive', label: 'Archiv', icon: '▤' },
    { id: 'playlists', href: '/playlists', label: 'Playlists', icon: '▸' },
  ];

  let activeTab = $derived(pathToTabId($page.url.pathname));
</script>

<aside class="sidebar">
  <div class="tabs">
    {#each topTabs as tab (tab.id)}
      <a
        href={tab.href}
        class="tab"
        class:active={activeTab === tab.id}
        aria-label={tab.label}
        aria-current={activeTab === tab.id ? 'page' : undefined}
      >
        <span class="tab-icon">{tab.icon}</span>
      </a>
    {/each}
  </div>

  <div class="bottom">
    <button type="button" class="tab" aria-label="Einstellungen" disabled>
      <span class="tab-icon">⚙</span>
    </button>
  </div>
</aside>

<style>
  .sidebar {
    width: 68px;
    height: 100%;
    background: var(--bg-surface);
    border-right: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 16px 0;
    justify-content: space-between;
  }
  .tabs {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .tab {
    width: 44px;
    height: 44px;
    border-radius: var(--radius-button);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-secondary);
    text-decoration: none;
    transition: background var(--transition-quick), color var(--transition-quick);
  }
  .tab:hover {
    background: var(--bg-elevated);
    color: var(--color-text-primary);
  }
  .tab.active {
    background: var(--bg-elevated);
    color: var(--color-text-primary);
  }
  .tab[disabled] {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .tab-icon {
    font-size: 20px;
  }
  .bottom {
    display: flex;
    flex-direction: column;
  }
</style>
```

- [ ] **Step 6: Layout aufräumen**

Ersetze in `src/routes/+layout.svelte` `<Sidebar activeTab="draw" />` durch `<Sidebar />`.

- [ ] **Step 7: typecheck + Build**

Run: `npm run check`
Expected: 0 errors, 0 warnings.

- [ ] **Step 8: Commit**

```bash
git add src/lib/components/Sidebar.svelte src/lib/components/sidebar-utils.ts src/lib/components/Sidebar.test.ts src/routes/+layout.svelte
git commit -m "feat(sidebar): tabs become svelte-kit links with active-path detection"
```

---

## Task 2: Zeichnen-Inhalt nach /draw verschieben, / als Redirect

**Files:**
- Create: `src/routes/draw/+page.svelte`
- Modify: `src/routes/+page.svelte`

- [ ] **Step 1: Zeichnen-Inhalt nach /draw verschieben**

```bash
mkdir -p src/routes/draw
git mv src/routes/+page.svelte src/routes/draw/+page.svelte
```

- [ ] **Step 2: Neuen Root-Redirect anlegen**

Erstelle `src/routes/+page.ts`:

```typescript
import { redirect } from '@sveltejs/kit';

export function load() {
  throw redirect(307, '/draw');
}
```

Und einen trivialen `src/routes/+page.svelte`:

```svelte
<!-- Redirect wird von +page.ts gemacht; dieser Body ist nie sichtbar. -->
```

- [ ] **Step 3: Typecheck**

Run: `npm run check`
Expected: 0 errors.

- [ ] **Step 4: Dev-Server starten und manuell prüfen**

Run: `npm run dev`
Erwartung: `http://localhost:5173/` leitet auf `/draw` um, Canvas + Toolbar + StepsPanel wie zuvor sichtbar.

Danach Dev-Server stoppen (Strg+C).

- [ ] **Step 5: Commit**

```bash
git add src/routes
git commit -m "refactor(routing): move draw view to /draw, root redirects"
```

---

## Task 3: Playlist-Typen definieren

**Files:**
- Create: `src/lib/types/playlist.ts`
- Create: `src/lib/types/playlist.test.ts`

- [ ] **Step 1: Test schreiben**

```typescript
import { describe, it, expect } from 'vitest';
import { createEmptyPlaylist } from './playlist';

describe('createEmptyPlaylist', () => {
  it('erzeugt UUID, leeren Namen, leere exerciseIds und Timestamps', () => {
    const p = createEmptyPlaylist();
    expect(p.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(p.name).toBe('');
    expect(p.exerciseIds).toEqual([]);
    expect(p.createdAt).toBeGreaterThan(0);
    expect(p.updatedAt).toBe(p.createdAt);
  });

  it('erzeugt unterschiedliche IDs', () => {
    const a = createEmptyPlaylist();
    const b = createEmptyPlaylist();
    expect(a.id).not.toBe(b.id);
  });
});
```

- [ ] **Step 2: Test ausführen — rot**

Run: `npm run test:unit -- --run src/lib/types/playlist.test.ts`
Expected: FAIL `Cannot find module './playlist'`

- [ ] **Step 3: Typ + Factory implementieren**

```typescript
export interface Playlist {
  id: string;
  name: string;
  exerciseIds: string[];
  createdAt: number;
  updatedAt: number;
}

export function createEmptyPlaylist(): Playlist {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    name: '',
    exerciseIds: [],
    createdAt: now,
    updatedAt: now,
  };
}
```

- [ ] **Step 4: Test grün**

Run: `npm run test:unit -- --run src/lib/types/playlist.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/types/playlist.ts src/lib/types/playlist.test.ts
git commit -m "feat(types): playlist entity with ordered exerciseIds"
```

---

## Task 4: Dexie-Schema auf v2 heben (playlists-Tabelle)

**Files:**
- Modify: `src/lib/db/database.ts`
- Modify: `src/lib/db/database.test.ts` *(falls existiert — prüfen; sonst überspringen)*

- [ ] **Step 1: Schema erweitern**

Ersetze `src/lib/db/database.ts`:

```typescript
import Dexie, { type Table } from 'dexie';
import type { Exercise } from '../types/exercise';
import type { Playlist } from '../types/playlist';

class TTPlaybookDB extends Dexie {
  exercises!: Table<Exercise, string>;
  playlists!: Table<Playlist, string>;

  constructor() {
    super('tt-playbook-trainer');
    this.version(1).stores({
      exercises: 'id, name, createdAt, updatedAt',
    });
    this.version(2).stores({
      exercises: 'id, name, createdAt, updatedAt',
      playlists: 'id, name, createdAt, updatedAt',
    });
  }
}

export const db = new TTPlaybookDB();
```

- [ ] **Step 2: Typecheck**

Run: `npm run check`
Expected: 0 errors.

- [ ] **Step 3: Existierende DB-Tests ausführen**

Run: `npm run test:unit -- --run src/lib/db`
Expected: alle PASS (Exercises-Tests müssen weiterhin grün sein, Playlist-Tabelle ist bloß zusätzlich da).

- [ ] **Step 4: Commit**

```bash
git add src/lib/db/database.ts
git commit -m "feat(db): bump schema to v2, add playlists table"
```

---

## Task 5: Playlist-DB-Layer (CRUD)

**Files:**
- Create: `src/lib/db/playlists.ts`
- Create: `src/lib/db/playlists.test.ts`

- [ ] **Step 1: Tests schreiben**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from './database';
import {
  savePlaylist,
  loadPlaylist,
  deletePlaylist,
  listAllPlaylists,
} from './playlists';
import { createEmptyPlaylist } from '../types/playlist';

describe('playlists DB', () => {
  beforeEach(async () => {
    await db.playlists.clear();
  });

  it('speichert und lädt eine Playlist', async () => {
    const p = createEmptyPlaylist();
    p.name = 'Aufschlag';
    p.exerciseIds = ['ex-1', 'ex-2'];
    await savePlaylist(p);

    const loaded = await loadPlaylist(p.id);
    expect(loaded?.name).toBe('Aufschlag');
    expect(loaded?.exerciseIds).toEqual(['ex-1', 'ex-2']);
  });

  it('updatedAt wird beim Speichern aktualisiert', async () => {
    const p = createEmptyPlaylist();
    const before = p.updatedAt;
    await savePlaylist(p);
    await new Promise((r) => setTimeout(r, 5));
    p.name = 'Geändert';
    await savePlaylist(p);

    const loaded = await loadPlaylist(p.id);
    expect(loaded!.updatedAt).toBeGreaterThan(before);
  });

  it('listet alle Playlists nach updatedAt absteigend', async () => {
    const a = createEmptyPlaylist();
    a.name = 'Alt';
    await savePlaylist(a);
    await new Promise((r) => setTimeout(r, 5));
    const b = createEmptyPlaylist();
    b.name = 'Neu';
    await savePlaylist(b);

    const all = await listAllPlaylists();
    expect(all.map((p) => p.name)).toEqual(['Neu', 'Alt']);
  });

  it('löscht eine Playlist', async () => {
    const p = createEmptyPlaylist();
    await savePlaylist(p);
    await deletePlaylist(p.id);
    expect(await loadPlaylist(p.id)).toBeUndefined();
  });
});
```

- [ ] **Step 2: Test ausführen — rot**

Run: `npm run test:unit -- --run src/lib/db/playlists.test.ts`
Expected: FAIL `Cannot find module './playlists'`

- [ ] **Step 3: Implementation**

```typescript
import { db } from './database';
import type { Playlist } from '../types/playlist';

export async function savePlaylist(playlist: Playlist): Promise<void> {
  playlist.updatedAt = Date.now();
  await db.playlists.put(playlist);
}

export async function loadPlaylist(id: string): Promise<Playlist | undefined> {
  return await db.playlists.get(id);
}

export async function deletePlaylist(id: string): Promise<void> {
  await db.playlists.delete(id);
}

export async function listAllPlaylists(): Promise<Playlist[]> {
  return await db.playlists.orderBy('updatedAt').reverse().toArray();
}
```

- [ ] **Step 4: Test grün**

Run: `npm run test:unit -- --run src/lib/db/playlists.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/db/playlists.ts src/lib/db/playlists.test.ts
git commit -m "feat(db): playlist crud (save/load/delete/listAll)"
```

---

## Task 6: Reorder-/Add-/Remove-Helpers für exerciseIds

**Files:**
- Create: `src/lib/db/playlistOps.ts`
- Create: `src/lib/db/playlistOps.test.ts`

Grund: Drag-Reorder + Add + Remove sind reine Array-Operationen. Als reine Funktionen trivial testbar — die Route ruft sie nur auf.

- [ ] **Step 1: Tests schreiben**

```typescript
import { describe, it, expect } from 'vitest';
import { addExerciseId, removeExerciseId, moveExerciseId } from './playlistOps';

describe('addExerciseId', () => {
  it('fügt am Ende an', () => {
    expect(addExerciseId(['a', 'b'], 'c')).toEqual(['a', 'b', 'c']);
  });
  it('fügt nicht doppelt ein', () => {
    expect(addExerciseId(['a', 'b'], 'a')).toEqual(['a', 'b']);
  });
});

describe('removeExerciseId', () => {
  it('entfernt vorhandenes Element', () => {
    expect(removeExerciseId(['a', 'b', 'c'], 'b')).toEqual(['a', 'c']);
  });
  it('lässt Liste unverändert, wenn id fehlt', () => {
    expect(removeExerciseId(['a', 'b'], 'x')).toEqual(['a', 'b']);
  });
});

describe('moveExerciseId', () => {
  it('verschiebt Element von fromIndex an toIndex', () => {
    expect(moveExerciseId(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd']);
  });
  it('verschiebt rückwärts', () => {
    expect(moveExerciseId(['a', 'b', 'c', 'd'], 3, 1)).toEqual(['a', 'd', 'b', 'c']);
  });
  it('no-op wenn from = to', () => {
    expect(moveExerciseId(['a', 'b', 'c'], 1, 1)).toEqual(['a', 'b', 'c']);
  });
  it('no-op bei ungültigen Indizes', () => {
    expect(moveExerciseId(['a', 'b'], 5, 0)).toEqual(['a', 'b']);
    expect(moveExerciseId(['a', 'b'], 0, 99)).toEqual(['a', 'b']);
  });
});
```

- [ ] **Step 2: Test ausführen — rot**

Run: `npm run test:unit -- --run src/lib/db/playlistOps.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementation**

```typescript
export function addExerciseId(ids: string[], id: string): string[] {
  if (ids.includes(id)) return ids;
  return [...ids, id];
}

export function removeExerciseId(ids: string[], id: string): string[] {
  return ids.filter((x) => x !== id);
}

export function moveExerciseId(ids: string[], from: number, to: number): string[] {
  if (from === to) return ids;
  if (from < 0 || from >= ids.length) return ids;
  if (to < 0 || to >= ids.length) return ids;
  const next = ids.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
```

- [ ] **Step 4: Test grün**

Run: `npm run test:unit -- --run src/lib/db/playlistOps.test.ts`
Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/db/playlistOps.ts src/lib/db/playlistOps.test.ts
git commit -m "feat(playlists): pure helpers for add/remove/move exerciseIds"
```

---

## Task 7: ExerciseThumbnail-Komponente

**Files:**
- Create: `src/lib/components/ExerciseThumbnail.svelte`

Grund: Kleine readonly-Konva-Stage, die Tisch + alle Strokes einer Übung skaliert rendert. Nutzt dieselben Renderer wie das große Canvas — keine Code-Duplikation.

- [ ] **Step 1: Vorhandene Renderer prüfen**

Vor Implementation kurz ansehen (nur lesen):
- `src/lib/canvas/TableRenderer` (o.ä. — Import aus `TableCanvas.svelte` nachvollziehen)
- `src/lib/canvas/StrokeRenderer` (o.ä.)

Ziel: verstehen wie sie eine Konva-Stage erwarten, damit die Thumbnail-Variante sie mit anderer Größe und ohne Input-Handler aufruft.

- [ ] **Step 2: Komponente implementieren**

```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Konva from 'konva';
  import type { Exercise } from '$lib/types/exercise';
  import { drawTable } from '$lib/canvas/table';
  import { drawStroke } from '$lib/canvas/stroke';

  interface Props {
    exercise: Exercise;
    width?: number;
    height?: number;
  }

  let { exercise, width = 220, height = 140 }: Props = $props();

  let container: HTMLDivElement;
  let stage: Konva.Stage | null = null;

  onMount(() => {
    stage = new Konva.Stage({ container, width, height, listening: false });
    const tableLayer = new Konva.Layer({ listening: false });
    const strokeLayer = new Konva.Layer({ listening: false });
    stage.add(tableLayer);
    stage.add(strokeLayer);

    drawTable(tableLayer, width, height);
    for (const stroke of exercise.strokes) {
      drawStroke(strokeLayer, stroke, width, height, { readonly: true });
    }
    tableLayer.draw();
    strokeLayer.draw();
  });

  onDestroy(() => {
    stage?.destroy();
    stage = null;
  });
</script>

<div bind:this={container} class="thumb" style="width: {width}px; height: {height}px;"></div>

<style>
  .thumb {
    border-radius: var(--radius-panel);
    overflow: hidden;
    background: var(--color-table);
  }
</style>
```

**Falls** die tatsächlichen Import-Namen in `$lib/canvas/` von `drawTable` / `drawStroke` abweichen, hier anpassen (Step 1 hat das geklärt).

- [ ] **Step 3: Typecheck**

Run: `npm run check`
Expected: 0 errors.

- [ ] **Step 4: Manueller Smoke-Test**

Vorübergehend in `src/routes/draw/+page.svelte` unten einfügen:

```svelte
<ExerciseThumbnail exercise={currentExercise.exercise} />
```

`npm run dev` → `/draw` öffnen, 2–3 Pfeile zeichnen, Thumbnail erscheint unten mit derselben Anordnung verkleinert. Danach den Test-Block wieder entfernen.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/ExerciseThumbnail.svelte
git commit -m "feat(archive): readonly konva thumbnail for exercise previews"
```

---

## Task 8: OverflowMenu-Komponente

**Files:**
- Create: `src/lib/components/OverflowMenu.svelte`

- [ ] **Step 1: Implementation**

```svelte
<script lang="ts">
  interface MenuItem {
    label: string;
    onSelect: () => void;
    destructive?: boolean;
  }

  interface Props {
    items: MenuItem[];
  }

  let { items }: Props = $props();
  let open = $state(false);
  let root: HTMLDivElement;

  function toggle() {
    open = !open;
  }

  function handleDocumentClick(e: MouseEvent) {
    if (!root.contains(e.target as Node)) open = false;
  }

  $effect(() => {
    if (open) {
      document.addEventListener('click', handleDocumentClick);
      return () => document.removeEventListener('click', handleDocumentClick);
    }
  });
</script>

<div class="overflow" bind:this={root}>
  <button type="button" class="trigger" aria-label="Aktionen" onclick={toggle}>⋯</button>
  {#if open}
    <ul class="menu" role="menu">
      {#each items as item (item.label)}
        <li>
          <button
            type="button"
            class:destructive={item.destructive}
            role="menuitem"
            onclick={() => {
              item.onSelect();
              open = false;
            }}
          >
            {item.label}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .overflow {
    position: relative;
  }
  .trigger {
    width: 32px;
    height: 32px;
    border-radius: var(--radius-button);
    color: var(--color-text-secondary);
  }
  .trigger:hover {
    background: var(--bg-elevated);
  }
  .menu {
    position: absolute;
    right: 0;
    top: 36px;
    background: var(--bg-elevated);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-panel);
    min-width: 160px;
    padding: 4px;
    list-style: none;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    z-index: 20;
  }
  .menu button {
    width: 100%;
    padding: 8px 12px;
    text-align: left;
    color: var(--color-text-primary);
    border-radius: 6px;
    font-size: 14px;
  }
  .menu button:hover {
    background: var(--bg-surface);
  }
  .menu button.destructive {
    color: var(--color-danger);
  }
</style>
```

- [ ] **Step 2: Typecheck**

Run: `npm run check`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/OverflowMenu.svelte
git commit -m "feat(ui): reusable overflow (3-dot) menu component"
```

---

## Task 9: ExerciseCard-Komponente

**Files:**
- Create: `src/lib/components/ExerciseCard.svelte`

- [ ] **Step 1: Implementation**

```svelte
<script lang="ts">
  import ExerciseThumbnail from './ExerciseThumbnail.svelte';
  import OverflowMenu from './OverflowMenu.svelte';
  import type { Exercise } from '$lib/types/exercise';

  interface Props {
    exercise: Exercise;
    onOpen: (id: string) => void;
    onRename: (id: string) => void;
    onDuplicate: (id: string) => void;
    onDelete: (id: string) => void;
  }

  let { exercise, onOpen, onRename, onDuplicate, onDelete }: Props = $props();

  const strokeCount = $derived(exercise.strokes.length);
  const uniqueTags = $derived(
    Array.from(new Set(exercise.strokes.map((s) => s.strokeType).filter(Boolean))) as string[],
  );
</script>

<article class="card">
  <button type="button" class="thumb-btn" onclick={() => onOpen(exercise.id)}>
    <ExerciseThumbnail {exercise} />
  </button>
  <div class="body">
    <div class="title-row">
      <h3 class="title">{exercise.name || 'Unbenannt'}</h3>
      <OverflowMenu
        items={[
          { label: 'Umbenennen', onSelect: () => onRename(exercise.id) },
          { label: 'Duplizieren', onSelect: () => onDuplicate(exercise.id) },
          { label: 'Löschen', onSelect: () => onDelete(exercise.id), destructive: true },
        ]}
      />
    </div>
    <div class="meta">
      <span>{strokeCount} Schläge</span>
      {#if exercise.repetitions}<span>{exercise.repetitions}x</span>{/if}
      {#if exercise.duration}<span>{exercise.duration}</span>{/if}
    </div>
    {#if uniqueTags.length > 0}
      <div class="tags">
        {#each uniqueTags as tag (tag)}
          <span class="chip">{tag}</span>
        {/each}
      </div>
    {/if}
  </div>
</article>

<style>
  .card {
    background: var(--bg-surface);
    border-radius: var(--radius-panel);
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .thumb-btn {
    padding: 0;
    background: none;
    border: 0;
    cursor: pointer;
    align-self: stretch;
  }
  .title-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .title {
    flex: 1;
    font-size: 15px;
    font-weight: 600;
    color: var(--color-text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .meta {
    display: flex;
    gap: 8px;
    font-size: 12px;
    color: var(--color-text-secondary);
  }
  .tags {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }
  .chip {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--bg-elevated);
    color: var(--color-text-secondary);
  }
</style>
```

- [ ] **Step 2: Typecheck**

Run: `npm run check`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/ExerciseCard.svelte
git commit -m "feat(archive): exercise card with thumbnail, meta and overflow menu"
```

---

## Task 10: Archiv-Route (Grid, leere/gefüllte States)

**Files:**
- Create: `src/routes/archive/+page.ts`
- Create: `src/routes/archive/+page.svelte`

- [ ] **Step 1: Loader**

```typescript
import type { PageLoad } from './$types';
import { listAllExercises } from '$lib/db/exercises';
import { browser } from '$app/environment';

export const ssr = false;

export const load: PageLoad = async () => {
  if (!browser) return { exercises: [] };
  return { exercises: await listAllExercises() };
};
```

- [ ] **Step 2: Route-Komponente**

```svelte
<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import ExerciseCard from '$lib/components/ExerciseCard.svelte';
  import { deleteExercise, saveExercise, loadExercise } from '$lib/db/exercises';
  import type { Exercise } from '$lib/types/exercise';

  let { data } = $props();
  let exercises = $derived(data.exercises);

  function open(id: string) {
    // Phase C: /draw/:id mit Vorlage — für jetzt: Navigation nach /draw
    goto('/draw');
  }

  async function rename(id: string) {
    const current = await loadExercise(id);
    if (!current) return;
    const next = prompt('Neuer Name:', current.name);
    if (next === null) return;
    current.name = next.trim();
    await saveExercise(current);
    await invalidateAll();
  }

  async function duplicate(id: string) {
    const src = await loadExercise(id);
    if (!src) return;
    const copy: Exercise = {
      ...src,
      id: crypto.randomUUID(),
      name: `${src.name || 'Unbenannt'} (Kopie)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await saveExercise(copy);
    await invalidateAll();
  }

  async function remove(id: string) {
    if (!confirm('Diese Übung wirklich löschen?')) return;
    await deleteExercise(id);
    await invalidateAll();
  }
</script>

<section class="archive">
  <header class="head">
    <h1>Archiv</h1>
    <p class="count">{exercises.length} Übung{exercises.length === 1 ? '' : 'en'}</p>
  </header>

  {#if exercises.length === 0}
    <div class="empty">
      <p>Noch keine Übungen gespeichert.</p>
      <a class="cta" href="/draw">Neue Übung zeichnen</a>
    </div>
  {:else}
    <div class="grid">
      {#each exercises as ex (ex.id)}
        <ExerciseCard
          exercise={ex}
          onOpen={open}
          onRename={rename}
          onDuplicate={duplicate}
          onDelete={remove}
        />
      {/each}
    </div>
  {/if}
</section>

<style>
  .archive {
    padding: 24px 32px;
    overflow-y: auto;
    flex: 1;
  }
  .head {
    display: flex;
    align-items: baseline;
    gap: 12px;
    margin-bottom: 20px;
  }
  h1 {
    font-size: 24px;
    font-weight: 600;
    color: var(--color-text-primary);
  }
  .count {
    color: var(--color-text-secondary);
    font-size: 14px;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px;
  }
  .empty {
    padding: 48px;
    text-align: center;
    color: var(--color-text-secondary);
  }
  .cta {
    display: inline-block;
    margin-top: 12px;
    padding: 10px 16px;
    background: var(--color-accent);
    color: #fff;
    border-radius: var(--radius-button);
    text-decoration: none;
  }
</style>
```

- [ ] **Step 3: Typecheck + Build**

Run: `npm run check && npm run build`
Expected: 0 errors, Build ok.

- [ ] **Step 4: Manueller Browser-Smoke-Test**

Run: `npm run dev` → `/archive` öffnen.
1. Leer-State: "Noch keine Übungen gespeichert." + CTA-Button sichtbar.
2. Auf `/draw` wechseln, 2 Übungen zeichnen + speichern.
3. Zurück nach `/archive`: beide Karten mit Thumbnails, Namen, Meta sichtbar.
4. Overflow-Menü → "Löschen" → Karte verschwindet.
5. "Duplizieren" → neue Karte "Name (Kopie)" erscheint.

- [ ] **Step 5: Visual-Check gegen Stitch "Archiv"**

Stitch-Screen "Archiv" daneben öffnen. Prüfen:
- Header: Ueberschrift + Anzahl-Chip + "+ Neue Uebung"-Button-Position.
- Karten-Abstand (Gap ca. 16–20px), Rounded 12, Thumbnail-Proportionen, Overflow-Menü rechts oben.
- Tischblau `#0a2a4a` im Thumbnail.
Abweichungen, die UX stören → korrigieren und Tests erneut laufen lassen. Reine Pixel-Perfect-Abweichungen → ignorieren.

- [ ] **Step 6: Commit**

```bash
git add src/routes/archive
git commit -m "feat(archive): grid view with rename/duplicate/delete and empty state"
```

---

## Task 11: Archiv-Suche (Name-Filter)

**Files:**
- Modify: `src/routes/archive/+page.svelte`

- [ ] **Step 1: Suchfeld + derived Liste einbauen**

Im `<script>`-Block ergänzen:

```typescript
let query = $state('');
let filtered = $derived(
  query.trim() === ''
    ? exercises
    : exercises.filter((e) =>
        e.name.toLowerCase().includes(query.toLowerCase().trim()),
      ),
);
```

Markup-Block unter `.head` vor `.grid`:

```svelte
<input
  class="search"
  type="search"
  placeholder="Suchen..."
  bind:value={query}
  aria-label="Übungen suchen"
/>
```

Das `{#each exercises}` auf `{#each filtered}` umstellen.

Leer-State bei Suchtreffern = 0:

```svelte
{:else if filtered.length === 0}
  <div class="empty">
    <p>Keine Übung passt zu "{query}".</p>
  </div>
{:else}
```

- [ ] **Step 2: Styling**

```css
.search {
  width: 320px;
  padding: 10px 14px;
  border-radius: var(--radius-button);
  background: var(--bg-surface);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  margin-bottom: 16px;
}
```

- [ ] **Step 3: Manueller Test**

`npm run dev` → `/archive`, Suche tippen, Treffer sollten live filtern. Leer-Suche zeigt alle wieder.

- [ ] **Step 4: Commit**

```bash
git add src/routes/archive/+page.svelte
git commit -m "feat(archive): name search with live filtering"
```

---

## Task 12: Archiv-Filter-Chips (Schlagart-Tags)

**Files:**
- Modify: `src/routes/archive/+page.svelte`

- [ ] **Step 1: Ableitung aller verwendeten Tags + Filter**

Im `<script>`:

```typescript
let activeTag = $state<string | null>(null);

const allTags = $derived(
  Array.from(
    new Set(
      exercises.flatMap((e) => e.strokes.map((s) => s.strokeType).filter(Boolean) as string[]),
    ),
  ).sort(),
);

let filtered = $derived(
  exercises.filter((e) => {
    const matchesQuery =
      query.trim() === '' ||
      e.name.toLowerCase().includes(query.toLowerCase().trim());
    const matchesTag =
      activeTag === null || e.strokes.some((s) => s.strokeType === activeTag);
    return matchesQuery && matchesTag;
  }),
);
```

Die existierende `filtered`-Deklaration aus Task 11 ersetzen.

- [ ] **Step 2: Chip-Reihe im Markup**

Unter `.search` vor `.grid`:

```svelte
{#if allTags.length > 0}
  <div class="chips">
    <button
      type="button"
      class="chip"
      class:active={activeTag === null}
      onclick={() => (activeTag = null)}
    >
      Alle
    </button>
    {#each allTags as tag (tag)}
      <button
        type="button"
        class="chip"
        class:active={activeTag === tag}
        onclick={() => (activeTag = tag)}
      >
        {tag}
      </button>
    {/each}
  </div>
{/if}
```

- [ ] **Step 3: Styling**

```css
.chips {
  display: flex;
  gap: 6px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.chip {
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 13px;
  background: var(--bg-surface);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}
.chip.active {
  background: var(--color-accent);
  color: #fff;
  border-color: var(--color-accent);
}
```

- [ ] **Step 4: Manueller Test**

`/archive`: Chips für alle verwendeten Schlagarten sichtbar, Klick filtert sichtbar, "Alle" setzt zurück. Kombiniert mit Suche funktioniert.

- [ ] **Step 5: Commit**

```bash
git add src/routes/archive/+page.svelte
git commit -m "feat(archive): filter chips per stroke type"
```

---

## Task 13: PlaylistListItem- und PlaylistDetail-Komponenten (Gerüst)

**Files:**
- Create: `src/lib/components/PlaylistListItem.svelte`
- Create: `src/lib/components/PlaylistDetail.svelte`

- [ ] **Step 1: PlaylistListItem implementieren**

```svelte
<script lang="ts">
  import type { Playlist } from '$lib/types/playlist';

  interface Props {
    playlist: Playlist;
    active: boolean;
    exerciseCount: number;
    onSelect: (id: string) => void;
  }

  let { playlist, active, exerciseCount, onSelect }: Props = $props();
</script>

<button
  type="button"
  class="item"
  class:active
  onclick={() => onSelect(playlist.id)}
>
  <span class="name">{playlist.name || 'Unbenannt'}</span>
  <span class="meta">{exerciseCount} Übung{exerciseCount === 1 ? '' : 'en'}</span>
</button>

<style>
  .item {
    width: 100%;
    text-align: left;
    padding: 12px 14px;
    border-radius: var(--radius-panel);
    background: transparent;
    color: var(--color-text-primary);
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .item:hover {
    background: var(--bg-surface);
  }
  .item.active {
    background: var(--color-accent);
    color: #fff;
  }
  .name {
    font-size: 14px;
    font-weight: 600;
  }
  .meta {
    font-size: 12px;
    opacity: 0.8;
  }
</style>
```

- [ ] **Step 2: PlaylistDetail implementieren (ohne Reorder — kommt in Task 16)**

```svelte
<script lang="ts">
  import OverflowMenu from './OverflowMenu.svelte';
  import ExerciseThumbnail from './ExerciseThumbnail.svelte';
  import type { Playlist } from '$lib/types/playlist';
  import type { Exercise } from '$lib/types/exercise';

  interface Props {
    playlist: Playlist;
    exercises: Exercise[]; // bereits in exerciseIds-Reihenfolge
    onRename: () => void;
    onDuplicate: () => void;
    onDelete: () => void;
    onAddExercise: () => void;
    onRemoveExercise: (exerciseId: string) => void;
  }

  let {
    playlist,
    exercises,
    onRename,
    onDuplicate,
    onDelete,
    onAddExercise,
    onRemoveExercise,
  }: Props = $props();
</script>

<div class="detail">
  <header class="head">
    <div class="title-row">
      <h2>{playlist.name || 'Unbenannt'}</h2>
      <button type="button" class="primary" disabled>Auf TV spielen</button>
    </div>
    <div class="meta-row">
      <span class="meta">{exercises.length} Übung{exercises.length === 1 ? '' : 'en'}</span>
      <div class="actions">
        <button type="button" onclick={onRename}>Umbenennen</button>
        <button type="button" onclick={onDuplicate}>Duplizieren</button>
        <button type="button" class="danger" onclick={onDelete}>Löschen</button>
      </div>
    </div>
  </header>

  {#if exercises.length === 0}
    <p class="empty">Noch keine Übung in dieser Playlist.</p>
  {:else}
    <ul class="list">
      {#each exercises as ex, i (ex.id)}
        <li class="row">
          <span class="idx">{i + 1}</span>
          <ExerciseThumbnail exercise={ex} width={96} height={60} />
          <div class="body">
            <span class="name">{ex.name || 'Unbenannt'}</span>
            <span class="meta">{ex.strokes.length} Schläge</span>
          </div>
          <OverflowMenu
            items={[
              {
                label: 'Aus Playlist entfernen',
                onSelect: () => onRemoveExercise(ex.id),
                destructive: true,
              },
            ]}
          />
        </li>
      {/each}
    </ul>
  {/if}

  <button type="button" class="add" onclick={onAddExercise}>+ Übung hinzufügen</button>
</div>

<style>
  .detail { padding: 20px 24px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 16px; }
  .head { display: flex; flex-direction: column; gap: 8px; }
  .title-row { display: flex; align-items: center; gap: 12px; }
  h2 { flex: 1; font-size: 22px; font-weight: 600; color: var(--color-text-primary); }
  .primary { padding: 10px 16px; border-radius: var(--radius-button); background: var(--color-accent); color: #fff; font-weight: 600; }
  .primary[disabled] { opacity: 0.5; cursor: not-allowed; }
  .meta-row { display: flex; align-items: center; gap: 12px; }
  .meta { color: var(--color-text-secondary); font-size: 13px; flex: 1; }
  .actions { display: flex; gap: 8px; }
  .actions button { color: var(--color-accent); font-size: 13px; padding: 4px 8px; }
  .actions .danger { color: var(--color-danger); }
  .list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
  .row { display: flex; align-items: center; gap: 12px; background: var(--bg-surface); border-radius: var(--radius-panel); padding: 10px 12px; }
  .idx { width: 28px; text-align: center; color: var(--color-text-secondary); }
  .body { flex: 1; display: flex; flex-direction: column; }
  .name { font-weight: 600; color: var(--color-text-primary); }
  .meta { font-size: 12px; color: var(--color-text-secondary); }
  .add { padding: 12px; border: 1px dashed var(--color-border); border-radius: var(--radius-panel); color: var(--color-text-secondary); font-size: 14px; }
  .add:hover { color: var(--color-text-primary); border-color: var(--color-text-secondary); }
  .empty { padding: 24px; text-align: center; color: var(--color-text-secondary); }
</style>
```

- [ ] **Step 3: Typecheck**

Run: `npm run check`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/PlaylistListItem.svelte src/lib/components/PlaylistDetail.svelte
git commit -m "feat(playlists): list item and detail components (no reorder yet)"
```

---

## Task 14: AddExerciseDialog-Komponente

**Files:**
- Create: `src/lib/components/AddExerciseDialog.svelte`

- [ ] **Step 1: Implementation**

```svelte
<script lang="ts">
  import type { Exercise } from '$lib/types/exercise';

  interface Props {
    exercises: Exercise[];
    excludeIds: string[];
    onPick: (id: string) => void;
    onClose: () => void;
  }

  let { exercises, excludeIds, onPick, onClose }: Props = $props();
  let query = $state('');

  const available = $derived(
    exercises.filter((e) => !excludeIds.includes(e.id)),
  );
  const filtered = $derived(
    query.trim() === ''
      ? available
      : available.filter((e) =>
          e.name.toLowerCase().includes(query.toLowerCase().trim()),
        ),
  );

  function handleBackdrop(e: MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }
</script>

<div class="backdrop" onclick={handleBackdrop} role="presentation">
  <div class="dialog" role="dialog" aria-modal="true" aria-label="Übung hinzufügen">
    <header class="head">
      <h3>Übung hinzufügen</h3>
      <button type="button" class="close" onclick={onClose} aria-label="Schließen">✕</button>
    </header>
    <input
      type="search"
      bind:value={query}
      placeholder="Suchen..."
      aria-label="Übungen suchen"
    />
    {#if filtered.length === 0}
      <p class="empty">Keine verfügbaren Übungen.</p>
    {:else}
      <ul>
        {#each filtered as ex (ex.id)}
          <li>
            <button type="button" onclick={() => onPick(ex.id)}>
              <span class="name">{ex.name || 'Unbenannt'}</span>
              <span class="meta">{ex.strokes.length} Schläge</span>
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>

<style>
  .backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: grid; place-items: center; z-index: 50; }
  .dialog { width: min(480px, 92vw); max-height: 80vh; background: var(--bg-elevated); border-radius: var(--radius-panel); padding: 20px; display: flex; flex-direction: column; gap: 12px; }
  .head { display: flex; align-items: center; }
  h3 { flex: 1; font-size: 18px; font-weight: 600; color: var(--color-text-primary); }
  .close { width: 32px; height: 32px; border-radius: 50%; color: var(--color-text-secondary); }
  input { padding: 10px 14px; border-radius: var(--radius-button); background: var(--bg-surface); border: 1px solid var(--color-border); color: var(--color-text-primary); }
  ul { list-style: none; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
  ul button { width: 100%; text-align: left; padding: 10px 12px; border-radius: var(--radius-panel); display: flex; justify-content: space-between; color: var(--color-text-primary); }
  ul button:hover { background: var(--bg-surface); }
  .name { font-weight: 500; }
  .meta { color: var(--color-text-secondary); font-size: 12px; }
  .empty { text-align: center; color: var(--color-text-secondary); padding: 24px 0; }
</style>
```

- [ ] **Step 2: Typecheck**

Run: `npm run check`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/AddExerciseDialog.svelte
git commit -m "feat(playlists): dialog to pick an exercise to add"
```

---

## Task 15: Playlists-Route (Split-View + CRUD)

**Files:**
- Create: `src/routes/playlists/+page.ts`
- Create: `src/routes/playlists/+page.svelte`

- [ ] **Step 1: Loader**

```typescript
import type { PageLoad } from './$types';
import { listAllPlaylists } from '$lib/db/playlists';
import { listAllExercises } from '$lib/db/exercises';
import { browser } from '$app/environment';

export const ssr = false;

export const load: PageLoad = async () => {
  if (!browser) return { playlists: [], exercises: [] };
  const [playlists, exercises] = await Promise.all([listAllPlaylists(), listAllExercises()]);
  return { playlists, exercises };
};
```

- [ ] **Step 2: Route-Komponente (ohne Reorder — das kommt in Task 16)**

```svelte
<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import PlaylistListItem from '$lib/components/PlaylistListItem.svelte';
  import PlaylistDetail from '$lib/components/PlaylistDetail.svelte';
  import AddExerciseDialog from '$lib/components/AddExerciseDialog.svelte';
  import { createEmptyPlaylist, type Playlist } from '$lib/types/playlist';
  import { savePlaylist, deletePlaylist, loadPlaylist } from '$lib/db/playlists';
  import { addExerciseId, removeExerciseId } from '$lib/db/playlistOps';

  let { data } = $props();

  let selectedId = $state<string | null>(data.playlists[0]?.id ?? null);
  let showAddDialog = $state(false);

  const selected = $derived(
    data.playlists.find((p) => p.id === selectedId) ?? null,
  );
  const selectedExercises = $derived(
    selected
      ? (selected.exerciseIds
          .map((id) => data.exercises.find((e) => e.id === id))
          .filter(Boolean) as typeof data.exercises)
      : [],
  );

  async function createPlaylist() {
    const name = prompt('Name der Playlist:');
    if (name === null) return;
    const p = createEmptyPlaylist();
    p.name = name.trim();
    await savePlaylist(p);
    selectedId = p.id;
    await invalidateAll();
  }

  async function renameSelected() {
    if (!selected) return;
    const next = prompt('Neuer Name:', selected.name);
    if (next === null) return;
    const p = await loadPlaylist(selected.id);
    if (!p) return;
    p.name = next.trim();
    await savePlaylist(p);
    await invalidateAll();
  }

  async function duplicateSelected() {
    if (!selected) return;
    const copy: Playlist = {
      ...selected,
      id: crypto.randomUUID(),
      name: `${selected.name || 'Unbenannt'} (Kopie)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await savePlaylist(copy);
    selectedId = copy.id;
    await invalidateAll();
  }

  async function deleteSelected() {
    if (!selected) return;
    if (!confirm('Diese Playlist wirklich löschen?')) return;
    const idToRemove = selected.id;
    await deletePlaylist(idToRemove);
    selectedId = data.playlists.find((p) => p.id !== idToRemove)?.id ?? null;
    await invalidateAll();
  }

  async function addExercise(exerciseId: string) {
    if (!selected) return;
    const p = await loadPlaylist(selected.id);
    if (!p) return;
    p.exerciseIds = addExerciseId(p.exerciseIds, exerciseId);
    await savePlaylist(p);
    showAddDialog = false;
    await invalidateAll();
  }

  async function removeExercise(exerciseId: string) {
    if (!selected) return;
    const p = await loadPlaylist(selected.id);
    if (!p) return;
    p.exerciseIds = removeExerciseId(p.exerciseIds, exerciseId);
    await savePlaylist(p);
    await invalidateAll();
  }
</script>

<section class="playlists-page">
  <aside class="left">
    <header class="left-head">
      <h1>Playlists</h1>
      <button type="button" class="add-btn" aria-label="Neue Playlist" onclick={createPlaylist}>+</button>
    </header>
    {#if data.playlists.length === 0}
      <p class="empty">Noch keine Playlist.</p>
    {:else}
      <div class="list">
        {#each data.playlists as pl (pl.id)}
          <PlaylistListItem
            playlist={pl}
            active={pl.id === selectedId}
            exerciseCount={pl.exerciseIds.length}
            onSelect={(id) => (selectedId = id)}
          />
        {/each}
      </div>
    {/if}
  </aside>

  <div class="right">
    {#if selected}
      <PlaylistDetail
        playlist={selected}
        exercises={selectedExercises}
        onRename={renameSelected}
        onDuplicate={duplicateSelected}
        onDelete={deleteSelected}
        onAddExercise={() => (showAddDialog = true)}
        onRemoveExercise={removeExercise}
      />
    {:else}
      <div class="empty">
        <p>Wähle oder erstelle eine Playlist.</p>
      </div>
    {/if}
  </div>

  {#if showAddDialog && selected}
    <AddExerciseDialog
      exercises={data.exercises}
      excludeIds={selected.exerciseIds}
      onPick={addExercise}
      onClose={() => (showAddDialog = false)}
    />
  {/if}
</section>

<style>
  .playlists-page { flex: 1; display: flex; overflow: hidden; }
  .left { width: 320px; border-right: 1px solid var(--color-border); background: var(--bg-surface); display: flex; flex-direction: column; padding: 16px; gap: 12px; }
  .left-head { display: flex; align-items: center; gap: 8px; }
  h1 { flex: 1; font-size: 20px; font-weight: 600; color: var(--color-text-primary); }
  .add-btn { width: 36px; height: 36px; border-radius: var(--radius-button); background: var(--color-accent); color: #fff; font-size: 20px; }
  .list { display: flex; flex-direction: column; gap: 4px; overflow-y: auto; }
  .right { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
  .empty { padding: 48px; text-align: center; color: var(--color-text-secondary); }
</style>
```

- [ ] **Step 3: Typecheck + Build**

Run: `npm run check && npm run build`
Expected: 0 errors, Build ok.

- [ ] **Step 4: Manueller Smoke-Test**

`npm run dev` → `/playlists`.
1. Leer-State links: "Noch keine Playlist.", rechts: "Wähle oder erstelle eine Playlist."
2. "+" klicken, Name eingeben → Playlist erscheint links und ist rechts offen.
3. "+ Übung hinzufügen" → Dialog zeigt Archiv-Übungen; einen auswählen → Zeile erscheint in der Detail-Liste.
4. Overflow "Aus Playlist entfernen" → Zeile verschwindet.
5. "Umbenennen" funktioniert, "Duplizieren" legt Kopie an, "Löschen" entfernt Playlist.
6. Reload (F5) → Zustand bleibt (Dexie).

- [ ] **Step 5: Visual-Check gegen Stitch "Playlists"**

Stitch-Screen "Playlists" daneben öffnen. Prüfen:
- Split-View: linke Liste ca. 320px, Trennlinie, aktive Playlist iOS-Blau hervorgehoben.
- Detail-Header in zwei Zeilen (wie nach der manuellen Korrektur am Stitch-Screen gemacht): Titel + "Auf TV spielen" oben, Meta + Umbenennen/Duplizieren/Löschen unten.
- Listenzeilen mit Drag-Handle (fürs MVP nur visuell, Logik kommt in Task 16), Thumbnail links, Meta rechts.
- "+ Übung hinzufügen" als gestrichelter Button unten.
Wichtige Abweichungen korrigieren, Pixel-Kleinigkeiten ignorieren.

- [ ] **Step 6: Commit**

```bash
git add src/routes/playlists
git commit -m "feat(playlists): split-view route with crud and add/remove exercises"
```

---

## Task 16: Playlist-Reihenfolge per Drag ändern

**Files:**
- Modify: `src/lib/components/PlaylistDetail.svelte`
- Modify: `src/routes/playlists/+page.svelte`

- [ ] **Step 1: Drag-Handler in PlaylistDetail ergänzen**

Props-Interface erweitern:

```typescript
interface Props {
  playlist: Playlist;
  exercises: Exercise[];
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onAddExercise: () => void;
  onRemoveExercise: (exerciseId: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}

let {
  /* … */
  onReorder,
}: Props = $props();

let dragIndex = $state<number | null>(null);
```

`<li class="row">` ändern:

```svelte
<li
  class="row"
  draggable="true"
  ondragstart={(e) => {
    dragIndex = i;
    e.dataTransfer?.setData('text/plain', String(i));
  }}
  ondragover={(e) => e.preventDefault()}
  ondrop={(e) => {
    e.preventDefault();
    const from = Number(e.dataTransfer?.getData('text/plain'));
    if (Number.isInteger(from) && from !== i) onReorder(from, i);
    dragIndex = null;
  }}
  ondragend={() => (dragIndex = null)}
  class:dragging={dragIndex === i}
>
  <span class="handle" aria-hidden="true">≡</span>
  <!-- Rest wie gehabt: idx, Thumbnail, Body, OverflowMenu -->
```

CSS für `.handle` und `.dragging`:

```css
.handle { color: var(--color-text-secondary); font-size: 16px; cursor: grab; padding: 0 4px; }
.row.dragging { opacity: 0.5; }
```

- [ ] **Step 2: Reorder-Handler in der Route**

In `src/routes/playlists/+page.svelte` ergänzen:

```typescript
import { moveExerciseId } from '$lib/db/playlistOps';

async function reorder(from: number, to: number) {
  if (!selected) return;
  const p = await loadPlaylist(selected.id);
  if (!p) return;
  p.exerciseIds = moveExerciseId(p.exerciseIds, from, to);
  await savePlaylist(p);
  await invalidateAll();
}
```

Und an `<PlaylistDetail ... onReorder={reorder} />` übergeben.

- [ ] **Step 3: Typecheck**

Run: `npm run check`
Expected: 0 errors.

- [ ] **Step 4: Manueller Test**

`/playlists` → Playlist mit ≥ 3 Übungen → Zeile greifen und an andere Position ziehen → Reihenfolge bleibt nach Reload erhalten.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/PlaylistDetail.svelte src/routes/playlists/+page.svelte
git commit -m "feat(playlists): drag to reorder exercises within a playlist"
```

---

## Task 17: Phase-B-Abschluss

**Files:**
- Modify: `README.md`
- (keine Code-Änderungen)

- [ ] **Step 1: Alle Tests ausführen**

Run: `npm run test:unit -- --run`
Expected: alle Unit-Tests grün (Server-Projekt).

- [ ] **Step 2: Typecheck + Build**

Run: `npm run check && npm run build`
Expected: 0 errors, 0 warnings, Build ok.

- [ ] **Step 3: Manueller End-to-End-Smoke-Test via Browser-use**

Dev-Server starten: `npm run dev` (im Hintergrund).

Dann im Hauptchat folgende Flows durchklicken (Browser-use öffnet `http://localhost:5173`):
1. `/` → Redirect auf `/draw`.
2. Sidebar: Klick auf Archiv → Grid.
3. Neue Übung zeichnen + speichern → in Archiv sichtbar + Thumbnail korrekt.
4. Archiv: Suche, Filter-Chip, Rename, Duplicate, Delete.
5. Sidebar: Playlists → "+" → Playlist anlegen → Übung zuordnen → Reihenfolge per Drag ändern → reload F5 → Zustand konsistent.

Dev-Server stoppen (Strg+C).

- [ ] **Step 4: Finaler Visual-Check gegen Stitch**

Alle drei Phase-B-Screens (Zeichnen mit geänderter Sidebar, Archiv, Playlists) gegen die Stitch-Mockups abgleichen. Bei groben Abweichungen (falsche Farben, verrutschte Blöcke, fehlende States) jetzt nachbessern; Pixel-Perfektion ist nicht das Ziel.

- [ ] **Step 5: README ergänzen**

In `README.md` unter dem Roadmap-Abschnitt bei Phase B ✓ setzen:

```
- Phase A ✓ Frontend Core (zeichnen, speichern)
- Phase B ✓ Archiv + Playlists
- Phase C — Übungen aus Archiv zum Bearbeiten laden
- Phase D — TV-Verbindung (QR + Pairing)
- Phase E — Polishing (Design-Icons, i18n, Onboarding)
```

- [ ] **Step 6: Abschluss-Commit**

```bash
git add README.md
git commit -m "docs: mark phase b as complete"
```

---

## Selbst-Review Checkliste (Done)

- **Spec-Coverage:** Navigation, Archiv (Grid + Thumbnail + Suche + Filter + CRUD), Playlists (Split-View + CRUD + Add/Remove + Reorder) — alle Ziele aus project-state.md Phase B abgedeckt.
- **Keine Platzhalter:** Jeder Schritt enthält vollständigen Code oder eindeutige Befehle.
- **Typkonsistenz:** `Playlist.exerciseIds: string[]`, `Exercise.id: string` — Helper-Signaturen (`addExerciseId`, `moveExerciseId`) und Aufrufe stimmen überein.
- **DB-Migration:** `.version(1)` + `.version(2)` erhalten — bestehende Übungen bleiben beim Upgrade.
- **Tests:** alle reinen Funktionen (pathToTabId, playlistOps) mit Vitest-Tests (colocation in `src/`), DB-Layer mit `fake-indexeddb/auto` wie in Phase A.
- **Drag-API:** HTML5 Drag-and-Drop native, keine neue Abhängigkeit.
- **Freies Feld für Follow-ups (nicht in Phase B):**
  - `/draw/:id` zum Bearbeiten existierender Übungen (= Phase C)
  - Playlist-Export, TV-Playback (= Phase D)
  - Automatisierte E2E-Tests via Browser-use-Skill (optional, wenn Flow stabil ist)
