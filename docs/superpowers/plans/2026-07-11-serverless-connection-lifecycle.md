# Serverless Connection Lifecycle Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop the Postgres client from silently reusing connections that may have gone stale between frozen/thawed Vercel serverless invocations, by adding `postgres.js`'s documented `idle_timeout` and `max_lifetime` settings.

**Architecture:** One-line-equivalent config change to the existing `postgres()` client factory in `src/lib/db/client.ts`. No new files, no schema/query/auth changes. Verification is manual (deploy + time real operations) since this project has no automated test runner (per `CLAUDE.md`: `npm run lint && npx tsc --noEmit` is the quality gate).

**Tech Stack:** `postgres` (postgres.js) npm package, Drizzle ORM, Next.js 16, Vercel, Supabase (Postgres + Supavisor pooler).

---

### Task 1: Add idle_timeout and max_lifetime to the Postgres client

**Files:**
- Modify: `src/lib/db/client.ts:9`

- [ ] **Step 1: Update the `postgres()` call**

Current content of `src/lib/db/client.ts`:

```ts
import 'server-only'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '@/env'
import * as schema from './schema'

export type Db = ReturnType<typeof drizzle<typeof schema>>

export const db = drizzle(postgres(env.DATABASE_URL, { max: 20, prepare: false }), { schema })
```

Replace the last line with:

```ts
export const db = drizzle(
  postgres(env.DATABASE_URL, {
    max: 20,
    prepare: false,
    idle_timeout: 20,
    max_lifetime: 60 * 30,
  }),
  { schema },
)
```

Full resulting file:

```ts
import 'server-only'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '@/env'
import * as schema from './schema'

export type Db = ReturnType<typeof drizzle<typeof schema>>

export const db = drizzle(
  postgres(env.DATABASE_URL, {
    max: 20,
    prepare: false,
    idle_timeout: 20,
    max_lifetime: 60 * 30,
  }),
  { schema },
)
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both exit 0, no new errors (the project has 3 pre-existing warnings in `add-account-form.tsx`, `calc-form.tsx`, `quick-pnl-form.tsx` about React Hook Form's `watch()` — unrelated to this change, ignore them).

- [ ] **Step 3: Local sanity check**

Run: `npm run dev`, then in another terminal register a throwaway account and hit both dynamic routes:

```bash
EMAIL="conn-check-$(date +%s)@example.com"
curl -s -c /tmp/conn-check-cookies.txt -b /tmp/conn-check-cookies.txt -X POST http://localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"Password123!\",\"name\":\"Conn Check\"}" \
  -o /dev/null -w "signup HTTP:%{http_code}\n"
curl -s -b /tmp/conn-check-cookies.txt -o /dev/null -w "journal HTTP:%{http_code}\n" http://localhost:3000/journal
curl -s -b /tmp/conn-check-cookies.txt -o /dev/null -w "accounts HTTP:%{http_code}\n" http://localhost:3000/accounts
```

Expected: all three requests return `HTTP:200` — confirms the new client config didn't break the connection.

Clean up the throwaway user afterward:

```bash
DB_URL=$(grep -oP 'DATABASE_URL=\K.*' .env.local | tr -d '"')
DB_URL="$DB_URL" node -e "
const postgres = require('postgres');
const sql = postgres(process.env.DB_URL, { prepare: false });
(async () => {
  const rows = await sql\`DELETE FROM \"user\" WHERE email LIKE 'conn-check-%@example.com' RETURNING email\`;
  console.log('deleted:', rows);
  await sql.end();
})();
"
```

Stop the local dev server afterward if you started it for this check.

- [ ] **Step 4: Commit**

```bash
git add src/lib/db/client.ts
git commit -m "$(cat <<'EOF'
Add idle_timeout/max_lifetime to Postgres client for serverless

Prevents silently reusing a connection that may have gone stale while a
Vercel serverless instance sat frozen between invocations — the client
now proactively closes idle (20s) or aged-out (30min) connections instead
of finding out mid-query that the server side already dropped them.
EOF
)"
```

---

### Task 2: Deploy and verify in production

**Files:** none (deployment + manual verification only)

- [ ] **Step 1: Push the branch and deploy**

Push `chore/cleanup-and-perf-fixes` (or merge it to whatever branch triggers your Vercel deployment) so the change goes live. This step is manual/environment-specific — confirm with the user how their Vercel deployment is triggered (auto-deploy on push to `main`, a preview deployment per branch, etc.) before pushing, since pushing affects a shared remote.

- [ ] **Step 2: Time real operations on the deployed app**

In the deployed app (not local dev), time:
- Adding a trade (Quick P&L or Calculator form)
- Loading `/journal`
- Loading `/accounts`
- Switching between accounts

Compare against the latency experienced before this change. There's no automated benchmark for this — it's a subjective "does it feel faster" check per the spec, since the original complaint was felt latency, not a specific measured number.

- [ ] **Step 3: Check Vercel Fluid Compute setting (informational, no code change)**

In the Vercel dashboard, under Project Settings → Functions, check whether **Fluid Compute** is enabled. This doesn't require a change as part of this plan, but if the app is still consistently slow after Task 1's fix, this is the next thing to check (it controls how aggressively Vercel reuses warm instances between requests, which affects how often a fresh connection needs to be established at all).

- [ ] **Step 4: Decide on next steps**

If the deployed app now feels acceptably fast: done, no further action needed.

If it's still consistently slow: per the spec's verification section, the next step (a separate, future spec — not part of this plan) would be piloting Supabase's HTTP-based Data API (`supabase-js`, `.from()`/`.rpc()`) on one hot-path query such as `getAccountsWithStats` (`src/features/accounts/actions/accounts.ts`), deploying that pilot, and comparing real timings before considering a fuller migration away from Drizzle.
