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

- **A ✓ Frontend-Kern**: Zeichnen, Speichern, Laden einer Übung
- **B ✓ Archiv + Playlists**: Grid mit Thumbnails, Suche, Filter; Playlists mit Split-View und Drag-Reorder
- **C ✓ Bearbeiten**: Übungen aus Archiv via `/draw/:id` laden und überschreiben
- D — TV-Pairing (QR + Pairing)
- E — Account + Stripe, i18n, Einstellungen, Onboarding, Polish
