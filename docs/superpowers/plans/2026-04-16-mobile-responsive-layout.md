# Mobile Responsive Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Macht die App auf Smartphone-Portrait bedienbar (Breakpoint 768px) — Sidebar → Bottom-Tab-Bar, Steps-Panel → Bottom-Sheet, Settings-Sub-Nav eingeklappt, Playlists-Split-View als State-Switch. Tablet- und Desktop-Layout bleiben unverändert.

**Architecture:** CSS-Media-Query-basiert (kein UA-Sniffing). Ein einziger Breakpoint `--bp-mobile: 768px` in `app.css`. Neue Komponenten für Mobile-Navigation (`MobileTabBar`, `MobileHeader`) koexistieren mit bestehender `Sidebar` — Umschaltung via CSS `display`. Bestehende Seiten-Komponenten (`StepsPanel`, Settings-Sub-Nav, Playlists) bekommen Mobile-CSS-Branches, keine Logik-Duplikate.

**Tech Stack:** SvelteKit 2, Svelte 5 (Runes), CSS-Media-Queries, Vitest (Unit-Tests colocation), browser-use (E2E), Paraglide i18n.

**Referenz-Spec:** `docs/superpowers/specs/2026-04-16-mobile-responsive-layout.md`

---

## File Structure

**Neue Dateien:**

- `src/lib/components/MobileTabBar.svelte` — Bottom-Tab-Bar für Mobile (4 Tabs: Zeichnen · Archiv · Listen · Mehr)
- `src/lib/components/MobileHeader.svelte` — Top-Header für Mobile (Titel · Back · TV-Dot)
- `src/lib/components/mobile-nav-utils.ts` — Pure Utilities (`pathToMobileTabId`, `resolveMobileHeader`)
- `src/lib/components/mobile-nav-utils.test.ts` — Unit-Tests für die Utilities
- `src/lib/components/steps-sheet-state.ts` — Pure State-Maschine für Bottom-Sheet (peek ↔ expanded)
- `src/lib/components/steps-sheet-state.test.ts` — Unit-Tests

**Geänderte Dateien:**

- `src/app.css` — `--bp-mobile`-Variable, Safe-Area-Utilities
- `src/lib/components/Sidebar.svelte` — CSS: `display: none` unter Breakpoint
- `src/lib/components/Toolbar.svelte` — CSS: TV-Button auf Mobile ausblenden, Name-Field schmaler
- `src/lib/components/StepsPanel.svelte` — Mobile-Bottom-Sheet-Branch (expanded/peek), CSS-Umbau
- `src/lib/components/DrawingView.svelte` — Layout-Container, `sheetExpanded`-State, Sheet overlay'd Canvas
- `src/routes/+layout.svelte` — Mobile-Header oben + Mobile-TabBar unten (unter Breakpoint)
- `src/routes/settings/+layout.svelte` — Sub-Nav ausblenden unter Breakpoint + `/settings` zeigt auf Mobile die Sub-Liste
- `src/routes/settings/+page.ts` — Mobile-Handling: kein Redirect auf `/settings/tv`, stattdessen leere Seite (oder Liste inline)
- `src/routes/settings/+page.svelte` — Auf Mobile: Liste der Sub-Seiten rendern (so dass `/settings` selbst sinnvoll ist)
- `src/routes/playlists/+page.svelte` — Mobile: State-Switch Liste ↔ Detail (Back-Button in Detail setzt `selectedId = null`)
- `src/routes/archive/+page.svelte` — Padding/Grid-Tuning für Mobile
- `messages/de.json`, `messages/en.json`, `messages/es.json` — neue Keys: `mobile_tab_more`, `mobile_header_back_aria`, `mobile_tv_dot_aria`, `mobile_sheet_toggle_aria`

---

## Task 1: CSS-Grundlagen — Breakpoint & Safe-Area

**Files:**
- Modify: `src/app.css`

- [ ] **Step 1: Breakpoint-Variable + Safe-Area-Utilities in `:root` ergänzen**

In `src/app.css`, füge am Ende des ersten `:root, :root[data-theme='dark']`-Blocks vor dem schließenden `}` hinzu (direkt nach `--transition-quick: 0.2s ease;`):

```css
  /* Mobile-Breakpoint (für Nutzung via @media (max-width: ...)) */
  --bp-mobile: 768px;
  --mobile-header-h: 52px;
  --mobile-tabbar-h: 56px;
```

Und am Ende der Datei (nach dem letzten Block) neuer Utility-Block:

```css
/* Safe-Area-Helper */
.safe-top { padding-top: env(safe-area-inset-top, 0); }
.safe-bottom { padding-bottom: env(safe-area-inset-bottom, 0); }
```

- [ ] **Step 2: Build prüfen**

Run: `cd ~/Developer/tt-playbook-trainer && npx vite build`
Expected: Build erfolgreich, keine CSS-Warnings.

- [ ] **Step 3: Commit**

```bash
cd ~/Developer/tt-playbook-trainer
git add src/app.css
git commit -m "style(css): add mobile breakpoint vars and safe-area utilities"
```

---

## Task 2: Sidebar unter Breakpoint ausblenden

**Files:**
- Modify: `src/lib/components/Sidebar.svelte:55-68`

- [ ] **Step 1: Media-Query an Sidebar-CSS anhängen**

In `src/lib/components/Sidebar.svelte` innerhalb des `<style>`-Blocks, direkt vor dem schließenden `</style>`:

```css
  @media (max-width: 767.98px) {
    .sidebar { display: none; }
  }
```

- [ ] **Step 2: Visuell prüfen (Viewport 375×812)**

Run: `cd ~/Developer/tt-playbook-trainer && npm run dev` (Background).
Im Browser (oder browser-use) DevTools auf 375×812 setzen, `/` öffnen.
Expected: Sidebar nicht sichtbar, Content fluffed sich über volle Breite. Tablet-Viewport (1024×768): Sidebar weiterhin sichtbar.

Stop dev-Server nach Check.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/Sidebar.svelte
git commit -m "style(sidebar): hide under mobile breakpoint"
```

---

## Task 3: Pure Utility — `pathToMobileTabId`

**Files:**
- Create: `src/lib/components/mobile-nav-utils.ts`
- Create: `src/lib/components/mobile-nav-utils.test.ts`

- [ ] **Step 1: Failing test schreiben**

Datei: `src/lib/components/mobile-nav-utils.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { pathToMobileTabId } from './mobile-nav-utils';

describe('pathToMobileTabId', () => {
  it('mapt / auf draw', () => {
    expect(pathToMobileTabId('/')).toBe('draw');
  });
  it('mapt /draw und /draw/:id auf draw', () => {
    expect(pathToMobileTabId('/draw')).toBe('draw');
    expect(pathToMobileTabId('/draw/abc')).toBe('draw');
  });
  it('mapt /archive auf archive', () => {
    expect(pathToMobileTabId('/archive')).toBe('archive');
  });
  it('mapt /playlists und /playlists/:id auf playlists', () => {
    expect(pathToMobileTabId('/playlists')).toBe('playlists');
    expect(pathToMobileTabId('/playlists/abc')).toBe('playlists');
  });
  it('mapt /settings und /settings/:sub auf more', () => {
    expect(pathToMobileTabId('/settings')).toBe('more');
    expect(pathToMobileTabId('/settings/tv')).toBe('more');
    expect(pathToMobileTabId('/settings/display')).toBe('more');
  });
  it('unbekannter Pfad → null', () => {
    expect(pathToMobileTabId('/foo')).toBeNull();
  });
});
```

- [ ] **Step 2: Test ausführen — FAIL erwartet**

Run: `cd ~/Developer/tt-playbook-trainer && npm run test:unit -- src/lib/components/mobile-nav-utils.test.ts --run`
Expected: FAIL ("Cannot find module './mobile-nav-utils'").

- [ ] **Step 3: Implementation schreiben**

Datei: `src/lib/components/mobile-nav-utils.ts`

```ts
export type MobileTabId = 'draw' | 'archive' | 'playlists' | 'more';

