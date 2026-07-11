# Fix serverless connection lifecycle for Supabase

## Context

Inserts and reads have consistently felt slow on the deployed (Vercel) version of the app — not just on the first request after idle, but every time. The user initially suspected Drizzle itself and wanted to migrate to Supabase RPC (calling Postgres functions via `supabase-js`'s `.rpc()`, which goes through PostgREST over HTTPS).

Before committing to that rewrite, we walked through the likely causes:

- **Region mismatch** (Vercel functions running far from the Supabase project's `ap-southeast-2` region) was considered and ruled out — the user confirmed the Vercel function region already matches.
- **Supabase free-tier project pausing** (common cause of "slow after being idle, then fine") was ruled out — the slowness is consistent on every request, not just after idle periods.
- What's left, and matches "consistently slow every single time" in a serverless deployment: **`src/lib/db/client.ts`** configures the `postgres.js` pool with only `{ max: 20, prepare: false }` — no `idle_timeout` or `max_lifetime`. Checked against `postgres.js`'s own documentation (via context7) and Drizzle's official Supabase connection guide: Drizzle's documented Transaction-mode example for Supabase doesn't override `max` at all, so there's no doc support for forcing it down to `1`. What the docs *do* call out specifically for serverless is `idle_timeout`/`max_lifetime` — because a serverless function can be "frozen" between invocations and "thawed" later for a new one, a connection can sit idle for an unknown, potentially long period and then get reused in a later invocation. If Supabase's own PgBouncer has already closed that connection server-side in the meantime (it has its own idle timeout), the client doesn't know until it tries to use it — the query then fails or hangs and has to be detected as broken and retried. That failure-and-retry cycle, happening unpredictably depending on how long a given serverless instance sat idle before being reused, is a plausible source of the "slow every time, not just after idle" pattern the user described (each request can be a fresh instance not "warm" from the user's perspective, whether or not it's been an especially long gap).

Migrating to Supabase RPC would not obviously fix this — RPC calls still reach the same database over the network, and the actual root cause here is connection lifecycle management, not the choice of client/ORM. This fix is a small, easily-reversible config change to try before considering any larger migration.

## Change

**`src/lib/db/client.ts`**: add `idle_timeout: 20` (seconds) and `max_lifetime: 60 * 30` (30 minutes) to the `postgres()` call — the exact settings `postgres.js`'s own docs recommend for serverless/unstable environments, so idle or aged-out connections are proactively closed and replaced instead of silently reused after the server side may have already dropped them. `max: 20` and `prepare: false` stay as-is — neither is called out as wrong by the docs, and `prepare: false` remains required for PgBouncer's transaction-mode pooler regardless.

No schema, query, or auth changes. No other files are touched.

## Verification

1. Deploy the change to Vercel.
2. In the deployed app, time a few real operations — adding a trade, loading `/journal`, switching accounts — and compare against the latency experienced before this change.
3. Separately (not a code change, just worth checking): in the Vercel dashboard, confirm whether **Fluid Compute** is enabled for the project. It affects how aggressively Vercel reuses warm instances between requests, which determines how often a fresh connection needs to be established at all. This is informational — no action required as part of this change unless the `idle_timeout`/`max_lifetime` fix alone doesn't resolve the slowness.
4. If the deployed app is still consistently slow after this change, the next step (not part of this spec) would be piloting Supabase's HTTP-based Data API on one hot-path query (e.g. `getAccountsWithStats`) to measure whether `fetch()`-based connection reuse in Vercel's runtime meaningfully outperforms a raw Postgres connection in this specific serverless setup — only then would a fuller migration be worth considering.
