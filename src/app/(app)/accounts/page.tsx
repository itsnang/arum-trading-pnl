import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { requireSession } from '@/lib/better-auth/session'
import { getQueryClient } from '@/lib/query-client'
import { queryKeys } from '@/lib/query-keys'
import { getAccountsWithStats } from '@/features/accounts/actions/accounts'
import { AccountsScreen } from '@/features/accounts/components/accounts-screen'
import { ProfileHeader } from './profile-header'

export default async function AccountsPage() {
  const { user } = await requireSession()
  const queryClient = getQueryClient()
  await queryClient.prefetchQuery({
    queryKey: queryKeys.accounts(),
    queryFn: getAccountsWithStats,
  })
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProfileHeader
        user={{ name: user.name, email: user.email, image: user.image ?? null }}
      />
      <AccountsScreen />
    </HydrationBoundary>
  )
}