export function pathToMobileTabId(pathname: string): MobileTabId | null {
  if (pathname === '/' || pathname.startsWith('/draw')) return 'draw';
  if (pathname.startsWith('/archive')) return 'archive';
  if (pathname.startsWith('/playlists')) return 'playlists';
  if (pathname.startsWith('/settings')) return 'more';
  return null;
}
```

- [ ] **Step 4: Test ausführen — PASS erwartet**

Run: `npm run test:unit -- src/lib/components/mobile-nav-utils.test.ts --run`
Expected: 6/6 PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/mobile-nav-utils.ts src/lib/components/mobile-nav-utils.test.ts
git commit -m "feat(mobile-nav): add pathToMobileTabId pure utility"
```

---

## Task 4: Pure Utility — `resolveMobileHeader`

**Files:**
- Modify: `src/lib/components/mobile-nav-utils.ts`
- Modify: `src/lib/components/mobile-nav-utils.test.ts`

- [ ] **Step 1: Failing tests für `resolveMobileHeader` anhängen**

Ans Ende von `src/lib/components/mobile-nav-utils.test.ts` anfügen:

```ts
import { resolveMobileHeader } from './mobile-nav-utils';

describe('resolveMobileHeader', () => {
  it('Root-Routen ohne Back-Button', () => {
    expect(resolveMobileHeader('/draw')).toEqual({ titleKey: 'mobile_header_draw', showBack: false, backHref: null });
    expect(resolveMobileHeader('/archive')).toEqual({ titleKey: 'mobile_header_archive', showBack: false, backHref: null });
    expect(resolveMobileHeader('/playlists')).toEqual({ titleKey: 'mobile_header_playlists', showBack: false, backHref: null });
    expect(resolveMobileHeader('/settings')).toEqual({ titleKey: 'mobile_header_settings', showBack: false, backHref: null });
  });

  it('Settings-Sub-Seiten: Back zu /settings', () => {
    expect(resolveMobileHeader('/settings/tv')).toEqual({ titleKey: 'settings_nav_tv', showBack: true, backHref: '/settings' });
    expect(resolveMobileHeader('/settings/display')).toEqual({ titleKey: 'settings_nav_display', showBack: true, backHref: '/settings' });
    expect(resolveMobileHeader('/settings/account')).toEqual({ titleKey: 'settings_nav_account', showBack: true, backHref: '/settings' });
    expect(resolveMobileHeader('/settings/language')).toEqual({ titleKey: 'settings_nav_language', showBack: true, backHref: '/settings' });
    expect(resolveMobileHeader('/settings/pro')).toEqual({ titleKey: 'settings_nav_pro', showBack: true, backHref: '/settings' });
    expect(resolveMobileHeader('/settings/about')).toEqual({ titleKey: 'settings_nav_about', showBack: true, backHref: '/settings' });
  });

  it('Draw mit ID: Back zu /archive', () => {
    expect(resolveMobileHeader('/draw/abc-123')).toEqual({ titleKey: 'mobile_header_draw', showBack: true, backHref: '/archive' });
  });

  it('Unbekannt: ohne Back, leerer Titel', () => {
    expect(resolveMobileHeader('/foo')).toEqual({ titleKey: null, showBack: false, backHref: null });
  });
});
```

- [ ] **Step 2: Tests ausführen — FAIL erwartet**

Run: `npm run test:unit -- src/lib/components/mobile-nav-utils.test.ts --run`
Expected: FAIL (`resolveMobileHeader` nicht exportiert).

- [ ] **Step 3: Implementation anhängen**

Ans Ende von `src/lib/components/mobile-nav-utils.ts`:

```ts
export interface MobileHeaderInfo {
  titleKey: string | null;
  showBack: boolean;
  backHref: string | null;
}

const SETTINGS_SUB_MAP: Record<string, string> = {
  '/settings/account': 'settings_nav_account',
  '/settings/language': 'settings_nav_language',
  '/settings/tv': 'settings_nav_tv',
  '/settings/display': 'settings_nav_display',
  '/settings/pro': 'settings_nav_pro',
  '/settings/about': 'settings_nav_about',
};

export function resolveMobileHeader(pathname: string): MobileHeaderInfo {
  // /draw/:id — Zeichnen mit Back zum Archiv
  if (pathname.startsWith('/draw/') && pathname.length > '/draw/'.length) {
    return { titleKey: 'mobile_header_draw', showBack: true, backHref: '/archive' };
  }
  if (pathname === '/' || pathname === '/draw') {
    return { titleKey: 'mobile_header_draw', showBack: false, backHref: null };
  }
  if (pathname === '/archive') {
    return { titleKey: 'mobile_header_archive', showBack: false, backHref: null };
  }
  if (pathname === '/playlists') {
    return { titleKey: 'mobile_header_playlists', showBack: false, backHref: null };
  }
  if (pathname === '/settings') {
    return { titleKey: 'mobile_header_settings', showBack: false, backHref: null };
  }
  if (SETTINGS_SUB_MAP[pathname]) {
    return { titleKey: SETTINGS_SUB_MAP[pathname], showBack: true, backHref: '/settings' };
  }
  return { titleKey: null, showBack: false, backHref: null };
}
```

- [ ] **Step 4: Tests ausführen — PASS erwartet**

Run: `npm run test:unit -- src/lib/components/mobile-nav-utils.test.ts --run`
Expected: Alle Tests (inkl. neue resolveMobileHeader-Tests) PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/mobile-nav-utils.ts src/lib/components/mobile-nav-utils.test.ts
git commit -m "feat(mobile-nav): add resolveMobileHeader pure utility"
```

---

## Task 5: i18n-Keys für Mobile-Chrome ergänzen

**Files:**
- Modify: `messages/de.json`
- Modify: `messages/en.json`
- Modify: `messages/es.json`

- [ ] **Step 1: DE-Keys anhängen**

In `messages/de.json`, vor dem schließenden `}` (nach dem letzten bestehenden Key):

```json
  "mobile_header_draw": "Übung",
  "mobile_header_archive": "Archiv",
  "mobile_header_playlists": "Trainingslisten",
  "mobile_header_settings": "Einstellungen",
  "mobile_header_back_aria": "Zurück",
  "mobile_tv_dot_aria_paired": "TV verbunden",
  "mobile_tv_dot_aria_unpaired": "TV nicht verbunden",
  "mobile_tab_more": "Mehr",
  "mobile_sheet_toggle_aria": "Details anzeigen oder ausblenden"
