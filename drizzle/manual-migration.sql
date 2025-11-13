-- Manual Migration Script for Customer & User Management
-- Run this as a database administrator with CREATE TABLE permissions
-- Database: mypak_kavop_staging

-- Create organizations table
CREATE TABLE IF NOT EXISTS "organizations" (
	"org_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_name" text NOT NULL,
	"mypak_customer_name" text NOT NULL,
	"kavop_token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_mypak_customer_name_unique" UNIQUE("mypak_customer_name")
);

-- Create users table
CREATE TABLE IF NOT EXISTS "users" (
	"user_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password" text NOT NULL,
	"role" text DEFAULT 'org_user' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_login_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

-- Add foreign key constraint
ALTER TABLE "users" ADD CONSTRAINT "users_org_id_organizations_org_id_fk"
FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("org_id")
ON DELETE cascade ON UPDATE no action;

-- Grant permissions to application user
GRANT SELECT, INSERT, UPDATE, DELETE ON "organizations" TO mypak_kavop_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "users" TO mypak_kavop_app;
