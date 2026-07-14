CREATE TABLE "deposit" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "deposit" ADD CONSTRAINT "deposit_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deposit" ADD CONSTRAINT "deposit_account_id_trading_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."trading_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "deposit_user_id_idx" ON "deposit" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "deposit_account_id_idx" ON "deposit" USING btree ("account_id");