```

(Achtung: im JSON vorigen Eintrag ein Komma ergänzen, falls nicht vorhanden.)

- [ ] **Step 2: EN-Keys anhängen**

In `messages/en.json` analog:

```json
  "mobile_header_draw": "Exercise",
  "mobile_header_archive": "Archive",
  "mobile_header_playlists": "Training lists",
  "mobile_header_settings": "Settings",
  "mobile_header_back_aria": "Back",
  "mobile_tv_dot_aria_paired": "TV connected",
  "mobile_tv_dot_aria_unpaired": "TV not connected",
  "mobile_tab_more": "More",
  "mobile_sheet_toggle_aria": "Show or hide details"
```

- [ ] **Step 3: ES-Keys anhängen**

In `messages/es.json` analog:

```json
  "mobile_header_draw": "Ejercicio",
  "mobile_header_archive": "Archivo",
  "mobile_header_playlists": "Listas de entrenamiento",
  "mobile_header_settings": "Ajustes",
  "mobile_header_back_aria": "Atrás",
  "mobile_tv_dot_aria_paired": "TV conectada",
  "mobile_tv_dot_aria_unpaired": "TV no conectada",
  "mobile_tab_more": "Más",
  "mobile_sheet_toggle_aria": "Mostrar u ocultar detalles"
```

- [ ] **Step 4: Paraglide-Regenerate via Build**

Run: `cd ~/Developer/tt-playbook-trainer && npx vite build`
Expected: Build erfolgreich, `src/lib/paraglide/messages.js` enthält neue Keys.

- [ ] **Step 5: Commit**

```bash
git add messages/de.json messages/en.json messages/es.json
git commit -m "i18n: add mobile chrome strings (tab bar, header, tv dot, sheet toggle)"
```

---

## Task 6: `MobileTabBar.svelte` — Komponente

**Files:**
- Create: `src/lib/components/MobileTabBar.svelte`

- [ ] **Step 1: Komponente schreiben**

Datei: `src/lib/components/MobileTabBar.svelte`

```svelte
<script lang="ts">
  import { page } from '$app/stores';
  import { pathToMobileTabId, type MobileTabId } from './mobile-nav-utils';
  import DrawIcon from '$lib/icons/DrawIcon.svelte';
  import ArchiveIcon from '$lib/icons/ArchiveIcon.svelte';
  import PlaylistIcon from '$lib/icons/PlaylistIcon.svelte';
  import MoreIcon from '$lib/icons/MoreIcon.svelte';
  import { m } from '$lib/paraglide/messages';
  import type { Component } from 'svelte';

  const tabs: Array<{ id: MobileTabId; href: string; label: string; icon: Component }> = [
    { id: 'draw', href: '/draw', label: m.sidebar_tab_draw(), icon: DrawIcon },
    { id: 'archive', href: '/archive', label: m.sidebar_tab_archive(), icon: ArchiveIcon },
    { id: 'playlists', href: '/playlists', label: m.sidebar_tab_playlists(), icon: PlaylistIcon },
    { id: 'more', href: '/settings', label: m.mobile_tab_more(), icon: MoreIcon },
  ];

  let activeTab = $derived(pathToMobileTabId($page.url.pathname));
</script>

