'use server'

import { revalidatePath } from 'next/cache'
import { and, desc, eq, getTableColumns, isNotNull, isNull, sql } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { tradingAccount } from '@/lib/db/schema/trading-account.table'
import { trade } from '@/lib/db/schema/trade.table'
import { deposit } from '@/lib/db/schema/deposit.table'
import { withAuthAction } from '@/lib/better-auth/middleware'
import type { AddAccountInput } from '../schemas'

// Shared by getAccountsWithStats/getArchivedAccountsWithStats — trade and
// deposit are both one-to-many against tradingAccount, so each is
// pre-aggregated to one row per accountId in its own subquery before being
// joined — joining both un-aggregated tables into a single GROUP BY would
// fan out and multiply the sums.
async function fetchAccountsWithStats(userId: string, archived: boolean) {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().slice(0, 10)

  const tradeStats = db
    .select({
      accountId: trade.accountId,
      totalPnl: sql<string>`COALESCE(SUM(${trade.pnl}), 0)`.as('total_pnl'),
      tradeCount: sql<string>`COUNT(${trade.id})`.as('trade_count'),
      recentCount: sql<string>`COUNT(${trade.id}) FILTER (WHERE ${trade.date} >= ${thirtyDaysAgoStr})`.as(
        'recent_count',
      ),
    })
    .from(trade)
    .where(eq(trade.userId, userId))
    .groupBy(trade.accountId)
    .as('trade_stats')

  const depositStats = db
    .select({
      accountId: deposit.accountId,
      totalDeposits: sql<string>`COALESCE(SUM(${deposit.amount}), 0)`.as('total_deposits'),
    })
    .from(deposit)
    .where(eq(deposit.userId, userId))
    .groupBy(deposit.accountId)
    .as('deposit_stats')

  const rows = await db
    .select({
      ...getTableColumns(tradingAccount),
      totalPnl: sql<string>`COALESCE(${tradeStats.totalPnl}, 0)`,
      tradeCount: sql<string>`COALESCE(${tradeStats.tradeCount}, 0)`,
      recentCount: sql<string>`COALESCE(${tradeStats.recentCount}, 0)`,
      totalDeposits: sql<string>`COALESCE(${depositStats.totalDeposits}, 0)`,
    })
    .from(tradingAccount)
    .leftJoin(tradeStats, eq(tradeStats.accountId, tradingAccount.id))
    .leftJoin(depositStats, eq(depositStats.accountId, tradingAccount.id))
    .where(
      and(
        eq(tradingAccount.userId, userId),
        archived ? isNotNull(tradingAccount.archivedAt) : isNull(tradingAccount.archivedAt),
      ),
    )
    .orderBy(archived ? desc(tradingAccount.archivedAt) : desc(tradingAccount.createdAt))

  return rows.map((row) => {
    const currentBalance = (
      parseFloat(row.startingBalance) + parseFloat(row.totalPnl) + parseFloat(row.totalDeposits)
    ).toFixed(2)

    return {
      ...row,
      currentBalance,
      tradeCount: parseInt(row.tradeCount),
      isActive: parseInt(row.recentCount) > 0,
    }
  })
}

export const getAccountsWithStats = withAuthAction(({ user }) => fetchAccountsWithStats(user.id, false))

export const getArchivedAccountsWithStats = withAuthAction(({ user }) =>
  fetchAccountsWithStats(user.id, true),
)

export const addAccount = withAuthAction(
  async ({ user }, input: AddAccountInput): Promise<{ error?: string }> => {
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
      revalidatePath('/journal')
      return {}
    } catch {
      return { error: 'Failed to create account' }
    }
  },
)

export const updateAccount = withAuthAction(
  async (
    { user },
    accountId: string,
    input: AddAccountInput,
  ): Promise<{ error?: string }> => {
    try {
      const [updated] = await db
        .update(tradingAccount)
        .set({
          name: input.name,
          broker: input.broker ?? null,
          type: input.type,
          startingBalance: input.startingBalance,
          updatedAt: new Date(),
        })
        .where(and(eq(tradingAccount.id, accountId), eq(tradingAccount.userId, user.id)))
        .returning({ id: tradingAccount.id })
      if (!updated) return { error: 'Account not found' }
      revalidatePath('/accounts')
      revalidatePath('/journal')
      return {}
    } catch {
      return { error: 'Failed to update account' }
    }
  },
)

export const archiveAccount = withAuthAction(
  async ({ user }, accountId: string): Promise<{ error?: string }> => {
    try {
      const [updated] = await db
        .update(tradingAccount)
        .set({ archivedAt: new Date(), updatedAt: new Date() })
        .where(
          and(
            eq(tradingAccount.id, accountId),
            eq(tradingAccount.userId, user.id),
            isNull(tradingAccount.archivedAt),
          ),
        )
        .returning({ id: tradingAccount.id })
      if (!updated) return { error: 'Account not found' }
      revalidatePath('/accounts')
      revalidatePath('/journal')
      return {}
    } catch {
      return { error: 'Failed to archive account' }
    }
  },
)

export const restoreAccount = withAuthAction(
  async ({ user }, accountId: string): Promise<{ error?: string }> => {
    try {
      const [updated] = await db
        .update(tradingAccount)
        .set({ archivedAt: null, updatedAt: new Date() })
        .where(
          and(
            eq(tradingAccount.id, accountId),
            eq(tradingAccount.userId, user.id),
            isNotNull(tradingAccount.archivedAt),
          ),
        )
        .returning({ id: tradingAccount.id })
      if (!updated) return { error: 'Account not found' }
      revalidatePath('/accounts')
      revalidatePath('/journal')
      return {}
    } catch {
      return { error: 'Failed to restore account' }
    }
  },
)
