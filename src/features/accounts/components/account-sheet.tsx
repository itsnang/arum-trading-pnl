'use client'

import { BottomSheet } from '@/components/shared/bottom-sheet'
import { AccountForm } from './account-form'
import type { AccountWithStats } from '../types'

interface AccountSheetProps {
  /** Pass an existing account to edit it; omit to create a new one. */
  account?: AccountWithStats
  open: boolean
  onClose: () => void
}

export function AccountSheet({ account, open, onClose }: AccountSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} title={account ? 'Edit Account' : 'Add Account'}>
      <div className="px-5 py-5">
        <AccountForm {...(account ? { account } : {})} onSuccess={onClose} />
      </div>
    </BottomSheet>
  )
}
