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
  user_id: uuid("user_id").defaultRandom().primaryKey(),
  org_id: uuid("org_id")
    .notNull()
    .references(() => organizations.org_id, { onDelete: "cascade" }),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  password: text("password").notNull(),
  role: text("role").notNull().default("org_user"), // "org_user" | "platform_admin"
  created_at: timestamp("created_at").defaultNow().notNull(),
  last_login_at: timestamp("last_login_at"),
});
