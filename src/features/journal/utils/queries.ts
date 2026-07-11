import { queryOptions } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { getMonthJournal } from '../actions'

export function monthJournalQueryOptions(accountId: string, month: string) {
  return queryOptions({
    queryKey: queryKeys.monthJournal(accountId, month),
    queryFn: () => getMonthJournal(accountId, month),
  })
}
