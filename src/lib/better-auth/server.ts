import 'server-only'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import { db, schema } from '@/lib/db'
import { env } from '@/env'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: { user: schema.user, session: schema.session, account: schema.account, verification: schema.verification },
  }),
  emailAndPassword: { enabled: true },
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  // VERCEL_URL is set by Vercel to each deployment's own exact origin (preview
  // builds get a unique one every time), so this only ever trusts itself —
  // not a `*.vercel.app` wildcard, which would trust unrelated Vercel sites too.
  trustedOrigins: process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : undefined,
  plugins: [nextCookies()], // must be last plugin
})

export type Auth = typeof auth
