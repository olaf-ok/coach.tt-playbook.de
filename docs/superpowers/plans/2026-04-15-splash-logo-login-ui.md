# Splash + Logo + Login-UI (Mock) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Frontend-only Spec umsetzen — theme-reaktive Logo/Icon-Komponenten, Cold-Start-Splash, Icon-Placement in Sidebar + `/tv`, Mock-Login-UI in `/settings/account` inkl. PaywallDialog-Link.

**Architecture:** Zwei neue Svelte-Komponenten im `brand/`-Modul (SVG inline, `currentColor`). Ein pure-function Splash-State-Helper für Session-Flag. Splash-Overlay im Root-Layout. Mock-User-Store als module-level `$state` (wie bestehender `proStatus`). Login-UI ersetzt den Platzhalter `/settings/account`. Kein Backend, kein Stripe.

**Tech Stack:** SvelteKit (Svelte 5 Runes), Vitest (node environment, pure-function tests), bestehende CSS-Custom-Properties (`--color-text-primary`), `currentColor`-Farbweitergabe.

**Spec:** `docs/superpowers/specs/2026-04-15-splash-logo-login-ui-design.md`

---

## Task 1: Logo-SVG als Svelte-Komponente (AppLogo)

**Files:**
- Create: `src/lib/brand/AppLogo.svelte`
- Source: `reference/logo/logo TT Playbook-coach.svg` (aus Workspace-Ordner, nicht Repo)

**Context:** Die Quell-SVG (viewBox `0 0 752.77 468.81`) nutzt `fill: #131514` via `.cls-1` plus Text-Paths ohne expliziten fill. Für Theme-Reaktivität alle Fills auf `currentColor` setzen.

- [ ] **Step 1: Komponente anlegen**

