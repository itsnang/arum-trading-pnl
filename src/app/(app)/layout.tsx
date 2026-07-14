import type { ReactNode } from 'react'
import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { requireSession } from '@/lib/better-auth/session'
import { getQueryClient } from '@/lib/query-client'
import { accountsQueryOptions } from '@/features/accounts/utils'
import { AppShell } from '@/components/shared/app-shell'
import { OnboardingGate } from './onboarding-gate'
import { PrefetchController } from './prefetch-controller'
import { AccountSelectionSync } from './account-selection-sync'

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { user } = await requireSession()
  // The accounts query is hydrated *here*, above OnboardingGate/PrefetchController
  // and the page itself — all of which read it via useAccounts(). TanStack
  // Query's HydrationBoundary only hydrates synchronously (during SSR) the
  // first time a query key is touched; if a sibling calls useAccounts() first,
  // hydration for that key gets deferred to a client-only effect that never
  // runs during SSR, so the server-rendered HTML is stuck showing empty data.
  // Hydrating once at this shared ancestor removes the race entirely.
  const queryClient = getQueryClient()
  await queryClient.prefetchQuery(accountsQueryOptions())

  return (
    <AppShell>
      <HydrationBoundary state={dehydrate(queryClient)}>
        {children}
        <AccountSelectionSync />
        <OnboardingGate />
        <PrefetchController />
      </HydrationBoundary>
    </AppShell>
  )
}
