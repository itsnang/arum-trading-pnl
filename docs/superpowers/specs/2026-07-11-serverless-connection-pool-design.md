# Fix serverless connection-pool sizing for Supabase

## Context

Inserts and reads have consistently felt slow on the deployed (Vercel) version of the app — not just on the first request after idle, but every time. The user initially suspected Drizzle itself and wanted to migrate to Supabase RPC (calling Postgres functions via `supabase-js`'s `.rpc()`, which goes through PostgREST over HTTPS).

Before committing to that rewrite, we walked through the likely causes:

- **Region mismatch** (Vercel functions running far from the Supabase project's `ap-southeast-2` region) was considered and ruled out — the user confirmed the Vercel function region already matches.
- **Supabase free-tier project pausing** (common cause of "slow after being idle, then fine") was ruled out — the slowness is consistent on every request, not just after idle periods.
- What's left, and matches "consistently slow every single time" in a serverless deployment: **`src/lib/db/client.ts`** configures the `postgres.js` pool with `max: 20` — a pool size appropriate for one long-running server process, not a serverless function. On Vercel, each invocation can be its own isolated environment; opening (or being configured to open, even if not immediately used) up to 20 connections per invocation is unnecessary overhead, and can also contribute to exceeding Supabase's PgBouncer pooler connection limit under any concurrent traffic, causing new connections to queue.

Migrating to Supabase RPC would not obviously fix this — RPC calls still reach the same database over the network, and the actual root cause here is connection-pool sizing, not the choice of client/ORM. This fix is a one-line, easily-reversible test to try before considering any larger migration.

## Change

**`src/lib/db/client.ts`**: change `max: 20` → `max: 1` in the `postgres()` call. This matches Supabase's own documented guidance for serverless/edge environments: one connection per function invocation, relying on Supabase's PgBouncer pooler (already in use via the `:6543` transaction-mode pooler URL) to fan out across many concurrent invocations rather than each invocation holding its own multi-connection pool. `prepare: false` stays as-is — still required for PgBouncer's transaction-mode pooler (unrelated to this change).

No schema, query, or auth changes. No other files are touched.

## Verification

1. Deploy the change to Vercel.
2. In the deployed app, time a few real operations — adding a trade, loading `/journal`, switching accounts — and compare against the latency experienced before this change.
3. Separately (not a code change, just worth checking): in the Vercel dashboard, confirm whether **Fluid Compute** is enabled for the project. It affects how aggressively Vercel reuses warm instances between requests, which determines how often a fresh connection needs to be established at all. This is informational — no action required as part of this change unless the `max: 1` fix alone doesn't resolve the slowness.
4. If the deployed app is still consistently slow after this change, the next step (not part of this spec) would be piloting Supabase's HTTP-based Data API on one hot-path query (e.g. `getAccountsWithStats`) to measure whether `fetch()`-based connection reuse in Vercel's runtime meaningfully outperforms a raw Postgres connection in this specific serverless setup — only then would a fuller migration be worth considering.