```svelte
<!-- src/lib/brand/AppLogo.svelte -->
<script lang="ts">
  interface Props {
    size?: number;
  }
  let { size = 120 }: Props = $props();
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 752.77 468.81"
  height={size}
  width="auto"
  fill="currentColor"
  role="img"
  aria-label="TT Playbook Coach"
>
  <g>
    <path d="M192,175.58c19.18-19.15,39.59-35.99,62.97-49.36-7.69,8.63-16.04,14.45-24.12,21.75-14.56,13.16-28.55,26.26-39.8,42.43-5.7,8.2-9.85,17-10.14,27.2-.3,10.47,6.69,19.53,16.5,23.16,13.73,5.08,28.01,6.75,43.02,6.31,31.05-.89,60.85-6.23,91.01-14.23,79.48-21.09,166.82-59.22,233.8-107.27,25.03-17.95,53.24-42.22,66.83-70.37,8.63.4,15.66-3.02,22.87-8.09-2.01,20.32-26.22,46.67-40.19,59.85-81.28,76.7-237.92,143.44-348.2,155.66-18.25,2.02-35.84,2.28-54.15.58-12.76-1.18-24.87-4.52-35.47-11.22-15.33-9.69-16.46-27.5-9.44-42.67,5.92-12.81,14.12-23.34,24.52-33.73Z" />
    <polygon points="301.22 217.12 252.41 216.91 273.89 114.92 208.95 114.65 217.3 74.83 346.96 74.83 338.96 114.51 322.11 114.9 301.22 217.12" />
    <polygon points="414.08 193.31 360.98 212.1 381.57 115.1 350.99 114.59 359.64 74.87 494.58 74.91 486.25 114.67 430.1 114.81 414.08 193.31" />
    <path d="M654.44,32.36c-4.21,9.84-13.79,14.96-23.49,14.14s-18.51-6.92-21.1-17.16c-2.54-10.06,2.31-19.91,10.53-25.14,8.4-5.35,19.24-4.64,27.09,1.77,7.08,5.78,11.09,16.76,6.96,26.39Z" />
    <path d="M471.7,166.95c35.48-19.8,69.78-42.73,100.97-69.87,14.89-12.96,31.48-31.88,38.66-49.97,3.27,3.04,6.34,5.41,10.69,6.4-19.13,35.06-59.38,62.47-92.55,82.97-18.95,10.93-36.76,21.97-57.76,30.47Z" />
    <path d="M607.99,3.03c-.71,1.39-1.58,2.49-2.45,3.67-1.67,2.25-2.99,4.58-3.97,7.34-10.31-2.97-20.2-4.06-30.75-4.43-11.31-.4-22.38.65-33.63,2.06-11.82,1.49-23.32,3.48-34.93,6.11-20.54,4.64-51.36,14.51-71.15,21.91l-38.45,14.36-11.54,4.67c-4.61,1.87-9.19,3.37-14.25,4.08,5.49-3.14,10.76-5.92,16.44-8.5l24.73-11.28,28.01-11.69c11.1-4.63,22.26-8.87,33.65-12.77,42.96-14.74,93.16-23.53,138.29-15.53Z" />
  </g>
  <g>
    <polygon points="0 350.59 24.36 350.59 12.12 420.31 32.15 420.31 44.51 350.59 68.87 350.59 71.74 334.31 2.87 334.31 0 350.59" />
    <polygon points="144.82 334.31 75.95 334.31 73.08 350.59 97.44 350.59 85.2 420.31 105.23 420.31 117.59 350.59 141.95 350.59 144.82 334.31" />
    <polygon points="138.47 393.07 192.11 393.07 195.1 376.07 141.6 376.07 138.47 393.07" />
    <path d="M270.16,346.79c-1.92-3.72-4.96-6.77-9.04-9.05-4.05-2.27-9.35-3.43-15.73-3.43h-33.48l-15.11,86h20.03l5.4-30.72h13.8c7.08,0,13.4-1.28,18.79-3.82,5.41-2.54,9.75-6.13,12.88-10.66,3.13-4.54,4.85-9.84,5.1-15.77.16-4.63-.72-8.86-2.63-12.55ZM237.35,373.19h-12.25l3.96-22.24h12.6c3.95,0,6.78.81,8.42,2.42,1.63,1.6,2.32,3.87,2.1,6.97-.22,3.95-1.59,7.12-4.06,9.4-2.48,2.29-6.1,3.45-10.78,3.45Z" />
    <polygon points="287.63 331.91 271.92 420.31 291.95 420.31 307.66 331.91 287.63 331.91" />
    <path d="M361.02,359.36c-4.12-1.98-9.19-2.98-15.07-2.98-5.39,0-10.38.96-14.85,2.84-4.47,1.89-8.3,4.51-11.38,7.8-3.1,3.3-5.33,7.23-6.65,11.68l-.38,1.28h19.44l.24-.66c.8-2.18,2.15-3.75,4.15-4.8,2.05-1.08,4.33-1.62,6.79-1.62s4.27.39,5.46,1.16c1.14.74,1.86,1.83,2.21,3.34.33,1.45.36,3.34.1,5.62h-13.88c-6.02,0-11.31.87-15.72,2.59-4.47,1.74-7.98,4.21-10.44,7.33-2.48,3.15-3.86,6.91-4.11,11.19-.17,3.29.45,6.3,1.85,8.98,1.41,2.7,3.68,4.84,6.74,6.37,3.01,1.5,6.95,2.27,11.73,2.27,2.31,0,4.53-.25,6.59-.75,2.07-.5,4.04-1.21,5.85-2.12,1.83-.91,3.5-2.03,4.96-3.33.75-.67,1.47-1.37,2.16-2.1l.1,6.85h17.55l6.74-38.26c.99-5.38.6-10.05-1.16-13.86-1.77-3.84-4.8-6.81-9-8.82ZM329.59,398.6c.68-.92,1.69-1.66,2.99-2.19,1.35-.55,3.02-.83,4.96-.83h10.08c-.42,1.23-.97,2.38-1.63,3.45-.86,1.39-1.93,2.62-3.16,3.67-1.23,1.04-2.61,1.88-4.1,2.47-1.47.59-3.04.89-4.67.89-1.79,0-3.25-.38-4.35-1.14-1-.69-1.43-1.67-1.37-3.03.14-1.27.55-2.35,1.25-3.29Z" />
    <polygon points="432.36 357.83 411.16 395.53 402.91 357.83 381.4 357.83 395.2 416.23 397.8 416.23 379.08 446.71 400.39 446.71 453.92 357.83 432.36 357.83" />
    <path d="M512.4,360.22c-3.79-2.54-8.32-3.83-13.46-3.83-4.37,0-8.31.84-11.72,2.5-2.41,1.17-4.61,2.6-6.57,4.25l5.56-31.23h-20.03l-15.59,88.4h17.67l2.9-6.11c.85,1.08,1.86,2.12,3.02,3.11,1.69,1.44,3.74,2.55,6.1,3.31,2.33.75,5.01,1.13,7.99,1.13,4.84,0,9.42-.96,13.61-2.85,4.18-1.88,7.92-4.54,11.11-7.9,3.19-3.35,5.74-7.31,7.58-11.77,1.83-4.45,2.89-9.18,3.13-14.08.25-5.42-.63-10.34-2.61-14.62-1.99-4.31-4.91-7.78-8.69-10.31ZM475.23,391.01c.07-3.25.88-6.17,2.38-8.69,1.51-2.53,3.48-4.55,5.85-6.02,2.35-1.45,5.06-2.19,8.05-2.19,2.51,0,4.69.57,6.48,1.71,1.78,1.13,3.15,2.72,4.07,4.73.92,2.03,1.28,4.31,1.05,6.8-.15,3.26-.97,6.17-2.44,8.66-1.47,2.48-3.43,4.46-5.83,5.89-2.39,1.42-5.09,2.14-8.01,2.14-2.52,0-4.69-.54-6.44-1.6-1.74-1.05-3.08-2.56-3.99-4.49-.92-1.96-1.32-4.27-1.16-6.93Z" />
    <path d="M585.31,360.13c-4.18-2.48-9.21-3.74-14.97-3.74-4.91,0-9.64.93-14.06,2.78-4.41,1.84-8.35,4.39-11.71,7.58-3.36,3.2-6.04,7.04-7.97,11.42-1.92,4.37-3.02,9.16-3.26,14.22-.25,5.5.71,10.55,2.86,15,2.16,4.48,5.38,8.03,9.57,10.56,4.18,2.52,9.18,3.8,14.86,3.8,5.07,0,9.86-.93,14.25-2.78,4.37-1.84,8.31-4.39,11.7-7.57,3.4-3.2,6.12-7.02,8.09-11.36,1.96-4.33,3.04-9.15,3.21-14.28.33-5.75-.64-10.89-2.87-15.27-2.24-4.39-5.49-7.88-9.68-10.37ZM570.12,401.93c-2.08,1.49-4.41,2.21-7.1,2.21-1.89,0-3.52-.47-4.96-1.45-1.45-.98-2.51-2.32-3.23-4.11-.74-1.82-1.08-4.05-1.01-6.58.23-3.61,1-6.8,2.3-9.47,1.28-2.63,3.01-4.75,5.14-6.28,2.1-1.51,4.46-2.27,7.04-2.27,1.95,0,3.67.47,5.1,1.4,1.42.92,2.5,2.28,3.22,4.04.74,1.81,1,4.09.77,6.84-.15,3.53-.89,6.69-2.18,9.39-1.28,2.67-2.99,4.79-5.08,6.28Z" />
    <path d="M659.71,360.13c-4.18-2.48-9.21-3.74-14.97-3.74-4.91,0-9.64.93-14.06,2.78-4.41,1.84-8.35,4.39-11.71,7.58-3.36,3.2-6.04,7.04-7.97,11.42-1.92,4.37-3.02,9.16-3.26,14.22-.25,5.5.71,10.55,2.86,15,2.16,4.48,5.38,8.03,9.57,10.56,4.18,2.52,9.18,3.8,14.86,3.8,5.07,0,9.86-.93,14.25-2.78,4.37-1.84,8.31-4.39,11.7-7.57,3.4-3.2,6.12-7.02,8.09-11.36,1.96-4.33,3.04-9.15,3.21-14.28.33-5.75-.64-10.89-2.87-15.27-2.24-4.39-5.49-7.88-9.68-10.37ZM644.52,401.93c-2.08,1.49-4.41,2.21-7.1,2.21-1.89,0-3.52-.47-4.96-1.45-1.45-.98-2.51-2.32-3.23-4.11-.74-1.82-1.08-4.05-1.01-6.58.23-3.61,1-6.8,2.3-9.47,1.28-2.63,3.01-4.75,5.14-6.28,2.1-1.51,4.46-2.27,7.04-2.27,1.95,0,3.67.47,5.1,1.4,1.42.92,2.5,2.28,3.22,4.04.74,1.81,1,4.09.77,6.84-.15,3.53-.89,6.69-2.18,9.39-1.28,2.67-2.99,4.79-5.08,6.28Z" />
    <polygon points="752.77 357.83 728.1 357.83 705.86 379.57 714.34 331.91 694.3 331.91 678.59 420.31 698.62 420.31 703.74 391.49 721.22 420.31 745.14 420.31 722.17 386.17 752.77 357.83" />
  </g>
  <g>
    <path d="M570.18,457.04c-.44,3.76-1.83,6.66-4.16,8.7-2.34,2.04-5.44,3.06-9.31,3.06-4.2,0-7.56-1.5-10.1-4.52-2.53-3.01-3.8-7.04-3.8-12.08v-3.42c0-3.3.59-6.21,1.77-8.72,1.18-2.51,2.85-4.43,5.02-5.77,2.16-1.34,4.67-2.01,7.52-2.01,3.78,0,6.8,1.05,9.08,3.16,2.28,2.11,3.6,5.03,3.98,8.75h-4.71c-.41-2.84-1.29-4.9-2.65-6.17-1.36-1.27-3.26-1.91-5.7-1.91-3,0-5.34,1.11-7.04,3.32-1.7,2.22-2.55,5.37-2.55,9.46v3.45c0,3.86.81,6.93,2.42,9.21s3.87,3.42,6.76,3.42c2.6,0,4.6-.59,5.99-1.77,1.39-1.18,2.31-3.23,2.77-6.16h4.71Z" />
    <path d="M613.92,451.69c0,3.48-.59,6.52-1.76,9.12-1.17,2.6-2.83,4.58-4.98,5.95s-4.66,2.05-7.52,2.05-5.28-.69-7.45-2.06c-2.17-1.38-3.85-3.34-5.04-5.88-1.2-2.55-1.81-5.5-1.84-8.85v-2.56c0-3.42.59-6.44,1.78-9.06,1.19-2.62,2.87-4.63,5.04-6.02,2.17-1.39,4.66-2.09,7.46-2.09s5.36.69,7.53,2.06c2.17,1.38,3.84,3.37,5.02,5.98,1.17,2.61,1.76,5.65,1.76,9.12v2.25ZM609.26,449.4c0-4.21-.85-7.45-2.54-9.7-1.69-2.25-4.06-3.38-7.1-3.38s-5.29,1.13-7,3.38c-1.7,2.25-2.58,5.38-2.62,9.39v2.61c0,4.09.86,7.3,2.58,9.63,1.72,2.33,4.08,3.5,7.09,3.5s5.37-1.1,7.03-3.31c1.66-2.21,2.51-5.37,2.56-9.49v-2.64Z" />
    <path d="M650.07,459.02h-14.89l-3.34,9.3h-4.83l13.57-35.55h4.1l13.6,35.55h-4.81l-3.39-9.3ZM636.6,455.18h12.08l-6.05-16.63-6.03,16.63Z" />
    <path d="M699.21,457.04c-.44,3.76-1.83,6.66-4.16,8.7-2.34,2.04-5.44,3.06-9.31,3.06-4.2,0-7.56-1.5-10.1-4.52-2.53-3.01-3.8-7.04-3.8-12.08v-3.42c0-3.3.59-6.21,1.77-8.72,1.18-2.51,2.85-4.43,5.02-5.77,2.16-1.34,4.67-2.01,7.52-2.01,3.78,0,6.8,1.05,9.08,3.16,2.28,2.11,3.6,5.03,3.98,8.75h-4.71c-.41-2.84-1.29-4.9-2.65-6.17-1.36-1.27-3.26-1.91-5.7-1.91-3,0-5.34,1.11-7.04,3.32-1.7,2.22-2.55,5.37-2.55,9.46v3.45c0,3.86.81,6.93,2.42,9.21s3.87,3.42,6.76,3.42c2.6,0,4.6-.59,5.99-1.77,1.39-1.18,2.31-3.23,2.77-6.16h4.71Z" />
    <path d="M742.92,468.32h-4.71v-16.43h-17.92v16.43h-4.69v-35.55h4.69v15.28h17.92v-15.28h4.71v35.55Z" />
  </g>
</svg>
```

