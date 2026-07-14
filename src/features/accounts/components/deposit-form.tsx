'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { queryKeys } from '@/lib/query-keys'
import { depositSchema, type DepositInput } from '../schemas'
import { addDeposit } from '../actions'

interface DepositFormProps {
  accountId: string
  onSuccess?: () => void
}

export function DepositForm({ accountId, onSuccess }: DepositFormProps) {
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DepositInput>({
    resolver: zodResolver(depositSchema),
    defaultValues: { amount: '', note: '' },
  })

  const onSubmit = async (values: DepositInput) => {
    const result = await addDeposit(accountId, values)
    if (result.error) {
      toast.error(result.error)
      return
    }
    await queryClient.invalidateQueries({ queryKey: queryKeys.accounts() })
    toast.success('Deposit added')
    reset()
    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="dep-amount">Amount ($)</Label>
        <Input
          id="dep-amount"
          placeholder="e.g. 5000"
          inputMode="decimal"
          {...register('amount')}
        />
        {errors.amount && (
          <p className="text-xs text-red">{errors.amount.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="dep-note">Note (optional)</Label>
        <Input
          id="dep-note"
          placeholder="e.g. Reload after drawdown"
          {...register('note')}
        />
        {errors.note && (
          <p className="text-xs text-red">{errors.note.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting} className="mt-1 w-full active:scale-[0.98]">
        {isSubmitting ? 'Saving…' : 'Add deposit'}
      </Button>
    </form>
  )
}
