# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Pipfolio** is a mobile-first XAU/USD trading journal app. Traders log P&L per day, view a monthly calendar of daily results, track multiple accounts (personal/funded/demo), and see win rate and net P&L stats. The visual design reference is the bundled prototype at `~/Downloads/Gold Weekly Profit and Loss.html` — warm paper/clay color palette (`#15140F` dark background, `#C25E3A` clay accent, `#FAF8F3` light), dark mode, Plus Jakarta Sans font.

## ⚠️ Important: Read Next.js docs before writing code

This project uses **Next.js 16**, which has breaking changes from earlier versions. APIs, conventions, and file structure may differ from training data. Before writing any code that touches Next.js internals, read the relevant guide in `node_modules/next/dist/docs/`.

## Commands

```bash
npm run dev          # Start dev server with Turbopack on http://localhost:3000
npm run build        # Production build (also runs tsc + lint)
npm run lint         # ESLint only
npx tsc --noEmit     # Type check only

npm run db:generate  # Generate Drizzle migration files from schema changes
npm run db:migrate   # Apply pending migrations to the database
npm run db:studio    # Open Drizzle Studio (local DB GUI)
```

No test runner is configured. Use `npm run lint && npx tsc --noEmit` as the quality gate.

To add a shadcn component: `npx shadcn@latest add <component-name>`

## Architecture

### Feature-Module structure

Business logic lives under `src/features/<domain>/`:

```
src/features/<domain>/
  actions/
    index.ts        ← barrel re-export only (no 'use server' here)
    <sub-domain>.ts ← 'use server' at top of each file
  components/
  hooks/
  schemas/
    index.ts        ← barrel re-export only
    <form>.schema.ts
  store/
    <domain>.store.ts  ← zustand (business state only)
  types.ts
  utils/
    index.ts
    <topic>.ts
```

**Current slices:**

| Slice | Responsibility |
|-------|---------------|
| `auth` | Session management — login, register, sign out, protected home page via better-auth + Postgres/Drizzle |

**Planned slices (build these next):**

| Slice | Responsibility |
|-------|---------------|
| `accounts` | CRUD for trading accounts (name, type: personal/funded/demo, currency) |
| `trades` | Log daily P&L entries per account (date, P&L amount, win/loss, optional entry/exit prices, notes) |
| `journal` | Monthly calendar view aggregating daily P&L; win rate and net P&L stats |

**Dependency direction:** Slices must not import from each other. Shared code goes in `@/components/shared/` or `@/lib/`.

**Shared presentational components** (`src/components/shared/`) must not import from any feature slice:
- `form-controls.tsx` — `Field` (label wrapper) and `Toggle` (accessible switch)
- `thumb.tsx` — generic image placeholder
- `theme-toggle.tsx` — light/dark theme switch (next-themes)
- `navigation-progress.tsx` — top-of-page loading bar (nprogress)
- `page-shell.tsx` — heading + description wrapper
- `icons.tsx` — `Icons` map of lucide icons

**Rules enforced by reviewers:**
- `'use server'` goes on each action file, never on `index.ts`
- Auth check must be the **first** thing in every action — derive identity from session cookie server-side, never from a caller-supplied id (IDOR risk)
- `revalidatePath()` / `revalidateTag()` must be called **after** the mutation commits
- Actions that return `{ error?: string }` must `return { error: '...' }` on failure, not `throw`
- Generic utilities (`formatDate`, money formatting) → `src/lib/<topic>/` with `index.ts` barrel. Domain-aware helpers → `src/features/<domain>/utils/`. Never put a generic formatter inside a feature `utils/`
- Component files: **kebab-case** filename, **PascalCase** export (`login-screen.tsx` → `LoginScreen`)
- **Every form: React Hook Form + Zod.** Schema in `schemas/<form>.schema.ts`, `useForm({ resolver: zodResolver(schema), defaultValues })`. Avoid `z.coerce` and `.default()` (breaks `exactOptionalPropertyTypes`). Errors via `Field`'s `error` prop.

### Auth conventions

`auth` calls better-auth's client (`signIn.email` / `signUp.email`) directly from Client Components — no custom server action wrapper, because better-auth's `nextCookies()` plugin owns the session cookie. Server components and actions call `requireSession()` / `getSession()` from `src/lib/better-auth/session.ts`.

### Database schema

Tables live in `src/lib/db/schema/`. Currently: `user`, `session`, `account`, `verification` (all better-auth managed). New domain tables (e.g. `trading_account`, `trade`) go here as new `*.table.ts` files, exported from `schema/index.ts`.

After adding a table: `npm run db:generate` → `npm run db:migrate`.

### Route groups

- `src/app/(auth)/` → `/login`, `/register` — unauthenticated
- `src/app/page.tsx` — protected root, shows signed-in user

Route protection is in `src/proxy.ts` (Next.js 16 middleware equivalent): optimistic cookie-presence check redirects unauthenticated → `/login`. `src/app/page.tsx` re-verifies via `requireSession()` server-side.

### Environment variables

`src/env.ts` — server-only, Zod-validated. `DATABASE_URL` and `BETTER_AUTH_SECRET` (min 32 chars) are required. Never import from Client Components (`server-only` guard makes it a build error). For `NEXT_PUBLIC_*` vars, add `src/env.client.ts`.

### Design system

Colors must match the Pipfolio prototype. Update `src/app/globals.css` (the only Tailwind config — no `tailwind.config.ts`):
- Dark background: `#15140F` (near-black warm brown)
- Clay accent: `#C25E3A` (burnt orange/terracotta)
- Light surface: `#FAF8F3` (warm off-white paper)
- Font: Plus Jakarta Sans (already configured via `--font-plus-jakarta-sans` in `globals.css`)
- Class-based dark mode via `@custom-variant dark (&:where(.dark, .dark *))` — toggle `.dark` on `<html>`

The current `globals.css` has a generic white/neutral palette — swap in the Pipfolio warm palette when building any trading journal UI.

### TanStack Query v5

`src/app/providers.tsx` wraps the app in `QueryClientProvider`. Server-prefetched data: `prefetchQuery` + `HydrationBoundary` in Server Components, `useQuery` with the same key in the Client Component. Query hooks live in `src/features/<domain>/hooks/`. Guard fetches with `enabled: !!userId`.

### Zustand

1. **Server state** → TanStack Query
2. **Client business/domain state** → Zustand (`src/features/<domain>/store/<domain>.store.ts`)
3. **UI state** (drawers, toggles) → `useState` in the owning component

Never return a fresh object/array from a selector (infinite re-render in v5) — use multiple primitive selectors or `useShallow`. Persisted stores: always `skipHydration: true`, rehydrate via `useIsomorphicLayoutEffect` on mount.

### shadcn/ui

Style: **New York**, base color: **Neutral**, CSS variables: **yes**. Components in `src/components/ui/`. Use `sonner` for toasts, not the deprecated `toast`.

### TypeScript strictness

`tsconfig.json` enables beyond `strict: true`:
- `noUncheckedIndexedAccess` — all array/object index reads may be `undefined`
- `exactOptionalPropertyTypes` — `prop={undefined}` is an error when type is `T` not `T | undefined`
- `noImplicitOverride`, `noFallthroughCasesInSwitch`
