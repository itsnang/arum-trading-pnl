'use client'

import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { queryKeys } from '@/lib/query-keys'
import { deleteAccount } from '../actions'
import type { AccountWithStats } from '../types'

interface DeleteAccountAlertProps {
  account: AccountWithStats
  open: boolean
  onClose: () => void
}

export function DeleteAccountAlert({ account, open, onClose }: DeleteAccountAlertProps) {
  const queryClient = useQueryClient()

  const handleDelete = async () => {
    const result = await deleteAccount(account.id)
    if (result.error) {
      toast.error(result.error)
      return
    }
    await queryClient.invalidateQueries({ queryKey: queryKeys.accounts() })
    toast.success('Account deleted')
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {account.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            {account.tradeCount > 0
              ? `This permanently deletes the account and its ${account.tradeCount} logged trade${account.tradeCount !== 1 ? 's' : ''}. This can't be undone.`
              : "This permanently deletes the account. This can't be undone."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleDelete}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
