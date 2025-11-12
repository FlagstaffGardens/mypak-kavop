import { pgTable, text, timestamp, uuid, integer, index, primaryKey } from "drizzle-orm/pg-core";

export const organizations = pgTable("organizations", {
  org_id: uuid("org_id").defaultRandom().primaryKey(),
  org_name: text("org_name").notNull(),
  mypak_customer_name: text("mypak_customer_name").notNull().unique(),
  kavop_token: text("kavop_token").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  user_id: uuid("user_id").defaultRandom().primaryKey(),
  org_id: uuid("org_id").references(() => organizations.org_id, { onDelete: "cascade" }),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  password: text("password").notNull(),
  role: text("role").notNull().default("org_user"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
  last_login_at: timestamp("last_login_at"),
});

export const productData = pgTable("product_data", {
  org_id: uuid("org_id")
    .references(() => organizations.org_id, { onDelete: "cascade" })
    .notNull(),
  sku: text("sku").notNull(),
  current_stock: integer("current_stock").notNull(),
  weekly_consumption: integer("weekly_consumption").notNull(),
  target_soh: integer("target_soh").notNull().default(6),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.org_id, table.sku] }),
  orgIdx: index("idx_product_data_org").on(table.org_id),
  updatedIdx: index("idx_product_data_updated").on(table.org_id, table.updated_at),
}));
