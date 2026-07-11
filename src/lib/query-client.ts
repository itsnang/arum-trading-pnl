import { cache } from 'react'
import { QueryClient } from '@tanstack/react-query'

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute — prevents refetch on RSC hydration
      },
    },
  })
}

// Memoized per request: every server component in the same render tree
// shares one QueryClient, so prefetching the same query key twice (e.g.
// layout + page) hits the cache instead of re-running the query function.
export const getQueryClient = cache(makeQueryClient)
