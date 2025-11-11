DROP TABLE IF EXISTS "account" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "session" CASCADE;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "org_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;