# Database Models - Production Specification

**Architecture:** Modern SaaS multi-tenant with Better Auth passwordless authentication

**Authentication:** Better Auth v1.3.34 (Email OTP, Organizations, Admin Impersonation)

---

## Better Auth Tables (Auto-Managed)

Better Auth manages these tables automatically via Drizzle migrations.

### Table: `user`

Better Auth user accounts.

```sql
CREATE TABLE user (
  id TEXT PRIMARY KEY,                      -- UUID
  email TEXT UNIQUE NOT NULL,
  emailVerified BOOLEAN NOT NULL DEFAULT FALSE,
  name TEXT NOT NULL,
  createdAt INTEGER NOT NULL,               -- Unix timestamp
  updatedAt INTEGER NOT NULL,               -- Unix timestamp
  role TEXT,                                -- 'admin' for platform admins
  image TEXT                                -- Profile image URL (optional)
);
```

**Notes:**
- Platform admins have `role = 'admin'`
- Regular users have `role = null` or undefined
- Passwordless authentication - no password field

---

### Table: `session`

Active user sessions with tokens.

```sql
CREATE TABLE session (
  id TEXT PRIMARY KEY,
  expiresAt INTEGER NOT NULL,               -- Unix timestamp
  token TEXT UNIQUE NOT NULL,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  ipAddress TEXT,
  userAgent TEXT,
  userId TEXT NOT NULL,

  FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
);
```

**Configuration:**
- `expiresIn: 60 * 60 * 24 * 60` (60 days)
- `updateAge: 60 * 60 * 24 * 7` (auto-renews every 7 days)
- Token stored in httpOnly cookie: `better-auth.session_token`

---

### Table: `verification`

OTP codes and magic link tokens.

```sql
CREATE TABLE verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,                 -- Email address
  value TEXT NOT NULL,                      -- OTP code or magic link token (hashed)
  expiresAt INTEGER NOT NULL,
  createdAt INTEGER,
  updatedAt INTEGER
);
```

**Notes:**
- OTP: 6-digit code, expires in 5 minutes
- Magic Link: Hashed token, expires in 15 minutes (currently disabled)
- Automatically cleaned up after use or expiry

---

### Table: `organization`

Better Auth organizations for multi-tenancy.

```sql
CREATE TABLE organization (
  id TEXT PRIMARY KEY,                      -- UUID
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  logo TEXT,
  createdAt INTEGER NOT NULL,
  metadata TEXT                             -- JSON string (optional)
);
```

**Notes:**
- Linked to business `organizations` table via `better_auth_org_id`
- One organization = one customer/farm

---

### Table: `member`

Organization memberships and roles.

```sql
CREATE TABLE member (
  id TEXT PRIMARY KEY,
  organizationId TEXT NOT NULL,
  userId TEXT NOT NULL,
  role TEXT NOT NULL,                       -- 'owner' | 'admin' | 'member'
  createdAt INTEGER NOT NULL,

  FOREIGN KEY (organizationId) REFERENCES organization(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE,
  UNIQUE(organizationId, userId)
);
```

**Roles:**
- `owner` - Full org admin access, can manage members
- `admin` - Can manage org settings
- `member` - Basic org access

---

### Table: `invitation`

Pending organization invitations.

```sql
CREATE TABLE invitation (
  id TEXT PRIMARY KEY,
  organizationId TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT,
  status TEXT NOT NULL,                     -- 'pending' | 'accepted' | 'rejected'
  expiresAt INTEGER NOT NULL,
  inviterId TEXT NOT NULL,

  FOREIGN KEY (organizationId) REFERENCES organization(id) ON DELETE CASCADE,
  FOREIGN KEY (inviterId) REFERENCES user(id) ON DELETE CASCADE
);
```

---

## Business Application Tables (Custom)

### Table: `organizations`

Business organization data and ERP integration.

```sql
CREATE TABLE organizations (
  org_id TEXT PRIMARY KEY,                  -- UUID (business ID)
  org_name TEXT NOT NULL,
  better_auth_org_id TEXT,                  -- Links to Better Auth organization.id
  mypak_customer_name TEXT NOT NULL,        -- Customer name in Kavop/MyPak ERP
  kavop_token TEXT NOT NULL,                -- API token for ERP access
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_inventory_update TIMESTAMP,

  INDEX idx_org_better_auth (better_auth_org_id)
);
```

**Schema Mapping:**
- `org_id` - Business organization identifier (used in product_data, orders)
- `better_auth_org_id` - Links to Better Auth `organization.id`
- `kavop_token` - Stored securely, used for ERP API authentication
- `mypak_customer_name` - Used to resolve customer in Kavop API

