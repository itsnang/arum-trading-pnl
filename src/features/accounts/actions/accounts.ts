'use server'

import { revalidatePath } from 'next/cache'
import { supabase } from '@/lib/supabase/client'
import { withAuthAction } from '@/lib/better-auth/middleware'
import type { AddAccountInput } from '../schemas'
import type { AccountWithStats } from '../types'

interface AccountStatsRow {
  id: string
  user_id: string
  name: string
  broker: string | null
  type: 'personal' | 'funded' | 'demo'
  starting_balance: number | string
  created_at: string
  updated_at: string
  total_pnl: number | string
  trade_count: number | string
  recent_count: number | string
}

export const getAccountsWithStats = withAuthAction(async ({ user }): Promise<AccountWithStats[]> => {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().slice(0, 10)

  const { data, error } = await supabase.rpc('get_accounts_with_stats', {
    p_user_id: user.id,
    p_recent_since: thirtyDaysAgoStr,
  })
  if (error) throw new Error(error.message)

  return (data as AccountStatsRow[]).map((row) => {
    const startingBalance = String(row.starting_balance)
    const totalPnl = String(row.total_pnl)
    const currentBalance = (parseFloat(startingBalance) + parseFloat(totalPnl)).toFixed(2)

    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      broker: row.broker,
      type: row.type,
      startingBalance,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      totalPnl,
      currentBalance,
      tradeCount: Number(row.trade_count),
      isActive: Number(row.recent_count) > 0,
    }
  })
})

export const addAccount = withAuthAction(
  async ({ user }, input: AddAccountInput): Promise<{ error?: string }> => {
    const { error } = await supabase.from('trading_account').insert({
      id: crypto.randomUUID(),
      user_id: user.id,
      name: input.name,
      broker: input.broker ?? null,
      type: input.type,
      starting_balance: input.startingBalance,
    })
    if (error) return { error: 'Failed to create account' }
    revalidatePath('/accounts')
    return {}
  },
)

export const deleteAccount = withAuthAction(
  async ({ user }, accountId: string): Promise<{ error?: string }> => {
    const { error } = await supabase
      .from('trading_account')
      .delete()
      .eq('id', accountId)
      .eq('user_id', user.id)
    if (error) return { error: 'Failed to delete account' }
    revalidatePath('/accounts')
    return {}
  },
)
