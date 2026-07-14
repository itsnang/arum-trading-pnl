'use client'

import { useState } from 'react'
import { Archive, MoreHorizontal, Pencil, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatBalance, formatPnl } from '@/lib/format'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AccountSheet } from './account-sheet'
import { ArchiveAccountAlert } from './archive-account-alert'
import { DepositSheet } from './deposit-sheet'
import { typeBadge } from '../utils'
import type { AccountWithStats } from '../types'

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
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [depositOpen, setDepositOpen] = useState(false)

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
          'flex flex-col rounded-xl border-[1.5px] bg-card text-left transition-colors',
          isSelected ? 'border-clay' : 'border-line',
        )}
      >
        {/* Header row */}
        <div className="flex items-center gap-2.5 px-4 pt-4 pb-3">
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Account actions"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                className="shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-hair hover:text-foreground active:scale-90"
              >
                <MoreHorizontal size={15} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setDepositOpen(true)}>
                <Wallet size={14} />
                Add deposit
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                <Pencil size={14} />
                Edit account
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onSelect={() => setArchiveOpen(true)}>
                <Archive size={14} />
                Archive account
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Separator />

        {/* Balance / P&L row */}
        <div className="flex items-baseline justify-between gap-2 px-4 pt-3 pb-4">
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

        {/* Active indicator */}
        {isSelected && (
          <div className="flex items-center gap-1.5 border-t border-clay/20 px-4 py-2.5">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-clay" />
            <span className="text-xs font-semibold text-clay">
              Active — journal logs to this account
            </span>
          </div>
        )}
      </div>
      <AccountSheet account={account} open={editOpen} onClose={() => setEditOpen(false)} />
      <ArchiveAccountAlert account={account} open={archiveOpen} onClose={() => setArchiveOpen(false)} />
      <DepositSheet accountId={account.id} open={depositOpen} onClose={() => setDepositOpen(false)} />
    </>
  )
}