**Notes:**
- Better Auth handles user authentication
- This table handles ERP integration and business data
- Each org has its own `kavop_token` for ERP access

---

### Table: `users` (Legacy)

Legacy user table - kept for schema compatibility.

```sql
CREATE TABLE users (
  user_id TEXT PRIMARY KEY,                 -- UUID
  org_id TEXT,                              -- FK to organizations
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password TEXT,                            -- DEPRECATED: Not used, kept for compatibility
  role TEXT NOT NULL,                       -- 'admin' | 'org_user'
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP,

  FOREIGN KEY (org_id) REFERENCES organizations(org_id) ON DELETE CASCADE,
  INDEX idx_users_org (org_id),
  INDEX idx_users_email (email)
);
```

**IMPORTANT:**
- `password` field is **DEPRECATED** and not used for authentication
- Better Auth handles all authentication (passwordless)
- Field kept only for schema compatibility
- All auth flows use Better Auth `user` table

---

### Table: `product_data`

Organization-specific inventory data and settings.

```sql
CREATE TABLE product_data (
  org_id TEXT NOT NULL,
  sku TEXT NOT NULL,
  current_stock INTEGER NOT NULL,           -- In cartons
  weekly_consumption INTEGER NOT NULL,      -- In cartons
  target_soh INTEGER NOT NULL DEFAULT 6,    -- Target stock on hand in weeks
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (org_id, sku),
  FOREIGN KEY (org_id) REFERENCES organizations(org_id) ON DELETE CASCADE,
  INDEX idx_product_data_org (org_id),
  INDEX idx_product_data_updated (org_id, updated_at DESC)
);
```

**Notes:**
- All quantities in **cartons** (base unit)
- Frontend converts to pallets using `pieces_per_pallet` from ERP
- `updated_at` tracks when data was last modified

---

### Table: `orders`

Audit trail of orders submitted through the application.

```sql
CREATE TABLE orders (
  id TEXT PRIMARY KEY,                      -- UUID
  org_id TEXT NOT NULL,
  created_by_user_id TEXT NOT NULL,         -- Audit: which user created
  order_number TEXT,                        -- From ERP after submission
  ordered_date DATE NOT NULL,
  delivery_date DATE NOT NULL,
  shipping_method TEXT,                     -- 'standard' | 'urgent' | 'specific'
  shipping_term TEXT,                       -- 'DDP' | 'FOB' | 'CIF'
  customer_order_number TEXT,               -- Customer PO number
  comments TEXT,
  status TEXT NOT NULL,                     -- 'PENDING' | 'SUBMITTED' | 'FAILED'
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  submitted_to_erp_at TIMESTAMP,

  FOREIGN KEY (org_id) REFERENCES organizations(org_id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  INDEX idx_orders_org (org_id),
  INDEX idx_orders_status (org_id, status),
  INDEX idx_orders_created (org_id, created_at DESC)
);
```

**Status Flow:**
1. `PENDING` - Created in UI, not yet submitted to ERP
2. `SUBMITTED` - Successfully sent to ERP
3. `FAILED` - ERP submission failed

---

### Table: `order_items`

Line items for each order.

```sql
CREATE TABLE order_items (
  id TEXT PRIMARY KEY,                      -- UUID
  order_id TEXT NOT NULL,
  sku TEXT NOT NULL,
  product_name TEXT NOT NULL,               -- Snapshot at order time
  quantity_cartons INTEGER NOT NULL,

  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_order_items_order (order_id)
);
```

**Notes:**
- `product_name` stored as snapshot (in case ERP changes it later)
- Quantities in **cartons**

---

## ERP Database (Read-Only)

Backend pulls data from ERP. **Do not write to ERP database.**

### Product Master Data

**Required fields per SKU:**
- `sku` - Unique product identifier (string)
- `name` - Product display name (string)
- `pack_count` - Number of cartons per pack (integer, e.g., 18)
- `pieces_per_pallet` - Cartons per pallet (integer, for UI conversion)
- `volume_per_pallet` - Volume per pallet in cubic meters (decimal, e.g., 1.25)
- `image_url` - Product image URL (string, optional)

### Order Data

**Required fields for orders:**
- `order_number` - Unique order identifier
- `mypak_customer_name` - Links to organization
- `ordered_date` - Date order was placed
- `delivery_date` - Expected/actual delivery date
- `status` - Order status (`APPROVED`, `IN_TRANSIT`, `DELIVERED`)
- `line_items[]` - Array of SKU + quantity (in cartons)

---

## Authorization Logic

### Middleware Protection

**Location:** `src/middleware.ts`

```typescript
// Checks for better-auth.session_token cookie
// Redirects to /sign-in if missing
// Allows: /sign-in, /api/auth/*
```

