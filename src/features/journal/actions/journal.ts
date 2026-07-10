'use server'

import { and, eq, gte, lte, sql } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { trade } from '@/lib/db/schema/trade.table'
import { withAuthAction } from '@/lib/better-auth/middleware'
import type { MonthJournalData } from '../types'

export const getMonthJournal = withAuthAction(async (
  { user },
  accountId: string,
  month: string,
): Promise<MonthJournalData> => {
  const [yearStr, monStr] = month.split('-')
  const year = Number(yearStr)
  const mon = Number(monStr)
  const firstDay = `${year}-${String(mon).padStart(2, '0')}-01`
  const lastDate = new Date(year, mon, 0).getDate()
  const lastDay = `${year}-${String(mon).padStart(2, '0')}-${String(lastDate).padStart(2, '0')}`

  const rows = await db
    .select({
      date: trade.date,
      totalPnl: sql<string>`SUM(${trade.pnl})`,
      tradeCount: sql<string>`COUNT(*)`,
      winCount: sql<string>`COUNT(*) FILTER (WHERE ${trade.result} = 'win')`,
      lossCount: sql<string>`COUNT(*) FILTER (WHERE ${trade.result} = 'loss')`,
    })
    .from(trade)
    .where(
      and(
        eq(trade.userId, user.id),
        eq(trade.accountId, accountId),
        gte(trade.date, firstDay),
        lte(trade.date, lastDay),
      ),
    )
    .groupBy(trade.date)

  const days = rows.map((r) => ({
    date: r.date,
    totalPnl: parseFloat(r.totalPnl),
    tradeCount: parseInt(r.tradeCount),
    winCount: parseInt(r.winCount),
    lossCount: parseInt(r.lossCount),
  }))

  const netPnl = days.reduce((s, d) => s + d.totalPnl, 0)
  const winCount = days.reduce((s, d) => s + d.winCount, 0)
  const lossCount = days.reduce((s, d) => s + d.lossCount, 0)
  const tradeCount = days.reduce((s, d) => s + d.tradeCount, 0)
  const winRate = tradeCount > 0 ? Math.round((winCount / tradeCount) * 100) : 0

  return { month, accountId, days, netPnl, winCount, lossCount, tradeCount, winRate }
})
