# Habit Log — Overhaul Design Spec
**Date:** 2026-04-05
**Status:** Awaiting approval

---

## Overview

Three-part overhaul of the existing Habit Log app:
1. **Direction A visual polish** — refine the current UI without breaking anything
2. **GitHub + independent hosting** — take full ownership, deploy to Vercel
3. **iOS standalone PWA** — make the app installable on iPhone as a home screen app

---

## Part 1: GitHub & Hosting Setup

### Housekeeping before push
- `package.json` name: `"vite_react_shadcn_ts"` → `"habit-log"`
- `README.md`: replace Lovable boilerplate with a real description
- `index.html`: remove Lovable OG images, set author to owner's name, add proper PWA meta tags (see Part 3)
- Remove `bun.lockb` (keep `package-lock.json` as canonical lock file)
- Add `.superpowers/` to `.gitignore`

### GitHub
- Create repo `habit-log` under `minhvn` account (public)
- Push main branch
- No secrets, no env vars needed — safe to be public

### Vercel deployment
- Connect Vercel to the GitHub repo
- Build command: `npm run build`
- Output directory: `dist`
- Add `vercel.json` for SPA routing (required for React Router hard-refresh):
  ```json
  { "rewrites": [{ "source": "/(.*)", "destination": "/" }] }
  ```
- No environment variables needed

---

## Part 2: Direction A — Visual Polish

**Philosophy:** Raise the quality bar on what's already there. No structural changes, no new pages, no component replacements. Every existing component stays — only spacing, color, and typography tokens change.

### Color tokens (index.css)

Light mode refinements:
- `--background`: stay white (`0 0% 100%`)
- `--card`: slightly warmer (`0 0% 98.5%`) — subtle lift over background
- `--border`: slightly lighter (`0 0% 90%`) — less harsh
- `--muted-foreground`: `0 0% 45%` — slightly darker for better readability
- `--primary`: keep `214 84% 56%` (current blue is good)
- Add `--card-shadow`: `0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)` — used on all cards

Dark mode refinements:
- `--background`: `0 0% 8%` (slightly lighter than current 7% — easier on eyes)
- `--card`: `0 0% 12%` (up from 11%)
- `--border`: `0 0% 18%` (tightened)

### Typography

- Add `font-feature-settings: "cv11", "ss01"` to body for better digit rendering
- Page titles (`text-2xl font-bold`): add `tracking-tight` utility class
- Section labels (uppercase small text): standardize to `text-[11px] font-semibold tracking-wider`
- Stat numbers (percentages, streaks): apply `tabular-nums` for alignment stability

### Component refinements

**Cards (all pages):**
- Border-radius: keep `rounded-2xl` (16px) — already good
- Add consistent `shadow-sm` using the new card shadow token
- Remove mixed shadow/no-shadow inconsistencies across components

**TodayProgressCard:**
- Progress bar height: `h-1.5` → `h-2` (slightly heavier, more visible)
- Percentage font: `text-2xl` → `text-3xl font-bold tabular-nums`
- Label text: add `text-[11px] uppercase tracking-wider` treatment

**TodayHabitCard:**
- Completion button: increase tap target clarity — add a visible ring on the pending state
- Completed state: keep green check, add a very subtle `opacity-60` to de-emphasize completed items (lets pending ones stand out)
- Streak indicator: make streak fire emoji + number a distinct visual unit

**BottomNavigation:**
- Active indicator: the current `::after` top bar is good — keep it
- Active label: bump to `font-semibold` (already has it) — ensure it's `text-[11px]`
- Bottom safe area: already has `pb-[env(safe-area-inset-bottom)]` ✓

**PageLayout (all page headers):**
- Consistent `px-4 py-3` padding across all page headers
- Header background: ensure sticky headers use `backdrop-blur-sm bg-background/90` for a frosted-glass scroll effect

### Dark mode
Already implemented via next-themes. Refinements:
- Ensure all new shadow tokens have dark-mode equivalents (use `rgba(0,0,0,0.3)` for dark card shadows)
- ThemeToggle stays in all page headers

---

## Part 3: iOS Standalone PWA

**Goal:** App is installable from iPhone Safari as a home screen icon. When launched, it runs fullscreen with no Safari chrome, matching a native app experience.

### Stack note
This is a **Vite + React** app, not Next.js. Implementation adapts from the ios-pwa-standalone skill accordingly.

### Dependencies
- Add `vite-plugin-pwa` (replaces `@ducanh2912/next-pwa` from the Next.js skill)

### Files to create

**`public/manifest.json`:**
```json
{
  "name": "Habit Log",
  "short_name": "Habits",
  "description": "Track habits and set goals",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

**`public/apple-touch-icon.png`** — 180×180px icon for iOS home screen

**`public/icon-192.png`** and **`public/icon-512.png`** — standard PWA icons

### `index.html` meta tags to add
```html
<link rel="manifest" href="/manifest.json" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="Habits" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
<meta name="theme-color" content="#141414" media="(prefers-color-scheme: dark)" />
```

### `vite.config.ts` update
Add `VitePWA` plugin:
```ts
import { VitePWA } from 'vite-plugin-pwa'

plugins: [
  react(),
  VitePWA({
    registerType: 'autoUpdate',
    manifest: false, // we manage manifest.json manually in public/
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg}']
    }
  }),
  ...
]
```

### `index.css` additions
```css
* { -webkit-tap-highlight-color: transparent; }
body { -webkit-font-smoothing: antialiased; }
html, body { overscroll-behavior: none; }
```

### `Layout.tsx` — no structural change needed
In standalone mode there is no Safari address bar, so `min-h-screen` is fine. The CSS additions above (`overscroll-behavior: none`) are what matters. The `pb-[env(safe-area-inset-bottom)]` already on `BottomNavigation` handles the home indicator.

### `.gitignore` additions
```
public/sw.js
public/sw.js.map
public/workbox-*.js
public/workbox-*.js.map
```

### Icon generation
Use a single source SVG or PNG → generate 192px, 512px, 180px sizes with a tool like `sharp` or [realfavicongenerator.net](https://realfavicongenerator.net).

### Verification
1. `npm run build` — service worker only generates on production build
2. Deploy to Vercel (HTTPS required for service workers; localhost also works)
3. Open on iPhone → Safari → Share → "Add to Home Screen"
4. Launch from home screen — confirm: no Safari chrome, status bar tinted, safe area visible below nav

---

## Out of scope
- Backend / cloud sync (localStorage stays)
- Authentication
- New pages or features
- Major layout restructuring (stays mobile-first, bottom nav, same 5 pages)
- Pull-to-refresh (can add in a future phase)

---

## Phases summary

| Phase | Work | Risk |
|---|---|---|
| 1 | GitHub housekeeping + Vercel setup | None |
| 2 | Visual polish (tokens, typography, card refinements) | Low |
| 3 | iOS PWA (manifest, icons, vite-plugin-pwa, meta tags) | Low |
