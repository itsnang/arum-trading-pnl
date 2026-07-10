import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPnl } from '@/lib/format'
import type { Trade } from '../types'

interface TradeItemProps {
  trade: Trade
  onDelete: (id: string) => void
  isDeleting: boolean
}

function modeBadge(t: Trade): { label: string; className: string } {
  const isPositive = parseFloat(t.pnl) >= 0
  const colorClass = isPositive ? 'bg-green/10 text-green' : 'bg-red/10 text-red'
  if (t.mode === 'quick') {
    return { label: t.result === 'win' ? 'WIN' : 'LOSS', className: colorClass }
  }
  return { label: t.direction === 'buy' ? 'BUY' : 'SELL', className: colorClass }
}

export function TradeItem({ trade: t, onDelete, isDeleting }: TradeItemProps) {
  const badge = modeBadge(t)
  const pnl = parseFloat(t.pnl)
  const isPositive = pnl >= 0

  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          'shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wide',
          badge.className,
        )}
      >
        {badge.label}
      </span>
      <div className="min-w-0 flex-1">
        {t.mode === 'calc' && t.entryPrice && t.exitPrice ? (
          <p className="truncate text-xs tabular-nums text-muted-foreground">
            {Number(t.entryPrice).toFixed(2)} → {Number(t.exitPrice).toFixed(2)} ·{' '}
            {Number(t.lotSize).toFixed(2)}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">Quick log</p>
        )}
      </div>
      <span
        className={cn(
          'shrink-0 text-sm font-semibold',
          isPositive ? 'text-green' : 'text-red',
        )}
      >
        {formatPnl(pnl, { showPlus: true })}
      </span>
      <button
        type="button"
        disabled={isDeleting}
        onClick={() => onDelete(t.id)}
        className="shrink-0 rounded-full p-1 text-muted-foreground transition-transform hover:bg-hair active:scale-90 disabled:opacity-40"
      >
        <X size={14} />
      </button>
    </div>
  )
}
