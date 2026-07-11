import 'server-only'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '@/env'
import * as schema from './schema'

export type Db = ReturnType<typeof drizzle<typeof schema>>

// prepare: false — required for Supabase's transaction-mode pooler (port 6543):
// PgBouncer can hand a prepared statement's later executions to a different
// backend connection, silently returning stale/wrong results.
export const db = drizzle(postgres(env.DATABASE_URL, { max: 20, prepare: false }), { schema })
