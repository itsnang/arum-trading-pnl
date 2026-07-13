import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { env } from '@/env'

// Service role key bypasses RLS — this app's auth is better-auth, not Supabase
// Auth, so storage.objects RLS policies keyed on auth.uid() don't apply. Every
// path must be scoped by user id manually (see actions.ts).
export const supabaseStorageClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})
