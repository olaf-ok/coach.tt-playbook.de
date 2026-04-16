# Mobile Responsive Layout — Design Spec

**Datum:** 2026-04-16
**Status:** Design-Phase
**Kontext:** Die App ist aktuell für Tablet-Landscape gebaut (Sidebar 68px links + Canvas + Steps-Panel rechts). Auf Smartphone-Portrait wird das Drei-Spalten-Layout unbenutzbar — Canvas schrumpft auf ~10px Breite, Sidebar verdeckt Inhalte, Steps-Panel stiehlt weiteren Platz.

## Ziel

Die App auf Smartphone-Portrait bedienbar machen, ohne das bestehende Tablet-Layout zu beeinträchtigen.

## Nicht-Ziele

- Keine native App, keine App-Store-Distribution (bleibt PWA)
- Keine Re-Gestaltung der Settings-Inhalte
- Keine Neuanordnung der Tablet-UI
- Keine neuen Features — nur responsive Umbau bestehender Flows

## Breakpoint

Ein einziger Breakpoint: **`--bp-mobile: 768px`**.

- `<768px`: Mobile-Layout (neu)
- `≥768px`: bestehendes Layout (unverändert)

Umgesetzt via CSS-Media-Queries (`@media (max-width: 767.98px)`). Kein User-Agent-Sniffing, keine JS-Viewport-Detection — pure CSS, reaktiv auf Rotation.

## Änderungen im Detail

### 1. Navigation: Sidebar → Tab-Bar auf Mobile

**Bestehend:** `AppSidebar.svelte` (68px links, vertikal, Zeichnen · Archiv · Listen · Settings-Gear + Home-Icon oben).

**Neu auf Mobile:**
- Sidebar per CSS `display: none` unter Breakpoint
- Neue Komponente `AppTabBar.svelte` (fixed bottom, 50px Höhe + safe-area-inset-bottom padding)
- Vier Tabs: **Zeichnen · Archiv · Listen · Mehr**
- Icons: bestehende SF-Symbol-Stil-Icons aus `src/lib/icons/`
- Active-State: Akzentfarbe (`--color-accent`)
- Hit-Target min. 44×44px

**„Mehr"-Tab:** Navigiert zu `/settings` (zeigt die Haupt-Liste). Auf Mobile bekommen Settings-Sub-Seiten (`/settings/tv`, `/settings/display` etc.) Back-Buttons statt der Sub-Nav.

### 2. Header auf Mobile

Neue `AppHeader.svelte` oben (existiert aktuell nicht als eigene Komponente — Header-Logik ist jetzt teils in `AppSidebar`, teils inline).

- Links: zurück-Pfeil (nur auf Sub-Seiten wie `/settings/tv`, `/draw/[id]`)
- Mitte: Titel (z.B. "Neue Übung", "Archiv", "Einstellungen")
- Rechts: **TV-Status-Dot** (grau = nicht paired, grün = paired), tappbar → `/settings/tv`

Tablet-Layout: Header bleibt, wie er ist (TV-Button in Toolbar).

### 3. Zeichnen-Seite: Steps-Panel → Bottom-Sheet

**Bestehend:** `StepsPanel.svelte` fixed rechts neben Canvas, volle Höhe.

**Neu auf Mobile:** dieselbe Komponente rendert als Bottom-Sheet.

Zwei Zustände:
- **Peek (Default):** ~60px Höhe, zeigt Übungsname + 2-3 Meta-Chips (Wdh./Dauer/Anzahl Schläge). Handle-Indicator oben (36×4px Pill).
- **Expanded:** ~60% Viewport-Höhe, zeigt Schritte-Liste mit Tags/Freitext, Wdh./Dauer-Eingaben. Scrollbar intern.

**Interaktion:**
- Tap auf Handle/Peek-Area toggelt zwischen Peek ↔ Expanded
- Kein Drag/Gesture im MVP (YAGNI — reines Tap-Toggle reicht)
- Beim Selektieren eines Pfeils → Sheet öffnet automatisch (wie bisher Steps-Panel den Eintrag aufklappt)
- Backdrop: keiner (Canvas bleibt sichtbar)

**Komponente:** Entweder `StepsPanel.svelte` um Mobile-Branch erweitern (via CSS + State), oder neue `StepsSheet.svelte` die dieselben Props nimmt. **Empfehlung:** ein Component, zwei CSS-Layouts — vermeidet duplizierten State.

### 4. Zeichnen-Toolbar auf Mobile

**Bestehend:** "↶ Zurück" (in Steps-Panel) + "+ Neu" + "TV" + "Speichern" in Toolbar oben.

**Neu auf Mobile:**
- Toolbar bleibt oben, aber kompakter: **"+ Neu · ↶ · Speichern"** (Zurück als Icon-only Button, Speichern als primärer Button)
- "TV"-Button entfällt (Status wandert in Header-Dot)

### 5. Canvas-Sizing

`TableCanvas.svelte` nutzt bereits `ResizeObserver`. Auf Mobile bekommt der Canvas-Container:
- Volle Viewport-Breite minus Padding (16px seitlich)
- Höhe = `100dvh` minus (Header + Toolbar + Sheet-Peek + TabBar) ≈ 100dvh - 230px
- Tisch-Aspect-Ratio (274:152.5) bleibt respektiert, Canvas zentriert

