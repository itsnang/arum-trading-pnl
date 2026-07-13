'use server'

import { revalidatePath } from 'next/cache'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { trade } from '@/lib/db/schema/trade.table'
import { withAuthAction } from '@/lib/better-auth/middleware'
import { storageAdapter } from '@/lib/storage'
import type { QuickTradeInput } from '../schemas/quick-trade.schema'
import type { CalcTradeInput } from '../schemas/calc-trade.schema'
import type { Trade } from '../types'
import { calcPnl } from '../utils/calc-pnl'

async function resolveScreenshotUrl(screenshotPath: string | null): Promise<string | null> {
  if (!screenshotPath) return null
  return storageAdapter.getSignedUrl(screenshotPath).catch(() => null)
}

export const getTradesForDay = withAuthAction(async ({ user }, accountId: string, date: string) => {
  const rows = await db
    .select()
    .from(trade)
    .where(
      and(
        eq(trade.userId, user.id),
        eq(trade.accountId, accountId),
        eq(trade.date, date),
      ),
    )
  return Promise.all(
    rows.map(async (row): Promise<Trade> => ({
      ...row,
      screenshotUrl: await resolveScreenshotUrl(row.screenshotPath),
    })),
  )
})

export const addQuickTrade = withAuthAction(
  async ({ user }, input: QuickTradeInput): Promise<{ error?: string; trade?: Trade }> => {
    const pnl = input.result === 'win' ? input.pnl : `-${input.pnl}`
    try {
      const [inserted] = await db
        .insert(trade)
        .values({
          id: crypto.randomUUID(),
          userId: user.id,
          accountId: input.accountId,
          date: input.date,
          mode: 'quick',
          result: input.result,
          pnl,
          screenshotPath: input.screenshotPath ?? null,
        })
        .returning()
      if (!inserted) return { error: 'Failed to save trade' }
      revalidatePath('/journal')
      revalidatePath('/accounts')
      return { trade: { ...inserted, screenshotUrl: await resolveScreenshotUrl(inserted.screenshotPath) } }
    } catch {
      return { error: 'Failed to save trade' }
    }
  },
)

export const addCalcTrade = withAuthAction(
  async ({ user }, input: CalcTradeInput): Promise<{ error?: string }> => {
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
        screenshotPath: input.screenshotPath ?? null,
      })
      revalidatePath('/journal')
      revalidatePath('/accounts')
      return {}
    } catch {
      return { error: 'Failed to save trade' }
    }
  },
)

export const deleteTrade = withAuthAction(
  async ({ user }, tradeId: string): Promise<{ error?: string }> => {
    try {
      const [deleted] = await db
        .delete(trade)
        .where(and(eq(trade.id, tradeId), eq(trade.userId, user.id)))
        .returning({ screenshotPath: trade.screenshotPath })
      if (deleted?.screenshotPath) {
        await storageAdapter.delete(deleted.screenshotPath).catch(() => {})
      }
      revalidatePath('/journal')
      revalidatePath('/accounts')
      return {}
    } catch {
      return { error: 'Failed to delete trade' }
    }
  },
)
