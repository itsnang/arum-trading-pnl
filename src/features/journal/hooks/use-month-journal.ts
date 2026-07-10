'use client'

import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { getMonthJournal } from '../actions'

export function useMonthJournal(accountId: string, month: string) {
  return useQuery({
    queryKey: queryKeys.monthJournal(accountId, month),
    queryFn: () => getMonthJournal(accountId, month),
    enabled: !!accountId && !!month,
  })
}
