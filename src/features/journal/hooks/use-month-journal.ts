'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { monthJournalQueryOptions } from '../utils'

export function useMonthJournal(accountId: string, month: string) {
  return useQuery({
    ...monthJournalQueryOptions(accountId, month),
    enabled: !!accountId && !!month,
    placeholderData: keepPreviousData,
  })
}
