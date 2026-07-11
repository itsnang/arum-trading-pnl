'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { toMonthKey } from '@/lib/format'
import { useSelectedAccountStore } from '@/features/accounts/store/accounts.store'
import { monthJournalQueryOptions } from '@/features/journal/utils'

/**
 * Prefetches the selected account's current-month journal in the background
 * whenever the account selection changes, so switching to the Journal tab
 * shows data instantly instead of triggering a fresh fetch on arrival.
 * Skipped while already on /journal — that page's server component prefetches
 * the same query itself.
 */
export function PrefetchController() {
  const queryClient = useQueryClient()
  const pathname = usePathname()
  const selectedAccountId = useSelectedAccountStore((s) => s.selectedAccountId)

  useEffect(() => {
    if (!selectedAccountId || pathname.startsWith('/journal')) return
    const month = toMonthKey(new Date())
    queryClient.prefetchQuery(monthJournalQueryOptions(selectedAccountId, month))
  }, [selectedAccountId, pathname, queryClient])

  return null
}
