import { queryOptions } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { getAccountsWithStats } from '../actions'

/**
 * Accounts change rarely (create/rename/archive) compared to trade data, and
 * every mutation path already calls invalidateQueries/revalidatePath explicitly,
 * so a long staleTime just cuts down on redundant refetches on remount/refocus.
 */
export function accountsQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.accounts(),
    queryFn: () => getAccountsWithStats(),
    staleTime: 5 * 60 * 1000,
  })
}
