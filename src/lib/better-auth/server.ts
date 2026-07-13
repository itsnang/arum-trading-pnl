import 'server-only'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import { db, schema } from '@/lib/db'
import { env } from '@/env'
import { sendResetPasswordEmail } from './send-reset-password-email'

// VERCEL_URL is each deployment's own exact origin (preview builds get a unique
// one every time); VERCEL_PROJECT_PRODUCTION_URL is the stable assigned production
// domain. Both are set by Vercel with zero configuration, so trusting them is a
// self-healing backstop if BETTER_AUTH_URL is ever missing/misconfigured in the
// dashboard — never a `*.vercel.app` wildcard, which would trust unrelated sites.
const vercelTrustedOrigins = [process.env.VERCEL_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL]
  .filter((host): host is string => !!host)
  .map((host) => `https://${host}`)

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: { user: schema.user, session: schema.session, account: schema.account, verification: schema.verification },
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await sendResetPasswordEmail({ to: user.email, url })
    },
  },
  // Session lookups otherwise hit Postgres on every request (~0.6-1.7s round
  // trip to the remote Supabase pooler). Caching the session+user payload in
  // a signed cookie skips that DB round trip until the cache expires.
  session: { cookieCache: { enabled: true, maxAge: 60 } },
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: vercelTrustedOrigins.length > 0 ? vercelTrustedOrigins : undefined,
  plugins: [nextCookies()], // must be last plugin
})

export type Auth = typeof auth