- [ ] **Step 2: Build-Check**

Run: `cd ~/Developer/tt-playbook-trainer && npx svelte-check --tsconfig ./tsconfig.json 2>&1 | tail -5`
Expected: `svelte-check found 0 errors, 0 warnings`

- [ ] **Step 3: Commit**

```bash
cd ~/Developer/tt-playbook-trainer
git add src/lib/brand/AppLogo.svelte
git commit -m "feat(brand): add AppLogo component with currentColor"
```

---

## Task 2: Icon-SVG als Svelte-Komponente (AppIcon)

**Files:**
- Create: `src/lib/brand/AppIcon.svelte`

**Context:** Gleiches Symbol wie in `AppLogo`, aber nur das Glyph (ohne Schrift). ViewBox der Icon-SVG ist `0 0 841.9 595.3`. Das Symbol füllt nur einen Teil — wir setzen `viewBox` enger auf das Symbol für saubere Zentrierung.

- [ ] **Step 1: Komponente anlegen**

```svelte
<!-- src/lib/brand/AppIcon.svelte -->
<script lang="ts">
  interface Props {
    size?: number;
  }
  let { size = 40 }: Props = $props();
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="180 160 500 260"
  width={size}
  height={size * (260 / 500)}
  fill="currentColor"
  role="img"
  aria-label="TT Playbook"
>
  <path d="M203.1,343.1c19.2-19.2,39.6-36,63-49.4-7.7,8.6-16,14.4-24.1,21.8-14.6,13.2-28.6,26.3-39.8,42.4s-9.9,17-10.1,27.2c-.3,10.5,6.7,19.5,16.5,23.2s28,6.7,43,6.3c31.1-.9,60.8-6.2,91-14.2,79.5-21.1,166.8-59.2,233.8-107.3,25-18,53.2-42.2,66.8-70.4,8.6.4,15.7-3,22.9-8.1-2,20.3-26.2,46.7-40.2,59.9-81.3,76.7-237.9,143.4-348.2,155.7-18.2,2-35.8,2.3-54.2.6-12.8-1.2-24.9-4.5-35.5-11.2-15.3-9.7-16.5-27.5-9.4-42.7,5.9-12.8,14.1-23.3,24.5-33.7Z" />
  <polygon points="312.4 384.6 263.5 384.4 285 282.4 220.1 282.1 228.4 242.3 358.1 242.3 350.1 282 333.3 282.4 312.4 384.6" />
  <polygon points="425.2 360.8 372.1 379.6 392.7 282.6 362.1 282.1 370.8 242.4 505.7 242.4 497.4 282.2 441.2 282.3 425.2 360.8" />
  <path d="M665.6,199.8c-4.2,9.8-13.8,15-23.5,14.1s-18.5-6.9-21.1-17.2c-2.5-10.1,2.3-19.9,10.5-25.1,8.4-5.3,19.2-4.6,27.1,1.8,7.1,5.8,11.1,16.8,7,26.4Z" />
  <path d="M482.8,334.4c35.5-19.8,69.8-42.7,101-69.9,14.9-13,31.5-31.9,38.7-50,3.3,3,6.3,5.4,10.7,6.4-19.1,35.1-59.4,62.5-92.6,83-18.9,10.9-36.8,22-57.8,30.5Z" />
  <path d="M619.1,170.5c-.7,1.4-1.6,2.5-2.5,3.7-1.7,2.2-3,4.6-4,7.3-10.3-3-20.2-4.1-30.8-4.4-11.3-.4-22.4.7-33.6,2.1-11.8,1.5-23.3,3.5-34.9,6.1-20.5,4.6-51.4,14.5-71.1,21.9l-38.5,14.4-11.5,4.7c-4.6,1.9-9.2,3.4-14.2,4.1,5.5-3.1,10.8-5.9,16.4-8.5l24.7-11.3,28-11.7c11.1-4.6,22.3-8.9,33.6-12.8,43-14.7,93.2-23.5,138.3-15.5Z" />
</svg>
```

- [ ] **Step 2: Build-Check**

Run: `cd ~/Developer/tt-playbook-trainer && npx svelte-check --tsconfig ./tsconfig.json 2>&1 | tail -5`
Expected: `0 errors, 0 warnings`

- [ ] **Step 3: Commit**

```bash
cd ~/Developer/tt-playbook-trainer
git add src/lib/brand/AppIcon.svelte
git commit -m "feat(brand): add AppIcon component with currentColor"
```

---

