CREATE TYPE "public"."account_type" AS ENUM('personal', 'funded', 'demo');--> statement-breakpoint
CREATE TYPE "public"."trade_direction" AS ENUM('buy', 'sell');--> statement-breakpoint
CREATE TYPE "public"."trade_mode" AS ENUM('quick', 'calc');--> statement-breakpoint
CREATE TYPE "public"."trade_result" AS ENUM('win', 'loss');--> statement-breakpoint
CREATE TABLE "trading_account" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"broker" text,
	"type" "account_type" DEFAULT 'personal' NOT NULL,
	"starting_balance" numeric(15, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trade" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"date" date NOT NULL,
	"mode" "trade_mode" NOT NULL,
	"direction" "trade_direction",
	"result" "trade_result",
	"pnl" numeric(15, 2) NOT NULL,
	"entry_price" numeric(15, 5),
	"exit_price" numeric(15, 5),
	"lot_size" numeric(10, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "trading_account" ADD CONSTRAINT "trading_account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade" ADD CONSTRAINT "trade_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade" ADD CONSTRAINT "trade_account_id_trading_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."trading_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "trading_account_user_id_idx" ON "trading_account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "trade_user_id_idx" ON "trade" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "trade_account_id_idx" ON "trade" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "trade_date_idx" ON "trade" USING btree ("date");