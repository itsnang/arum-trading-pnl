import { relations } from 'drizzle-orm'
import { user } from './user.table'
import { session } from './session.table'
import { account } from './account.table'

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}))

export * from './user.table'
export * from './session.table'
export * from './account.table'
export * from './verification.table'
