'use client'

import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { getTradesForDay } from '../actions'

export function useDayTrades(accountId: string, date: string) {
  return useQuery({
    queryKey: queryKeys.dayTrades(accountId, date),
    queryFn: () => getTradesForDay(accountId, date),
    enabled: !!accountId && !!date,
  })
}