## Task 3: Splash-State (Pure Function + Tests)

**Files:**
- Create: `src/lib/splash/splash-state.ts`
- Create: `src/lib/splash/splash-state.test.ts`

**Context:** Testbare pure Funktion. Wird von Root-Layout aufgerufen. Entscheidet, ob der Splash in dieser Session noch nicht gezeigt wurde UND nicht auf `/tv`.

- [ ] **Step 1: Tests schreiben (fail first)**

```typescript
// src/lib/splash/splash-state.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { shouldShowSplash, SPLASH_SESSION_KEY } from './splash-state';

function fakeStorage(): Storage {
  const data = new Map<string, string>();
  return {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => {
      data.set(k, String(v));
    },
    removeItem: (k) => {
      data.delete(k);
    },
    clear: () => data.clear(),
    key: (i) => Array.from(data.keys())[i] ?? null,
    get length() {
      return data.size;
    },
  };
}

describe('shouldShowSplash', () => {
  let storage: Storage;
  beforeEach(() => {
    storage = fakeStorage();
  });

  it('zeigt Splash wenn kein Flag gesetzt und Pfad nicht /tv', () => {
    expect(shouldShowSplash(storage, '/draw')).toBe(true);
  });

  it('versteckt Splash wenn Flag bereits gesetzt', () => {
    storage.setItem(SPLASH_SESSION_KEY, '1');
    expect(shouldShowSplash(storage, '/draw')).toBe(false);
  });

  it('versteckt Splash auf /tv', () => {
    expect(shouldShowSplash(storage, '/tv')).toBe(false);
  });

  it('versteckt Splash auf /tv/beliebigem-suffix', () => {
    expect(shouldShowSplash(storage, '/tv/display')).toBe(false);
  });
});
```

- [ ] **Step 2: Tests laufen lassen (erwartetes FAIL)**

Run: `cd ~/Developer/tt-playbook-trainer && npx vitest run src/lib/splash/`
Expected: FAIL — "Cannot find module './splash-state'"

- [ ] **Step 3: Implementierung**

```typescript
// src/lib/splash/splash-state.ts
export const SPLASH_SESSION_KEY = 'tt-splash-shown';

export function shouldShowSplash(storage: Storage, pathname: string): boolean {
  if (pathname.startsWith('/tv')) return false;
  return storage.getItem(SPLASH_SESSION_KEY) === null;
}
```

- [ ] **Step 4: Tests laufen (PASS)**

Run: `cd ~/Developer/tt-playbook-trainer && npx vitest run src/lib/splash/`
Expected: `4 passed`

- [ ] **Step 5: Commit**

```bash
cd ~/Developer/tt-playbook-trainer
git add src/lib/splash/splash-state.ts src/lib/splash/splash-state.test.ts
git commit -m "feat(splash): add shouldShowSplash helper with tests"
```

---

## Task 4: Splash-Komponente

**Files:**
- Create: `src/lib/splash/Splash.svelte`

**Context:** Overlay mit Logo. Nach `visibleMs` Fade-Animation via CSS-Klasse, nach Fade-Ende dispatcht `done`-Event. Parent entfernt Komponente danach aus DOM.

- [ ] **Step 1: Komponente schreiben**

```svelte
<!-- src/lib/splash/Splash.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import AppLogo from '$lib/brand/AppLogo.svelte';

  interface Props {
    visibleMs?: number;
    fadeMs?: number;
    ondone?: () => void;
  }

  let { visibleMs = 1000, fadeMs = 300, ondone }: Props = $props();
  let fading = $state(false);

  onMount(() => {
    const fadeTimer = setTimeout(() => {
      fading = true;
    }, visibleMs);
    const doneTimer = setTimeout(() => {
      ondone?.();
    }, visibleMs + fadeMs);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  });
</script>

<div
  class="splash"
  class:fading
  style="--fade-ms: {fadeMs}ms"
  role="presentation"
  aria-hidden="true"
>
  <AppLogo size={140} />
</div>

<style>
  .splash {
    position: fixed;
    inset: 0;
    background: var(--bg-app);
    color: var(--color-text-primary);
    display: grid;
    place-items: center;
    z-index: 9999;
    opacity: 1;
    transition: opacity var(--fade-ms) ease;
  }
  .splash.fading {
    opacity: 0;
  }
</style>
```

- [ ] **Step 2: Build-Check**

Run: `cd ~/Developer/tt-playbook-trainer && npx svelte-check --tsconfig ./tsconfig.json 2>&1 | tail -5`
Expected: `0 errors, 0 warnings`

- [ ] **Step 3: Commit**

```bash
cd ~/Developer/tt-playbook-trainer
git add src/lib/splash/Splash.svelte
git commit -m "feat(splash): add Splash overlay component"
```

---

## Task 5: Splash im Root-Layout integrieren

**Files:**
- Modify: `src/routes/+layout.svelte`

**Context:** `onMount` prüft `shouldShowSplash()`, setzt Flag, rendert `Splash`. Svelte-5-Event-Syntax: `ondone={...}` statt `on:done`.

- [ ] **Step 1: Layout anpassen**

Ersetze in `src/routes/+layout.svelte` den Import-Block und `onMount`:

```svelte
<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { invalidateAll } from '$app/navigation';
  import favicon from '$lib/assets/favicon.svg';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import Splash from '$lib/splash/Splash.svelte';
  import { shouldShowSplash, SPLASH_SESSION_KEY } from '$lib/splash/splash-state';
  import { seedIfEmpty } from '$lib/db/seed';
  import { theme } from '$lib/theme/store.svelte';
  import { tvSession } from '$lib/tv/session.svelte';

  let { children } = $props();

  const hideChrome = $derived($page.url.pathname.startsWith('/tv'));
  const isTvView = $derived($page.url.pathname.startsWith('/tv'));

  let showSplash = $state(false);

  onMount(async () => {
    theme.init();

    if (shouldShowSplash(sessionStorage, $page.url.pathname)) {
      sessionStorage.setItem(SPLASH_SESSION_KEY, '1');
      showSplash = true;
    }

    try {
      const seeded = await seedIfEmpty();
      if (seeded) await invalidateAll();
    } catch (err) {
      console.warn('seed failed', err);
    }
  });

  // Tablet-Seite: Theme an gepairten TV pushen.
  $effect(() => {
    const resolvedTheme = theme.resolved;
    const client = tvSession.client;
    const clientStatus = client?.status;
    if (isTvView) return;
    if (!client || clientStatus !== 'paired') return;
    client.sendTheme(resolvedTheme);
  });

  $effect(() => {
    const client = tvSession.client;
    const received = client?.lastTheme;
    if (!isTvView) return;
    if (!received) return;
    theme.set(received);
  });
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

{#if showSplash}
  <Splash ondone={() => (showSplash = false)} />
{/if}

<div class="app-root">
  {#if !hideChrome}<Sidebar />{/if}
  <main class="content">
    {@render children()}
  </main>
</div>

<style>
  .app-root {
    height: 100dvh;
    display: flex;
    overflow: hidden;
  }

  .content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
</style>
```

- [ ] **Step 2: Build-Check**

