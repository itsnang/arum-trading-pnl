DROP INDEX "trade_account_id_idx";--> statement-breakpoint
DROP INDEX "trade_date_idx";--> statement-breakpoint
CREATE INDEX "trade_account_id_date_idx" ON "trade" USING btree ("account_id","date");