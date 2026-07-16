'use client'

import { useState } from 'react'
import { Archive, Plus } from 'lucide-react'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { TourTooltip } from '@/components/shared/tour-tooltip'
import { useSelectedAccountStore } from '../store/accounts.store'
import { useAccounts } from '../hooks/use-accounts'
import { groupTotalsByType } from '../utils'
import { AccountTypeTotals } from './account-type-totals'
import { AccountCard } from './account-card'
import { AccountSheet } from './account-sheet'
import { ArchivedAccountsSheet } from './archived-accounts-sheet'

export function AccountsScreen() {
  const { data: accounts = [] } = useAccounts()
  const [addOpen, setAddOpen] = useState(false)
  const [archivedOpen, setArchivedOpen] = useState(false)
  const { selectedAccountId, setSelectedAccountId } = useSelectedAccountStore()

  const typeTotals = groupTotalsByType(accounts)

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pb-3 pt-2">
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
            aria-label="View archived accounts"
            onClick={() => setArchivedOpen(true)}
            className="grid h-[38px] w-[38px] place-items-center rounded-lg bg-muted text-muted-foreground transition-colors hover:text-foreground active:scale-90"
          >
            <Archive size={16} />
          </button>
          <button
            type="button"
            data-tour="add-account"
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1 rounded-xl bg-clay px-3 py-2 text-xs font-semibold text-white transition-transform active:scale-[0.98]"
          >
            <Plus size={14} />
            Add
          </button>
        </div>
      </div>

      <TourTooltip
        storageKey="pipfolio_accounts_tour"
        steps={[
          { target: 'profile-avatar', title: 'Edit your profile', body: 'Tap your avatar to change your name or photo.', tipPosition: 'below' },
          { target: 'add-account', title: 'Add an account', body: 'Create personal, funded, or demo accounts to track separately.', tipPosition: 'below' },
          { target: 'account-totals', title: 'Account totals', body: 'Balances are grouped by type — personal, funded, and demo are never mixed.', tipPosition: 'below' },
        ]}
      />

      <div data-tour="account-totals">
        <AccountTypeTotals totals={typeTotals} />
      </div>

      {/* Account list */}
      <div className="flex flex-col gap-3 px-5 lg:grid lg:grid-cols-2 lg:gap-4 xl:grid-cols-3">
        {accounts.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground lg:col-span-2 xl:col-span-3">
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

      <AccountSheet open={addOpen} onClose={() => setAddOpen(false)} />
      <ArchivedAccountsSheet open={archivedOpen} onClose={() => setArchivedOpen(false)} />
    </div>
  )
}
