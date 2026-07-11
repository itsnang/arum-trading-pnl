import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/query-client'
import { toMonthKey } from '@/lib/format'
import { accountsQueryOptions } from '@/features/accounts/utils'
import { monthJournalQueryOptions } from '@/features/journal/utils'
import { JournalView } from './journal-view'

export default async function JournalPage() {
  const queryClient = getQueryClient()
  const month = toMonthKey(new Date())

  const accounts = await queryClient.fetchQuery(accountsQueryOptions())

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
