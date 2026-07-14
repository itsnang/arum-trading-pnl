'use client'

import { BottomSheet } from '@/components/shared/bottom-sheet'
import { DepositForm } from './deposit-form'

interface DepositSheetProps {
  accountId: string
  open: boolean
  onClose: () => void
}

export function DepositSheet({ accountId, open, onClose }: DepositSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Add Deposit">
      <div className="px-5 py-5">
        <DepositForm accountId={accountId} onSuccess={onClose} />
      </div>
    </BottomSheet>
  )
}
