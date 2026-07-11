# Remove Drizzle from domain queries (accounts/trades/journal) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the three domain server-action files (`accounts`, `trades`, `journal`) off Drizzle's query builder onto `@supabase/supabase-js`, while better-auth keeps its own Drizzle adapter untouched.

**Architecture:** New server-only Supabase client (service-role key, RLS bypass, manual `user_id` scoping preserved everywhere Drizzle did it today). Two new Postgres functions (`get_accounts_with_stats`, `get_month_journal`) added via a raw-SQL Drizzle migration, called through `.rpc()`. Everything else (inserts/deletes/simple selects) uses `.from()` directly.

**Tech Stack:** `@supabase/supabase-js`, existing Drizzle migration tooling (for the raw-SQL migration only), existing Zod schemas/types (unchanged).

**Full context:** see the approved design doc at `docs/superpowers/specs/2026-07-11-remove-drizzle-domain-queries-design.md`.

---

## Prerequisite (manual, not a task — do this before Task 1)

Add two vars to `.env.local` (not committed — get these from the Supabase project dashboard, Settings → API):

```
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service role secret>
```

`DATABASE_URL` already points at the same Postgres database, so no other env changes are needed.

---

### Task 1: Add Supabase dependency and env vars

**Files:**
- Modify: `package.json` (dependency)
- Modify: `src/env.ts`

- [ ] **Step 1: Install the dependency**

Run: `npm install @supabase/supabase-js`

Expected: `package.json` gains `"@supabase/supabase-js": "^2.x.x"` under `dependencies`, `package-lock.json` updates.

- [ ] **Step 2: Add the two env vars to the server schema**

In `src/env.ts`, add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to `serverSchema`:

```ts
import "server-only";
import { z } from "zod";

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

const serverEnv = serverSchema.safeParse(process.env);

if (!serverEnv.success) {
  console.error(
    "Invalid server environment variables:",
    serverEnv.error.format(),
  );
  throw new Error("Invalid server environment variables", {
    cause: serverEnv.error,
  });
}

export const env = serverEnv.data;
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: no errors (this file has no consumers yet that would break).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/env.ts
git commit -m "Add @supabase/supabase-js dependency and env vars"
```

---

### Task 2: Create the server-only Supabase client

**Files:**
- Create: `src/lib/supabase/client.ts`

- [ ] **Step 1: Write the client factory**

```ts
import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { env } from '@/env'

// Service role key bypasses RLS — this app's auth is better-auth, not
// Supabase Auth, so RLS policies keyed on auth.uid() don't apply. Every
// query/RPC call below must scope by user_id manually, exactly as the
// Drizzle queries did.
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase/client.ts
git commit -m "Add server-only Supabase client for domain queries"
```

---

### Task 3: Add the two Postgres functions via a raw-SQL migration

**Files:**
- Create: `drizzle/migrations/0003_add_domain_query_functions.sql` (exact number/name assigned by the command below)

- [ ] **Step 1: Generate an empty custom migration**

Run: `npx drizzle-kit generate --custom --name=add_domain_query_functions`

Expected: a new file appears at `drizzle/migrations/0003_add_domain_query_functions.sql` (empty except a comment), and `drizzle/migrations/meta/_journal.json` gains an entry with `"idx": 3`.

- [ ] **Step 2: Write the function definitions into the generated file**

Replace the generated file's contents with:

