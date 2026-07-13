import { date, index, numeric, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { user } from './user.table'
import { tradingAccount } from './trading-account.table'

export const tradeModeEnum = pgEnum('trade_mode', ['quick', 'calc'])
export const tradeDirectionEnum = pgEnum('trade_direction', ['buy', 'sell'])
export const tradeResultEnum = pgEnum('trade_result', ['win', 'loss'])

export const trade = pgTable(
  'trade',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accountId: text('account_id')
      .notNull()
      .references(() => tradingAccount.id, { onDelete: 'cascade' }),
    date: date('date').notNull(),
    mode: tradeModeEnum('mode').notNull(),
    direction: tradeDirectionEnum('direction'),
    result: tradeResultEnum('result'),
    pnl: numeric('pnl', { precision: 15, scale: 2 }).notNull(),
    entryPrice: numeric('entry_price', { precision: 15, scale: 5 }),
    exitPrice: numeric('exit_price', { precision: 15, scale: 5 }),
    lotSize: numeric('lot_size', { precision: 10, scale: 2 }),
    // Storage-adapter path (not a signed URL, which expires) — resolve to a
    // fresh signed URL at read time via storageAdapter.getSignedUrl().
    screenshotPath: text('screenshot_path'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('trade_user_id_idx').on(table.userId),
    // Every trade query filters accountId + a date (range), so index the pair
    // directly rather than making Postgres bitmap-AND two separate indexes.
    index('trade_account_id_date_idx').on(table.accountId, table.date),
  ],
)
