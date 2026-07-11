import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/query-client'
import { queryKeys } from '@/lib/query-keys'
import { getAccountsWithStats } from '@/features/accounts/actions/accounts'
import { AccountsScreen } from '@/features/accounts/components/accounts-screen'

export default async function AccountsPage() {
  const queryClient = getQueryClient()
  await queryClient.prefetchQuery({
    queryKey: queryKeys.accounts(),
    queryFn: getAccountsWithStats,
  })
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AccountsScreen />
    </HydrationBoundary>
  )
}