Run: `cd ~/Developer/tt-playbook-trainer && npx svelte-check --tsconfig ./tsconfig.json 2>&1 | tail -5`
Expected: `0 errors, 0 warnings`

- [ ] **Step 3: Commit**

```bash
cd ~/Developer/tt-playbook-trainer
git add src/routes/+layout.svelte
git commit -m "feat(splash): show cold-start splash in root layout"
```

---

## Task 6: App-Icon in Sidebar oben

**Files:**
- Modify: `src/lib/components/Sidebar.svelte`

**Context:** Neues Element oben in der Sidebar — Link zu `/draw`, dient als App-Home. 40 px AppIcon, mit Abstand zu den Tabs.

- [ ] **Step 1: Sidebar anpassen**

Ersetze den kompletten Inhalt von `src/lib/components/Sidebar.svelte`:

```svelte
<script lang="ts">
  import { page } from '$app/stores';
  import { pathToTabId, type TabId } from './sidebar-utils';
  import AppIcon from '$lib/brand/AppIcon.svelte';
  import DrawIcon from '$lib/icons/DrawIcon.svelte';
  import ArchiveIcon from '$lib/icons/ArchiveIcon.svelte';
  import PlaylistIcon from '$lib/icons/PlaylistIcon.svelte';
  import SettingsIcon from '$lib/icons/SettingsIcon.svelte';
  import type { Component } from 'svelte';

  const topTabs: Array<{ id: TabId; href: string; label: string; icon: Component }> = [
    { id: 'draw', href: '/draw', label: 'Zeichnen', icon: DrawIcon },
    { id: 'archive', href: '/archive', label: 'Archiv', icon: ArchiveIcon },
    { id: 'playlists', href: '/playlists', label: 'Playlists', icon: PlaylistIcon },
  ];

  let activeTab = $derived(pathToTabId($page.url.pathname));
</script>

<aside class="sidebar">
  <div class="top">
    <a href="/draw" class="brand" aria-label="TT Playbook — Startseite">
      <AppIcon size={40} />
    </a>
    <div class="tabs">
      {#each topTabs as tab (tab.id)}
        {@const Icon = tab.icon}
        <a
          href={tab.href}
          class="tab"
          class:active={activeTab === tab.id}
          aria-label={tab.label}
          aria-current={activeTab === tab.id ? 'page' : undefined}
        >
          <Icon />
        </a>
      {/each}
    </div>
  </div>

  <div class="bottom">
    <a
      href="/settings"
      class="tab"
      class:active={$page.url.pathname.startsWith('/settings')}
      aria-label="Einstellungen"
    >
      <SettingsIcon />
    </a>
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
  .top {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }
  .brand {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-primary);
    text-decoration: none;
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
  .bottom {
    display: flex;
    flex-direction: column;
  }
</style>
```

- [ ] **Step 2: Build-Check**

Run: `cd ~/Developer/tt-playbook-trainer && npx svelte-check --tsconfig ./tsconfig.json 2>&1 | tail -5`
Expected: `0 errors, 0 warnings`

- [ ] **Step 3: Unit-Tests laufen lassen (nichts geändert an Logik)**

Run: `cd ~/Developer/tt-playbook-trainer && npx vitest run`
Expected: alle grün

- [ ] **Step 4: Commit**

```bash
cd ~/Developer/tt-playbook-trainer
git add src/lib/components/Sidebar.svelte
git commit -m "feat(sidebar): add AppIcon at top as home link"
```

---

## Task 7: App-Icon auf /tv-Page (dezentes Wasserzeichen)

**Files:**
- Modify: `src/routes/tv/+page.svelte`

**Context:** Icon in Ecke oben links, 32 px, 40 % Opacity. Nicht interaktiv. Nur wenn nicht `paired` sichtbar — im Paired-State rendert `TvDisplay` den Vollbild, da wäre das Icon störend. Alternative: immer sichtbar. Spec sagt "bleibt sichtbar, wirkt wie Wasserzeichen" — wir folgen dem, aber mit noch geringerer Opacity (25 %) wenn paired. Einfacher: einheitlich 40 %, immer sichtbar.

- [ ] **Step 1: tv/+page.svelte anpassen**

Ersetze Template + Imports:

```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import QRCode from 'qrcode';
  import TvDisplay from '$lib/components/TvDisplay.svelte';
  import AppIcon from '$lib/brand/AppIcon.svelte';
  import { tvSession } from '$lib/tv/session.svelte';

  const client = tvSession.ensureClient();
  let qrSvg = $state<string>('');

  $effect(() => {
    if (!client.code) {
      qrSvg = '';
      return;
    }
    const url = `${window.location.origin}/connect-tv?code=${client.code}`;
    QRCode.toString(url, { type: 'svg', margin: 1, width: 240 }).then((svg) => {
      qrSvg = svg;
    });
  });

  onMount(() => {
    client.registerAsTv();
  });

  onDestroy(() => {
    tvSession.reset();
  });
</script>

<section class="tv-root">
  <div class="watermark" aria-hidden="true">
    <AppIcon size={32} />
  </div>

  {#if client.status === 'paired'}
    <TvDisplay exercise={client.lastExercise} />
  {:else}
    <div class="pair-view">
      <h1>TT Playbook Trainer</h1>
      <p class="sub">Tablet mit diesem Bildschirm verbinden</p>

      {#if client.status === 'registered' && client.code}
        <div class="qr-wrap">
          {@html qrSvg}
        </div>
        <div class="code-group">
          <span class="code-label">Code</span>
          <span class="code">{client.code}</span>
        </div>
        <p class="hint">
          Scanne den QR-Code auf deinem Tablet oder gib den Code unter <span class="path">/connect-tv</span>
          manuell ein.
        </p>
      {:else if client.status === 'connecting'}
        <p class="status">Verbinde mit Server…</p>
      {:else if client.status === 'error'}
        <p class="error">Fehler: {client.errorReason ?? 'unbekannt'}</p>
      {:else if client.status === 'closed'}
        <p class="status">Verbindung geschlossen.</p>
      {/if}
    </div>
  {/if}
</section>

<style>
  .tv-root {
    flex: 1;
    display: flex;
    overflow: hidden;
    position: relative;
  }
  .watermark {
    position: absolute;
    top: 24px;
    left: 24px;
    color: var(--color-text-primary);
    opacity: 0.4;
    z-index: 2;
    pointer-events: none;
  }
  .pair-view {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px;
    gap: 32px;
    background: var(--bg-app);
  }
  h1 {
    font-size: 48px;
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0;
  }
  .sub {
    font-size: 22px;
    color: var(--color-text-secondary);
    margin: 0;
  }
  .qr-wrap {
    background: #fff;
    padding: 16px;
    border-radius: var(--radius-panel);
  }
  .qr-wrap :global(svg) {
    display: block;
    width: 240px;
    height: 240px;
  }
  .code-group {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }
  .code-label {
    font-size: 14px;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 2px;
  }
  .code {
    font-size: 96px;
    font-weight: 600;
    color: var(--color-accent);
    letter-spacing: 8px;
  }
  .hint {
    font-size: 16px;
    color: var(--color-text-secondary);
    text-align: center;
    max-width: 480px;
  }
  .path {
    color: var(--color-text-primary);
    font-family: ui-monospace, monospace;
  }
  .status,
  .error {
    font-size: 18px;
    color: var(--color-text-secondary);
  }
  .error {
    color: var(--color-danger);
  }
</style>
```

