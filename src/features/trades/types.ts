export type TradeMode = 'quick' | 'calc'
export type TradeDirection = 'buy' | 'sell'
export type TradeResult = 'win' | 'loss'

export interface Trade {
  id: string
  userId: string
  accountId: string
  date: string
  mode: TradeMode
  direction: TradeDirection | null
  result: TradeResult | null
  pnl: string
  entryPrice: string | null
  exitPrice: string | null
  lotSize: string | null
  note: string | null
  screenshotUrl: string | null
  createdAt: Date
  updatedAt: Date
}
