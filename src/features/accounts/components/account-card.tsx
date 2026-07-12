'use client'

import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatBalance, formatPnl } from '@/lib/format'
import { AccountSheet } from './account-sheet'
import { DeleteAccountAlert } from './delete-account-alert'
import type { AccountWithStats, AccountType } from '../types'

const typeBadge: Record<AccountType, { label: string; className: string }> = {
  personal: { label: 'Personal', className: 'bg-green/10 text-green' },
  funded: { label: 'Funded', className: 'bg-clay/10 text-clay' },
  demo: { label: 'Demo', className: 'bg-hair text-muted-foreground' },
}

interface AccountCardProps {
  account: AccountWithStats
  isSelected: boolean
  onSelect: () => void
}

export function AccountCard({ account, isSelected, onSelect }: AccountCardProps) {
  const badge = typeBadge[account.type]
  const pnl = parseFloat(account.totalPnl)
  const isPositive = pnl >= 0
  const initial = account.name.charAt(0).toUpperCase()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onSelect()
          }
        }}
        className={cn(
          'flex flex-col gap-2.75 rounded-xl border-[1.5px] bg-card px-3.75 py-3.75 text-left transition-colors',
          isSelected ? 'border-clay' : 'border-line',
        )}
      >
        <div className="flex items-center gap-2.75">
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-extrabold',
              isSelected ? 'bg-clay text-white' : 'bg-hair text-muted-foreground',
            )}
          >
            {initial}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-px">
            <span className="truncate text-sm font-bold">{account.name}</span>
            <span className="truncate text-[11.5px] font-semibold text-muted-foreground">
              {account.broker || '—'}
            </span>
          </div>
          <span
            className={cn(
              'shrink-0 rounded-md px-2 py-1 text-[11px] font-bold',
              badge.className,
            )}
          >
            {badge.label}
          </span>
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              aria-label="Edit account"
              onClick={(e) => {
                e.stopPropagation()
                setEditOpen(true)
              }}
              className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-hair hover:text-foreground active:scale-90"
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              aria-label="Delete account"
              onClick={(e) => {
                e.stopPropagation()
                setDeleteOpen(true)
              }}
              className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-red/10 hover:text-red active:scale-90"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <div className="flex flex-col gap-px">
            <span className="text-[10.5px] font-semibold text-muted-foreground">Balance</span>
            <span className="text-[17px] font-extrabold tracking-tight tabular-nums">
              ${formatBalance(account.currentBalance)}
            </span>
          </div>
          <div className="flex flex-col items-end gap-px">
            <span className="text-[10.5px] font-semibold text-muted-foreground">
              P&amp;L · {account.tradeCount} trade{account.tradeCount !== 1 ? 's' : ''}
            </span>
            <span
              className={cn(
                'text-sm font-extrabold tabular-nums',
                isPositive ? 'text-green' : 'text-red',
              )}
            >
              {formatPnl(pnl, { showPlus: true })}
            </span>
          </div>
        </div>
        {isSelected && (
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-clay" />
            <span className="text-xs font-semibold text-clay">
              Active — journal logs to this account
            </span>
          </div>
        )}
      </div>
      <AccountSheet account={account} open={editOpen} onClose={() => setEditOpen(false)} />
      <DeleteAccountAlert account={account} open={deleteOpen} onClose={() => setDeleteOpen(false)} />
    </>
  )
}
