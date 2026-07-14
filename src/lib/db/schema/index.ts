import { relations } from 'drizzle-orm'
import { user } from './user.table'
import { session } from './session.table'
import { account } from './account.table'
import { tradingAccount } from './trading-account.table'
import { trade } from './trade.table'
import { deposit } from './deposit.table'

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  tradingAccounts: many(tradingAccount),
  trades: many(trade),
  deposits: many(deposit),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}))

export const tradingAccountRelations = relations(tradingAccount, ({ one, many }) => ({
  user: one(user, { fields: [tradingAccount.userId], references: [user.id] }),
  trades: many(trade),
  deposits: many(deposit),
}))

export const tradeRelations = relations(trade, ({ one }) => ({
  user: one(user, { fields: [trade.userId], references: [user.id] }),
  tradingAccount: one(tradingAccount, { fields: [trade.accountId], references: [tradingAccount.id] }),
}))

export const depositRelations = relations(deposit, ({ one }) => ({
  user: one(user, { fields: [deposit.userId], references: [user.id] }),
  tradingAccount: one(tradingAccount, { fields: [deposit.accountId], references: [tradingAccount.id] }),
}))

export * from './user.table'
export * from './session.table'
export * from './account.table'
export * from './verification.table'
export * from './trading-account.table'
export * from './trade.table'
export * from './deposit.table'
