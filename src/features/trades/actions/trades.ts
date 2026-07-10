'use server'

import { revalidatePath } from 'next/cache'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { trade } from '@/lib/db/schema/trade.table'
import { requireSession } from '@/lib/better-auth/session'
import type { QuickTradeInput } from '../schemas/quick-trade.schema'
import type { CalcTradeInput } from '../schemas/calc-trade.schema'
import { calcPnl } from '../utils/calc-pnl'

export async function getTradesForDay(accountId: string, date: string) {
  const { user } = await requireSession()
  return db
    .select()
    .from(trade)
    .where(
      and(
        eq(trade.userId, user.id),
        eq(trade.accountId, accountId),
        eq(trade.date, date),
      ),
    )
}

export async function addQuickTrade(input: QuickTradeInput): Promise<{ error?: string }> {
  const { user } = await requireSession()
  const pnl = input.result === 'win' ? input.pnl : `-${input.pnl}`
  try {
    await db.insert(trade).values({
      id: crypto.randomUUID(),
      userId: user.id,
      accountId: input.accountId,
      date: input.date,
      mode: 'quick',
      result: input.result,
      pnl,
    })
    revalidatePath('/journal')
    revalidatePath('/accounts')
    return {}
  } catch {
    return { error: 'Failed to save trade' }
  }
}

export async function addCalcTrade(input: CalcTradeInput): Promise<{ error?: string }> {
  const { user } = await requireSession()
  const entry = parseFloat(input.entryPrice)
  const exit = parseFloat(input.exitPrice)
  const lots = parseFloat(input.lotSize)
  const rawPnl = calcPnl(input.direction, entry, exit, lots)
  const result = rawPnl >= 0 ? 'win' : 'loss'
  try {
    await db.insert(trade).values({
      id: crypto.randomUUID(),
      userId: user.id,
      accountId: input.accountId,
      date: input.date,
      mode: 'calc',
      direction: input.direction,
      result,
      pnl: rawPnl.toFixed(2),
      entryPrice: input.entryPrice,
      exitPrice: input.exitPrice,
      lotSize: input.lotSize,
    })
    revalidatePath('/journal')
    revalidatePath('/accounts')
    return {}
  } catch {
    return { error: 'Failed to save trade' }
  }
}

export async function deleteTrade(tradeId: string): Promise<{ error?: string }> {
  const { user } = await requireSession()
  try {
    await db
      .delete(trade)
      .where(and(eq(trade.id, tradeId), eq(trade.userId, user.id)))
    revalidatePath('/journal')
    revalidatePath('/accounts')
    return {}
  } catch {
    return { error: 'Failed to delete trade' }
  }
}
