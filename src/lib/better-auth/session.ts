import 'server-only'
import { cache } from 'react'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from './server'

// Memoized per request so requireSession() and every withAuthAction-wrapped
// server action share one session lookup instead of each hitting the DB.
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() })
})

export async function requireSession() {
  const data = await getSession()
  if (!data?.session || !data.user) redirect('/login')
  return data
}