**Wichtig:** Canvas-Höhe bleibt **konstant** (Peek-basiert). Wenn Sheet expanded wird, legt es sich **overlay** über den Canvas — der Canvas resized nicht mit. Das vermeidet Stage-Rebuild + Stroke-Umrechnung bei jedem Sheet-Toggle.

### 6. Archiv / Listen auf Mobile

**Archiv:**
- Grid bleibt 2-spaltig (statt 3-4 auf Tablet)
- Suchleiste + Filter-Chips bleiben oben, vereinfacht (Filter ggf. als Sheet falls Platz fehlt)

**Listen (Playlists/Trainingslisten):**
- Split-View funktioniert auf Mobile nicht
- **Entscheidung:** interner State-Switch (kein neuer Route). Bestehende `/playlists`-Seite hält `selectedPlaylistId` — auf Mobile wird unter Breakpoint entweder Liste ODER Detail gerendert (nicht beide). Back-Button setzt `selectedPlaylistId = null`
- Auf Tablet: Split-View bleibt identisch zum Ist-Stand

### 7. Settings auf Mobile

- `/settings` zeigt Haupt-Liste (kein Sub-Nav mehr sichtbar)
- Sub-Seiten (`/settings/tv`, `/settings/display`, etc.) sind Vollbild-Screens mit Back-Button in Header
- Bestehende Sub-Nav (`260px` links) per CSS ausgeblendet unter Breakpoint

### 8. Safe-Area & Viewport

- `100dvh` statt `100vh` (bereits überall eingesetzt, prüfen)
- `env(safe-area-inset-bottom)` auf TabBar und Sheet
- `env(safe-area-inset-top)` auf Header (für Notch)

### 9. TV-Seite (`/tv`)

Keine Änderung nötig — `/tv` ist bereits full-screen ohne Sidebar/Chrome. TV-Display wird typischerweise auf großem Screen gerendert, Mobile-Viewport nicht im Scope.

## Komponenten-Übersicht

Neu:
- `src/lib/layout/AppTabBar.svelte` — Mobile-Navigation unten
- `src/lib/layout/AppHeader.svelte` — Mobile-Header oben

Geändert:
- `src/lib/layout/AppSidebar.svelte` — CSS: `display: none` unter Breakpoint
- `src/lib/components/StepsPanel.svelte` — Mobile-CSS: Bottom-Sheet-Variante mit Peek/Expanded-State
- `src/lib/components/DrawingView.svelte` — Container-Sizing + Sheet-State
- `src/routes/+layout.svelte` — Header + TabBar einbinden (unter Breakpoint)
- `src/routes/settings/+layout.svelte` — Sub-Nav unter Breakpoint ausblenden, Back-Button-Logik für Sub-Seiten
- `src/routes/playlists/+page.svelte` — Detail-View-Logik für Mobile (Liste ↔ Detail)
- `src/app.css` — CSS-Variable `--bp-mobile: 768px`, Safe-Area-Utilities

## Testing

- **Unit-Tests** (Vitest, colocation): TabBar-Active-State-Logik (Route-Matching), Bottom-Sheet-State-Machine (peek ↔ expanded)
- **Manueller Browser-Test** via Browser-use: Viewport 375×812 (iPhone 13), Pfeil zeichnen + Sheet öffnen + Speichern
- **Tablet-Regression:** 1024×768 Viewport, Flow bleibt identisch zum Ist-Stand
- **Rotation:** Mobile rotieren auf Landscape — fällt unter Breakpoint (≥768px Breite) → Tablet-Layout, kein Bruch

## Offene Punkte (nicht blockierend)

- Swipe-Gesten für Sheet (Drag statt Tap) — später, YAGNI
- Pull-to-Refresh im Archiv — erstmal nicht nötig
- Haptic Feedback auf Tab-Switch — PWA-Limits, später
- Exercise-Liste in Playlist auf Mobile editierbar? Muss manuell getestet werden

## Risiken / Knackpunkte

- **StepsPanel-CSS-Komplexität:** Peek/Expanded-State + Animation sauber zu bauen ist das größte Stück Arbeit. Fallback wenn zu komplex: immer Peek, Tap öffnet ein Modal-Sheet statt Inline-Expansion.
- **Canvas-Höhe bei geöffnetem Sheet:** Wenn Sheet expanded ist und Canvas shrinken müsste, könnte das die ResizeObserver-Stage-Neuaufbau-Logik triggern und Strokes umrechnen. Alternative: Sheet overlay'd Canvas (Canvas-Höhe konstant, Sheet legt sich drüber).
- **Entscheidung:** Sheet overlay'd Canvas (einfacher, stabiler) — Canvas-Größe ändert sich NICHT bei Sheet-Toggle.

## Umsetzungsreihenfolge (grob)

1. CSS-Breakpoint + Sidebar ausblenden + TabBar neu
2. Header mit TV-Dot
3. StepsPanel → Bottom-Sheet (Peek/Expanded via CSS + State)
4. DrawingView-Layout angepasst
5. Settings-Sub-Nav responsive + Back-Button
6. Playlists-Split-View → Detail-Mobile
7. Manueller Viewport-Test + Fix-Runde
