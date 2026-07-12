'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { signOut } from '@/lib/better-auth/client'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { useSelectedAccountStore } from '../store/accounts.store'
import { useAccounts } from '../hooks/use-accounts'
import { groupTotalsByType } from '../utils'
import { AccountTypeTotals } from './account-type-totals'
import { AccountCard } from './account-card'
import { AccountSheet } from './account-sheet'

export function AccountsScreen() {
  const router = useRouter()
  const { data: accounts = [] } = useAccounts()
  const [addOpen, setAddOpen] = useState(false)
  const { selectedAccountId, setSelectedAccountId } = useSelectedAccountStore()

  const typeTotals = groupTotalsByType(accounts)

  const handleSignOut = () => {
    signOut({ fetchOptions: { onSuccess: () => router.push('/login') } })
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pb-3 pt-12">
        <div>
          <h1 className="text-xl font-extrabold">Accounts</h1>
          <p className="text-xs text-muted-foreground">
            {accounts.length} account{accounts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1 rounded-xl bg-clay px-3 py-2 text-xs font-semibold text-white transition-transform active:scale-[0.98]"
          >
            <Plus size={14} />
            Add
          </button>
        </div>
      </div>

      {/* Per-type totals — balances/P&L are never blended across account types */}
      <AccountTypeTotals totals={typeTotals} />

      {/* Account list */}
      <div className="flex flex-col gap-3 px-5">
        {accounts.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No accounts yet. Add one to get started.
          </div>
        ) : (
          accounts.map((acc) => (
            <AccountCard
              key={acc.id}
              account={acc}
              isSelected={acc.id === selectedAccountId}
              onSelect={() => setSelectedAccountId(acc.id)}
            />
          ))
        )}
      </div>

      {/* Sign out */}
      <div className="mt-8 px-5 pb-4">
        <Separator className="mb-6" />
        <Button variant="outline" className="w-full" onClick={handleSignOut}>
          Sign out
        </Button>
      </div>

      <AccountSheet open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}
