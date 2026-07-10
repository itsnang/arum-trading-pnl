import type { QueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'

/** Refresh every cached view affected by a trade create/delete. */
export function invalidateTradeQueries(queryClient: QueryClient, accountId: string, date: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.dayTrades(accountId, date) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.journal() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.accounts() }),
  ])
}
