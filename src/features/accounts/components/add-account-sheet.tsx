'use client'

import { BottomSheet } from '@/components/shared/bottom-sheet'
import { AddAccountForm } from './add-account-form'

interface AddAccountSheetProps {
  open: boolean
  onClose: () => void
}

export function AddAccountSheet({ open, onClose }: AddAccountSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Add Account">
      <div className="px-5 py-5">
        <AddAccountForm onSuccess={onClose} />
      </div>
    </BottomSheet>
  )
}
