import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { makeQueryClient } from '@/lib/query-client'
import { queryKeys } from '@/lib/query-keys'
import { toMonthKey } from '@/lib/format'
import { getAccountsWithStats } from '@/features/accounts/actions/accounts'
import { monthJournalQueryOptions } from '@/features/journal/utils'
import { JournalView } from './journal-view'

export default async function JournalPage() {
  const queryClient = makeQueryClient()
  const month = toMonthKey(new Date())

  const accounts = await queryClient.fetchQuery({
    queryKey: queryKeys.accounts(),
    queryFn: getAccountsWithStats,
  })

  const firstAccount = accounts[0]
  if (firstAccount) {
    await queryClient.prefetchQuery(monthJournalQueryOptions(firstAccount.id, month))
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <JournalView
        defaultAccountId={firstAccount?.id ?? null}
        defaultMonth={month}
        accounts={accounts.map(({ id, name }) => ({ id, name }))}
      />
    </HydrationBoundary>
  )
}
