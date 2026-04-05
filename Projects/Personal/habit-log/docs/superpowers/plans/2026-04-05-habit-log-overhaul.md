# Habit Log Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Take ownership of the Habit Log app from Lovable, polish the UI (Direction A), set up GitHub + Vercel hosting, and make it installable as an iOS standalone PWA with a Ring Check icon.

**Architecture:** Pure Vite + React SPA. No backend. All data in localStorage. Three independent phases: (1) repo cleanup, (2) visual polish via CSS tokens and component tweaks, (3) iOS PWA via vite-plugin-pwa + manifest + icons.

**Tech Stack:** Vite 5, React 18, TypeScript, Tailwind CSS v3, shadcn/ui, next-themes, vite-plugin-pwa (new)

---

## File Map

### Phase 1 — Housekeeping
- Modify: `package.json` — rename app
- Modify: `.gitignore` — add `.superpowers/`
- Create: `vercel.json` — SPA rewrite rule
- Rewrite: `README.md` — replace Lovable boilerplate
- Delete: `bun.lockb` — keep only npm lock

### Phase 2 — Visual Polish
- Modify: `src/index.css` — refined color tokens, typography globals
- Modify: `src/components/TodayProgressCard.tsx` — larger percentage, heavier bar
- Modify: `src/components/TodayHabitCard.tsx` — visible pending ring, de-emphasise done items
- Modify: `src/components/PageLayout.tsx` — sticky header with backdrop blur

### Phase 3 — iOS PWA
- Modify: `package.json` — add vite-plugin-pwa devDep
- Modify: `vite.config.ts` — register VitePWA plugin
- Create: `public/manifest.json` — PWA manifest
- Create: `public/icon.svg` — Ring Check source SVG
- Create: `scripts/generate-icons.js` — Node script → PNG assets
- Create: `public/icon-192.png`, `public/icon-512.png`, `public/apple-touch-icon.png` — generated
- Modify: `index.html` — remove Lovable meta, add PWA meta tags
- Modify: `src/index.css` — iOS tap/scroll CSS fixes
- Modify: `.gitignore` — exclude generated service worker files

---

## Task 1: Repository Housekeeping

**Files:**
- Modify: `package.json`
- Modify: `.gitignore`
- Create: `vercel.json`
- Delete: `bun.lockb`

- [ ] **Step 1: Rename package**

In `package.json`, change line 2:
```json
"name": "habit-log",
```

- [ ] **Step 2: Add .superpowers to .gitignore**

Append to `.gitignore`:
```
# Superpowers brainstorm sessions
.superpowers/
```

- [ ] **Step 3: Create vercel.json**

Create `vercel.json` at repo root:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

- [ ] **Step 4: Delete bun lockfile**

```bash
rm bun.lockb
```

- [ ] **Step 5: Verify dev still starts**

```bash
npm install && npm run dev
```
Expected: dev server starts at http://localhost:8080 with no errors.

- [ ] **Step 6: Commit**

```bash
git add package.json .gitignore vercel.json
git rm bun.lockb
git commit -m "chore: rename package, add vercel.json, drop bun lockfile"
```

---

## Task 2: Rewrite README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace README content**

Replace the entire file with:
```markdown
# Habit Log

A personal habit tracker and goal manager. Mobile-first, runs in the browser, data stored locally.

## Stack

- Vite + React 18 + TypeScript
- Tailwind CSS + shadcn/ui
- Data: localStorage (no backend)

## Dev

```bash
npm install
npm run dev        # http://localhost:8080
npm run build      # production build → dist/
```

## Deploy

Hosted on Vercel. Push to `main` → auto-deploys.

## iOS

Installable as a standalone app: open in Safari → Share → Add to Home Screen.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: rewrite README, remove Lovable boilerplate"
```

---

## Task 3: Visual Polish — CSS Tokens and Typography

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Refine light mode color tokens**

In `src/index.css`, replace the `:root` block (lines 5–32) with:
```css
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 6.7%;
    --card: 0 0% 98.5%;
    --card-foreground: 0 0% 6.7%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 6.7%;
    --primary: 214 84% 56%;
    --primary-foreground: 0 0% 100%;
    --secondary: 0 0% 95.3%;
    --secondary-foreground: 0 0% 40%;
    --muted: 0 0% 95.3%;
    --muted-foreground: 0 0% 45%;
    --accent: 0 0% 95.3%;
    --accent-foreground: 0 0% 29.4%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 98%;
    --success: 142 71% 45%;
    --success-foreground: 0 0% 100%;
    --warning: 38 92% 50%;
    --warning-foreground: 0 0% 100%;
    --border: 0 0% 90%;
    --input: 0 0% 90%;
    --ring: 214 84% 56%;
    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;
  }
```