```sql
CREATE OR REPLACE FUNCTION get_accounts_with_stats(p_user_id text, p_recent_since date)
RETURNS TABLE (
  id text,
  user_id text,
  name text,
  broker text,
  type account_type,
  starting_balance numeric,
  created_at timestamp,
  updated_at timestamp,
  total_pnl numeric,
  trade_count bigint,
  recent_count bigint
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    ta.id,
    ta.user_id,
    ta.name,
    ta.broker,
    ta.type,
    ta.starting_balance,
    ta.created_at,
    ta.updated_at,
    COALESCE(SUM(t.pnl), 0) AS total_pnl,
    COUNT(t.id) AS trade_count,
    COUNT(t.id) FILTER (WHERE t.date >= p_recent_since) AS recent_count
  FROM trading_account ta
  LEFT JOIN trade t ON t.account_id = ta.id AND t.user_id = p_user_id
  WHERE ta.user_id = p_user_id
  GROUP BY ta.id
  ORDER BY ta.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION get_month_journal(p_user_id text, p_account_id text, p_first_day date, p_last_day date)
RETURNS TABLE (
  date date,
  total_pnl numeric,
  trade_count bigint,
  win_count bigint,
  loss_count bigint
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    t.date,
    SUM(t.pnl) AS total_pnl,
    COUNT(*) AS trade_count,
    COUNT(*) FILTER (WHERE t.result = 'win') AS win_count,
    COUNT(*) FILTER (WHERE t.result = 'loss') AS loss_count
  FROM trade t
  WHERE t.user_id = p_user_id
    AND t.account_id = p_account_id
    AND t.date >= p_first_day
    AND t.date <= p_last_day
  GROUP BY t.date;
$$;

GRANT EXECUTE ON FUNCTION get_accounts_with_stats(text, date) TO service_role;
GRANT EXECUTE ON FUNCTION get_month_journal(text, text, date, date) TO service_role;
```

- [ ] **Step 3: Apply the migration**

Run: `npm run db:migrate`
Expected: output confirms migration `0003_add_domain_query_functions` applied with no errors.

- [ ] **Step 4: Verify the functions exist and are callable**

In `npm run db:studio` (or the Supabase SQL editor), run:

```sql
select * from get_accounts_with_stats('some-existing-user-id', (current_date - interval '30 days')::date);
```

Expected: returns rows (or an empty set if that user has no accounts) with no SQL error. Repeat with `get_month_journal('some-existing-user-id', 'some-account-id', '2026-07-01', '2026-07-31')`.

- [ ] **Step 5: Commit**

```bash
git add drizzle/migrations/0003_add_domain_query_functions.sql drizzle/migrations/meta/
git commit -m "Add get_accounts_with_stats and get_month_journal Postgres functions"
```

---

### Task 4: Rewrite `src/features/accounts/actions/accounts.ts`

**Files:**
- Modify: `src/features/accounts/actions/accounts.ts`

- [ ] **Step 1: Replace the file contents**

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { supabase } from '@/lib/supabase/client'
import { withAuthAction } from '@/lib/better-auth/middleware'
import type { AddAccountInput } from '../schemas'
import type { AccountWithStats } from '../types'

interface AccountStatsRow {
  id: string
  user_id: string
  name: string
  broker: string | null
  type: 'personal' | 'funded' | 'demo'
  starting_balance: number | string
  created_at: string
  updated_at: string
  total_pnl: number | string
  trade_count: number | string
  recent_count: number | string
}

export const getAccountsWithStats = withAuthAction(async ({ user }): Promise<AccountWithStats[]> => {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().slice(0, 10)

  const { data, error } = await supabase.rpc('get_accounts_with_stats', {
    p_user_id: user.id,
    p_recent_since: thirtyDaysAgoStr,
  })
  if (error) throw new Error(error.message)

  return (data as AccountStatsRow[]).map((row) => {
    const startingBalance = String(row.starting_balance)
    const totalPnl = String(row.total_pnl)
    const currentBalance = (parseFloat(startingBalance) + parseFloat(totalPnl)).toFixed(2)

    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      broker: row.broker,
      type: row.type,
      startingBalance,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      totalPnl,
      currentBalance,
      tradeCount: Number(row.trade_count),
      isActive: Number(row.recent_count) > 0,
    }
  })
})

