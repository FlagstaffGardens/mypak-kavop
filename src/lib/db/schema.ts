import { pgTable, text, timestamp, uuid, integer, index, primaryKey, decimal, jsonb, date, boolean, unique } from "drizzle-orm/pg-core";

// ========================================
// Better Auth Tables
// ========================================

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  name: text("name").notNull(),
  image: text("image"),
  // Admin plugin fields
  role: text("role"),
  banned: boolean("banned").notNull().default(false),
  banReason: text("banReason"),
  banExpires: timestamp("banExpires"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  impersonatedBy: text("impersonatedBy"), // Admin user ID
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
}, (table) => ({
  userIdx: index("idx_session_user").on(table.userId),
  expiresAtIdx: index("idx_session_expires_at").on(table.expiresAt),
}));

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
}, (table) => ({
  userIdx: index("idx_account_user").on(table.userId),
  providerIdx: index("idx_account_provider").on(table.providerId, table.accountId),
}));

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
}, (table) => ({
  identifierIdx: index("idx_verification_identifier").on(table.identifier),
  expiresAtIdx: index("idx_verification_expires_at").on(table.expiresAt),
}));

export const organization = pgTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  metadata: jsonb("metadata"),
});

export const member = pgTable("member", {
  id: text("id").primaryKey(),
  organizationId: text("organizationId")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // 'owner' | 'admin' | 'member'
  createdAt: timestamp("createdAt").notNull().defaultNow(),
}, (table) => ({
  // Unique constraint: one user can only be a member of an org once
  uniqueOrgUser: unique().on(table.organizationId, table.userId),
  // Indexes for performance
  orgIdx: index("idx_member_org").on(table.organizationId),
  userIdx: index("idx_member_user").on(table.userId),
}));

export const invitation = pgTable("invitation", {
  id: text("id").primaryKey(),
  organizationId: text("organizationId")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role").notNull(),
  inviterId: text("inviterId")
    .notNull()
    .references(() => user.id),
  status: text("status").notNull().default("pending"),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
}, (table) => ({
  orgIdx: index("idx_invitation_org").on(table.organizationId),
  emailIdx: index("idx_invitation_email").on(table.email),
}));

// ========================================
// Business Tables
// ========================================

export const organizations = pgTable("organizations", {
  org_id: uuid("org_id").defaultRandom().primaryKey(),
  better_auth_org_id: text("better_auth_org_id")
    .notNull()
    .unique()
    .references(() => organization.id, { onDelete: "cascade" }),
  org_name: text("org_name").notNull(),
  mypak_customer_name: text("mypak_customer_name").notNull().unique(),
  kavop_token: text("kavop_token").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
  last_inventory_update: timestamp("last_inventory_update"),
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
