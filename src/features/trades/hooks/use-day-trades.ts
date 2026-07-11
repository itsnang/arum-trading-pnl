'use client'

import { useQuery } from '@tanstack/react-query'
import { dayTradesQueryOptions } from '../utils'

export function useDayTrades(accountId: string, date: string) {
  return useQuery({
    ...dayTradesQueryOptions(accountId, date),
    enabled: !!accountId && !!date,
  })
}
