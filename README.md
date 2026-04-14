# TT Playbook Trainer

Digitales Taktikboard für Tischtennistrainer. PWA, offline-fähig.

## Entwicklung

```bash
npm install
npm run dev
```

Öffnet `http://localhost:5173`.

## Tests

```bash
npm run test
```

## Build

```bash
npm run build
npm run preview
```

## Stack

- SvelteKit 2 + Svelte 5 (Runes)
- TypeScript (strict)
- Konva.js (Canvas)
- Dexie.js (IndexedDB)
- Vitest

## Phasen

- **A — Frontend-Kern** (aktuell): Zeichnen, Speichern, Laden einer Übung
- B — Archiv + Playlists
- C — TV-Pairing
- D — Account + Stripe
- E — i18n + Einstellungen + Onboarding + Polish
