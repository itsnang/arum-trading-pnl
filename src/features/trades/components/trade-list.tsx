'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { deleteTrade } from '../actions'
import { TradeItem } from './trade-item'
import { invalidateTradeQueries } from '../utils'
import type { Trade } from '../types'

interface TradeListProps {
  trades: Trade[]
  accountId: string
  date: string
}

export function TradeList({ trades, accountId, date }: TradeListProps) {
  const queryClient = useQueryClient()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    const result = await deleteTrade(id)
    if (result.error) {
      toast.error(result.error)
    } else {
      await invalidateTradeQueries(queryClient, accountId, date)
      toast.success('Trade deleted')
    }
    setDeletingId(null)
  }

  if (trades.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No trades logged for this day.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {trades.map((t) => (
        <TradeItem
          key={t.id}
          trade={t}
          onDelete={handleDelete}
          isDeleting={deletingId === t.id}
        />
      ))}
    </div>
  )
}
