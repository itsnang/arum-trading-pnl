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
import { archiveAccount } from '../actions'
import type { AccountWithStats } from '../types'

interface ArchiveAccountAlertProps {
  account: AccountWithStats
  open: boolean
  onClose: () => void
}

export function ArchiveAccountAlert({ account, open, onClose }: ArchiveAccountAlertProps) {
  const queryClient = useQueryClient()

  const handleArchive = async () => {
    const result = await archiveAccount(account.id)
    if (result.error) {
      toast.error(result.error)
      return
    }
    await queryClient.invalidateQueries({ queryKey: queryKeys.accounts() })
    toast.success('Account archived')
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive {account.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This hides the account and its trades from your list. You can restore it anytime
            from Archived accounts.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleArchive}>Archive</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
