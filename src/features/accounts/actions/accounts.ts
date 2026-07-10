'use server'

import { revalidatePath } from 'next/cache'
import { and, desc, eq, getTableColumns, sql } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { tradingAccount } from '@/lib/db/schema/trading-account.table'
import { trade } from '@/lib/db/schema/trade.table'
import { requireSession } from '@/lib/better-auth/session'
import type { AddAccountInput } from '../schemas'

export async function getAccountsWithStats() {
  const { user } = await requireSession()

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().slice(0, 10)

  // Single grouped query instead of one stats round trip per account.
  const rows = await db
    .select({
      ...getTableColumns(tradingAccount),
      totalPnl: sql<string>`COALESCE(SUM(${trade.pnl}), 0)`,
      tradeCount: sql<string>`COUNT(${trade.id})`,
      recentCount: sql<string>`COUNT(${trade.id}) FILTER (WHERE ${trade.date} >= ${thirtyDaysAgoStr})`,
    })
    .from(tradingAccount)
    .leftJoin(trade, and(eq(trade.accountId, tradingAccount.id), eq(trade.userId, user.id)))
    .where(eq(tradingAccount.userId, user.id))
    .groupBy(tradingAccount.id)
    .orderBy(desc(tradingAccount.createdAt))

  return rows.map((row) => {
    const currentBalance = (
      parseFloat(row.startingBalance) + parseFloat(row.totalPnl)
    ).toFixed(2)

    return {
      ...row,
      currentBalance,
      tradeCount: parseInt(row.tradeCount),
      isActive: parseInt(row.recentCount) > 0,
    }
  })
}

export async function addAccount(input: AddAccountInput): Promise<{ error?: string }> {
  const { user } = await requireSession()

  try {
    await db.insert(tradingAccount).values({
      id: crypto.randomUUID(),
      userId: user.id,
      name: input.name,
      broker: input.broker ?? null,
      type: input.type,
      startingBalance: input.startingBalance,
    })
    revalidatePath('/accounts')
    return {}
  } catch {
    return { error: 'Failed to create account' }
  }
}

export async function deleteAccount(accountId: string): Promise<{ error?: string }> {
  const { user } = await requireSession()

  try {
    await db
      .delete(tradingAccount)
      .where(and(eq(tradingAccount.id, accountId), eq(tradingAccount.userId, user.id)))
    revalidatePath('/accounts')
    return {}
  } catch {
    return { error: 'Failed to delete account' }
  }
}
