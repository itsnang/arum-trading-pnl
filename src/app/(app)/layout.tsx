import type { ReactNode } from 'react'
import { Suspense } from 'react'
import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { requireSession } from '@/lib/better-auth/session'
import { makeQueryClient } from '@/lib/query-client'
import { queryKeys } from '@/lib/query-keys'
import { getAccountsWithStats } from '@/features/accounts/actions/accounts'
import { AppShell } from '@/components/shared/app-shell'
import { OnboardingGate } from './onboarding-gate'
import { PrefetchController } from './prefetch-controller'
import { AppLoadingFallback } from './app-loading-fallback'

// Auth check + accounts prefetch live in their own async component, wrapped
// in Suspense below, so the shell (nav bar + logo splash) can stream to the
// browser immediately instead of the whole page blocking on DB round trips.
//
// The accounts query is hydrated *here*, above OnboardingGate/PrefetchController
// and the page itself — all of which read it via useAccounts(). TanStack
// Query's HydrationBoundary only hydrates synchronously (during SSR) the
// first time a query key is touched; if a sibling calls useAccounts() first,
// hydration for that key gets deferred to a client-only effect that never
// runs during SSR, so the server-rendered HTML is stuck showing empty data.
// Hydrating once at this shared ancestor removes the race entirely.
async function SessionGate({ children }: { children: ReactNode }) {
  await requireSession()
  const queryClient = makeQueryClient()
  await queryClient.prefetchQuery({
    queryKey: queryKeys.accounts(),
    queryFn: getAccountsWithStats,
  })
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {children}
      <OnboardingGate />
      <PrefetchController />
    </HydrationBoundary>
  )
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell>
      <Suspense fallback={<AppLoadingFallback />}>
        <SessionGate>{children}</SessionGate>
      </Suspense>
    </AppShell>
  )
}
