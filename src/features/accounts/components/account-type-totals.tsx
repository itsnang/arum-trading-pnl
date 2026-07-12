import { HeroCard } from '@/components/shared/hero-card'
import { cn } from '@/lib/utils'
import { formatBalance, formatPnl } from '@/lib/format'
import type { AccountType } from '../types'
import type { AccountTypeTotal } from '../utils'

const typeLabel: Record<AccountType, string> = {
  personal: 'Personal',
  funded: 'Funded',
  demo: 'Demo',
}

interface AccountTypeTotalsProps {
  totals: AccountTypeTotal[]
}

/** One compact hero card per account type — kept separate since summing
 *  personal and funded/demo money into one number would misrepresent what's
 *  actually at stake. The last card spans both columns when the count is
 *  odd (pure CSS, via the `:last-child:nth-child(odd)` selector below). */
export function AccountTypeTotals({ totals }: AccountTypeTotalsProps) {
  if (totals.length === 0) return null

  return (
    <div className="mx-5 mb-4 grid grid-cols-2 gap-2 max-md:[&>*:last-child:nth-child(odd)]:col-span-2 md:grid-cols-3">
      {totals.map(({ type, equity, pnl }) => {
        const isPositive = pnl >= 0
        return (
          <HeroCard
            key={type}
            compact
            label={typeLabel[type]}
            value={
              <span className="text-lg font-extrabold leading-none tracking-tight tabular-nums">
                ${formatBalance(equity)}
              </span>
            }
            trailing={
              <span
                className={cn(
                  'text-xs font-bold tabular-nums',
                  isPositive ? 'text-pos-hero' : 'text-neg-hero',
                )}
              >
                {formatPnl(pnl, { showPlus: true })}
              </span>
            }
          />
        )
      })}
    </div>
  )
}
