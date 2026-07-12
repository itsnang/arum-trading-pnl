import { cache } from 'react'
import { QueryClient } from '@tanstack/react-query'

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // 2 minutes — every mutation path invalidates its query keys explicitly
        // (see invalidate-trade-queries.ts, account-form.tsx), so this is
        // just a floor that avoids redundant refetches on remount/window-refocus.
        staleTime: 2 * 60 * 1000,
      },
    },
  })
}

// Memoized per request: every server component in the same render tree
// shares one QueryClient, so prefetching the same query key twice (e.g.
// layout + page) hits the cache instead of re-running the query function.
export const getQueryClient = cache(makeQueryClient)
