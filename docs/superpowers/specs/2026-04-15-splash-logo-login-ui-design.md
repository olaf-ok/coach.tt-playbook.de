# Design — Splash, Logo, Icon-Placement, Login-UI (Mock)

**Datum:** 2026-04-15
**Projekt:** TT Playbook Trainer
**Status:** Spec 1 von 2 (Frontend-only). Spec 2 = Auth-Backend + Stripe (separates Dokument, später).

## Motivation

Die App startet aktuell direkt mit `/draw`. Trainer brauchen:

- Einen kurzen visuellen App-Start mit dem Marken-Logo (Wiedererkennung beim Halle-Tablet)
- Das Marken-Symbol präsent in der App-Oberfläche
- Eine Anmelde-Oberfläche, die später an das echte Backend gestöpselt wird

Dieses Spec deckt rein frontend-seitige, visuelle Arbeit ab. Kein Backend, kein Stripe, kein Auth-Request. Die Login-UI ist ein Mock, der `proStatus` umschaltet.

## Scope

### In Scope

1. Logo-/Icon-Komponenten mit `currentColor` (Theme-reaktiv)
2. Splash-Overlay beim Cold-Start
3. App-Icon in Sidebar + auf `/tv`
4. Login/Signup-UI in `/settings/account` (Mock-Auth)
5. Paywall-Dialog ergänzt um Link „Ich habe schon ein Konto"

### Out of Scope

- Auth-Backend (User-Tabelle, Passwort-Hashing, JWT/Session)
- Stripe-Integration
- Passwort-Reset-Flow
- i18n-Strings (nur DE hardcoded; Extraction erfolgt im i18n-Spec)
- PWA-Manifest-Splash (System-Splash ist separat und bleibt unverändert)

## Architektur

### Neue Dateien

```
src/lib/brand/
  AppLogo.svelte      # Symbol + "TT Playbook coach"-Wortmarke
  AppIcon.svelte      # Nur das Symbol
src/lib/splash/
  splash-state.ts     # shouldShowSplash() — pure Funktion, testbar
  Splash.svelte       # Overlay-Komponente
src/lib/auth/
  mock-user.svelte.ts # Reactive Store für Mock-User (E-Mail, loggedIn)
```

### Geänderte Dateien

```
src/routes/+layout.svelte          # Splash-Overlay, Cold-Start-Logik
src/routes/settings/account/+page.svelte  # Platzhalter → Login/Signup + Eingeloggt-View
src/routes/tv/+page.svelte         # AppIcon dezent links oben
src/lib/Sidebar.svelte             # AppIcon oben
src/lib/PaywallDialog.svelte       # Zusatz-Link „Schon ein Konto? Anmelden"
```

## Komponenten-Details

### AppLogo.svelte / AppIcon.svelte

- Inline-SVG aus `reference/logo/`, alle `fill`-Attribute → `currentColor`, `class`-basierte Fills entfernt
- Props: `size?: number` (Standard: Logo 120 px Höhe, Icon 40 px)
- Kein `color`-Prop — Elternselement steuert via CSS `color`
- Accessibility: `role="img"`, `aria-label="TT Playbook Coach"` (Logo) / `aria-label="TT Playbook"` (Icon)

**Farbverhalten:**
- Im Root-Layout setzt `app.css` `color: var(--color-text-primary)` global → SVGs sind im Dark-Mode hell, im Light-Mode dunkel. Theme-Wechsel im Settings-Panel aktualisiert sofort ohne Reload.

### Splash-Overlay

**Datei-Struktur:**

- `splash-state.ts`:
  ```ts
  export function shouldShowSplash(storage: Storage, pathname: string): boolean
  ```
  Liest/schreibt `sessionStorage['tt-splash-shown']`. Gibt `false` zurück, wenn Pfad mit `/tv` beginnt. Pure Funktion, 4 Unit-Tests (ungesetzt/gesetzt/tv-path/tv-subpath).

