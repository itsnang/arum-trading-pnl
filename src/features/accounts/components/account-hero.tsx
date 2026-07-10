import { HeroCard } from '@/components/shared/hero-card'
import { formatBalance, formatPnl } from '@/lib/format'
import { cn } from '@/lib/utils'

interface AccountHeroProps {
  totalEquity: number
  totalPnl: number
}

export function AccountHero({ totalEquity, totalPnl }: AccountHeroProps) {
  const isPositive = totalPnl >= 0

  return (
    <HeroCard
      label="All accounts"
      value={
        <p className="text-[28px] font-extrabold leading-none tracking-tight tabular-nums">
          ${formatBalance(totalEquity)}
        </p>
      }
      trailing={
        <>
          <span className="text-xs font-semibold opacity-60">Total P&amp;L</span>
          <span
            className={cn(
              'text-sm font-extrabold tabular-nums',
              isPositive ? 'text-pos-hero' : 'text-neg-hero',
            )}
          >
            {formatPnl(totalPnl, { showPlus: true })}
          </span>
        </>
      }
    />
  )
}