- [ ] **Step 2: Refine dark mode tokens**

Replace the `.dark` block (the `--background` through `--ring` values inside `.dark`) with:
```css
  .dark {
    --background: 0 0% 8%;
    --foreground: 0 0% 95%;
    --card: 0 0% 12%;
    --card-foreground: 0 0% 95%;
    --popover: 0 0% 12%;
    --popover-foreground: 0 0% 95%;
    --primary: 214 84% 56%;
    --primary-foreground: 0 0% 100%;
    --secondary: 0 0% 15%;
    --secondary-foreground: 0 0% 90%;
    --muted: 0 0% 15%;
    --muted-foreground: 0 0% 65%;
    --accent: 0 0% 18%;
    --accent-foreground: 0 0% 95%;
    --destructive: 0 62% 50%;
    --destructive-foreground: 0 0% 98%;
    --success: 142 71% 45%;
    --success-foreground: 0 0% 100%;
    --warning: 38 92% 50%;
    --warning-foreground: 0 0% 100%;
    --border: 0 0% 18%;
    --input: 0 0% 18%;
    --ring: 214 84% 56%;
    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;
  }
```

- [ ] **Step 3: Add typography globals**

In the `@layer base` block, update the `body` rule and add font feature settings:
```css
@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground font-sans;
    font-feature-settings: "cv11", "ss01";
    -webkit-font-smoothing: antialiased;
  }
}
```

- [ ] **Step 4: Verify in browser**

```bash
npm run dev
```
Open http://localhost:8080. Toggle dark/light mode. Cards should look slightly lifted (98.5% card bg vs 100% page bg). Border should look slightly lighter and softer.

- [ ] **Step 5: Commit**

```bash
git add src/index.css
git commit -m "feat: refine design tokens — card lift, softer borders, better contrast"
```

---

## Task 4: Visual Polish — TodayProgressCard

**Files:**
- Modify: `src/components/TodayProgressCard.tsx`

- [ ] **Step 1: Replace the component**

Replace the entire contents of `src/components/TodayProgressCard.tsx` with:
```tsx
interface TodayProgressCardProps {
  completedCount: number;
  totalCount: number;
  percentage: number;
}

export const TodayProgressCard = ({ completedCount, totalCount, percentage }: TodayProgressCardProps) => {
  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
        Today's progress
      </p>
      <div className="flex items-center justify-between mb-2">
        <span className="text-3xl font-bold tabular-nums text-foreground">{percentage}%</span>
        <span className="text-muted-foreground text-sm">
          {completedCount} / {totalCount} completed
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Verify in browser**

Open http://localhost:8080 (Today page). The percentage should be `text-3xl` and bolder, the progress bar visibly heavier (h-2 vs h-1.5), and the label should read in small uppercase.

- [ ] **Step 3: Commit**

```bash
git add src/components/TodayProgressCard.tsx
git commit -m "feat: progress card — larger pct, heavier bar, uppercase label"
```

---

## Task 5: Visual Polish — TodayHabitCard

**Files:**
- Modify: `src/components/TodayHabitCard.tsx`

- [ ] **Step 1: Add visible pending ring**

In `src/components/TodayHabitCard.tsx`, find the toggle button's `default` state class string (around line 143):
```tsx
toggleState === "default" && "border-border text-muted-foreground hover:border-primary hover:ring-2 hover:ring-primary/20 active:ring-4 active:ring-primary/20",
```
Replace with:
```tsx
toggleState === "default" && "border-muted-foreground/40 text-muted-foreground ring-2 ring-muted/40 hover:border-primary hover:ring-primary/30 active:ring-4 active:ring-primary/20",
```

- [ ] **Step 2: De-emphasise completed habit rows**

Find the outer `<div>` with the `cn(...)` classes starting at around line 122. The `done` case currently is:
```tsx
toggleState === "done" && "bg-emerald-50/60 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800",
```
Replace with:
```tsx
toggleState === "done" && "bg-emerald-50/40 dark:bg-emerald-900/10 border border-emerald-200/60 dark:border-emerald-800/60 opacity-75",
```

- [ ] **Step 3: Verify in browser**

Open Today page. Pending habits should show a faint ring around their toggle circle. Completed habits should appear slightly dimmed, making pending ones visually stand out.

- [ ] **Step 4: Commit**

```bash
git add src/components/TodayHabitCard.tsx
git commit -m "feat: habit card — visible pending ring, dimmed completed rows"
```

---

## Task 6: Visual Polish — PageLayout Sticky Header

**Files:**
- Modify: `src/components/PageLayout.tsx`

- [ ] **Step 1: Add sticky frosted-glass header**

Replace the entire file with:
```tsx
import { ReactNode } from "react";

