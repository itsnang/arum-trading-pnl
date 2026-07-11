import type { ReactNode } from 'react'
import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { requireSession } from '@/lib/better-auth/session'
import { getQueryClient } from '@/lib/query-client'
import { queryKeys } from '@/lib/query-keys'
import { getAccountsWithStats } from '@/features/accounts/actions/accounts'
import { AppShell } from '@/components/shared/app-shell'
import { OnboardingGate } from './onboarding-gate'
import { PrefetchController } from './prefetch-controller'

// The accounts query is hydrated *here*, above OnboardingGate/PrefetchController
// and the page itself — all of which read it via useAccounts(). TanStack
// Query's HydrationBoundary only hydrates synchronously (during SSR) the
// first time a query key is touched; if a sibling calls useAccounts() first,
// hydration for that key gets deferred to a client-only effect that never
// runs during SSR, so the server-rendered HTML is stuck showing empty data.
// Hydrating once at this shared ancestor removes the race entirely.
export default async function AppLayout({ children }: { children: ReactNode }) {
  await requireSession()
  const queryClient = getQueryClient()
  await queryClient.prefetchQuery({
    queryKey: queryKeys.accounts(),
    queryFn: getAccountsWithStats,
  })

  return (
    <AppShell>
      <HydrationBoundary state={dehydrate(queryClient)}>
        {children}
        <OnboardingGate />
        <PrefetchController />
      </HydrationBoundary>
    </AppShell>
  )
}
