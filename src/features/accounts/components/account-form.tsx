'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { queryKeys } from '@/lib/query-keys'
import { addAccountSchema, type AddAccountInput } from '../schemas'
import { addAccount, updateAccount } from '../actions'
import type { AccountWithStats } from '../types'

const ACCOUNT_TYPES = [
  { value: 'personal', label: 'Personal' },
  { value: 'funded', label: 'Funded' },
  { value: 'demo', label: 'Demo' },
] as const

interface AccountFormProps {
  /** Pass an existing account to edit it; omit to create a new one. */
  account?: AccountWithStats
  onSuccess?: () => void
}

export function AccountForm({ account, onSuccess }: AccountFormProps) {
  const isEdit = !!account
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddAccountInput>({
    resolver: zodResolver(addAccountSchema),
    defaultValues: account
      ? {
          name: account.name,
          broker: account.broker ?? '',
          type: account.type,
          startingBalance: account.startingBalance,
        }
      : { name: '', broker: '', type: 'personal', startingBalance: '' },
  })

  const selectedType = watch('type')

  const onSubmit = async (values: AddAccountInput) => {
    const result = isEdit ? await updateAccount(account.id, values) : await addAccount(values)
    if (result.error) {
      toast.error(result.error)
      return
    }
    await queryClient.invalidateQueries({ queryKey: queryKeys.accounts() })
    toast.success(isEdit ? 'Account updated' : 'Account created')
    if (!isEdit) reset()
    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="acc-name">Account name</Label>
        <Input
          id="acc-name"
          placeholder="e.g. FTMO 100k Challenge"
          {...register('name')}
        />
        {errors.name && (
          <p className="text-xs text-red">{errors.name.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Type</Label>
        <div className="flex gap-2">
          {ACCOUNT_TYPES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setValue('type', value)}
              className={cn(
                'flex-1 rounded-xl border py-2 text-sm font-medium transition active:scale-[0.98]',
                selectedType === value
                  ? 'border-clay bg-clay/10 text-clay'
                  : 'border-line text-muted-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="acc-broker">Broker (optional)</Label>
        <Input
          id="acc-broker"
          placeholder="e.g. IC Markets"
          {...register('broker')}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="acc-balance">Starting balance ($)</Label>
        <Input
          id="acc-balance"
          placeholder="e.g. 100000"
          inputMode="decimal"
          {...register('startingBalance')}
        />
        {errors.startingBalance && (
          <p className="text-xs text-red">{errors.startingBalance.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting} className="mt-1 w-full active:scale-[0.98]">
        {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create account'}
      </Button>
    </form>
  )
}