interface PageLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  headerRight?: ReactNode;
}

export const PageLayout = ({
  children,
  title,
  subtitle,
  action,
  headerRight
}: PageLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header with frosted glass on scroll */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-sm border-b border-border/50 px-4 py-3">
        <div className="flex items-start justify-between gap-4 max-w-3xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {headerRight}
            {action}
          </div>
        </div>
      </div>

      {/* Page content */}
      <div className="p-4 pb-24 space-y-6 max-w-3xl mx-auto">
        {children}
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Verify in browser**

Open /habits or /goals page. Scroll down — the header should stay fixed at the top with a slight frosted-glass blur over the content scrolling behind it.

- [ ] **Step 3: Commit**

```bash
git add src/components/PageLayout.tsx
git commit -m "feat: PageLayout sticky header with backdrop blur"
```

---

## Task 7: Generate Ring Check Icon Assets

**Files:**
- Create: `public/icon.svg`
- Create: `scripts/generate-icons.js`
- Create (generated): `public/icon-192.png`, `public/icon-512.png`, `public/apple-touch-icon.png`

- [ ] **Step 1: Install sharp**

```bash
npm install --save-dev sharp
```

- [ ] **Step 2: Create source SVG**

Create `public/icon.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <!-- Background -->
  <rect width="100" height="100" rx="22" fill="#1a2e4a"/>
  <!-- Progress ring (faint track) -->
  <circle cx="50" cy="50" r="34" fill="none" stroke="rgba(59,130,246,0.2)" stroke-width="6"/>
  <!-- Progress ring (arc ~75% complete) -->
  <circle cx="50" cy="50" r="34" fill="none" stroke="#3b82f6" stroke-width="6"
    stroke-dasharray="213.6" stroke-dashoffset="53"
    stroke-linecap="round"
    transform="rotate(-90 50 50)"/>
  <!-- Checkmark -->
  <polyline points="32,50 44,63 68,36" fill="none" stroke="white" stroke-width="6"
    stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

- [ ] **Step 3: Create icon generation script**

Create `scripts/generate-icons.js`:
```js
import sharp from 'sharp';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const svgPath = join(__dirname, '../public/icon.svg');
const svgBuffer = readFileSync(svgPath);

const sizes = [
  { size: 512, name: 'icon-512.png' },
  { size: 192, name: 'icon-192.png' },
  { size: 180, name: 'apple-touch-icon.png' },
];

for (const { size, name } of sizes) {
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(join(__dirname, '../public', name));
  console.log(`Generated public/${name} (${size}×${size})`);
}
```

- [ ] **Step 4: Run icon generation**

```bash
node scripts/generate-icons.js
```
Expected output:
```
Generated public/icon-512.png (512×512)
Generated public/icon-192.png (192×192)
Generated public/apple-touch-icon.png (180×180)
```

- [ ] **Step 5: Verify icons exist**

```bash
ls -lh public/icon-512.png public/icon-192.png public/apple-touch-icon.png
```
Expected: all three files present, each a few KB.

- [ ] **Step 6: Commit**

```bash
git add public/icon.svg public/icon-192.png public/icon-512.png public/apple-touch-icon.png scripts/generate-icons.js
git commit -m "feat: add Ring Check icon assets (SVG + generated PNGs)"
```

---

## Task 8: Install vite-plugin-pwa

**Files:**
- Modify: `package.json` (via npm install)
- Modify: `vite.config.ts`

- [ ] **Step 1: Install plugin**

```bash
npm install --save-dev vite-plugin-pwa
```

- [ ] **Step 2: Update vite.config.ts**

Replace the entire file with:
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: false,
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
      },
    }),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
```

- [ ] **Step 3: Verify dev still works**

```bash
npm run dev
```
Expected: server starts, no TypeScript errors about VitePWA.

- [ ] **Step 4: Commit**

```bash
git add vite.config.ts package.json package-lock.json
git commit -m "feat: add vite-plugin-pwa for service worker generation"
```

---

## Task 9: PWA Manifest

**Files:**
- Create: `public/manifest.json`

- [ ] **Step 1: Create manifest**

Create `public/manifest.json`:
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
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

- [ ] **Step 2: Commit**

```bash
git add public/manifest.json
git commit -m "feat: add PWA manifest"
```

---

## Task 10: Update index.html — PWA Meta Tags + Remove Lovable Branding

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Replace index.html**

Replace the entire file with:
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
    <title>Habit Log</title>
    <meta name="description" content="Track habits and set goals" />
    <meta name="author" content="Minh" />

    <!-- PWA / iOS standalone -->
    <link rel="manifest" href="/manifest.json" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="Habits" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

    <!-- Theme color (light/dark) -->
    <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
    <meta name="theme-color" content="#141414" media="(prefers-color-scheme: dark)" />

    <!-- Favicon -->
    <link rel="icon" type="image/png" href="/icon-192.png" />

    <!-- Open Graph -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content="Habit Log" />
    <meta property="og:description" content="Track habits and set goals" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Verify in browser**

```bash
npm run dev
```
Open http://localhost:8080. Check browser tab — should show the favicon (icon-192.png). Open DevTools → Application → Manifest — should show the manifest loaded with icons.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: update index.html — PWA meta tags, remove Lovable branding"
```

---

## Task 11: iOS CSS Fixes + .gitignore Service Worker Entries

**Files:**
- Modify: `src/index.css`
- Modify: `.gitignore`

- [ ] **Step 1: Add iOS-specific CSS**

In `src/index.css`, add the following immediately after the closing `}` of the `@layer base` block (after line ~77):
```css
/* iOS PWA fixes */
* {
  -webkit-tap-highlight-color: transparent;
}

