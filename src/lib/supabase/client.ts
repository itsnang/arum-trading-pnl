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
