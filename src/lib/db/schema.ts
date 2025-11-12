import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const organizations = pgTable("organizations", {
  org_id: uuid("org_id").defaultRandom().primaryKey(),
  org_name: text("org_name").notNull(),
  mypak_customer_name: text("mypak_customer_name").notNull().unique(),
  kavop_token: text("kavop_token").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.org_id, { onDelete: "cascade" }), // Nullable for platform_admin
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  password: text("password").notNull(), // Plain-text for now
  role: text("role").notNull().default("org_user"), // "org_user" | "platform_admin"
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  lastLoginAt: timestamp("lastLoginAt"),
});