html, body {
  overscroll-behavior: none;
}
```

- [ ] **Step 2: Add service worker files to .gitignore**

Append to `.gitignore`:
```
# Generated service worker files (vite-plugin-pwa)
public/sw.js
public/sw.js.map
public/workbox-*.js
public/workbox-*.js.map
```

- [ ] **Step 3: Verify build generates service worker**

```bash
npm run build
ls dist/sw.js dist/workbox-*.js
```
Expected: `sw.js` and at least one `workbox-*.js` file present in `dist/`.

- [ ] **Step 4: Commit**

```bash
git add src/index.css .gitignore
git commit -m "feat: iOS PWA CSS fixes + gitignore service worker files"
```

---

## Task 12: End-to-End Verification

- [ ] **Step 1: Full production build**

```bash
npm run build
npm run preview
```
Open http://localhost:4173. Navigate between all 5 pages (Today, Calendar, Habits, Goals, Stats). Confirm no visual regressions.

- [ ] **Step 2: Verify service worker**

In Chrome/Safari DevTools → Application → Service Workers: confirm `sw.js` is registered and active.

- [ ] **Step 3: iOS Add to Home Screen test**

Deploy to Vercel (or use an HTTPS preview URL). On iPhone:
1. Open in Safari
2. Share → Add to Home Screen
3. Name: "Habits" (or "Habit Log")
4. Launch from home screen
5. Confirm: no Safari URL bar, status bar tinted blue, bottom nav clears the home indicator

- [ ] **Step 4: GitHub push**

```bash
git remote add origin https://github.com/minhvn/habit-log.git
git push -u origin main
```

- [ ] **Step 5: Vercel connect**

1. Go to vercel.com → New Project → Import from GitHub → `minhvn/habit-log`
2. Framework Preset: Vite
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Deploy — no env vars needed

---

## Summary

| Task | Scope | Risk |
|---|---|---|
| 1 | Repo housekeeping (package, gitignore, vercel.json) | None |
| 2 | README rewrite | None |
| 3 | CSS tokens + typography | Low |
| 4 | TodayProgressCard | Low |
| 5 | TodayHabitCard | Low |
| 6 | PageLayout sticky header | Low |
| 7 | Ring Check icon generation | Low |
| 8 | vite-plugin-pwa install | Low |
| 9 | manifest.json | None |
| 10 | index.html PWA meta | None |
| 11 | iOS CSS + .gitignore | None |
| 12 | E2E verification + deploy | None |