- [ ] **Step 2: Build-Check**

Run: `cd ~/Developer/tt-playbook-trainer && npx svelte-check --tsconfig ./tsconfig.json 2>&1 | tail -5`
Expected: `0 errors, 0 warnings`

- [ ] **Step 3: Commit**

```bash
cd ~/Developer/tt-playbook-trainer
git add src/routes/tv/+page.svelte
git commit -m "feat(tv): add AppIcon watermark top-left on tv page"
```

---

## Task 8: Mock-User-Store + Tests

**Files:**
- Create: `src/lib/auth/mock-user.svelte.ts`
- Create: `src/lib/auth/mock-user.test.ts`

**Context:** Analog zum bestehenden `src/lib/pro/status.svelte.ts`. Für Testbarkeit splitten wir in eine pure Factory, die Storage bekommt, und einen module-level Singleton.

- [ ] **Step 1: Tests schreiben (fail first)**

```typescript
// src/lib/auth/mock-user.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createMockUserApi, MOCK_USER_STORAGE_KEY } from './mock-user-api';

function fakeStorage(): Storage {
  const data = new Map<string, string>();
  return {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => {
      data.set(k, String(v));
    },
    removeItem: (k) => {
      data.delete(k);
    },
    clear: () => data.clear(),
    key: (i) => Array.from(data.keys())[i] ?? null,
    get length() {
      return data.size;
    },
  };
}

describe('createMockUserApi', () => {
  let storage: Storage;
  let proSet: boolean | null;
  let setPro: (v: boolean) => void;

  beforeEach(() => {
    storage = fakeStorage();
    proSet = null;
    setPro = (v) => {
      proSet = v;
    };
  });

  it('startet ohne User wenn Storage leer', () => {
    const api = createMockUserApi(storage, setPro);
    expect(api.readUser()).toBeNull();
  });

  it('hydratisiert User aus Storage', () => {
    storage.setItem(MOCK_USER_STORAGE_KEY, JSON.stringify({ email: 'a@b.de' }));
    const api = createMockUserApi(storage, setPro);
    expect(api.readUser()).toEqual({ email: 'a@b.de' });
  });

  it('login schreibt User + setzt Pro', () => {
    const api = createMockUserApi(storage, setPro);
    api.login('user@test.de');
    expect(api.readUser()).toEqual({ email: 'user@test.de' });
    expect(storage.getItem(MOCK_USER_STORAGE_KEY)).toBe(
      JSON.stringify({ email: 'user@test.de' }),
    );
    expect(proSet).toBe(true);
  });

  it('logout entfernt User + setzt Pro false', () => {
    const api = createMockUserApi(storage, setPro);
    api.login('user@test.de');
    api.logout();
    expect(api.readUser()).toBeNull();
    expect(storage.getItem(MOCK_USER_STORAGE_KEY)).toBeNull();
    expect(proSet).toBe(false);
  });

  it('ignoriert kaputten JSON-Storage-Inhalt', () => {
    storage.setItem(MOCK_USER_STORAGE_KEY, 'not-json');
    const api = createMockUserApi(storage, setPro);
    expect(api.readUser()).toBeNull();
  });
});
```

- [ ] **Step 2: Tests laufen lassen (FAIL erwartet)**

Run: `cd ~/Developer/tt-playbook-trainer && npx vitest run src/lib/auth/`
Expected: FAIL — "Cannot find module './mock-user-api'"

- [ ] **Step 3: Pure API anlegen**

```typescript
// src/lib/auth/mock-user-api.ts
export const MOCK_USER_STORAGE_KEY = 'tt-mock-user';

export interface MockUser {
  email: string;
}

export interface MockUserApi {
  readUser(): MockUser | null;
  login(email: string): void;
  logout(): void;
}

export function createMockUserApi(
  storage: Storage,
  setPro: (value: boolean) => void,
): MockUserApi {
  function readUser(): MockUser | null {
    const raw = storage.getItem(MOCK_USER_STORAGE_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.email === 'string') {
        return { email: parsed.email };
      }
      return null;
    } catch {
      return null;
    }
  }

  function login(email: string): void {
    storage.setItem(MOCK_USER_STORAGE_KEY, JSON.stringify({ email }));
    setPro(true);
  }

  function logout(): void {
    storage.removeItem(MOCK_USER_STORAGE_KEY);
    setPro(false);
  }

  return { readUser, login, logout };
}
```

- [ ] **Step 4: Tests laufen (PASS)**

Run: `cd ~/Developer/tt-playbook-trainer && npx vitest run src/lib/auth/`
Expected: `5 passed`

- [ ] **Step 5: Reactive Wrapper anlegen**

```typescript
// src/lib/auth/mock-user.svelte.ts
import { proStatus } from '$lib/pro/status.svelte';
import {
  createMockUserApi,
  type MockUser,
} from './mock-user-api';

function readInitial(): MockUser | null {
  if (typeof localStorage === 'undefined') return null;
  const api = createMockUserApi(localStorage, () => {});
  return api.readUser();
}

let user = $state<MockUser | null>(readInitial());

function getApi() {
  return createMockUserApi(localStorage, (v) => proStatus.set(v));
}

export const mockUser = {
  get current(): MockUser | null {
    return user;
  },
  get loggedIn(): boolean {
    return user !== null;
  },
  async login(email: string): Promise<void> {
    await new Promise((r) => setTimeout(r, 500));
    getApi().login(email);
    user = { email };
  },
  async signup(email: string): Promise<void> {
    return this.login(email);
  },
  logout(): void {
    getApi().logout();
    user = null;
  },
};
```

- [ ] **Step 6: Build-Check**

Run: `cd ~/Developer/tt-playbook-trainer && npx svelte-check --tsconfig ./tsconfig.json 2>&1 | tail -5`
Expected: `0 errors, 0 warnings`

- [ ] **Step 7: Commit**

```bash
cd ~/Developer/tt-playbook-trainer
git add src/lib/auth/
git commit -m "feat(auth): add mock-user api + reactive store with tests"
```

---

## Task 9: Settings-Sub-Nav — Account aktivieren

**Files:**
- Modify: `src/routes/settings/+layout.svelte`

**Context:** Aktuell ist `account` als `available: false` markiert und wird als disabled-Span gerendert. Wir setzen es auf `true`.

- [ ] **Step 1: Flag umschalten**

In `src/routes/settings/+layout.svelte`, Zeile 12, ändern:

```typescript
    { id: 'account', href: '/settings/account', label: 'Account', available: true },
```

- [ ] **Step 2: Build-Check**

Run: `cd ~/Developer/tt-playbook-trainer && npx svelte-check --tsconfig ./tsconfig.json 2>&1 | tail -5`
Expected: `0 errors, 0 warnings` (auch wenn `/settings/account`-Route noch 404 wird — das kommt in Task 10)

