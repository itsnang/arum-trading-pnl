import { cn } from '@/lib/utils'
import { formatPnl, formatBalance } from '@/lib/format'
import type { MonthJournalData } from '../types'

interface MonthHeroProps {
  data: MonthJournalData
  currentBalance?: string
}

export function MonthHero({ data, currentBalance }: MonthHeroProps) {
  const isPositive = data.netPnl >= 0

  return (
    <div className="relative mx-5 mb-4 overflow-hidden rounded-xl bg-hero-bg px-5 py-5 text-hero-fg">
      {/* Clay glow */}
      <div
        className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(194,94,58,0.65), transparent 70%)' }}
      />

      {/* Top row */}
      <div className="relative flex items-start justify-between gap-4">
        {/* Month net — primary metric */}
        <div className="flex flex-col gap-1.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] opacity-50">Month net</p>
          <p className={cn(
            'text-2xl font-extrabold leading-none tracking-tight tabular-nums',
            isPositive ? 'text-pos-hero' : 'text-neg-hero',
          )}>
            {formatPnl(data.netPnl, { showPlus: true })}
          </p>
        </div>

        {/* Balance — secondary, muted */}
        {currentBalance !== undefined && (
          <div className="flex flex-col items-end gap-1.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] opacity-50">Balance</p>
            <p className="text-lg font-extrabold tabular-nums">
              ${formatBalance(currentBalance)}
            </p>
          </div>
        )}
      </div>

      {/* Bottom row: stats */}
      <div className="relative mt-3.5 flex items-center gap-2.5 border-t border-white/10 pt-3">
        <span className="text-[11px] font-bold tabular-nums opacity-80">{data.winRate}% win rate</span>
        <span className="opacity-20">·</span>
        <span className="text-[11px] font-medium tabular-nums opacity-50">
          {data.winCount}W/{data.lossCount}L
        </span>
        <span className="opacity-20">·</span>
        <span className="text-[11px] font-medium tabular-nums opacity-50">
          {data.tradeCount} trade{data.tradeCount !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
}