- `Splash.svelte`:
  - Position: `fixed inset-0`, `background: var(--color-bg-base)`, `z-index: 9999`
  - Inhalt: `<AppLogo size={140}>` zentriert
  - Timing: Props `visibleMs=1000`, `fadeMs=300`. Nach `visibleMs` setzt CSS-Transition `opacity: 0`. Nach `fadeMs` → dispatch `done`-Event; Parent entfernt Komponente aus DOM.
  - Kein Klick-to-Skip im MVP. Nutzer wartet 1,3 s. Wenn Feedback zeigt, dass es stört → Click-Handler nachträglich.

- Einbindung in `+layout.svelte`:
  ```svelte
  onMount(() => {
    showSplash = shouldShowSplash(sessionStorage, $page.url.pathname);
    if (showSplash) sessionStorage.setItem('tt-splash-shown', '1');
  });
  {#if showSplash}<Splash on:done={() => showSplash = false} />{/if}
  ```

### Icon-Placement

**Sidebar (`src/lib/Sidebar.svelte`):**

- Neues Element ganz oben, vor den Tabs, innerhalb der 68 px Breite
- `<AppIcon size={40} />` in `<a href="/draw">`-Wrapper
- Klick navigiert zu `/draw` (wie App-Home-Button)
- Abstand unten: 16 px zum ersten Tab
- Hover: sanfte Farb-Shift nicht nötig — Logo bleibt neutral

**`/tv` (`src/routes/tv/+page.svelte`):**

- `<AppIcon size={32} />` in `position: fixed; top: 24px; left: 24px; opacity: 0.4`
- Sichtbar nur im Registered/Paired-State. Im TvDisplay-Modus (Übung spielt) — bleibt sichtbar, wirkt wie Wasserzeichen.
- Nicht interaktiv, kein Klick-Handler.

**Settings-Sub-Nav:** nicht extra. Sidebar ist sichtbar, Logo doppelt wäre Overkill.

### Login-UI (Mock)

**Mock-Store `src/lib/auth/mock-user.svelte.ts`:**

```ts
export const mockUser = $state({
  email: null as string | null,
  loggedIn: false
});

export function login(email: string): Promise<void>   // 500ms delay, schreibt Store + localStorage, setzt proStatus.isPro=true
export function signup(email: string): Promise<void>  // gleiche Mock-Logik
export function logout(): void                         // Store reset, localStorage clear, proStatus.isPro=false
```

Persistenz: `localStorage['tt-mock-user']` = `{ email }`. Beim Mount des Root-Layouts wird dieser gelesen und in Store hydratisiert.

**`/settings/account/+page.svelte`:**

- **Nicht eingeloggt:**
  - iOS-Style-Segmented-Control: „Anmelden" / „Registrieren"
  - Felder: E-Mail (type=email, required), Passwort (type=password, required, min 6 Zeichen)
  - Submit-Button disabled bis beide Felder gefüllt + E-Mail enthält `@` + Passwort ≥ 6 Zeichen
  - Loading-Zustand während 500 ms Mock-Delay (Spinner im Button)
  - Info-Text unten: „Noch kein Backend — Eingaben werden lokal gespeichert."

- **Eingeloggt:**
  - Avatar-Placeholder (Initial aus E-Mail)
  - E-Mail groß
  - `proStatus.isPro`-Badge „Pro aktiv" grün
  - Abschnitt „Abonnement verwalten" — Placeholder-Button „bald" (kommt mit Stripe in Spec 2)
  - Logout-Button (rot, am unteren Rand des Detail-Bereichs)

**Paywall-Dialog-Erweiterung (`src/lib/PaywallDialog.svelte`):**

- Zusätzlicher Link unten, unterhalb der CTAs: „Bereits ein Konto? Anmelden →"
- Klick schließt Dialog + navigiert zu `/settings/account`

## Datenfluss