- [ ] **Step 3: Commit**

```bash
cd ~/Developer/tt-playbook-trainer
git add src/routes/settings/+layout.svelte
git commit -m "feat(settings): enable Account entry in sub-nav"
```

---

## Task 10: Account-Page — Login/Signup-UI + Eingeloggt-View

**Files:**
- Create: `src/routes/settings/account/+page.svelte`

**Context:** Zwei Zustände: Nicht eingeloggt → Segmented Control + Form; Eingeloggt → Profil + Logout. Mock-Delay 500 ms, Button-Loading-Zustand.

- [ ] **Step 1: Account-Page erstellen**

```svelte
<!-- src/routes/settings/account/+page.svelte -->
<script lang="ts">
  import { mockUser } from '$lib/auth/mock-user.svelte';
  import { proStatus } from '$lib/pro/status.svelte';

  type Mode = 'login' | 'signup';
  let mode = $state<Mode>('login');
  let email = $state('');
  let password = $state('');
  let busy = $state(false);
  let error = $state<string | null>(null);

  const canSubmit = $derived(
    email.includes('@') && password.length >= 6 && !busy,
  );

  async function submit(e: Event) {
    e.preventDefault();
    if (!canSubmit) return;
    error = null;
    busy = true;
    try {
      if (mode === 'login') await mockUser.login(email);
      else await mockUser.signup(email);
      email = '';
      password = '';
    } catch (err) {
      error = err instanceof Error ? err.message : 'Fehler';
    } finally {
      busy = false;
    }
  }

  function logout() {
    mockUser.logout();
  }

  function initial(e: string): string {
    return (e[0] ?? '?').toUpperCase();
  }
</script>

<section class="account">
  <header class="head">
    <h2>Account</h2>
  </header>

  {#if mockUser.loggedIn && mockUser.current}
    <div class="profile">
      <div class="avatar">{initial(mockUser.current.email)}</div>
      <div class="email">{mockUser.current.email}</div>
      {#if proStatus.isPro}
        <span class="badge pro">Pro aktiv</span>
      {:else}
        <span class="badge">Free</span>
      {/if}
    </div>

    <div class="card">
      <h3>Abonnement</h3>
      <p class="muted">Abo verwalten kommt mit der Stripe-Integration.</p>
      <button type="button" class="btn secondary" disabled>Abo verwalten (bald)</button>
    </div>

    <div class="actions">
      <button type="button" class="btn danger" onclick={logout}>Abmelden</button>
    </div>
  {:else}
    <div class="tabs" role="tablist">
      <button
        type="button"
        role="tab"
        class:active={mode === 'login'}
        aria-selected={mode === 'login'}
        onclick={() => (mode = 'login')}
      >
        Anmelden
      </button>
      <button
        type="button"
        role="tab"
        class:active={mode === 'signup'}
        aria-selected={mode === 'signup'}
        onclick={() => (mode = 'signup')}
      >
        Registrieren
      </button>
    </div>

    <form class="form" onsubmit={submit}>
      <label class="field">
        <span>E-Mail</span>
        <input
          type="email"
          bind:value={email}
          autocomplete="email"
          required
          placeholder="du@beispiel.de"
        />
      </label>
      <label class="field">
        <span>Passwort</span>
        <input
          type="password"
          bind:value={password}
          autocomplete={mode === 'login' ? 'current-password' : 'new-password'}
          required
          minlength="6"
          placeholder="mindestens 6 Zeichen"
        />
      </label>

      {#if error}
        <p class="error">{error}</p>
      {/if}

      <button type="submit" class="btn primary" disabled={!canSubmit}>
        {#if busy}
          <span class="spinner" aria-hidden="true"></span>
          {mode === 'login' ? 'Anmelden…' : 'Konto wird erstellt…'}
        {:else}
          {mode === 'login' ? 'Anmelden' : 'Konto erstellen'}
        {/if}
      </button>

      <p class="note">
        Noch kein echtes Backend — Eingaben werden lokal gespeichert und schalten Pro frei.
      </p>
    </form>
  {/if}
</section>

<style>
  .account {
    padding: 32px;
    max-width: 520px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .head h2 {
    font-size: 22px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;
  }
  .profile {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding: 20px;
    background: var(--bg-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-panel);
  }
  .avatar {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--color-accent);
    color: #fff;
    font-size: 22px;
    font-weight: 600;
    display: grid;
    place-items: center;
  }
  .email {
    font-size: 18px;
    font-weight: 500;
    color: var(--color-text-primary);
  }
  .badge {
    font-size: 12px;
    padding: 4px 10px;
    border-radius: 999px;
    background: var(--bg-elevated);
    color: var(--color-text-secondary);
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  .badge.pro {
    background: var(--color-success);
    color: #fff;
  }
  .card {
    padding: 16px 20px;
    background: var(--bg-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-panel);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .card h3 {
    font-size: 15px;
    font-weight: 600;
    margin: 0;
    color: var(--color-text-primary);
  }
  .muted {
    color: var(--color-text-secondary);
    font-size: 13px;
    margin: 0;
  }
  .tabs {
    display: flex;
    gap: 4px;
    padding: 4px;
    background: var(--bg-surface);
    border-radius: var(--radius-button);
    border: 1px solid var(--color-border);
    align-self: flex-start;
  }
  .tabs button {
    padding: 8px 16px;
    border-radius: 6px;
    background: transparent;
    color: var(--color-text-secondary);
    font-size: 14px;
    font-weight: 500;
  }
  .tabs button.active {
    background: var(--bg-elevated);
    color: var(--color-text-primary);
  }
  .form {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .field span {
    font-size: 13px;
    color: var(--color-text-secondary);
  }
  .field input {
    padding: 10px 12px;
    background: var(--bg-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-button);
    color: var(--color-text-primary);
    font-size: 15px;
  }
  .field input:focus {
    outline: 2px solid var(--color-accent);
    outline-offset: 0;
  }
  .btn {
    padding: 12px 16px;
    border-radius: var(--radius-button);
    font-weight: 600;
    font-size: 15px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .btn.primary {
    background: var(--color-accent);
    color: #fff;
  }
  .btn.secondary {
    background: var(--bg-elevated);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border);
  }
  .btn.danger {
    background: var(--color-danger);
    color: #fff;
  }
  .btn[disabled] {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .actions {
    display: flex;
    justify-content: flex-start;
  }
  .note {
    font-size: 12px;
    color: var(--color-text-secondary);
    margin: 0;
  }
  .error {
    color: var(--color-danger);
    font-size: 13px;
    margin: 0;
  }
  .spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    display: inline-block;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
```

- [ ] **Step 2: Build-Check**

Run: `cd ~/Developer/tt-playbook-trainer && npx svelte-check --tsconfig ./tsconfig.json 2>&1 | tail -5`
Expected: `0 errors, 0 warnings`

- [ ] **Step 3: Commit**

```bash
cd ~/Developer/tt-playbook-trainer
git add src/routes/settings/account/+page.svelte
git commit -m "feat(account): add login/signup form + logged-in profile view"
```

---

