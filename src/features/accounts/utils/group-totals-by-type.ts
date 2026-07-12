import type { AccountType, AccountWithStats } from '../types'

const TYPE_ORDER: AccountType[] = ['personal', 'funded', 'demo']

export interface AccountTypeTotal {
  type: AccountType
  equity: number
  pnl: number
}

/** Personal, funded and demo money means different things — summing
 *  balances or P&L across types would misrepresent what's actually at
 *  stake, so callers show one total per type instead of one blended total. */
export function groupTotalsByType(accounts: AccountWithStats[]): AccountTypeTotal[] {
  return TYPE_ORDER.flatMap((type) => {
    const accountsOfType = accounts.filter((a) => a.type === type)
    if (accountsOfType.length === 0) return []
    const equity = accountsOfType.reduce((sum, a) => sum + parseFloat(a.currentBalance), 0)
    const pnl = accountsOfType.reduce((sum, a) => sum + parseFloat(a.totalPnl), 0)
    return [{ type, equity, pnl }]
  })
}
