import { HeroCard } from '@/components/shared/hero-card'
import { cn } from '@/lib/utils'
import { formatPnl } from '@/lib/format'
import type { MonthJournalData } from '../types'

interface MonthHeroProps {
  data: MonthJournalData
}

export function MonthHero({ data }: MonthHeroProps) {
  const isPositive = data.netPnl >= 0

  return (
    <HeroCard
      label="Month net"
      value={
        <p
          className={cn(
            'text-[30px] font-extrabold leading-none tracking-tight tabular-nums',
            isPositive ? 'text-pos-hero' : 'text-neg-hero',
          )}
        >
          {formatPnl(data.netPnl, { showPlus: true })}
        </p>
      }
      trailing={
        <>
          <span className="text-xs font-bold tabular-nums">{data.winRate}% win rate</span>
          <span className="text-[11.5px] font-semibold tabular-nums opacity-60">
            {data.winCount}W/{data.lossCount}L · {data.tradeCount} trade
            {data.tradeCount !== 1 ? 's' : ''}
          </span>
        </>
      }
    />
  )
}
