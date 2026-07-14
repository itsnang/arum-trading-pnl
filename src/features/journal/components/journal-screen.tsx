'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { shiftMonth, formatMonthLabel } from '@/lib/format'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { UserAvatar } from '@/components/shared/user-avatar'
import { useMonthJournal } from '../hooks/use-month-journal'
import { MonthNav } from './month-nav'
import { MonthHero } from './month-hero'
import { MonthCalendar } from './month-calendar'
import { RecentDaysPanel } from './recent-days-panel'
import type { AccountWithStatsLike } from '../types'

interface JournalScreenProps {
  accountId: string | null
  month: string
  selectedDate: string | null
  onMonthChange: (month: string) => void
  onDayPress: (date: string) => void
  accounts: AccountWithStatsLike[]
  user: { name: string; image: string | null }
}


export function JournalScreen({
  accountId,
  month,
  selectedDate,
  onMonthChange,
  onDayPress,
  accounts,
  user,
}: JournalScreenProps) {
  const effectiveAccountId = accountId ?? ''

  const { data } = useMonthJournal(effectiveAccountId, month)

  const emptyData = {
    month,
    accountId: effectiveAccountId,
    days: [],
    netPnl: 0,
    winCount: 0,
    lossCount: 0,
    tradeCount: 0,
    winRate: 0,
  }

  const journalData = data ?? emptyData
  const activeAccount = accounts.find((acc) => acc.id === effectiveAccountId)

  return (
    <div className="flex flex-col">
      <div className="px-5 pt-8 pb-2">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <UserAvatar name={user.name} image={user.image} size={28} />
            <span className="text-sm font-semibold text-muted-foreground">
              Hi, {user.name.split(' ')[0]}
            </span>
          </div>
          <ThemeToggle />
        </div>
        <div className="flex items-end justify-between gap-2">
          <div>
            <h1 className="text-xl font-extrabold">Journal</h1>
            <p className="text-xs text-muted-foreground">XAU/USD · {formatMonthLabel(month)}</p>
          </div>
          {activeAccount && (
            <Link
              href="/accounts"
              className="flex items-center gap-1.5 rounded-xl border border-line bg-card px-3 py-2 text-xs font-semibold"
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-clay" />
              <span className="max-w-24 truncate">{activeAccount.name}</span>
              <ChevronRight size={13} className="text-muted-foreground" />
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-start">
        <div className="flex-1 lg:min-w-0">
          {/* Month navigation */}
          <MonthNav
            month={month}
            onPrev={() => onMonthChange(shiftMonth(month, -1))}
            onNext={() => onMonthChange(shiftMonth(month, 1))}
          />

          {/* Hero */}
          <MonthHero data={journalData} />

          {/* Calendar */}
          <MonthCalendar
            month={month}
            days={journalData.days}
            selectedDate={selectedDate}
            onDayPress={onDayPress}
          />
        </div>

        {/* Recent days — tablet/desktop only: stacked below the calendar at
            md, beside it at lg. Mobile already has per-day detail via the
            sheet. Starts level with MonthNav now that the header sits above
            the split, instead of level with the page title. */}
        <aside className="hidden px-5 md:mt-6 md:block lg:w-80 lg:shrink-0 lg:pl-0">
          <RecentDaysPanel days={journalData.days} selectedDate={selectedDate} onDayPress={onDayPress} />
        </aside>
      </div>
    </div>
  )
}
