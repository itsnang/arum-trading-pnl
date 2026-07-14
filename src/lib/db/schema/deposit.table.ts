import { index, numeric, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { user } from './user.table'
import { tradingAccount } from './trading-account.table'

export const deposit = pgTable(
  'deposit',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accountId: text('account_id')
      .notNull()
      .references(() => tradingAccount.id, { onDelete: 'cascade' }),
    amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
    note: text('note'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('deposit_user_id_idx').on(table.userId),
    index('deposit_account_id_idx').on(table.accountId),
  ],
)
