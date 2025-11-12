CREATE TABLE "product_data" (
	"org_id" uuid NOT NULL,
	"sku" text NOT NULL,
	"current_stock" integer NOT NULL,
	"weekly_consumption" integer NOT NULL,
	"target_soh" integer DEFAULT 6 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "product_data_org_id_sku_pk" PRIMARY KEY("org_id","sku")
);
--> statement-breakpoint
ALTER TABLE "product_data" ADD CONSTRAINT "product_data_org_id_organizations_org_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("org_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_product_data_org" ON "product_data" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_product_data_updated" ON "product_data" USING btree ("org_id","updated_at");