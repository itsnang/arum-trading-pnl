'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { formatPnl } from '@/lib/format'
import { calcTradeSchema, type CalcTradeInput } from '../schemas/calc-trade.schema'
import { addCalcTrade } from '../actions'
import { calcPnl, invalidateTradeQueries } from '../utils'

interface CalcFormProps {
  accountId: string
  date: string
  onSuccess?: () => void
}

function previewCalcPnl(direction: 'buy' | 'sell', entry: string, exit: string, lots: string): number | null {
  const e = parseFloat(entry)
  const x = parseFloat(exit)
  const l = parseFloat(lots)
  if (isNaN(e) || isNaN(x) || isNaN(l) || l <= 0) return null
  return calcPnl(direction, e, x, l)
}

export function CalcForm({ accountId, date, onSuccess }: CalcFormProps) {
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CalcTradeInput>({
    resolver: zodResolver(calcTradeSchema),
    defaultValues: { accountId, date, direction: 'buy', entryPrice: '', exitPrice: '', lotSize: '' },
  })

  const [direction, entry, exit, lots] = watch(['direction', 'entryPrice', 'exitPrice', 'lotSize'])
  const previewPnl = previewCalcPnl(direction, entry, exit, lots)

  const onSubmit = async (values: CalcTradeInput) => {
    const res = await addCalcTrade(values)
    if (res.error) {
      toast.error(res.error)
      return
    }
    await invalidateTradeQueries(queryClient, accountId, date)
    const rawPnl = calcPnl(
      values.direction,
      parseFloat(values.entryPrice),
      parseFloat(values.exitPrice),
      parseFloat(values.lotSize),
    )
    toast.success(`Trade logged · ${formatPnl(rawPnl, { showPlus: true })}`)
    reset({ accountId, date, direction: 'buy', entryPrice: '', exitPrice: '', lotSize: '' })
    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {/* Direction toggle */}
      <div className="flex gap-2">
        {(['buy', 'sell'] as const).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setValue('direction', d)}
            className={cn(
              'flex-1 rounded-xl border py-2 text-sm font-semibold uppercase transition active:scale-[0.98]',
              direction === d
                ? d === 'buy'
                  ? 'border-green bg-green/10 text-green'
                  : 'border-red bg-red/10 text-red'
                : 'border-line text-muted-foreground',
            )}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="entry">Entry</Label>
          <Input id="entry" placeholder="2350.00" inputMode="decimal" {...register('entryPrice')} />
          {errors.entryPrice && <p className="text-xs text-red">{errors.entryPrice.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="exit">Exit</Label>
          <Input id="exit" placeholder="2380.00" inputMode="decimal" {...register('exitPrice')} />
          {errors.exitPrice && <p className="text-xs text-red">{errors.exitPrice.message}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="lots">Lot size</Label>
        <Input id="lots" placeholder="0.10" inputMode="decimal" {...register('lotSize')} />
        {errors.lotSize && <p className="text-xs text-red">{errors.lotSize.message}</p>}
      </div>

      {/* Live P&L preview */}
      <div
        className={cn(
          'flex items-center justify-center rounded-xl px-4 py-2.5 text-center text-sm font-extrabold tabular-nums',
          previewPnl === null
            ? 'border-[1.5px] border-dashed border-line text-muted-foreground'
            : previewPnl >= 0
              ? 'bg-green/10 text-green'
              : 'bg-red/10 text-red',
        )}
      >
        {previewPnl === null ? 'P&L —' : formatPnl(previewPnl, { showPlus: true })}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full active:scale-[0.98]">
        {isSubmitting ? 'Saving…' : 'Add trade'}
      </Button>
    </form>
  )
}
