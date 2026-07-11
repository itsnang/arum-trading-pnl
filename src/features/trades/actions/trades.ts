'use server'

import { revalidatePath } from 'next/cache'
import { supabase } from '@/lib/supabase/client'
import { withAuthAction } from '@/lib/better-auth/middleware'
import type { QuickTradeInput } from '../schemas/quick-trade.schema'
import type { CalcTradeInput } from '../schemas/calc-trade.schema'
import type { Trade } from '../types'
import { calcPnl } from '../utils/calc-pnl'

interface TradeRow {
  id: string
  user_id: string
  account_id: string
  date: string
  mode: 'quick' | 'calc'
  direction: 'buy' | 'sell' | null
  result: 'win' | 'loss' | null
  pnl: number | string
  entry_price: number | string | null
  exit_price: number | string | null
  lot_size: number | string | null
  created_at: string
  updated_at: string
}

function mapTradeRow(row: TradeRow): Trade {
  return {
    id: row.id,
    userId: row.user_id,
    accountId: row.account_id,
    date: row.date,
    mode: row.mode,
    direction: row.direction,
    result: row.result,
    pnl: String(row.pnl),
    entryPrice: row.entry_price === null ? null : String(row.entry_price),
    exitPrice: row.exit_price === null ? null : String(row.exit_price),
    lotSize: row.lot_size === null ? null : String(row.lot_size),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

export const getTradesForDay = withAuthAction(async ({ user }, accountId: string, date: string): Promise<Trade[]> => {
  const { data, error } = await supabase
    .from('trade')
    .select('*')
    .eq('user_id', user.id)
    .eq('account_id', accountId)
    .eq('date', date)
  if (error) throw new Error(error.message)
  return (data as TradeRow[]).map(mapTradeRow)
})

export const addQuickTrade = withAuthAction(
  async ({ user }, input: QuickTradeInput): Promise<{ error?: string }> => {
    const pnl = input.result === 'win' ? input.pnl : `-${input.pnl}`
    const { error } = await supabase.from('trade').insert({
      id: crypto.randomUUID(),
      user_id: user.id,
      account_id: input.accountId,
      date: input.date,
      mode: 'quick',
      result: input.result,
      pnl,
    })
    if (error) return { error: 'Failed to save trade' }
    revalidatePath('/journal')
    revalidatePath('/accounts')
    return {}
  },
)

export const addCalcTrade = withAuthAction(
  async ({ user }, input: CalcTradeInput): Promise<{ error?: string }> => {
    const entry = parseFloat(input.entryPrice)
    const exit = parseFloat(input.exitPrice)
    const lots = parseFloat(input.lotSize)
    const rawPnl = calcPnl(input.direction, entry, exit, lots)
    const result = rawPnl >= 0 ? 'win' : 'loss'
    const { error } = await supabase.from('trade').insert({
      id: crypto.randomUUID(),
      user_id: user.id,
      account_id: input.accountId,
      date: input.date,
      mode: 'calc',
      direction: input.direction,
      result,
      pnl: rawPnl.toFixed(2),
      entry_price: input.entryPrice,
      exit_price: input.exitPrice,
      lot_size: input.lotSize,
    })
    if (error) return { error: 'Failed to save trade' }
    revalidatePath('/journal')
    revalidatePath('/accounts')
    return {}
  },
)

export const deleteTrade = withAuthAction(
  async ({ user }, tradeId: string): Promise<{ error?: string }> => {
    const { error } = await supabase.from('trade').delete().eq('id', tradeId).eq('user_id', user.id)
    if (error) return { error: 'Failed to delete trade' }
    revalidatePath('/journal')
    revalidatePath('/accounts')
    return {}
  },
)
