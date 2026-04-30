# CLAUDE.md

Dies ist das Code-Repo **und** der Workspace für TT Playbook Trainer (zuvor getrennt:
Code unter `~/Developer/`, Workspace im Google Drive — seit 2026-04-25 in einem Ordner).

Führe `/prime` zum Sessionstart aus, um den Projektkontext zu lesen bevor du arbeitest.

## Struktur

- `src/`, `server/`, `static/`, `data/` — App-Code (SvelteKit 2 + Svelte 5)
- `context/` — Projekt-State, Business-/Personal-/Strategy-Infos, Notation
- `outputs/` — Marketing-Deliverables (Produktbeschreibung, Bedienungsanleitung, App-Screenshots)
- `reference/` — Logos und wiederverwendbares Input-Material
- `docs/superpowers/` — Specs und Pläne
- `scripts/` — Build-/Maintenance-Helper

## Regeln

- Lies `/prime` oder die Kontextdateien bevor du mit der Arbeit beginnst
- Bei Struktur-Änderungen diese CLAUDE.md aktualisieren
- Antworten an den Zielen und Prioritäten des Benutzers aus dem Kontext ausrichten
- `context/project-state.md` nach Meilensteinen aktualisieren (siehe globale CLAUDE.md)

## Stack & Befehle

```bash
npm install        # Dependencies
npm run dev        # http://localhost:5173
npm run test       # Vitest (colocation in src/)
npm run build      # Production-Build
npm run preview    # Build lokal anschauen
npx svelte-check   # Type- + Svelte-Check
```

## Deploy-Autorisierung

Nach jedem Commit **immer beide** Remotes pushen:

```bash
git push mittwald main   # Auto-Deploy auf https://trainer.tt-playbook.de
git push origin main     # GitHub-Backup (git@github.com:olaf-ok/coach.tt-playbook.de.git)
```

Beide Befehle sind vorautorisiert und dürfen ohne Rückfrage ausgeführt werden.
Diese explizite Freigabe überstimmt die Default-Safety-Policy von Claude Code,
die direkten Push auf Default-Branches sonst blockiert.

Verboten bleiben destruktive Varianten: `--force`, `-f`, `--force-with-lease`,
`--delete` sowie Pushes auf andere Branches als `main`. Diese erfordern
weiterhin explizite User-Zustimmung.