### Admin Routes

**Location:** `src/app/admin/layout.tsx`

```typescript
// Platform admins (user.role === 'admin')
//   - Full access to all organizations
//   - Can impersonate users
//   - Can create organizations

// Org owners (member.role === 'owner')
//   - Access to their organization only
//   - Can manage org members
//   - Can view org users
```

### Row-Level Security

All queries automatically filter by org:

```typescript
// For org users (via Better Auth membership)
const activeOrgId = session?.session?.activeOrganizationId;
const products = await db
  .select()
  .from(product_data)
  .where(eq(product_data.org_id, activeOrgId));

// For platform admins
const products = await db
  .select()
  .from(product_data)
  .where(eq(product_data.org_id, requested_org_id));
```

---

## Authentication Flow

### Sign-In (Email OTP)

1. User enters email on `/sign-in`
2. Backend generates 6-digit OTP via Better Auth
3. OTP sent via Resend to user's email
4. User enters OTP code
5. Better Auth validates code (5-minute expiry)
6. Session created (60-day expiry, 7-day auto-renewal)
7. Session token stored in httpOnly cookie
8. User redirected to dashboard

### Session Management

- Cookie: `better-auth.session_token` (httpOnly, secure, sameSite)
- Expiry: 60 days
- Auto-renewal: Every 7 days of activity
- Middleware checks token on every request

### Admin Impersonation

- Platform admins can impersonate org users
- Impersonation session: 1 hour
- Tracked separately in Better Auth
- Useful for customer support

---

## Data Flow Architecture

```
┌─────────────────────────────────────────┐
│ ERP Database (Read-Only)                │
│ - Product master data                   │
│ - Orders (IN_TRANSIT, DELIVERED)        │
└─────────────────┬───────────────────────┘
                  │ READ ONLY (kavop_token)
                  ▼
┌─────────────────────────────────────────┐
│ Next.js API Routes                      │
│ - Fetch ERP data by mypak_customer_name │
│ - Join with product_data (by org_id)    │
│ - Run recommendation algorithm          │
│ - Enforce Better Auth authorization     │
└─────────────────┬───────────────────────┘
                  │ Server Components
                  ▼
┌─────────────────────────────────────────┐
│ Next.js Frontend                        │
│ - Better Auth session (httpOnly cookie) │
│ - Display org-specific data             │
│ - Submit orders                          │
└─────────────────┬───────────────────────┘
                  │ Better Auth API
                  ▼
┌─────────────────────────────────────────┐
│ PostgreSQL Database                     │
│ - Better Auth tables (user, session)   │
│ - Business tables (organizations, etc)  │
│ - Multi-tenant with org isolation       │
└─────────────────────────────────────────┘
```

---

## Security Requirements

1. **Passwordless Auth**: Email OTP only (no passwords to compromise)
2. **Multi-Tenancy**: Strict org-level isolation via Better Auth organizations
3. **RBAC**: Platform admin vs org owner/admin/member roles
4. **HTTPS Only**: All API calls over TLS 1.3+
5. **HttpOnly Cookies**: Session tokens not accessible to JavaScript
6. **CORS**: Restricted to app domain only
7. **Rate Limiting**: Handled by Better Auth
8. **Input Validation**: All requests validated against schema
9. **SQL Injection Prevention**: Parameterized queries only (Drizzle ORM)

---

## Performance Requirements

- Dashboard load: < 500ms
- Product list: < 300ms
- Order submission: < 2s
- Recommendation calculation: < 1s

**Optimization:**
- Database indexes on `org_id` (all tables)
- Better Auth session caching
- ERP API response caching (per-org, cache-busted on inventory update)
- Connection pooling (min 10, max 50)

---

## Migration Strategy

### Better Auth Setup

Better Auth tables are created automatically via:
```bash
npx @better-auth/cli generate
npx drizzle-kit push
```

### Initial Data

```sql
-- Create business organization
INSERT INTO organizations (org_id, org_name, mypak_customer_name, kavop_token)
VALUES ('org-001', 'Acme Farms', 'ACME', 'eyJ0eXAiOiJKV1QiLCJ...');

-- Platform admin (in Better Auth user table)
-- Created via seed script with role='admin'

-- Org users
-- Created when they sign in via Email OTP
-- Better Auth automatically creates user + member records
```

### Seed Script

**Location:** `scripts/seed.ts`

Creates:
- Platform admin user (role='admin')
- Test organization with Better Auth org link
- Sample product_data

---

**Last Updated:** 2025-01-15
**Authentication:** Better Auth v1.3.34
**Database:** PostgreSQL via Drizzle ORM
