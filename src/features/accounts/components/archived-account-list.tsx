'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { queryKeys } from '@/lib/query-keys'
import { useArchivedAccounts } from '../hooks/use-archived-accounts'
import { restoreAccount } from '../actions'
import { ArchivedAccountItem } from './archived-account-item'

function ArchivedAccountListSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[0, 1].map((i) => (
        <div key={i} className="flex items-center gap-2.75">
          <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
          <Skeleton className="h-8 flex-1" />
        </div>
      ))}
    </div>
  )
}

export function ArchivedAccountList() {
  const queryClient = useQueryClient()
  const { data: accounts = [], isPending } = useArchivedAccounts()
  const [restoringId, setRestoringId] = useState<string | null>(null)

  const handleRestore = async (id: string) => {
    setRestoringId(id)
    const result = await restoreAccount(id)
    if (result.error) {
      toast.error(result.error)
    } else {
      await queryClient.invalidateQueries({ queryKey: queryKeys.accounts() })
      toast.success('Account restored')
    }
    setRestoringId(null)
  }

  if (isPending) return <ArchivedAccountListSkeleton />

  if (accounts.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">No archived accounts.</p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {accounts.map((account) => (
        <ArchivedAccountItem
          key={account.id}
          account={account}
          onRestore={handleRestore}
          isRestoring={restoringId === account.id}
        />
      ))}
    </div>
  )
}
