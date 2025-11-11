# Database Models - Production Specification

**Architecture:** Modern SaaS multi-tenant with role-based access control (RBAC)

---

## Application Database Schema

### Table: `organizations`

Multi-tenant organization management.

```sql
CREATE TABLE organizations (
  org_id VARCHAR(36) PRIMARY KEY,               -- UUID
  org_name VARCHAR(255) NOT NULL,
  erp_customer_id VARCHAR(255),                 -- Link to ERP customer record
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_org_erp_id (erp_customer_id)
);
```

**Notes:**
- One org = one customer/farm
- `erp_customer_id` maps to ERP's customer identifier

---

### Table: `users`

User accounts with role-based access.

```sql
CREATE TABLE users (
  user_id VARCHAR(36) PRIMARY KEY,              -- UUID
  org_id VARCHAR(36),                           -- FK, null for platform admins
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,                    -- 'org_user' | 'platform_admin'
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP,

  FOREIGN KEY (org_id) REFERENCES organizations(org_id) ON DELETE CASCADE,
  INDEX idx_users_org (org_id),
  INDEX idx_users_email (email)
);
```

**Roles:**
- `org_user` - Regular user, can only access their org's data
- `platform_admin` - MyPak admin, can access any org's data

**Notes:**
- Platform admins have `org_id = null`
- JWT token contains `user_id` + `role`
- Backend resolves `user_id` → `org_id` for data access

---

### Table: `product_data`

Organization-specific inventory data and settings.