## Task 11: PaywallDialog — Link zu /settings/account

**Files:**
- Modify: `src/lib/components/PaywallDialog.svelte`

**Context:** Zusätzlicher Link unten, schließt Dialog und navigiert zur Account-Seite.

- [ ] **Step 1: Footer anpassen**

In `src/lib/components/PaywallDialog.svelte` den `<footer>`-Block (Zeile 54–56) ersetzen durch:

```svelte
    <footer class="foot">
      <button type="button" class="text-btn" onclick={onClose}>Vielleicht später</button>
      <a
        href="/settings/account"
        class="text-btn account-link"
        onclick={onClose}
      >
        Bereits ein Konto? Anmelden →
      </a>
    </footer>
```

Und in den `<style>`-Block unten vor der schließenden `</style>` ergänzen:

```css
  .foot {
    justify-content: space-between;
    align-items: center;
  }
  .account-link {
    text-decoration: none;
  }
```

Und die bestehende `.foot { justify-content: flex-start }` Regel streichen (der neue Block ersetzt sie).

- [ ] **Step 2: Build-Check**

Run: `cd ~/Developer/tt-playbook-trainer && npx svelte-check --tsconfig ./tsconfig.json 2>&1 | tail -5`
Expected: `0 errors, 0 warnings`

- [ ] **Step 3: Commit**

```bash
cd ~/Developer/tt-playbook-trainer
git add src/lib/components/PaywallDialog.svelte
git commit -m "feat(paywall): add login link to existing-account users"
```

---

## Task 12: Gesamt-Verifikation (Tests + svelte-check + Build)

**Files:** —

- [ ] **Step 1: Alle Unit-Tests**

Run: `cd ~/Developer/tt-playbook-trainer && npx vitest run`
Expected: alle grün, inkl. neue `splash-state` (4) + `mock-user-api` (5)

- [ ] **Step 2: svelte-check**

Run: `cd ~/Developer/tt-playbook-trainer && npx svelte-check --tsconfig ./tsconfig.json`
Expected: `0 errors, 0 warnings`

- [ ] **Step 3: Production-Build**

Run: `cd ~/Developer/tt-playbook-trainer && NODE_OPTIONS='--max-old-space-size=1024' npx vite build`
Expected: erfolgreicher Build-Abschluss

---

## Task 13: Browser-Verifikation (Dev-Server + browser-use)

**Files:** —

**Context:** Manuelle/agenten-gestützte End-to-End-Verifikation per browser-use-Skill. Schritte werden nicht committet, sondern dokumentiert.

- [ ] **Step 1: Dev-Server starten**

Run: `cd ~/Developer/tt-playbook-trainer && npm run dev &`
Wait for: "Local: http://localhost:5173"

- [ ] **Step 2: Cold-Start-Splash prüfen**

Browser-use:
1. Gehe zu http://localhost:5173/ (in neuem Kontext/Tab)
2. Erwartung: Logo zentriert auf dunklem Hintergrund, nach ~1.3 s verschwindet es → `/draw` sichtbar
3. Reload → Splash **nicht** mehr sichtbar (sessionStorage-Flag)

- [ ] **Step 3: Theme-Wechsel**

Browser-use:
1. `/settings/display` → "Hell"
2. Erwartung: Sidebar-Icon (oben) ändert Farbe zu Dunkel; Hintergrund hell
3. "Dunkel" → Icon zu Hell

- [ ] **Step 4: Account-Flow**

Browser-use:
1. `/settings/account` → Anmelden-Form sichtbar
2. "test@test.de" + "123456" → Anmelden klicken → 500 ms Loading → Eingeloggt-View mit "test@test.de" + "Pro aktiv"-Badge
3. Abmelden → zurück zur Anmelden-Form

- [ ] **Step 5: PaywallDialog-Link**

Browser-use:
1. Im `/settings/pro` den Dev-Toggle aus → Pro-Status false
2. `/draw` → 6 Übungen speichern → PaywallDialog öffnet sich
3. "Bereits ein Konto? Anmelden" klicken → Dialog zu, Navigation zu `/settings/account`

- [ ] **Step 6: /tv-Icon und kein Splash**

Browser-use:
1. Neuer Tab → direkt `/tv` → Icon dezent oben links sichtbar, **kein** Splash
2. QR + Code sichtbar

- [ ] **Step 7: Dev-Server stoppen**

Run: `pkill -f "vite dev"`

- [ ] **Step 8: Abschluss-Commit (Doku, optional)**

Keine Code-Änderungen nötig, wenn alle Checks grün. Falls Anpassungen — separate Commits, dann hier vermerken.

---

## Task 14: Deploy auf Mittwald

**Files:** —

- [ ] **Step 1: Push auf mittwald-Remote**

Run: `cd ~/Developer/tt-playbook-trainer && git push mittwald main`
Erwartung: Post-Receive-Hook läuft (checkout → npm install → vite build → touch .restart-trigger). Output enthält keine Errors.

- [ ] **Step 2: Live-Check**

Warten ~30 s. Dann:
- Browser-use: https://trainer.tt-playbook.de öffnen → Splash sichtbar → `/draw`
- `/settings/account` → Login-Form
- Theme-Switch → Logo-Farbe folgt

- [ ] **Step 3: Bei Fehler**

Falls Splash nicht erscheint oder Layout-Fehler: Logs ziehen via `ssh mittwald-tt 'tail -50 /tmp/app.log'`.

---

## Self-Review (nach Plan-Abschluss)

**Spec-Coverage:**
- ✅ Logo-Asset theme-reaktiv → Task 1, 2 (currentColor in SVGs)
- ✅ Splash-Overlay Cold-Start → Task 3 (Helper), 4 (Komponente), 5 (Layout)
- ✅ Icon in Sidebar oben → Task 6
- ✅ Icon auf /tv → Task 7
- ✅ Mock-Login-UI → Task 8 (Store), 9 (Nav aktiviert), 10 (Seite)
- ✅ PaywallDialog-Link → Task 11
- ✅ sessionStorage-Flag (kein Splash bei SPA-Nav) → Task 3, 5
- ✅ /tv ohne Splash → Task 3 (shouldShowSplash gibt false für /tv*)
- ✅ Theme-Wechsel ohne Reload → CSS currentColor — kein extra Code
- ✅ Akzeptanzkriterium „Logout entfernt Pro-Status" → Task 8, `logout()` ruft `setPro(false)`
- ✅ Tests grün, svelte-check 0 → Task 12
- ✅ Browser-Verifikation aller 8 Akzeptanzkriterien → Task 13

**Placeholder-Scan:** Kein TBD/TODO, kein „handle edge cases", alle Code-Steps enthalten vollständigen Code.

**Typ-Konsistenz:**
- `MockUser` / `MockUserApi` konsistent zwischen `mock-user-api.ts` und `mock-user.svelte.ts` ✓
- `SPLASH_SESSION_KEY` einmal exportiert, von zwei Stellen importiert ✓
- `AppLogo`/`AppIcon` beide mit `size`-Prop ✓
- `Splash`-Komponente: `ondone`-Callback (Svelte 5 Convention), nicht `on:done` ✓
