# nextjs-vertical-slice-starter-pack

A Next.js 16 starter that demonstrates **vertical-slice architecture**: business logic organized by feature/domain rather than by technical layer, with a working example included.

## What is vertical-slice architecture

Instead of splitting code horizontally (`controllers/`, `services/`, `models/`), each feature owns everything it needs — its own actions, components, hooks, schemas, and types — in one folder:

```
src/features/<domain>/
  actions/      ← server actions ('use server')
  components/   ← feature UI
  hooks/        ← TanStack Query hooks
  schemas/      ← Zod schemas + inferred types for forms
  store/        ← Zustand store (client-only domain state)
  types.ts
  utils/        ← domain-aware helpers
```

Slices don't import from each other — shared code lives in `src/components/shared/` or `src/lib/`. This keeps features independently understandable and deletable.

## What's included

- **`auth` feature slice** — login/register on better-auth (`src/lib/better-auth/`), Postgres via Drizzle ORM (`src/lib/db/`)
- **shadcn/ui** components (New York style) in `src/components/ui/`
- **TanStack Query v5** setup (`src/app/providers.tsx`, `src/lib/query-client.ts`) for server state
- **Zustand** conventions for client-only domain state
- **React Hook Form + Zod** convention for every form
- **TailwindCSS v4** (config lives in `src/app/globals.css`, no `tailwind.config.ts`)
- A protected home page (`/`) showing the signed-in user, guarded by `src/proxy.ts`

See [CLAUDE.md](./CLAUDE.md) for the full architectural rulebook (naming conventions, dependency rules, TypeScript strictness, etc.) — it's written for both humans and Claude Code.

## Adding a new slice

1. Create `src/features/<your-domain>/` with whichever of `actions/`, `components/`, `hooks/`, `schemas/`, `store/`, `types.ts`, `utils/` you need
2. Add a route under `src/app/` that renders your slice's components
3. Keep pages under `src/app/` thin — business logic stays in the slice

## Quickstart

Needs a Postgres database — any reachable instance works (a local install, or a free hosted one like Neon, Supabase, or Railway).

```bash
npm install
cp .env.local.example .env.local   # fill in DATABASE_URL and BETTER_AUTH_SECRET
npm run db:generate && npm run db:migrate
npm run dev                        # http://localhost:3000
```

Visit `/register` to create an account — you'll land on `/`, a protected page showing your session's user (derived server-side via `requireSession()` in `src/lib/better-auth/session.ts`, never from client input).

Other commands:

```bash
npm run build     # production build (also runs tsc + lint)
npm run lint      # ESLint only
npx tsc --noEmit  # type check only
npm run db:studio # Drizzle Studio
```

Use `npx drizzle-kit push` for ad-hoc schema syncing during prototyping — the checked-in workflow is `db:generate` + `db:migrate`.
