'use client'

import { ArchiveRestore } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatBalance, formatDate } from '@/lib/format'
import { typeBadge } from '../utils'
import type { AccountWithStats } from '../types'

interface ArchivedAccountItemProps {
  account: AccountWithStats
  onRestore: (id: string) => void
  isRestoring: boolean
}

export function ArchivedAccountItem({ account, onRestore, isRestoring }: ArchivedAccountItemProps) {
  const badge = typeBadge[account.type]
  const initial = account.name.charAt(0).toUpperCase()

  return (
    <div className="flex items-center gap-2.75">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-hair text-base font-extrabold text-muted-foreground">
        {initial}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-px">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-bold">{account.name}</span>
          <span className={cn('shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold', badge.className)}>
            {badge.label}
          </span>
        </div>
        <span className="truncate text-[11.5px] font-semibold text-muted-foreground">
          ${formatBalance(account.currentBalance)}
          {account.archivedAt && ` · Archived ${formatDate(account.archivedAt.toString())}`}
        </span>
      </div>
      <button
        type="button"
        disabled={isRestoring}
        onClick={() => onRestore(account.id)}
        className="shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-clay/10 hover:text-clay active:scale-90 disabled:opacity-40"
      >
        <ArchiveRestore size={16} />
      </button>
    </div>
  )
}