```
App-Cold-Start
  └─ +layout.svelte onMount
       └─ shouldShowSplash(sessionStorage, pathname) === true (erste Session)
            └─ sessionStorage['tt-splash-shown'] = '1'
            └─ Splash rendert
                 └─ nach 1.3 s → done-Event → unmount

User öffnet /settings/account
  └─ Store hydratisiert aus localStorage['tt-mock-user']
  └─ if (mockUser.loggedIn) → Eingeloggt-View
  └─ else → Login/Signup-Form
       └─ Submit → login(email) → 500ms delay
            └─ mockUser.loggedIn = true, mockUser.email = email
            └─ localStorage['tt-mock-user'] = { email }
            └─ proStatus.isPro = true
            └─ UI wechselt zu Eingeloggt-View

Logout
  └─ mockUser reset
  └─ localStorage.removeItem('tt-mock-user')
  └─ proStatus.isPro = false
  └─ UI zurück zu Login-Form
```

## Theme-Verhalten (Logo-Farbe)

Aktuell hat `app.css` folgende Custom Properties:
- Dark: `--color-text-primary: #f5f5f7`
- Light: `--color-text-primary: #1d1d1f`

Durch `currentColor` in den SVGs folgt die Logo-Farbe automatisch der Text-Farbe am Platzierungsort. Auf Splash-Overlay wird explizit `color: var(--color-text-primary)` gesetzt.

Kein zusätzlicher JS-Code nötig — CSS macht alles.

## Tests

### Unit-Tests (Vitest, colocated)

- `src/lib/splash/splash-state.test.ts`:
  - `shouldShowSplash` ohne Flag, mit Flag, Pfad `/tv`, Pfad `/tv/display`
- `src/lib/brand/AppLogo.test.ts`:
  - Rendert mit erwarteten aria-Labels; enthält `currentColor` in SVG
- `src/lib/brand/AppIcon.test.ts`:
  - gleich
- `src/lib/auth/mock-user.test.ts`:
  - `login` setzt Store + localStorage + proStatus; `logout` räumt alles weg

### Browser-Tests (browser-use, manuell)

- Cold-Start (neuer Tab): Splash sichtbar → verschwindet → `/draw` aktiv
- Reload derselbe Tab: Splash **nicht** sichtbar (sessionStorage-Flag)
- Theme-Switch im Settings: Logo in Sidebar + auf `/settings/account` ändert Farbe sofort
- `/settings/account` Login-Flow: E-Mail eintippen → Submit → 500 ms Loading → Eingeloggt-View
- Paywall-Dialog „Bereits ein Konto?" → navigiert zu `/settings/account`, Dialog zu
- `/tv` zeigt Icon oben links dezent; kein Splash beim `/tv`-Start

## Sicherheit

Keine echte Authentifizierung. Der Mock-Store ist explizit so benannt (`mockUser`, `tt-mock-user`) und die Account-Seite zeigt einen Hinweis. Spec 2 ersetzt den Store-Layer komplett durch echten API-Call; UI bleibt unverändert.

## Offene Punkte

- Logo-SVG-Hintergrund-Clipping: `viewBox` der coach-SVG ist 752.77×468.81. In Svelte-Komponente muss `preserveAspectRatio` + `height`-Prop sauber funktionieren. Beim Implementieren prüfen.
- Icon-Click auf `/tv`: Im Moment nicht klickbar. Sollte es ein „Back"-Gesture sein? → Nein, TV bleibt im Voll-Modus. Kein Klick.

## Akzeptanzkriterien

1. Cold-Start auf Tablet zeigt Logo-Splash mit korrekter Theme-Farbe
2. Logo-Splash erscheint **nicht** bei SPA-Navigation oder zweitem Tab-Reload innerhalb der Session
3. Sidebar zeigt App-Icon oben, dient als Link zu `/draw`
4. `/tv` zeigt App-Icon dezent in Ecke (kein Splash!)
5. `/settings/account` erlaubt Anmeldung mit E-Mail/Passwort-Mock → Pro-Status wird aktiv
6. Logout entfernt Pro-Status und zurück zur Login-Form
7. Paywall-Dialog hat sichtbaren Link zu `/settings/account`
8. Theme-Wechsel ändert Logo-Farbe sofort ohne Reload
9. Alle Unit-Tests grün, svelte-check 0 Errors
