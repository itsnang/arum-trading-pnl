'use client'

import { useState } from 'react'
import { BottomSheet } from '@/components/shared/bottom-sheet'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { formatDateWithWeekday, formatPnl } from '@/lib/format'
import { useDayTrades } from '../hooks/use-day-trades'
import { TradeList } from './trade-list'
import { QuickPnlForm } from './quick-pnl-form'
import { CalcForm } from './calc-form'

const MODES = [
  { value: 'quick', label: 'Quick P&L' },
  { value: 'calc', label: 'Entry / Exit' },
] as const

type FormMode = 'quick' | 'calc'

interface DayDialogProps {
  open: boolean
  onClose: () => void
  date: string
  accountId: string
}

export function DayDialog({ open, onClose, date, accountId }: DayDialogProps) {
  const [mode, setMode] = useState<FormMode>('quick')
  const { data: trades = [] } = useDayTrades(accountId, date)

  const dayPnl = trades.reduce((sum, t) => sum + parseFloat(t.pnl), 0)
  const hasTrades = trades.length > 0

  return (
    <BottomSheet open={open} onClose={onClose} title={date ? formatDateWithWeekday(date) : ''}>
      <div className="flex flex-col gap-4 px-5 py-4">
        {/* Day P&L summary */}
        {hasTrades && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {trades.length} trade{trades.length !== 1 ? 's' : ''}
            </span>
            <span
              className={cn(
                'text-sm font-extrabold tabular-nums',
                dayPnl >= 0 ? 'text-green' : 'text-red',
              )}
            >
              {formatPnl(dayPnl, { showPlus: true })}
            </span>
          </div>
        )}

        {hasTrades ? (
          <TradeList trades={trades} accountId={accountId} date={date} />
        ) : (
          <p className="text-center text-[12.5px] font-medium text-muted-foreground">
            No trades on this day yet.
          </p>
        )}

        <Separator />

        {/* Mode tabs */}
        <div className="flex gap-1 rounded-xl bg-hair p-1">
          {MODES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              className={cn(
                'flex-1 rounded-lg py-1.5 text-sm font-medium transition active:scale-[0.98]',
                mode === value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === 'quick' ? (
          <QuickPnlForm accountId={accountId} date={date} />
        ) : (
          <CalcForm accountId={accountId} date={date} />
        )}
      </div>
    </BottomSheet>
  )
}
