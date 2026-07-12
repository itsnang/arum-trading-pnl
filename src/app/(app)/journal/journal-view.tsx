'use client'

import { useState } from 'react'
import { JournalScreen } from '@/features/journal/components/journal-screen'
import { DayDialog } from '@/features/trades/components/day-dialog'
import { useSelectedAccountStore } from '@/features/accounts/store/accounts.store'
import type { AccountWithStatsLike } from '@/features/journal/types'

interface JournalViewProps {
  defaultAccountId: string | null
  defaultMonth: string
  accounts: AccountWithStatsLike[]
}

export function JournalView({ defaultAccountId, defaultMonth, accounts }: JournalViewProps) {
  const [month, setMonth] = useState(defaultMonth)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const selectedAccountId = useSelectedAccountStore((s) => s.selectedAccountId)

  // AccountSelectionSync (mounted app-wide) keeps selectedAccountId valid
  // once accounts load; defaultAccountId is only the SSR-safe fallback for
  // the very first paint, before that client-side sync has run.
  const accountId = selectedAccountId ?? defaultAccountId

  return (
    <>
      <JournalScreen
        accountId={accountId}
        month={month}
        selectedDate={selectedDay}
        onMonthChange={setMonth}
        onDayPress={(date) => setSelectedDay(date)}
        accounts={accounts}
      />
      <DayDialog
        open={!!selectedDay}
        date={selectedDay ?? ''}
        accountId={accountId ?? ''}
        onClose={() => setSelectedDay(null)}
      />
    </>
  )
}
