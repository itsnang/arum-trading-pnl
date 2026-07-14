'use client'

import { BottomSheet } from '@/components/shared/bottom-sheet'
import { ArchivedAccountList } from './archived-account-list'

interface ArchivedAccountsSheetProps {
  open: boolean
  onClose: () => void
}

export function ArchivedAccountsSheet({ open, onClose }: ArchivedAccountsSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Archived Accounts">
      <div className="px-5 py-5">
        <ArchivedAccountList />
      </div>
    </BottomSheet>
  )
}
