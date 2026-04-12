# CLAUDE.md

## Project

Personal habit tracker and goal manager. Track daily habits, set goals, view stats, and browse a calendar of past completions. Mobile-first, installable as an iOS PWA. Single user, no auth, all data stored in localStorage.

## Stack

- Vite
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui
- react-router-dom — client-side routing
- TanStack Query — async state
- react-hook-form + zod — form handling and validation
- recharts — stats charts
- date-fns — date utilities
- vite-plugin-pwa — service worker + PWA manifest
- Vercel — auto-deploy on push to main

## Architecture

SPA with 5 main pages: **Today** (daily habit checklist), **Habits** (manage habit list), **Goals** (set and track goals), **Calendar** (monthly completion grid), **Stats** (charts and streaks). All state lives in `src/contexts/AppContext.tsx` backed by localStorage — no server, no DB. `PeopleSettingsContext.tsx` manages user/people settings. Components are in `src/components/`, pages in `src/pages/`, shared utilities in `src/lib/` and `src/utils/`. iOS standalone: open in Safari → Share → Add to Home Screen.

## Commands

```bash
npm run dev     # http://localhost:8080
npm run build   # production build → dist/
```
