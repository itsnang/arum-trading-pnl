import { queryOptions } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { getTradesForDay } from '../actions'

/** Trade edits invalidate this key explicitly, so staleTime just avoids
 *  redundant refetches when re-opening a day already fetched this session. */
export function dayTradesQueryOptions(accountId: string, date: string) {
  return queryOptions({
    queryKey: queryKeys.dayTrades(accountId, date),
    queryFn: () => getTradesForDay(accountId, date),
    staleTime: 2 * 60 * 1000,
  })
}