```sql
CREATE TABLE product_data (
  org_id VARCHAR(36) NOT NULL,
  sku VARCHAR(255) NOT NULL,
  current_stock INTEGER NOT NULL,               -- In cartons
  weekly_consumption INTEGER NOT NULL,          -- In cartons
  target_soh INTEGER NOT NULL DEFAULT 6,        -- Target stock on hand in weeks
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
  id VARCHAR(36) PRIMARY KEY,                   -- UUID
  org_id VARCHAR(36) NOT NULL,
  created_by_user_id VARCHAR(36) NOT NULL,      -- Audit: which user created
  order_number VARCHAR(255),                    -- From ERP after submission
  ordered_date DATE NOT NULL,
  delivery_date DATE NOT NULL,
  shipping_method VARCHAR(50),                  -- 'standard' | 'urgent' | 'specific'
  shipping_term VARCHAR(10),                    -- 'DDP' | 'FOB' | 'CIF'
  customer_order_number VARCHAR(255),           -- Customer PO number
  comments TEXT,
  status VARCHAR(20) NOT NULL,                  -- 'PENDING' | 'SUBMITTED' | 'FAILED'
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

**Notes:**
- `order_number` populated after ERP confirms
- `created_by_user_id` for audit trail

---

### Table: `order_items`

Line items for each order.

```sql
CREATE TABLE order_items (
  id VARCHAR(36) PRIMARY KEY,                   -- UUID
  order_id VARCHAR(36) NOT NULL,
  sku VARCHAR(255) NOT NULL,
  product_name VARCHAR(500) NOT NULL,           -- Snapshot at order time
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
- `erp_customer_id` - Links to organization
- `ordered_date` - Date order was placed
- `delivery_date` - Expected/actual delivery date
- `status` - Order status (`APPROVED`, `IN_TRANSIT`, `DELIVERED`)
- `line_items[]` - Array of SKU + quantity (in cartons)

---

## Calculated Data (Not Stored)

Generated fresh by backend on each request.

### Container Recommendations

Algorithm implementation: `/src/lib/calculations.ts`

```typescript
{
  container_number: number,          // Sequential: 1, 2, 3...
  order_by_date: string,             // ISO date
  delivery_date: string,             // ISO date
  total_cartons: number,
  urgency: "URGENT" | null,
  products: [
    {
      sku: string,
      product_name: string,
      current_stock: number,         // cartons
      weekly_consumption: number,    // cartons
      recommended_quantity: number,
      after_delivery_stock: number,
      weeks_supply: number,
      runs_out_date: string
    }
  ]
}
```

**Algorithm:**
1. Calculate `weeks_remaining = current_stock / weekly_consumption`
2. Filter products where `weeks_remaining < 16`
3. Calculate `recommended_quantity = (weekly_consumption * 10) - current_stock`
4. Calculate `pallets_needed = recommended_quantity / pieces_per_pallet`
5. Calculate `volume_needed = pallets_needed * volume_per_pallet`
6. Group into containers by volume (40HC = 76m³, 20GP = 33m³)
7. Mark `URGENT` if any product has `weeks_remaining < target_soh`

**Container Types:**
- 40HC (High Cube): ~76 cubic meters
- 20GP (General Purpose): ~33 cubic meters

### Product Status

```typescript
{
  weeks_remaining: number,
  runs_out_date: string,
  status: "CRITICAL" | "ORDER_NOW" | "HEALTHY"
}
```

**Status Logic:**
- `CRITICAL`: `weeks_remaining < target_soh` (default 6)
- `ORDER_NOW`: `target_soh ≤ weeks_remaining < 16`
- `HEALTHY`: `weeks_remaining ≥ 16`

---

## Authorization Logic

### Backend Middleware

```javascript
function authorize(req) {
  const user = decodeJWT(req.headers.authorization);
  const requested_org_id = req.params.org_id || req.body.org_id;

  // Platform admin can access any org
  if (user.role === 'platform_admin') {
    return true;
  }

  // Org user can only access their own org
  if (user.role === 'org_user') {
    if (user.org_id === requested_org_id) {
      return true;
    }
    throw new ForbiddenError('Access denied');
  }

  throw new UnauthorizedError('Invalid role');
}
```

### Row-Level Security

All queries automatically filter by org:

```sql
-- For org users
SELECT * FROM product_data
WHERE org_id = :user_org_id;

-- For platform admins
SELECT * FROM product_data
WHERE org_id = :requested_org_id;
```

---

## Data Flow Architecture

```
┌─────────────────────────────────────────┐
│ ERP Database (Read-Only)                │
│ - Product master data                   │
│ - Orders (IN_TRANSIT, DELIVERED)        │
└─────────────────┬───────────────────────┘
                  │ READ ONLY
                  ▼
┌─────────────────────────────────────────┐
│ Backend API                             │
│ - Fetch ERP data by erp_customer_id     │
│ - Join with product_data (by org_id)    │
│ - Run recommendation algorithm          │
│ - Enforce org-level authorization       │
└─────────────────┬───────────────────────┘
                  │ REST/GraphQL API
                  ▼
┌─────────────────────────────────────────┐
│ Next.js Frontend                        │
│ - JWT auth (user_id + role)             │
│ - Display org-specific data             │
│ - Submit orders                          │
└─────────────────┬───────────────────────┘
                  │ POST
                  ▼
┌─────────────────────────────────────────┐
│ Application Database                    │
│ - organizations (orgs)                  │
│ - users (authentication + RBAC)         │
│ - product_data (org inventory)          │
│ - orders (audit trail)                  │
└─────────────────────────────────────────┘
```

---

## Security Requirements

1. **JWT Authentication**: All endpoints require valid token
2. **Multi-Tenancy**: Strict org-level isolation
3. **RBAC**: Role-based access (org_user vs platform_admin)
4. **HTTPS Only**: All API calls over TLS 1.3+
5. **Rate Limiting**: 100 req/min per user, 1000 req/min per org
6. **Input Validation**: All requests validated against schema
7. **SQL Injection Prevention**: Parameterized queries only
8. **Password Security**: bcrypt with cost factor 12+

---

## Performance Requirements

- Dashboard load: < 500ms
- Product list: < 300ms
- Order submission: < 2s
- Recommendation calculation: < 1s

**Optimization:**
- Database indexes on `org_id` (all tables)
- Pagination (50 items per page)
- Connection pooling (min 10, max 50)

---

## Migration & Deployment

### Initial Setup

```sql
-- Create organizations first
INSERT INTO organizations (org_id, org_name, erp_customer_id)
VALUES ('org-001', 'Acme Farms', 'ERP-CUST-123');

-- Create users
INSERT INTO users (user_id, org_id, email, password_hash, name, role)
VALUES ('user-001', 'org-001', 'john@acmefarms.com', '$2b$12$...', 'John Smith', 'org_user');

-- Platform admin
INSERT INTO users (user_id, org_id, email, password_hash, name, role)
VALUES ('admin-001', null, 'admin@mypak.com', '$2b$12$...', 'MyPak Admin', 'platform_admin');
```

### Backup Strategy

- Daily full backups (retained 30 days)
- Hourly incremental backups (retained 7 days)
- Real-time replication to standby
- Point-in-time recovery enabled

---

## Questions for ERP Team

1. **Customer Mapping**: How do we map `org_id` to your customer records?
2. **Product Endpoint**: What API returns product master data?
3. **Order Endpoint**: What API returns orders by customer?
4. **Order Submission**: What API creates new orders?
5. **Authentication**: API key, OAuth, or other?
6. **Rate Limits**: Any throttling on your APIs?

---

**Last Updated:** 2025-01-10
