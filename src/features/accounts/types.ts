export type AccountType = 'personal' | 'funded' | 'demo'

export interface TradingAccount {
  id: string
  userId: string
  name: string
  broker: string | null
  type: AccountType
  startingBalance: string
  createdAt: Date
  updatedAt: Date
}

export interface AccountWithStats extends TradingAccount {
  currentBalance: string
  totalPnl: string
  totalDeposits: string
  tradeCount: number
  isActive: boolean
}