<nav class="tabbar" aria-label="Mobile Navigation">
  {#each tabs as tab (tab.id)}
    {@const Icon = tab.icon}
    <a
      href={tab.href}
      class="tab"
      class:active={activeTab === tab.id}
      aria-current={activeTab === tab.id ? 'page' : undefined}
    >
      <span class="tab-icon"><Icon /></span>
      <span class="tab-label">{tab.label}</span>
    </a>
  {/each}
</nav>

<style>
  .tabbar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    height: calc(var(--mobile-tabbar-h) + env(safe-area-inset-bottom, 0));
    padding-bottom: env(safe-area-inset-bottom, 0);
    background: var(--bg-glass-strong);
    backdrop-filter: blur(40px) saturate(180%);
    -webkit-backdrop-filter: blur(40px) saturate(180%);
    border-top: 1px solid var(--color-border);
    display: flex;
    justify-content: space-around;
    align-items: stretch;
    z-index: 40;
  }
  .tab {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    color: var(--color-text-tertiary);
    text-decoration: none;
    font-size: 11px;
    font-weight: 500;
    padding: 6px 4px;
    transition: color var(--transition-quick), transform 0.15s ease;
  }
  .tab:active {
    transform: scale(0.92);
  }
  .tab.active {
    color: var(--color-accent);
  }
  .tab-icon {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .tab-label {
    line-height: 1;
  }

  @media (min-width: 768px) {
    .tabbar { display: none; }
  }
</style>
```

- [ ] **Step 2: Type-Check**

Run: `cd ~/Developer/tt-playbook-trainer && npm run check`
Expected: 0 errors, 0 warnings.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/MobileTabBar.svelte
git commit -m "feat(mobile): add MobileTabBar component"
```

---

## Task 7: `MobileHeader.svelte` — Komponente

**Files:**
- Create: `src/lib/components/MobileHeader.svelte`

- [ ] **Step 1: Komponente schreiben**

Datei: `src/lib/components/MobileHeader.svelte`

```svelte
<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { resolveMobileHeader } from './mobile-nav-utils';
  import { tvSession } from '$lib/tv/session.svelte';
  import { m } from '$lib/paraglide/messages';

  let info = $derived(resolveMobileHeader($page.url.pathname));
  let tvPaired = $derived(tvSession.status === 'paired');

  function title(): string {
    if (!info.titleKey) return '';
    // Lookup via Paraglide — Keys sind bekannt, aber dynamischer Zugriff über Record
    const keys: Record<string, () => string> = {
      mobile_header_draw: m.mobile_header_draw,
      mobile_header_archive: m.mobile_header_archive,
      mobile_header_playlists: m.mobile_header_playlists,
      mobile_header_settings: m.mobile_header_settings,
      settings_nav_account: m.settings_nav_account,
      settings_nav_language: m.settings_nav_language,
      settings_nav_tv: m.settings_nav_tv,
      settings_nav_display: m.settings_nav_display,
      settings_nav_pro: m.settings_nav_pro,
      settings_nav_about: m.settings_nav_about,
    };
    return keys[info.titleKey]?.() ?? '';
  }

  function handleBack() {
    if (info.backHref) goto(info.backHref);
  }

  function handleTvTap() {
    goto('/settings/tv');
  }
</script>

<header class="m-header">
  <div class="left">
    {#if info.showBack}
      <button
        type="button"
        class="back"
        aria-label={m.mobile_header_back_aria()}
        onclick={handleBack}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 6 9 12 15 18"></polyline>
        </svg>
      </button>
    {/if}
  </div>

  <h1 class="title">{title()}</h1>

  <div class="right">
    <button
      type="button"
      class="tv-dot"
      class:paired={tvPaired}
      onclick={handleTvTap}
      aria-label={tvPaired ? m.mobile_tv_dot_aria_paired() : m.mobile_tv_dot_aria_unpaired()}
    ></button>
  </div>
</header>

<style>
  .m-header {
    position: sticky;
    top: 0;
    height: calc(var(--mobile-header-h) + env(safe-area-inset-top, 0));
    padding-top: env(safe-area-inset-top, 0);
    background: var(--bg-glass-strong);
    backdrop-filter: blur(40px) saturate(180%);
    -webkit-backdrop-filter: blur(40px) saturate(180%);
    border-bottom: 1px solid var(--color-border);
    display: flex;
    align-items: center;
    padding-left: 8px;
    padding-right: 14px;
    z-index: 30;
  }
  .left, .right {
    width: 44px;
    display: flex;
    align-items: center;
  }
  .right { justify-content: flex-end; }

  .back {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-button);
    color: var(--color-text-primary);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .back:active { background: var(--bg-glass-hover); }

  .title {
    flex: 1;
    text-align: center;
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tv-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--color-text-tertiary);
    padding: 0;
  }
  .tv-dot.paired {
    background: var(--color-success);
    box-shadow: 0 0 6px var(--color-success);
  }

  @media (min-width: 768px) {
    .m-header { display: none; }
  }
</style>
```

- [ ] **Step 2: Type-Check**

Run: `npm run check`
Expected: 0 errors, 0 warnings.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/MobileHeader.svelte
git commit -m "feat(mobile): add MobileHeader component"
```

---

## Task 8: Root-Layout — Mobile-Chrome einbinden

**Files:**
- Modify: `src/routes/+layout.svelte`

- [ ] **Step 1: Imports + Rendering erweitern**

In `src/routes/+layout.svelte`, in den `<script>`-Imports ergänzen (nach Zeile 7, nach `import Sidebar`):

```ts
  import MobileTabBar from '$lib/components/MobileTabBar.svelte';
  import MobileHeader from '$lib/components/MobileHeader.svelte';
```

Im Template, den Block

```svelte
<div class="app-root">
  {#if !hideChrome}<Sidebar />{/if}
  <main class="content">
    {@render children()}
  </main>
</div>
```

ersetzen durch:

```svelte
<div class="app-root">
  {#if !hideChrome}<Sidebar />{/if}
  <div class="main-col">
    {#if !hideChrome}<MobileHeader />{/if}
    <main class="content">
      {@render children()}
    </main>
    {#if !hideChrome}<MobileTabBar />{/if}
  </div>
</div>
```

Im `<style>` den `.content`-Block ergänzen und `.main-col` hinzufügen:

```css
  .main-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-width: 0;
  }

  .content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  @media (max-width: 767.98px) {
    .content {
      padding-bottom: calc(var(--mobile-tabbar-h) + env(safe-area-inset-bottom, 0));
    }
  }
```

- [ ] **Step 2: Type-Check + Build**

Run: `npm run check && npx vite build`
Expected: 0 errors, Build erfolgreich.

- [ ] **Step 3: Visueller Check**

Run: `npm run dev` (Background).
Browser (oder browser-use) Viewport 375×812 öffnen → `/draw`.
Expected: Oben Header mit Titel „Übung" + TV-Dot rechts. Unten TabBar mit 4 Tabs. Content zwischendrin. Tablet 1024: nur Sidebar, keine Mobile-Chrome.
Check `/tv`: weder Sidebar noch Mobile-Chrome (hideChrome-Guard).

Stop dev-server.

- [ ] **Step 4: Commit**

```bash
git add src/routes/+layout.svelte
git commit -m "feat(layout): wire mobile header and tabbar into root layout"
```

---

## Task 9: Toolbar Mobile — TV-Button raus, Name-Field flexibler

**Files:**
- Modify: `src/lib/components/Toolbar.svelte`

- [ ] **Step 1: CSS-Anpassungen anhängen**

In `src/lib/components/Toolbar.svelte`, vor dem schließenden `</style>`:

```css
  @media (max-width: 767.98px) {
    .toolbar {
      height: 52px;
      padding: 0 10px;
      gap: 8px;
    }
    .name-field {
      max-width: none;
      font-size: 14px;
      height: 36px;
    }
    .tv-btn {
      display: none;
    }
    .btn {
      height: 36px;
      padding: 0 12px;
      font-size: 13px;
    }
    .btn-secondary :global(span) {
      display: none;
    }
  }
```

(Die letzte Regel blendet das "Neu"-Label aus, Icon bleibt — spart Platz.)

- [ ] **Step 2: Visueller Check**

Run: `npm run dev`. Browser 375×812 → `/draw`.
Expected: Toolbar schlank, nur Name-Field + Icon-Button („+") + „Speichern". TV-Button weg (Status wandert in Header-Dot).

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/Toolbar.svelte
git commit -m "style(toolbar): compact layout on mobile, hide tv button"
```

---

## Task 10: Bottom-Sheet-State — Pure Utility

**Files:**
- Create: `src/lib/components/steps-sheet-state.ts`
- Create: `src/lib/components/steps-sheet-state.test.ts`

- [ ] **Step 1: Failing tests schreiben**

Datei: `src/lib/components/steps-sheet-state.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { nextSheetState, type SheetState } from './steps-sheet-state';

describe('nextSheetState', () => {
  it('toggle: peek → expanded', () => {
    expect(nextSheetState('peek', 'toggle')).toBe('expanded');
  });
  it('toggle: expanded → peek', () => {
    expect(nextSheetState('expanded', 'toggle')).toBe('peek');
  });
  it('open: peek → expanded', () => {
    expect(nextSheetState('peek', 'open')).toBe('expanded');
  });
  it('open: expanded bleibt', () => {
    expect(nextSheetState('expanded', 'open')).toBe('expanded');
  });
  it('close: expanded → peek', () => {
    expect(nextSheetState('expanded', 'close')).toBe('peek');
  });
  it('close: peek bleibt', () => {
    expect(nextSheetState('peek', 'close')).toBe('peek');
  });
});

describe('SheetState type', () => {
  it('nur peek und expanded sind gültig', () => {
    const peek: SheetState = 'peek';
    const expanded: SheetState = 'expanded';
    expect(peek).toBe('peek');
    expect(expanded).toBe('expanded');
  });
});
```

- [ ] **Step 2: Tests ausführen — FAIL erwartet**

Run: `npm run test:unit -- src/lib/components/steps-sheet-state.test.ts --run`
Expected: FAIL (Modul fehlt).

- [ ] **Step 3: Implementation schreiben**

Datei: `src/lib/components/steps-sheet-state.ts`

```ts
export type SheetState = 'peek' | 'expanded';
export type SheetAction = 'toggle' | 'open' | 'close';

export function nextSheetState(current: SheetState, action: SheetAction): SheetState {
  switch (action) {
    case 'open':
      return 'expanded';
    case 'close':
      return 'peek';
    case 'toggle':
      return current === 'peek' ? 'expanded' : 'peek';
  }
}
```

- [ ] **Step 4: Tests ausführen — PASS erwartet**

Run: `npm run test:unit -- src/lib/components/steps-sheet-state.test.ts --run`
Expected: 7/7 PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/steps-sheet-state.ts src/lib/components/steps-sheet-state.test.ts
git commit -m "feat(steps-sheet): pure state machine for peek/expanded"
```

---

## Task 11: StepsPanel → Bottom-Sheet auf Mobile

**Files:**
- Modify: `src/lib/components/StepsPanel.svelte`

- [ ] **Step 1: Props + State erweitern**

In `src/lib/components/StepsPanel.svelte`, im `<script>`:

- Import ergänzen:
  ```ts
  import { currentExercise } from '$lib/stores/currentExercise.svelte';
  import { getStrokeColor } from '$lib/constants/colors';
  import StrokeTypeButtons from './StrokeTypeButtons.svelte';
  import UndoIcon from '$lib/icons/UndoIcon.svelte';
  import { isStrokeTypeCode, type StrokeTypeCode } from '$lib/constants/strokeTypes';
  import { strokeTypeLabel } from '$lib/i18n/stroke-type-labels';
  import { m } from '$lib/paraglide/messages';
  import type { SheetState } from './steps-sheet-state';
  ```

- `Props`-Interface erweitern:
  ```ts
  interface Props {
    selectedStrokeId: string | null;
    onSelectStroke?: (id: string | null) => void;
    onDeleteStroke?: (id: string) => void;
    onUndo?: () => void;
    canUndo?: boolean;
    sheetState?: SheetState;
    onSheetToggle?: () => void;
  }
  ```

- Props destrukturieren:
  ```ts
  let {
    selectedStrokeId,
    onSelectStroke,
    onDeleteStroke,
    onUndo,
    canUndo = false,
    sheetState = 'peek',
    onSheetToggle,
  }: Props = $props();
  ```

- [ ] **Step 2: Template erweitern — Peek-Row + Handle**

Den gesamten `<aside class="panel">`-Block ersetzen durch:

```svelte
<aside
  class="panel"
  class:sheet-peek={sheetState === 'peek'}
  class:sheet-expanded={sheetState === 'expanded'}
>
  <button
    type="button"
    class="handle-row"
    onclick={() => onSheetToggle?.()}
    aria-label={m.mobile_sheet_toggle_aria()}
  >
    <span class="handle"></span>
    <span class="peek-summary">
      <span class="peek-name">{currentExercise.exercise.name || m.toolbar_exercise_name_placeholder()}</span>
      <span class="peek-meta">
        {#if currentExercise.exercise.repetitions}<span class="chip">{currentExercise.exercise.repetitions}×</span>{/if}
        {#if currentExercise.exercise.duration}<span class="chip">{currentExercise.exercise.duration}</span>{/if}
        <span class="chip">{currentExercise.exercise.strokes.length === 1 ? m.exercise_meta_strokes_one({ count: 1 }) : m.exercise_meta_strokes_other({ count: currentExercise.exercise.strokes.length })}</span>
      </span>
    </span>
  </button>

  <div class="sheet-body">
    <header class="panel-header">
      <h2>{m.steps_header()}</h2>
      <button
        type="button"
        class="undo-btn"
        disabled={!canUndo}
        onclick={() => onUndo?.()}
        aria-label={m.toolbar_undo_aria()}
        title={m.toolbar_undo_aria()}
      >
        <UndoIcon size={15} />
        <span>{m.toolbar_undo()}</span>
      </button>
    </header>

    <div class="steps">
      {#each currentExercise.exercise.strokes as stroke (stroke.id)}
        <div
          class="step"
          class:selected={selectedStrokeId === stroke.id}
          role="button"
          tabindex="0"
          style:--step-color={getStrokeColor(stroke.number)}
          onclick={() => onSelectStroke?.(stroke.id)}
          onkeydown={(e) => e.key === 'Enter' && onSelectStroke?.(stroke.id)}
        >
          <span class="step-dot">
            {stroke.number}
          </span>
          <div class="step-body">
            {#if selectedStrokeId === stroke.id}
              <StrokeTypeButtons
                activeType={stroke.strokeType}
                onSelect={setType}
              />
            {:else if stroke.strokeType}
              <span class="step-type">{tagLabel(stroke.strokeType)}</span>
            {/if}
            <textarea
              class="step-desc"
              placeholder={m.steps_freetext_placeholder()}
              rows="1"
              data-desc-id={stroke.id}
              value={stroke.description ?? ''}
              oninput={(e) => setDescription(e, stroke.id)}
            ></textarea>
          </div>
          <button
            type="button"
            class="delete"
            aria-label={m.steps_delete_aria()}
            onclick={(e) => {
              e.stopPropagation();
              onDeleteStroke?.(stroke.id);
            }}
          >×</button>
        </div>
      {/each}

      {#if currentExercise.exercise.strokes.length === 0}
        <p class="hint">{m.draw_hint_empty()}</p>
      {/if}
    </div>

    <footer class="meta">
      <div class="field">
        <span class="field-label">{m.steps_label_repeats()}</span>
        <div class="presets">
          {#each [5, 10, 15, 20] as n (n)}
            <button
              type="button"
              class="preset"
              class:active={currentExercise.exercise.repetitions === n}
              onclick={() => (currentExercise.exercise.repetitions = n)}
            >
              {n}
            </button>
          {/each}
          <input
            type="number"
            min="1"
            class="preset-input"
            placeholder={m.steps_select_placeholder()}
            bind:value={currentExercise.exercise.repetitions}
          />
        </div>
      </div>

      <div class="field">
        <span class="field-label">{m.steps_label_duration()}</span>
        <div class="presets">
          {#each ['5 min', '10 min', '15 min'] as d (d)}
            <button
              type="button"
              class="preset"
              class:active={currentExercise.exercise.duration === d}
              onclick={() => (currentExercise.exercise.duration = d)}
            >
              {d}
            </button>
          {/each}
          <input
            type="text"
            class="preset-input"
            placeholder={m.steps_select_placeholder()}
            bind:value={currentExercise.exercise.duration}
          />
        </div>
      </div>
    </footer>
  </div>
</aside>
```

- [ ] **Step 3: CSS anpassen — Mobile-Sheet-Varianten**

Den `<style>`-Block vollständig ersetzen durch:

```css
  .panel {
    width: 320px;
    height: 100%;
    background: var(--bg-glass);
    backdrop-filter: blur(40px) saturate(180%);
    -webkit-backdrop-filter: blur(40px) saturate(180%);
    border-left: 1px solid var(--color-border);
    box-shadow: inset 1px 0 0 rgba(255, 255, 255, 0.04);
    display: flex;
    flex-direction: column;
  }

  /* Handle-Row nur Mobile sichtbar */
  .handle-row {
    display: none;
  }

  .panel-header {
    padding: 16px 16px 8px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  h2 {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .undo-btn {
    height: 30px;
    padding: 0 10px;
    border-radius: var(--radius-button);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 500;
    color: var(--color-text-secondary);
    background: transparent;
    border: 1px solid var(--color-border);
    transition: background var(--transition-quick), color var(--transition-quick), transform 0.15s ease;
  }
  .undo-btn:hover:not(:disabled) {
    background: var(--bg-glass-hover);
    color: var(--color-text-primary);
  }
  .undo-btn:active:not(:disabled) {
    transform: scale(0.92);
  }
  .undo-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .sheet-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .steps {
    flex: 1;
    overflow-y: auto;
    padding: 8px 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .step {
    display: flex;
    gap: 10px;
    padding: 10px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: var(--radius-card);
    cursor: pointer;
    transition: background var(--transition-quick), transform 0.15s ease, box-shadow var(--transition-quick);
  }

  .step:hover {
    background: rgba(255, 255, 255, 0.07);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  .step:active {
    transform: translateY(0);
  }

  .step.selected {
    outline: 1.5px solid var(--step-color);
    background: rgba(255, 255, 255, 0.06);
  }

  .step-dot {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--step-color);
    color: #000;
    font-size: 12px;
    font-weight: 700;
    flex-shrink: 0;
  }

  .step-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }

  .step-type {
    align-self: flex-start;
    padding: 2px 8px;
    background: var(--bg-surface);
    border-radius: 999px;
    color: var(--color-text-secondary);
    font-size: 11px;
    font-weight: 500;
  }

  .step-desc {
    width: 100%;
    resize: none;
    background: transparent;
    border: none;
    color: var(--color-text-primary);
    font-size: 13px;
    outline: none;
    padding: 0;
  }

  .step-desc::placeholder {
    color: var(--color-text-tertiary);
  }

  .delete {
    width: 24px;
    height: 24px;
    color: var(--color-text-tertiary);
    font-size: 18px;
    align-self: flex-start;
    flex-shrink: 0;
    transition: color var(--transition-quick);
  }

  .delete:hover {
    color: #ff453a;
  }

  .hint {
    color: var(--color-text-tertiary);
    font-size: 13px;
    padding: 12px;
    text-align: center;
  }

  .meta {
    padding: 16px 20px 20px;
    border-top: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .field-label {
    color: var(--color-text-secondary);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .presets {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .preset {
    min-width: 40px;
    height: 32px;
    padding: 0 10px;
    background: var(--bg-elevated);
    color: var(--color-text-primary);
    border-radius: var(--radius-button);
    font-size: 13px;
    font-weight: 500;
    transition: background var(--transition-quick), color var(--transition-quick);
  }

  .preset:hover {
    background: var(--color-chip-bg);
  }

  .preset.active {
    background: var(--color-accent);
    color: #fff;
  }

  .preset-input {
    flex: 1;
    min-width: 60px;
    height: 32px;
    padding: 0 10px;
    background: var(--bg-elevated);
    color: var(--color-text-primary);
    border: none;
    border-radius: var(--radius-button);
    outline: none;
    font-size: 13px;
  }

  .preset-input:focus {
    outline: 1.5px solid var(--color-accent);
  }

  .preset-input::placeholder {
    color: var(--color-text-tertiary);
  }

  /* Mobile: Panel → Bottom-Sheet */
  @media (max-width: 767.98px) {
    .panel {
      position: fixed;
      left: 0;
      right: 0;
      bottom: calc(var(--mobile-tabbar-h) + env(safe-area-inset-bottom, 0));
      width: auto;
      height: auto;
      max-height: 60vh;
      border-left: none;
      border-top: 1px solid var(--color-border);
      border-radius: 16px 16px 0 0;
      background: var(--bg-glass-strong);
      z-index: 20;
      transition: max-height 0.25s ease;
    }
    .panel.sheet-peek {
      max-height: 72px;
      overflow: hidden;
    }
    .panel.sheet-expanded {
      max-height: 60vh;
    }
    .handle-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 14px 6px;
      background: transparent;
      border: none;
      color: inherit;
      text-align: left;
      width: 100%;
    }
    .handle {
      width: 36px;
      height: 4px;
      border-radius: 2px;
      background: var(--color-text-tertiary);
      opacity: 0.5;
      flex-shrink: 0;
    }
    .peek-summary {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }
    .peek-name {
      font-size: 13px;
      font-weight: 600;
      color: var(--color-text-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .peek-meta {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .chip {
      background: var(--color-chip-bg);
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 11px;
      color: var(--color-text-secondary);
      line-height: 1.4;
    }
    .panel.sheet-peek .sheet-body {
      display: none;
    }
    .panel.sheet-expanded .sheet-body {
      display: flex;
      overflow-y: auto;
    }
  }
```

- [ ] **Step 4: Type-Check + Build**

Run: `npm run check && npx vite build`
Expected: 0 errors, Build erfolgreich.

- [ ] **Step 5: Unit-Tests laufen lassen (Regression)**

Run: `npm run test:unit -- --run`
Expected: Alle Tests grün (keine Regression).

- [ ] **Step 6: Commit**

```bash
git add src/lib/components/StepsPanel.svelte
git commit -m "feat(steps-panel): mobile bottom-sheet with peek/expanded states"
```

---

## Task 12: DrawingView — Sheet-State integrieren

**Files:**
- Modify: `src/lib/components/DrawingView.svelte`

- [ ] **Step 1: Sheet-State + Auto-Expand-Logik einbauen**

In `src/lib/components/DrawingView.svelte`, im `<script>` nach den Imports:

- Import ergänzen:
  ```ts
  import { nextSheetState, type SheetState } from './steps-sheet-state';
  ```

- State ergänzen (nach `let paywallOpen = $state(false);`):
  ```ts
  let sheetState = $state<SheetState>('peek');

  // Auf Mobile: Sheet öffnet auto wenn ein Stroke selektiert wird
  $effect(() => {
    if (!selectedStrokeId) return;
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(max-width: 767.98px)').matches) {
      sheetState = nextSheetState(sheetState, 'open');
    }
  });

  function toggleSheet() {
    sheetState = nextSheetState(sheetState, 'toggle');
  }
  ```

- [ ] **Step 2: Props an StepsPanel durchreichen**

Das `<StepsPanel ... />` im Template ersetzen durch:

```svelte
  <StepsPanel
    selectedStrokeId={selectedStrokeId}
    onSelectStroke={(id) => (selectedStrokeId = id)}
    onDeleteStroke={handleDeleteStroke}
    onUndo={handleUndo}
    canUndo={currentExercise.exercise.strokes.length > 0}
    sheetState={sheetState}
    onSheetToggle={toggleSheet}
  />
```

- [ ] **Step 3: Layout-CSS — Mobile-Canvas volle Breite, Sheet overlay'd**

Den `<style>`-Block am Ende ergänzen (vor `</style>`):

```css
  @media (max-width: 767.98px) {
    .layout {
      flex-direction: column;
    }
    .canvas-area {
      flex: 1;
      /* Sheet overlay'd — Canvas-Höhe bleibt konstant mit Peek unten */
      padding-bottom: 72px;
    }
  }
```

- [ ] **Step 4: Type-Check + Build**

Run: `npm run check && npx vite build`
Expected: 0 errors.

- [ ] **Step 5: Visueller Check (Viewport 375×812)**

Run: `npm run dev`. Browser 375×812 → `/draw`.
Expected:
- Canvas groß, Tisch gut sichtbar (keine 10px mehr)
- Bottom-Sheet als Peek sichtbar (Handle + Name + Meta-Chips)
- Tap auf Peek → Sheet öffnet auf ~60vh
- Tap nochmal → schließt
- Pfeil zeichnen → Sheet öffnet auto
- Tab-Bar ganz unten, Header oben mit TV-Dot

- [ ] **Step 6: Commit**

```bash
git add src/lib/components/DrawingView.svelte
git commit -m "feat(drawing): wire steps bottom-sheet state for mobile"
```

---

## Task 13: Settings-Sub-Nav Mobile ausblenden + `/settings` als Liste

**Files:**
- Modify: `src/routes/settings/+layout.svelte`
- Modify: `src/routes/settings/+page.svelte`
- Modify: `src/routes/settings/+page.ts` (falls vorhanden — sonst neu erstellen)

- [ ] **Step 1: Prüfen ob `+page.ts` existiert**

Run: `ls ~/Developer/tt-playbook-trainer/src/routes/settings/+page.ts 2>/dev/null`
Wenn vorhanden: Inhalt lesen (enthält vermutlich Redirect auf `/settings/tv`).

- [ ] **Step 2: Redirect auf Mobile nicht ausführen**

Falls `+page.ts` einen globalen Redirect hat, ändere ihn so, dass er nur auf Tablet+ redirected. Aber SvelteKit-Loads laufen serverseitig — Viewport ist da nicht bekannt.

**Einfacher:** Redirect komplett entfernen. `/settings` wird zur eigenständigen Seite mit Liste der Sub-Einträge. Auf Tablet sieht der User die Liste links (Sub-Nav) + rechts die Haupt-Liste — das ist OK, funktioniert aber etwas redundant.

**Besser:** Auf Tablet+ hat das Sub-Nav-Layout bereits alle Items links sichtbar → `/settings` selbst kann auf Tablet einen „bitte wähle aus der Liste"-Hinweis zeigen, auf Mobile eine funktionale Liste.

Falls `+page.ts` existiert und redirected: Datei löschen.
```bash
rm ~/Developer/tt-playbook-trainer/src/routes/settings/+page.ts
```

(Falls `+page.ts` NICHT existiert: Schritt überspringen.)

- [ ] **Step 3: i18n-Key für den Tablet-Hinweis**

Anfügen in `messages/de.json`:
```json
  "settings_hint_pick_left": "Bitte einen Bereich aus der Liste links wählen."
```

`messages/en.json`:
```json
  "settings_hint_pick_left": "Please pick a section from the list on the left."
```

`messages/es.json`:
```json
  "settings_hint_pick_left": "Elige una sección de la lista a la izquierda."
```

- [ ] **Step 4: `/settings/+page.svelte` als Mobile-Liste + Tablet-Hinweis**

Datei: `src/routes/settings/+page.svelte` (überschreiben)

```svelte
<script lang="ts">
  import { m } from '$lib/paraglide/messages';

  const items = [
    { href: '/settings/account', label: m.settings_nav_account() },
    { href: '/settings/language', label: m.settings_nav_language() },
    { href: '/settings/tv', label: m.settings_nav_tv() },
    { href: '/settings/display', label: m.settings_nav_display() },
    { href: '/settings/pro', label: m.settings_nav_pro() },
    { href: '/settings/about', label: m.settings_nav_about() },
  ];
</script>

<section class="settings-index">
  <ul class="list mobile-only">
    {#each items as item (item.href)}
      <li>
        <a class="row" href={item.href}>
          <span class="row-label">{item.label}</span>
          <span class="chev">›</span>
        </a>
      </li>
    {/each}
  </ul>
  <p class="tablet-hint desktop-only">{m.settings_hint_pick_left()}</p>
</section>

<style>
  .settings-index { padding: 8px 0; }
  .list { list-style: none; margin: 0; padding: 0; }
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    color: var(--color-text-primary);
    text-decoration: none;
    font-size: 15px;
    border-bottom: 1px solid var(--color-border);
    transition: background var(--transition-quick);
  }
  .row:active { background: var(--bg-glass-hover); }
  .row-label { font-weight: 500; }
  .chev { color: var(--color-text-tertiary); font-size: 18px; }
  .tablet-hint { padding: 48px; text-align: center; color: var(--color-text-secondary); font-size: 14px; }
  .desktop-only { display: none; }
  .mobile-only { display: block; }
  @media (min-width: 768px) {
    .mobile-only { display: none; }
    .desktop-only { display: block; }
  }
</style>
```

- [ ] **Step 5: `settings/+layout.svelte` Sub-Nav unter Breakpoint ausblenden**

Im `<style>`-Block von `src/routes/settings/+layout.svelte`, vor dem schließenden `</style>`:

```css
  @media (max-width: 767.98px) {
    .sub-nav {
      display: none;
    }
    .settings-page {
      flex-direction: column;
    }
  }
```

- [ ] **Step 6: Build + Check**

Run: `npm run check && npx vite build`
Expected: 0 errors.

- [ ] **Step 7: Visueller Check (375×812 + 1024×768)**

Run: `npm run dev`.
Mobile 375×812 → `/settings`: Liste mit Account/Sprache/TV/Anzeige/Pro/Über, jeder Eintrag tappbar, Sub-Nav nicht sichtbar. Tap auf „TV-Verbindung" → Sub-Seite, oben im MobileHeader steht „TV-Verbindung" + Back-Button zurück zu `/settings`.
Tablet 1024 → `/settings`: Sub-Nav links + rechts Hinweis „bitte einen Bereich aus Liste links wählen".

- [ ] **Step 8: Commit**

```bash
git add src/routes/settings/+page.svelte src/routes/settings/+layout.svelte messages/de.json messages/en.json messages/es.json
git rm -f src/routes/settings/+page.ts 2>/dev/null || true
git commit -m "feat(settings): mobile index list + hide sub-nav on mobile"
```

---

## Task 14: Playlists Mobile — State-Switch Liste ↔ Detail

**Files:**
- Modify: `src/routes/playlists/+page.svelte`

- [ ] **Step 1: Mobile-State ergänzen**

In `src/routes/playlists/+page.svelte`, im `<script>` ergänzen (nach der `selected`-Derivation, bei Z. ~33):

```ts
  // Auf Mobile: Liste vs. Detail wird per selectedId entschieden.
  // Auto-Select-Effect darf auf Mobile NICHT selektieren (sonst landet User direkt im Detail).
```

Den bestehenden `$effect` anpassen:

```ts
  $effect(() => {
    if (selectedId === null && data.playlists.length > 0) {
      if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767.98px)').matches) {
        return; // Auf Mobile: erst bei manuellem Tap selektieren
      }
      selectedId = data.playlists[0].id;
    }
  });
```

Und eine Back-Funktion:

```ts
  function clearSelection() {
    selectedId = null;
  }
```

- [ ] **Step 2: i18n-Key für Back-Label**

Anfügen in `messages/de.json`:
```json
  "playlists_back_to_list": "Zur Liste"
```
`messages/en.json`:
```json
  "playlists_back_to_list": "Back to list"
```
`messages/es.json`:
```json
  "playlists_back_to_list": "A la lista"
```

- [ ] **Step 3: `PlaylistDetail.svelte` — Back-Button ergänzen**

In `src/lib/components/PlaylistDetail.svelte`:

(a) `Props`-Interface erweitern (nach `playHint?: string;`, vor `}`):
```ts
    onBack?: () => void;
```

(b) Destrukturierung erweitern (nach `playHint = '',`):
```ts
    onBack,
```

(c) Template: direkt nach dem öffnenden `<div class="detail">` (vor `<header class="head">`) einfügen:
```svelte
  {#if onBack}
    <button
      type="button"
      class="mobile-back"
      onclick={onBack}
      aria-label={m.playlists_back_to_list()}
    >
      ‹ {m.playlists_back_to_list()}
    </button>
  {/if}
```

(d) Im `<style>`-Block, vor `</style>` anfügen:
```css
  .mobile-back {
    display: none;
    align-self: flex-start;
    padding: 6px 10px;
    background: transparent;
    color: var(--color-accent);
    font-size: 14px;
    font-weight: 500;
  }
  @media (max-width: 767.98px) {
    .mobile-back { display: inline-flex; align-items: center; gap: 4px; }
  }
```

- [ ] **Step 4: `playlists/+page.svelte` — Back-Prop durchreichen + Mobile-CSS**

Im Template die `PlaylistDetail`-Aufrufe um `onBack={clearSelection}` ergänzen:

```svelte
<PlaylistDetail
  playlist={selected}
  exercises={selectedExercises}
  onRename={renameSelected}
  onDuplicate={duplicateSelected}
  onDelete={deleteSelected}
  onAddExercise={() => (showAddDialog = true)}
  onRemoveExercise={removeExercise}
  onReorder={reorder}
  onPlay={startPlay}
  canPlay={tvPaired && selectedExercises.length > 0}
  playHint={playHint}
  onBack={clearSelection}
/>
```

CSS am Ende ergänzen (vor `</style>`):

```css
  @media (max-width: 767.98px) {
    .playlists-page {
      flex-direction: column;
    }
    .left {
      width: 100%;
      border-right: none;
    }
    .right {
      display: none;
    }
    /* Wenn eine Playlist selektiert ist: Liste verstecken, Detail zeigen */
    .playlists-page:has(.right:not(:empty)) .left {
      display: none;
    }
    .playlists-page:has(.right:not(:empty)) .right {
      display: flex;
    }
  }
```

**Hinweis:** `:has()`-Selector wird in modernen Browsern unterstützt. Falls Problem → alternativ eine Class-Based-Variante (Class-Switch in Svelte basierend auf `selected`):

Alternative (robuster): Im Template-Container eine Class setzen:

```svelte
<section class="playlists-page" class:has-selection={selected !== null}>
```

Und CSS:
```css
  @media (max-width: 767.98px) {
    .playlists-page {
      flex-direction: column;
    }
    .left, .right {
      width: 100%;
      border-right: none;
    }
    .has-selection .left { display: none; }
    .playlists-page:not(.has-selection) .right { display: none; }
  }
```

**Wähle diese Alternative.**

- [ ] **Step 5: Type-Check + Build**

Run: `npm run check && npx vite build`
Expected: 0 errors.

- [ ] **Step 6: Visueller Check (375×812)**

Run: `npm run dev`. Browser 375×812 → `/playlists`.
Expected: Liste ohne Auto-Select, Tap auf eine Liste → Detail volles Bild mit Back-Button. Back → zurück zur Liste.
Tablet 1024: Split-View wie bisher.

- [ ] **Step 7: Commit**

```bash
git add src/routes/playlists/+page.svelte src/lib/components/PlaylistDetail.svelte messages/de.json messages/en.json messages/es.json
git commit -m "feat(playlists): mobile state-switch list↔detail with back button"
```

---

## Task 15: Archive Mobile-Tuning

**Files:**
- Modify: `src/routes/archive/+page.svelte`

- [ ] **Step 1: CSS-Mobile-Tuning anhängen**

In `src/routes/archive/+page.svelte`, im `<style>`-Block vor `</style>`:

```css
  @media (max-width: 767.98px) {
    .archive {
      padding: 12px 14px;
    }
    .head {
      margin-bottom: 14px;
    }
    h1 {
      font-size: 20px;
    }
    .new-btn {
      padding: 8px 12px;
      font-size: 13px;
    }
    .search-wrap {
      width: 100%;
      margin-bottom: 12px;
    }
    .chips {
      gap: 4px;
      margin-bottom: 12px;
      overflow-x: auto;
      flex-wrap: nowrap;
      padding-bottom: 4px;
    }
    .chip {
      flex-shrink: 0;
    }
    .grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }
  }
```

- [ ] **Step 2: Visueller Check**

Run: `npm run dev`. Browser 375×812 → `/archive`.
Expected: Titel kleiner, Suche über volle Breite, Chips horizontal scrollbar, Karten 2-spaltig.

- [ ] **Step 3: Commit**

```bash
git add src/routes/archive/+page.svelte
git commit -m "style(archive): compact mobile layout with 2-column grid"
```

---

## Task 16: Vollständiger Unit-Test-Regression

**Files:**
- Keine

- [ ] **Step 1: Alle Unit-Tests laufen lassen**

Run: `cd ~/Developer/tt-playbook-trainer && npm run test:unit -- --run`
Expected: Alle Tests grün (71 bestehende + 7 neue aus Task 3 + 7 neue aus Task 10 = 85 Tests). Falls failing: Root Cause finden und fixen, danach erneut.

- [ ] **Step 2: Svelte-Check**

Run: `npm run check`
Expected: 0 errors, 0 warnings.

- [ ] **Step 3: Production-Build**

Run: `npx vite build`
Expected: Build erfolgreich, Service Worker generiert.

---

## Task 17: Browser-E2E via browser-use

**Files:** keine (manueller Test)

- [ ] **Step 1: Dev-Server starten**

Run: `cd ~/Developer/tt-playbook-trainer && npm run dev` (Background).

- [ ] **Step 2: browser-use Szenario — Mobile-Viewport**

Viewport setzen auf 375×812 (iPhone 13).

**Testflow (alle via browser-use screenshots verifizieren):**

1. Öffne `/draw`
   - Erwartung: MobileHeader oben mit „Übung" + TV-Dot, MobileTabBar unten, Canvas groß mit Tisch, Peek-Sheet über der TabBar
2. Zeichne einen Pfeil (via drag simulation)
   - Erwartung: Sheet öffnet sich automatisch, neuer Stroke im Sheet sichtbar
3. Tap auf Sheet-Handle
   - Erwartung: Sheet schließt auf Peek
4. Navigiere via TabBar auf Archiv
   - Erwartung: Header-Titel „Archiv", 2-Spalten-Grid, Suche oben
5. Navigiere via TabBar auf Listen
   - Erwartung: nur Playlist-Liste, kein Detail (ohne Auto-Select)
6. Tap auf eine Playlist
   - Erwartung: Detail-Vollbild, Back-Button „‹ Zurück" oben
7. Tap auf Back
   - Erwartung: zurück zur Liste
8. Navigiere via TabBar auf „Mehr"
   - Erwartung: `/settings`-Liste mit 6 Einträgen, kein Sub-Nav
9. Tap auf „TV-Verbindung"
   - Erwartung: Sub-Seite, Header-Titel „TV-Verbindung" + Back-Button, Back führt zurück zu `/settings`
10. Viewport-Rotation auf 812×375 (Landscape, Breite ≥768 → Tablet-Layout)
    - Erwartung: Sidebar sichtbar, TabBar weg, Header weg — Tablet-Layout aktiv

- [ ] **Step 3: Tablet-Regression (1024×768)**

Viewport 1024×768 und alle Seiten öffnen:
- `/draw` — Sidebar links, Steps-Panel rechts, kein Bottom-Sheet
- `/archive` — Grid-Layout wie bisher
- `/playlists` — Split-View wie bisher
- `/settings` — Sub-Nav links sichtbar, rechts „Bitte einen Bereich wählen"-Hinweis
- `/settings/tv` — Sub-Nav links, Inhalt rechts

- [ ] **Step 4: Bugs fixen**

Falls Regressionen oder Bugs gefunden: pro Bug ein separater Commit. Stoppe nach dem Fix den Dev-Server erst wenn alle Tests grün.

- [ ] **Step 5: Final-Commit (falls Doku-Nachzug)**

Falls Anpassungen an der Spec nötig waren:
```bash
git add docs/superpowers/specs/2026-04-16-mobile-responsive-layout.md
git commit -m "docs(spec): align mobile layout spec with implementation"
```

- [ ] **Step 6: Live-Deploy (optional — nach User-Bestätigung)**

Wenn User zufrieden mit dem Browser-Test:
```bash
git push mittwald main
```

Auto-Deploy-Hook baut + startet neu (ca. 30-60s).

---

## Abschluss-Checkliste

- [ ] Alle 17 Tasks committed, je ein Commit pro Task (+ ggf. Bug-Fix-Commits)
- [ ] `npm run test:unit -- --run` → alle Tests grün
- [ ] `npm run check` → 0/0/0
- [ ] `npx vite build` → erfolgreich
- [ ] browser-use Mobile-Flow + Tablet-Regression geprüft
- [ ] Commits gepushed auf `mittwald` für Live-Deploy
