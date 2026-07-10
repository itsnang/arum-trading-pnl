import { cn } from '@/lib/utils'
import { formatPnlShort } from '@/lib/format'
import type { DayStats } from '../types'

interface CalendarDayCellProps {
  date: string
  stats: DayStats | undefined
  isToday: boolean
  isSelected: boolean
  isCurrentMonth: boolean
  onPress: (date: string) => void
}

export function CalendarDayCell({
  date,
  stats,
  isToday,
  isSelected,
  isCurrentMonth,
  onPress,
}: CalendarDayCellProps) {
  const day = parseInt(date.split('-')[2] ?? '0')
  const hasTrades = stats !== undefined
  const isPositive = hasTrades && stats.totalPnl >= 0

  return (
    <button
      type="button"
      onClick={() => onPress(date)}
      className={cn(
        'flex min-h-13.5 flex-col items-center justify-start gap-0.5 rounded-lg border-[1.5px] py-1.5 transition-colors',
        isSelected ? 'border-clay' : isToday ? 'border-faint' : 'border-hair',
        !isCurrentMonth ? 'opacity-30' : '',
        hasTrades ? (isPositive ? 'bg-green/10' : 'bg-red/10') : 'bg-transparent',
      )}
    >
      <span className={cn('text-[11px] font-bold', isToday ? 'text-clay' : 'text-muted-foreground')}>
        {day}
      </span>
      <span
        className={cn(
          'text-[10px] font-extrabold leading-none tabular-nums',
          hasTrades ? (isPositive ? 'text-green' : 'text-red') : 'text-transparent',
        )}
      >
        {hasTrades ? formatPnlShort(stats.totalPnl) : '·'}
      </span>
    </button>
  )
}
