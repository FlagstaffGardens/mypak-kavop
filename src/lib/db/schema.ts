import { pgTable, text, timestamp, uuid, integer, index, primaryKey, decimal, jsonb, date } from "drizzle-orm/pg-core";

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

export const recommendations = pgTable("recommendations", {
  id: uuid("id").defaultRandom().primaryKey(),
  org_id: uuid("org_id")
    .references(() => organizations.org_id, { onDelete: "cascade" })
    .notNull(),
  container_number: integer("container_number").notNull(),
  order_by_date: date("order_by_date").notNull(),
  delivery_date: date("delivery_date").notNull(),
  total_cartons: integer("total_cartons").notNull(),
  total_volume: decimal("total_volume", { precision: 10, scale: 2 }).notNull(),
  urgency: text("urgency"), // 'OVERDUE', 'URGENT', 'PLANNED'
  products: jsonb("products").notNull(), // Array of product objects
  generated_at: timestamp("generated_at").notNull().defaultNow(),
}, (table) => ({
  orgIdx: index("idx_recommendations_org").on(table.org_id, table.generated_at),
  orderDateIdx: index("idx_recommendations_order_date").on(table.org_id, table.order_by_date),
}));
