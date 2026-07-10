import 'server-only'
import { z } from 'zod'

// Vercel doesn't require BETTER_AUTH_URL to be set manually — fall back to the
// platform-provided deployment URL so auth's origin check passes out of the box.
const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL
const defaultAuthUrl = vercelHost ? `https://${vercelHost}` : 'http://localhost:3000'

const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url().default(defaultAuthUrl),
})

const serverEnv = serverSchema.safeParse(process.env)

if (!serverEnv.success) {
  console.error('Invalid server environment variables:', serverEnv.error.format())
  throw new Error('Invalid server environment variables', { cause: serverEnv.error })
}

export const env = serverEnv.data
