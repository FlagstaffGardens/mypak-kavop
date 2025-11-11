CREATE TABLE "organizations" (
	"org_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_name" text NOT NULL,
	"mypak_customer_name" text NOT NULL,
	"kavop_token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_mypak_customer_name_unique" UNIQUE("mypak_customer_name")
);
