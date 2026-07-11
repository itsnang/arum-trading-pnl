'use server'

import { supabase } from '@/lib/supabase/client'
import { withAuthAction } from '@/lib/better-auth/middleware'
import type { MonthJournalData } from '../types'

interface MonthJournalRow {
  date: string
  total_pnl: number | string
  trade_count: number | string
  win_count: number | string
  loss_count: number | string
}

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

  const { data, error } = await supabase.rpc('get_month_journal', {
    p_user_id: user.id,
    p_account_id: accountId,
    p_first_day: firstDay,
    p_last_day: lastDay,
  })
  if (error) throw new Error(error.message)

  const days = (data as MonthJournalRow[]).map((r) => ({
    date: r.date,
    totalPnl: parseFloat(String(r.total_pnl)),
    tradeCount: Number(r.trade_count),
    winCount: Number(r.win_count),
    lossCount: Number(r.loss_count),
  }))

  const netPnl = days.reduce((s, d) => s + d.totalPnl, 0)
  const winCount = days.reduce((s, d) => s + d.winCount, 0)
  const lossCount = days.reduce((s, d) => s + d.lossCount, 0)
  const tradeCount = days.reduce((s, d) => s + d.tradeCount, 0)
  const winRate = tradeCount > 0 ? Math.round((winCount / tradeCount) * 100) : 0

  return { month, accountId, days, netPnl, winCount, lossCount, tradeCount, winRate }
})