export const addAccount = withAuthAction(
  async ({ user }, input: AddAccountInput): Promise<{ error?: string }> => {
    const { error } = await supabase.from('trading_account').insert({
      id: crypto.randomUUID(),
      user_id: user.id,
      name: input.name,
      broker: input.broker ?? null,
      type: input.type,
      starting_balance: input.startingBalance,
    })
    if (error) return { error: 'Failed to create account' }
    revalidatePath('/accounts')
    return {}
  },
)

export const deleteAccount = withAuthAction(
  async ({ user }, accountId: string): Promise<{ error?: string }> => {
    const { error } = await supabase
      .from('trading_account')
      .delete()
      .eq('id', accountId)
      .eq('user_id', user.id)
    if (error) return { error: 'Failed to delete account' }
    revalidatePath('/accounts')
    return {}
  },
)
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors. `AccountWithStats` return type annotation forces the mapped object shape to match exactly what `use-accounts.ts` and the account components already expect.

- [ ] **Step 3: Commit**

```bash
git add src/features/accounts/actions/accounts.ts
git commit -m "Move accounts actions off Drizzle onto Supabase client"
```

---

### Task 5: Rewrite `src/features/trades/actions/trades.ts`

**Files:**
- Modify: `src/features/trades/actions/trades.ts`

- [ ] **Step 1: Replace the file contents**

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { supabase } from '@/lib/supabase/client'
import { withAuthAction } from '@/lib/better-auth/middleware'
import type { QuickTradeInput } from '../schemas/quick-trade.schema'
import type { CalcTradeInput } from '../schemas/calc-trade.schema'
import type { Trade } from '../types'
import { calcPnl } from '../utils/calc-pnl'

interface TradeRow {
  id: string
  user_id: string
  account_id: string
  date: string
  mode: 'quick' | 'calc'
  direction: 'buy' | 'sell' | null
  result: 'win' | 'loss' | null
  pnl: number | string
  entry_price: number | string | null
  exit_price: number | string | null
  lot_size: number | string | null
  created_at: string
  updated_at: string
}

