CREATE TABLE "recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"container_number" integer NOT NULL,
	"order_by_date" date NOT NULL,
	"delivery_date" date NOT NULL,
	"total_cartons" integer NOT NULL,
	"total_volume" numeric(10, 2) NOT NULL,
	"urgency" text,
	"products" jsonb NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_org_id_organizations_org_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("org_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_recommendations_org" ON "recommendations" USING btree ("org_id","generated_at");--> statement-breakpoint
CREATE INDEX "idx_recommendations_order_date" ON "recommendations" USING btree ("org_id","order_by_date");