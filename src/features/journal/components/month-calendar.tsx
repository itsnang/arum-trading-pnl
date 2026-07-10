'use client'

import { useMemo } from 'react'
import { toMonthKey } from '@/lib/format'
import { buildCalendarCells } from '../utils'
import { CalendarDayCell } from './calendar-day-cell'
import { WeekTotalCell } from './week-total-cell'
import type { DayStats } from '../types'

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

interface WeekData {
  cells: (string | null)[]
  total: number
  hasTrades: boolean
}

interface MonthCalendarProps {
  month: string
  days: DayStats[]
  selectedDate: string | null
  onDayPress: (date: string) => void
}

export function MonthCalendar({ month, days, selectedDate, onDayPress }: MonthCalendarProps) {
  const todayStr = useMemo(() => {
    const now = new Date()
    return toMonthKey(now) === month ? now.toISOString().slice(0, 10) : ''
  }, [month])

  const statsMap = useMemo(() => {
    const m = new Map<string, DayStats>()
    for (const d of days) m.set(d.date, d)
    return m
  }, [days])

  const weeks = useMemo<WeekData[]>(() => {
    const cells = buildCalendarCells(month)
    const result: WeekData[] = []
    for (let i = 0; i < cells.length; i += 7) {
      const weekCells = cells.slice(i, i + 7)
      let total = 0
      let hasTrades = false
      for (const date of weekCells) {
        if (!date || !date.startsWith(month)) continue
        const s = statsMap.get(date)
        if (s) {
          total += s.totalPnl
          hasTrades = true
        }
      }
      result.push({ cells: weekCells, total, hasTrades })
    }
    return result
  }, [month, statsMap])

  return (
    <div className="px-5">
      {/* Day labels */}
      <div className="mb-1 grid grid-cols-7 gap-x-1">
        {DAY_LABELS.map((l, i) => (
          <div key={i} className="text-center text-[10px] font-semibold text-muted-foreground">
            {l}
          </div>
        ))}
      </div>

      {/* Weeks */}
      {weeks.map((week, wi) => (
        <div key={wi} className="mb-1 flex flex-col gap-0.5">
          <div className="grid grid-cols-7 items-center gap-x-1">
            {week.cells.map((date, di) =>
              date ? (
                <CalendarDayCell
                  key={date}
                  date={date}
                  stats={statsMap.get(date)}
                  isToday={date === todayStr}
                  isSelected={date === selectedDate}
                  isCurrentMonth={date.startsWith(month)}
                  onPress={onDayPress}
                />
              ) : (
                <div key={`empty-${wi}-${di}`} />
              ),
            )}
          </div>
          <WeekTotalCell weekNumber={wi + 1} total={week.total} hasTrades={week.hasTrades} />
        </div>
      ))}
    </div>
  )
}