function mapTradeRow(row: TradeRow): Trade {
  return {
    id: row.id,
    userId: row.user_id,
    accountId: row.account_id,
    date: row.date,
    mode: row.mode,
    direction: row.direction,
    result: row.result,
    pnl: String(row.pnl),
    entryPrice: row.entry_price === null ? null : String(row.entry_price),
    exitPrice: row.exit_price === null ? null : String(row.exit_price),
    lotSize: row.lot_size === null ? null : String(row.lot_size),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

export const getTradesForDay = withAuthAction(async ({ user }, accountId: string, date: string): Promise<Trade[]> => {
  const { data, error } = await supabase
    .from('trade')
    .select('*')
    .eq('user_id', user.id)
    .eq('account_id', accountId)
    .eq('date', date)
  if (error) throw new Error(error.message)
  return (data as TradeRow[]).map(mapTradeRow)
})

export const addQuickTrade = withAuthAction(
  async ({ user }, input: QuickTradeInput): Promise<{ error?: string }> => {
    const pnl = input.result === 'win' ? input.pnl : `-${input.pnl}`
    const { error } = await supabase.from('trade').insert({
      id: crypto.randomUUID(),
      user_id: user.id,
      account_id: input.accountId,
      date: input.date,
      mode: 'quick',
      result: input.result,
      pnl,
    })
    if (error) return { error: 'Failed to save trade' }
    revalidatePath('/journal')
    revalidatePath('/accounts')
    return {}
  },
)

export const addCalcTrade = withAuthAction(
  async ({ user }, input: CalcTradeInput): Promise<{ error?: string }> => {
    const entry = parseFloat(input.entryPrice)
    const exit = parseFloat(input.exitPrice)
    const lots = parseFloat(input.lotSize)
    const rawPnl = calcPnl(input.direction, entry, exit, lots)
    const result = rawPnl >= 0 ? 'win' : 'loss'
    const { error } = await supabase.from('trade').insert({
      id: crypto.randomUUID(),
      user_id: user.id,
      account_id: input.accountId,
      date: input.date,
      mode: 'calc',
      direction: input.direction,
      result,
      pnl: rawPnl.toFixed(2),
      entry_price: input.entryPrice,
      exit_price: input.exitPrice,
      lot_size: input.lotSize,
    })
    if (error) return { error: 'Failed to save trade' }
    revalidatePath('/journal')
    revalidatePath('/accounts')
    return {}
  },
)

export const deleteTrade = withAuthAction(
  async ({ user }, tradeId: string): Promise<{ error?: string }> => {
    const { error } = await supabase.from('trade').delete().eq('id', tradeId).eq('user_id', user.id)
    if (error) return { error: 'Failed to delete trade' }
    revalidatePath('/journal')
    revalidatePath('/accounts')
    return {}
  },
)
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/trades/actions/trades.ts
git commit -m "Move trades actions off Drizzle onto Supabase client"
```

---

### Task 6: Rewrite `src/features/journal/actions/journal.ts`

**Files:**
- Modify: `src/features/journal/actions/journal.ts`

- [ ] **Step 1: Replace the file contents**

```ts
'use server'

import { supabase } from '@/lib/supabase/client'
import { withAuthAction } from '@/lib/better-auth/middleware'
import type { MonthJournalData } from '../types'

interface MonthJournalRow {
  date: string
  total_pnl: number | string
  trade_count: number | string
  win_count: number | string
  loss_count: number | string
}

export const getMonthJournal = withAuthAction(async (
  { user },
  accountId: string,
  month: string,
): Promise<MonthJournalData> => {
  const [yearStr, monStr] = month.split('-')
  const year = Number(yearStr)
  const mon = Number(monStr)
  const firstDay = `${year}-${String(mon).padStart(2, '0')}-01`
  const lastDate = new Date(year, mon, 0).getDate()
  const lastDay = `${year}-${String(mon).padStart(2, '0')}-${String(lastDate).padStart(2, '0')}`

  const { data, error } = await supabase.rpc('get_month_journal', {
    p_user_id: user.id,
    p_account_id: accountId,
    p_first_day: firstDay,
    p_last_day: lastDay,
  })
  if (error) throw new Error(error.message)

  const days = (data as MonthJournalRow[]).map((r) => ({
    date: r.date,
    totalPnl: parseFloat(String(r.total_pnl)),
    tradeCount: Number(r.trade_count),
    winCount: Number(r.win_count),
    lossCount: Number(r.loss_count),
  }))

  const netPnl = days.reduce((s, d) => s + d.totalPnl, 0)
  const winCount = days.reduce((s, d) => s + d.winCount, 0)
  const lossCount = days.reduce((s, d) => s + d.lossCount, 0)
  const tradeCount = days.reduce((s, d) => s + d.tradeCount, 0)
  const winRate = tradeCount > 0 ? Math.round((winCount / tradeCount) * 100) : 0

  return { month, accountId, days, netPnl, winCount, lossCount, tradeCount, winRate }
})
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/journal/actions/journal.ts
git commit -m "Move journal actions off Drizzle onto Supabase client"
```

---

### Task 7: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Replace the "Database schema" section**

Find this section:

```markdown
### Database schema

Tables live in `src/lib/db/schema/`. Currently: `user`, `session`, `account`, `verification` (all better-auth managed). New domain tables (e.g. `trading_account`, `trade`) go here as new `*.table.ts` files, exported from `schema/index.ts`.

After adding a table: `npm run db:generate` → `npm run db:migrate`.
```

Replace it with:

```markdown
### Database schema

Tables live in `src/lib/db/schema/`. Drizzle owns the schema/migration history for **all** tables (`user`, `session`, `account`, `verification`, `trading_account`, `trade`), but at runtime it is only queried by better-auth (`src/lib/better-auth/server.ts`'s `drizzleAdapter`) for its own four tables. Domain tables (`trading_account`, `trade`) are queried at runtime through the Supabase client (`src/lib/supabase/client.ts`, service-role key, manual `user_id` scoping in every call — see `src/features/accounts/actions/accounts.ts`, `src/features/trades/actions/trades.ts`, `src/features/journal/actions/journal.ts`).

After adding/changing a table: `npm run db:generate` → `npm run db:migrate`.
To add or change a Postgres function called via `.rpc()`: `npx drizzle-kit generate --custom --name=<name>` to create an empty raw-SQL migration, write the `CREATE OR REPLACE FUNCTION ...` SQL by hand, then `npm run db:migrate`. This keeps Drizzle's migration history the single source of truth for the whole database, even for objects the Drizzle query builder never touches at runtime.
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "Document Supabase client usage for domain queries in CLAUDE.md"
```

---

### Task 8: Full verification and manual two-user isolation check

**Files:** none (verification only)

- [ ] **Step 1: Full automated check**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: all three succeed with no errors.

- [ ] **Step 2: Manual two-user isolation check**

1. Run `npm run dev`.
2. Register throwaway user A (e.g. `a+test@example.com`). Add a trading account. Add one quick trade and one calc trade on today's date. Load `/journal` and confirm the day shows the trade(s) and correct win/loss coloring. Load `/accounts` and confirm the account's current balance and trade count match what was entered.
3. Log out. Register throwaway user B (e.g. `b+test@example.com`). Repeat: add a different-named account, add one trade.
4. With both users' data now in the database, log in as user A again and confirm `/accounts` and `/journal` show only A's account(s)/trade(s) — never B's. Log in as B and confirm the reverse.
5. As user A, delete the trade, then delete the account; confirm both disappear and no error toast appears.
6. Clean up: delete users A and B (and their cascaded accounts/trades) from the database directly (`npm run db:studio`), since there's no in-app account deletion.

- [ ] **Step 3: If anything fails**

- A Postgres error mentioning `permission denied for function` → the `GRANT EXECUTE` statements in the Task 3 migration didn't take effect against the role Supabase's PostgREST uses for the service key; re-run the two `GRANT` statements directly against the database.
- A Postgres error mentioning `function get_accounts_with_stats(...) does not exist` → check the parameter types passed from `.rpc()` match the SQL function signature exactly (`text`/`date`), and that the migration in Task 3 was actually applied (`npm run db:migrate`).
- Data from one user appearing for another → stop immediately, do not proceed further; re-check every `.eq('user_id', ...)` / `p_user_id` filter in the three action files and the two SQL functions against this plan's code.

No commit for this task — it's verification of the prior seven tasks' commits.

---

## Plan self-review notes

- **Spec coverage:** every function listed in the design doc's "Current behavior" section has a corresponding rewritten function in Tasks 4–6, using the same error-message strings and the same `revalidatePath` calls. Env vars, client, and Postgres functions from the "Architecture" section are Tasks 1–3. CLAUDE.md update is Task 7. The design doc's two-user isolation testing requirement is Task 8.
- **Type consistency:** `AccountStatsRow`/`TradeRow`/`MonthJournalRow` (snake_case, matching what Supabase/PostgREST actually returns) are mapped to the existing exported types (`AccountWithStats`, `Trade`, `MonthJournalData`) via explicit `Promise<T>` return annotations, so a field-name mismatch is a compile error, not a silent runtime bug.
- **Numeric precision note:** PostgREST serializes Postgres `numeric` columns as JSON numbers (not strings, confirmed against PostgREST's docs), unlike Drizzle's `postgres.js` driver which returns them as strings. Every numeric-like field is explicitly wrapped in `String(...)` before being placed into a field typed `string`, so the external contract (`Trade.pnl: string`, `TradingAccount.startingBalance: string`, etc.) holds exactly as before. This matters because `formatBalance`/`formatPnl` re-derive 2-decimal display formatting themselves (`Intl.NumberFormat`), so no display regression is possible either way, but the type contract still needs to hold for `noUncheckedIndexedAccess`/`exactOptionalPropertyTypes` strictness elsewhere in the codebase.
