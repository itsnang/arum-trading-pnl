import { index, numeric, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { user } from './user.table'

export const accountTypeEnum = pgEnum('account_type', ['personal', 'funded', 'demo'])

export const tradingAccount = pgTable(
  'trading_account',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    broker: text('broker'),
    type: accountTypeEnum('type').notNull().default('personal'),
    startingBalance: numeric('starting_balance', { precision: 15, scale: 2 }).notNull(),
    archivedAt: timestamp('archived_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('trading_account_user_id_idx').on(table.userId)],
)
