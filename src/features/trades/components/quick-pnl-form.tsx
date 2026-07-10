'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { formatPnl } from '@/lib/format'
import { quickTradeSchema, type QuickTradeInput } from '../schemas/quick-trade.schema'
import { addQuickTrade } from '../actions'
import { invalidateTradeQueries } from '../utils'

interface QuickPnlFormProps {
  accountId: string
  date: string
  onSuccess?: () => void
}

export function QuickPnlForm({ accountId, date, onSuccess }: QuickPnlFormProps) {
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<QuickTradeInput>({
    resolver: zodResolver(quickTradeSchema),
    defaultValues: { accountId, date, result: 'win', pnl: '' },
  })

  const result = watch('result')

  const onSubmit = async (values: QuickTradeInput) => {
    const res = await addQuickTrade(values)
    if (res.error) {
      toast.error(res.error)
      return
    }
    await invalidateTradeQueries(queryClient, accountId, date)
    const signedPnl = values.result === 'win' ? parseFloat(values.pnl) : -parseFloat(values.pnl)
    toast.success(`Trade logged · ${formatPnl(signedPnl, { showPlus: true })}`)
    reset({ accountId, date, result: 'win', pnl: '' })
    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {/* Result toggle */}
      <div className="flex gap-2">
        {(['win', 'loss'] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setValue('result', r)}
            className={cn(
              'flex-1 rounded-xl border py-2 text-sm font-semibold capitalize transition active:scale-[0.98]',
              result === r
                ? r === 'win'
                  ? 'border-green bg-green/10 text-green'
                  : 'border-red bg-red/10 text-red'
                : 'border-line text-muted-foreground',
            )}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Amount */}
      <div className="flex flex-col gap-1.5">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
          <Input
            className="pl-7"
            placeholder="0.00"
            inputMode="decimal"
            {...register('pnl')}
          />
        </div>
        {errors.pnl && <p className="text-xs text-red">{errors.pnl.message}</p>}
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className={cn(
          'w-full active:scale-[0.98]',
          result === 'win'
            ? 'bg-green hover:bg-green/90'
            : 'bg-red hover:bg-red/90',
        )}
      >
        {isSubmitting ? 'Saving…' : result === 'win' ? 'Log win' : 'Log loss'}
      </Button>
    </form>
  )
}
