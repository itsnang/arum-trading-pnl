import { cn } from '@/lib/utils'
import { formatPnl } from '@/lib/format'

interface WeekTotalCellProps {
  weekNumber: number
  total: number
  hasTrades: boolean
}

export function WeekTotalCell({ weekNumber, total, hasTrades }: WeekTotalCellProps) {
  const isPositive = total >= 0
  return (
    <div className="flex items-center justify-between px-1 py-1">
      <span className="text-[9px] font-bold uppercase tracking-wide text-faint">
        Wk {weekNumber}
      </span>
      <span
        className={cn(
          'text-[11px] font-extrabold tabular-nums',
          !hasTrades ? 'text-faint' : isPositive ? 'text-green' : 'text-red',
        )}
      >
        {hasTrades ? formatPnl(total, { showPlus: true }) : '—'}
      </span>
    </div>
  )
}
