import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const organizations = pgTable("organizations", {
  org_id: uuid("org_id").defaultRandom().primaryKey(),
  org_name: text("org_name").notNull(),
  mypak_customer_name: text("mypak_customer_name").notNull().unique(),
  kavop_token: text("kavop_token").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});
