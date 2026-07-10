import 'server-only'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '@/env'
import * as schema from './schema'

export type Db = ReturnType<typeof drizzle<typeof schema>>

export const db = drizzle(postgres(env.DATABASE_URL, { max: 20 }), { schema })
