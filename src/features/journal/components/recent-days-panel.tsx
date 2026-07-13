import { cn } from '@/lib/utils'
import { formatDateWithWeekday, formatPnl } from '@/lib/format'
import type { DayStats } from '../types'

interface RecentDaysPanelProps {
  days: DayStats[]
  selectedDate: string | null
  onDayPress: (date: string) => void
}

/** Tablet/desktop-only companion to the calendar — a scannable log of the
 *  month's traded days, reusing the same day-level stats the calendar cells
 *  already have (no extra query). Deliberately skips repeating the month
 *  totals shown in MonthHero above it. */
export function RecentDaysPanel({ days, selectedDate, onDayPress }: RecentDaysPanelProps) {
  const tradedDays = [...days].filter((d) => d.tradeCount > 0).sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="rounded-xl border border-line bg-card">
      <div className="border-b border-line px-4 py-3">
        <h2 className="text-sm font-bold">Recent days</h2>
      </div>
      {tradedDays.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground">
          No trades logged yet this month.
        </p>
      ) : (
        <div className="flex flex-col divide-y divide-line">
          {tradedDays.map((day) => {
            const isPositive = day.totalPnl >= 0
            return (
              <button
                key={day.date}
                type="button"
                onClick={() => onDayPress(day.date)}
                className={cn(
                  'flex items-center justify-between gap-2 px-4 py-3 text-left transition-colors hover:bg-hair',
                  day.date === selectedDate && 'bg-hair',
                )}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold">{formatDateWithWeekday(day.date)}</span>
                  <span className="text-xs text-muted-foreground">
                    {day.winCount}W/{day.lossCount}L · {day.tradeCount} trade
                    {day.tradeCount !== 1 ? 's' : ''}
                  </span>
                </div>
                <span
                  className={cn(
                    'shrink-0 text-sm font-extrabold tabular-nums',
                    isPositive ? 'text-green' : 'text-red',
                  )}
                >
                  {formatPnl(day.totalPnl, { showPlus: true })}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
