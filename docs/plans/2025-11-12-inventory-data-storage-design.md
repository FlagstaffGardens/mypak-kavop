# Inventory Data Storage Design

**Date:** November 12, 2025
**Status:** ✅ **IMPLEMENTED** (November 12, 2025)
**Author:** Design collaboration with user

---

## Implementation Summary

**Completed:** All requirements from this design document have been successfully implemented and are production-ready.

**Key Deliverables:**
- ✅ Database schema (`product_data` table) with migration
- ✅ API routes (`/api/inventory/list` and `/api/inventory/save`)
- ✅ Service layer with database-backed functions
- ✅ First-visit blocking modal with smart defaults
- ✅ New product detection and banner notification
- ✅ Dashboard integration with proper loading states
- ✅ Constants file for maintainability (`src/lib/constants.ts`)
- ✅ Toast notifications for better UX
- ✅ Full type safety with Zod validation

**Production Enhancements Beyond Plan:**
- Loading overlay during page reload for better UX
- Toast notifications instead of browser alerts
- Centralized constants for magic numbers
- Inline comments for complex logic (decimal rounding)
- PropState sync to prevent race conditions

**Build Status:** ✅ Passing (TypeScript compilation successful)

---

## Overview

Replace mock inventory data with database-backed storage that allows users to configure and update current stock, weekly consumption, and target SOH (Stock On Hand) for their products. Includes a first-visit setup flow and ongoing update capability.

**Problem:**
Currently, inventory levels (currentStock, weeklyConsumption, targetSOH) use mock data from `src/lib/services/inventory.ts`. This prevents users from tracking their actual inventory and receiving accurate recommendations.

**Solution:**
Store user-editable inventory data in the database per organization, with a clean initial setup modal and reusable update flow.

---

## User Experience Flow

### First Visit (Initial Setup)

1. User logs in → Dashboard page loads
2. System detects: `product_data` table has zero rows for this org
3. **Blocking modal appears** - cannot dismiss until data is saved
4. Modal displays all ERP products with smart defaults:
   - Current Stock: 1 pallet (reasonable starting point)
   - Weekly Consumption: 0 (must be set by user - critical value)
   - Target SOH: 6 weeks (standard default)
5. User edits values in table (pallets displayed, cartons stored)
6. User clicks "Save Changes"
7. System validates:
   - If products have zero consumption → Show warning: "X products have no weekly consumption set - they won't show accurate status on dashboard"
   - Warning allows proceeding (not blocking)
8. System converts pallets → cartons and saves to database
9. Modal closes, dashboard reloads with real data

### Ongoing Updates

1. User clicks "Update Inventory Data" button in dashboard header
2. Same modal opens, pre-filled with current database values
3. User edits values
4. User clicks "Save Changes" (or "Cancel" to discard)
5. System validates and saves
6. Dashboard reloads with updated data

### New Product Detection

1. System compares ERP products vs database SKUs
2. If new products found (in ERP but not in DB):
   - Display banner at top of dashboard
   - Banner text: "X new products found in ERP. Update your inventory data to see them on the dashboard."
   - Banner includes "Update Now" button → Opens modal
3. Modal includes new products with smart defaults
4. User configures new products and saves

---

## Database Schema

### New Table: `product_data`

```sql
CREATE TABLE product_data (
  org_id UUID NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  current_stock INTEGER NOT NULL,        -- In cartons (ERP base unit)
  weekly_consumption INTEGER NOT NULL,   -- In cartons per week
  target_soh INTEGER NOT NULL DEFAULT 6, -- Target stock on hand in weeks
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (org_id, sku)
);

CREATE INDEX idx_product_data_org ON product_data(org_id);
CREATE INDEX idx_product_data_updated ON product_data(org_id, updated_at DESC);
```

**Design decisions:**

- **Composite primary key** (org_id, sku) - ensures one record per org per product
- **Store cartons not pallets** - ERP uses cartons, calculations use cartons, UI converts on display
- **Cascade delete** - if organization deleted, inventory data is deleted
- **Updated timestamp** - track when data was last modified for auditing

**Unit conversion:**

```typescript
// UI → DB: pallets * cartonsPerPallet = cartons
// DB → UI: cartons / cartonsPerPallet = pallets

// Example: 0.3 pallets × 4,544 cartons/pallet = 1,363 cartons (stored)
//          1,363 cartons ÷ 4,544 cartons/pallet = 0.3 pallets (displayed)
```

---

## API Routes

### GET `/api/inventory/list`

**Purpose:** Load ERP products and existing inventory data for modal

**Response:**

```typescript
{
  erpProducts: ErpProduct[],      // From ERP API
  inventoryMap: {                 // From database, keyed by SKU
    [sku: string]: {
      current_stock: number,      // cartons
      weekly_consumption: number, // cartons
      target_soh: number,
      updated_at: string
    }
  }
}
```

**Implementation:**

```typescript
// src/app/api/inventory/list/route.ts

import { getCurrentUser } from '@/lib/auth';
import { fetchErpProducts } from '@/lib/erp/client';
import { db } from '@/lib/db';
import { productData } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  const user = await getCurrentUser();

  // Fetch ERP products
  const erpProducts = await fetchErpProducts();

  // Fetch stored inventory data
  const inventoryRows = await db
    .select()
    .from(productData)
    .where(eq(productData.org_id, user.orgId));

  // Map by SKU for easy lookup
  const inventoryMap = Object.fromEntries(
    inventoryRows.map(row => [row.sku, row])
  );

  return Response.json({
    erpProducts,
    inventoryMap,
  });
}
```

### POST `/api/inventory/save`

**Purpose:** Save/update inventory data for multiple products

**Request body:**

```typescript
{
  products: Array<{
    sku: string,
    currentStock: number,      // cartons (already converted from pallets)
    weeklyConsumption: number, // cartons
    targetSOH: number
  }>
}
```

**Implementation:**

```typescript
// src/app/api/inventory/save/route.ts

import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { productData } from '@/lib/db/schema';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const { products } = await request.json();

  // Upsert all products in transaction
  await db.transaction(async (tx) => {
    for (const product of products) {
      await tx
        .insert(productData)
        .values({
          org_id: user.orgId,
          sku: product.sku,
          current_stock: product.currentStock,
          weekly_consumption: product.weeklyConsumption,
          target_soh: product.targetSOH,
          updated_at: new Date(),
        })
        .onConflictDoUpdate({
          target: [productData.org_id, productData.sku],
          set: {
            current_stock: product.currentStock,
            weekly_consumption: product.weeklyConsumption,
            target_soh: product.targetSOH,
            updated_at: new Date(),
          },
        });
    }
  });

  return Response.json({ success: true });
}
```

**Why upsert?** Handles both insert (new products) and update (existing products) in one operation.

---

## Dashboard Integration

### Server Component Changes

**File:** `src/app/page.tsx`

**Current flow:**

```typescript
1. Fetch ERP products
2. Get mock inventory from getInventoryForProducts()
3. Merge and display
```

**New flow:**

```typescript
1. Fetch ERP products
2. Fetch real inventory from database
3. Check if first visit (inventoryRows.length === 0)
4. Detect new products (in ERP but not in DB)
5. Merge ERP + inventory data
6. Pass to client: products, isFirstVisit, newProductCount
```

**Implementation:**

```typescript
export default async function Dashboard() {
  const user = await getCurrentUser();

  // Fetch ERP data
  const erpProducts = await fetchErpProducts();
  const erpOrders = await fetchErpCurrentOrders();

  // Fetch inventory from database
  const inventoryRows = await db
    .select()
    .from(productData)
    .where(eq(productData.org_id, user.orgId));

  // Check first visit
  const isFirstVisit = inventoryRows.length === 0;

  // Detect new products
  const dbSkus = new Set(inventoryRows.map(row => row.sku));
  const newProducts = erpProducts.filter(p => !dbSkus.has(p.sku));

  // Merge ERP + inventory
  const products = erpProducts.map(erpProduct => {
    const inventory = inventoryRows.find(row => row.sku === erpProduct.sku);

    if (!inventory) {
      // Not configured yet - placeholder
      return {
        ...transformErpProduct(erpProduct),
        currentStock: 0,
        weeklyConsumption: 0,
        targetSOH: 6,
        status: 'CRITICAL' as const,
        weeksRemaining: 0,
      };
    }

    // Complete with real data
    return completeProductWithInventory(
      transformErpProduct(erpProduct),
      inventory.current_stock,
      inventory.weekly_consumption,
      inventory.target_soh
    );
  });

  return (
    <DashboardClient
      products={products}
      orders={transformedOrders}
      isFirstVisit={isFirstVisit}
      newProductCount={newProducts.length}
    />
  );
}
```

### Client Component Changes

**File:** `src/components/dashboard/DashboardClient.tsx`

**Add:**

1. "Update Inventory Data" button in header
2. New products banner (conditionally shown)
3. Modal trigger logic

**Implementation:**

```typescript
'use client';

export function DashboardClient({
  products,
  orders,
  isFirstVisit,
  newProductCount
}) {
  const [showSetupModal, setShowSetupModal] = useState(isFirstVisit);

  return (
    <>
      {/* Header with Update button */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Inventory Dashboard</h1>
        <Button onClick={() => setShowSetupModal(true)}>
          Update Inventory Data
        </Button>
      </div>

      {/* New products banner */}
      {newProductCount > 0 && !isFirstVisit && (
        <Alert className="mb-6 border-blue-500 bg-blue-50">
          <InfoIcon className="h-4 w-4 text-blue-600" />
          <AlertTitle>New products detected</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>
              {newProductCount} new {newProductCount === 1 ? 'product' : 'products'}
              found in ERP. Update your inventory data to see them on the dashboard.
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSetupModal(true)}
            >
              Update Now
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Setup/Update Modal */}
      {showSetupModal && (
        <InventorySetupModal
          isFirstVisit={isFirstVisit}
          onClose={() => !isFirstVisit && setShowSetupModal(false)}
          onSave={() => {
            window.location.reload(); // Reload to get fresh data
          }}
        />
      )}

      {/* Rest of dashboard */}
      <RecommendationCard {...} />
      <ProductGrid products={products} />
    </>
  );
}
```

---

## Modal Component

**File:** `src/components/inventory/InventorySetupModal.tsx` (already built)

**Key integration points:**

1. **Load data from API:**

```typescript
useEffect(() => {
  async function loadProducts() {
    const response = await fetch('/api/inventory/list');
    const data = await response.json();

    // Merge with smart defaults
    const withDefaults = data.erpProducts.map(erpProduct => ({
      sku: erpProduct.sku,
      name: erpProduct.name,
      cartonsPerPallet: erpProduct.cartonsPerPallet,

      // Use DB values if exist, otherwise defaults
      currentStockPallets: data.inventoryMap[erpProduct.sku]
        ? data.inventoryMap[erpProduct.sku].current_stock / erpProduct.cartonsPerPallet
        : 1, // default: 1 pallet

      weeklyConsumptionPallets: data.inventoryMap[erpProduct.sku]
        ? data.inventoryMap[erpProduct.sku].weekly_consumption / erpProduct.cartonsPerPallet
        : 0, // default: 0 (must be set)

      targetSOH: data.inventoryMap[erpProduct.sku]?.target_soh || 6,
    }));

    setProducts(withDefaults);
  }

  loadProducts();
}, []);
```

2. **Save to API:**

```typescript
async function handleSave() {
  // Validate
  const warnings = validateProducts(products);
  if (warnings.length > 0) {
    setValidationWarnings(warnings);
    return; // Show warning, user can proceed on second click
  }

  setIsSaving(true);

  // Convert pallets → cartons
  const dataToSave = products.map(p => ({
    sku: p.sku,
    currentStock: Math.round(p.currentStockPallets * p.cartonsPerPallet),
    weeklyConsumption: Math.round(p.weeklyConsumptionPallets * p.cartonsPerPallet),
    targetSOH: p.targetSOH,
  }));

  await fetch('/api/inventory/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ products: dataToSave }),
  });

  setIsSaving(false);
  onSave();
}
```

3. **Validation logic:**

```typescript
function validateProducts(products) {
  const warnings = [];
  const emptyConsumption = products.filter(p => p.weeklyConsumptionPallets === 0);

  if (emptyConsumption.length > 0) {
    warnings.push(
      `${emptyConsumption.length} products have no weekly consumption set - ` +
      `they won't show accurate status on dashboard`
    );
  }

  return warnings;
}
```

---

## Helper Functions

### Update Inventory Service

**File:** `src/lib/services/inventory.ts`

**Replace mock functions with database queries:**

```typescript
import { db } from '@/lib/db';
import { productData } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function getInventoryData(orgId: string) {
  const data = await db
    .select()
    .from(productData)
    .where(eq(productData.org_id, orgId));

  return data;
}

export async function getInventoryForProduct(orgId: string, sku: string) {
  const [data] = await db
    .select()
    .from(productData)
    .where(eq(productData.org_id, orgId))
    .where(eq(productData.sku, sku));

  return data;
}
```

**Delete mock functions:**
- `getInventoryForProduct(productId: number)` - replaced
- `getInventoryForProducts(productIds: number[])` - replaced

### Update Calculations

**File:** `src/lib/calculations.ts`

**Add targetSOH parameter to completeProductWithInventory:**

```typescript
export function completeProductWithInventory(
  partial: PartialProduct,
  currentStock: number, // cartons
  weeklyConsumption: number, // cartons
  targetSOH: number = 6 // per-product override
): Product {
  const weeksRemaining = weeklyConsumption > 0
    ? currentStock / weeklyConsumption
    : 999; // infinite if no consumption

  const status = calculateProductStatus(weeksRemaining, targetSOH);
  const runsOutDays = Math.floor(weeksRemaining * 7);

  return {
    ...partial,
    currentStock,
    weeklyConsumption,
    targetSOH,
    weeksRemaining,
    status,
    runsOutDays,
    runsOutDate: format(addDays(new Date(), runsOutDays), 'MMM dd, yyyy'),
    currentPallets: currentStock / partial.cartonsPerPallet,
    weeklyPallets: weeklyConsumption / partial.cartonsPerPallet,
  };
}
```

**Why targetSOH parameter?** Allows per-product target overrides (default 6 weeks, user can set 4 or 8 for specific products).

---

## Database Migration

**File:** `migrations/0003_add_product_data.sql`

```sql
-- Create product_data table
CREATE TABLE product_data (
  org_id UUID NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  current_stock INTEGER NOT NULL,
  weekly_consumption INTEGER NOT NULL,
  target_soh INTEGER NOT NULL DEFAULT 6,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (org_id, sku)
);

-- Indexes for query performance
CREATE INDEX idx_product_data_org ON product_data(org_id);
CREATE INDEX idx_product_data_updated ON product_data(org_id, updated_at DESC);

-- Comments for documentation
COMMENT ON TABLE product_data IS 'Organization-specific inventory data for products';
COMMENT ON COLUMN product_data.current_stock IS 'Current stock in cartons (ERP base unit)';
COMMENT ON COLUMN product_data.weekly_consumption IS 'Weekly consumption in cartons';
COMMENT ON COLUMN product_data.target_soh IS 'Target stock on hand in weeks';
```

**Drizzle schema update:**

**File:** `src/lib/db/schema.ts`

```typescript
import { pgTable, text, timestamp, uuid, integer, index, primaryKey } from "drizzle-orm/pg-core";

// ... existing tables ...

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
```

---

## Implementation Checklist

### Database Layer

- [ ] Add `productData` table to Drizzle schema (`src/lib/db/schema.ts`)
- [ ] Create migration file (`migrations/0003_add_product_data.sql`)
- [ ] Run migration against development database
- [ ] Verify indexes are created correctly

### Service Layer

- [ ] Update `src/lib/services/inventory.ts` with DB queries
- [ ] Remove mock data functions
- [ ] Update `completeProductWithInventory` to accept `targetSOH` parameter
- [ ] Test inventory service functions

### API Routes

- [ ] Create `src/app/api/inventory/list/route.ts` (GET endpoint)
- [ ] Create `src/app/api/inventory/save/route.ts` (POST endpoint)
- [ ] Add error handling for database failures
- [ ] Test API routes with Postman/curl

### Dashboard Integration

- [ ] Update `src/app/page.tsx` to fetch inventory from DB
- [ ] Add first-visit detection logic
- [ ] Add new product detection logic
- [ ] Pass `isFirstVisit` and `newProductCount` to client

### Client Components

- [ ] Add "Update Inventory Data" button to dashboard header
- [ ] Add new products banner component
- [ ] Update modal to fetch from `/api/inventory/list`
- [ ] Update modal save logic to POST to `/api/inventory/save`
- [ ] Add validation warning display
- [ ] Handle loading/error states

### Testing

- [ ] Test first-visit flow (empty DB → blocking modal → save → dashboard)
- [ ] Test update flow (existing data → modal → edit → save → refresh)
- [ ] Test new product detection (add product in ERP → banner appears)
- [ ] Test validation (save with zero consumption → warning shows)
- [ ] Test multi-org isolation (org A cannot see org B's data)
- [ ] Test pallet/carton conversion accuracy

---

## Edge Cases & Error Handling

### Database Errors

**Scenario:** Database connection fails during save

**Handling:**
```typescript
try {
  await fetch('/api/inventory/save', { ... });
} catch (error) {
  toast.error('Failed to save inventory data. Please try again.');
  console.error('Save error:', error);
}
```

### ERP Product Deleted

**Scenario:** Product exists in DB but not in ERP anymore

**Handling:**
- Don't display on dashboard (only show products from ERP)
- Don't delete from DB (preserve historical data)
- Admin can manually clean up via SQL if needed

### Zero Consumption Edge Case

**Scenario:** User sets weekly consumption to 0

**Handling:**
- Allow saving (not blocking)
- Show warning: "Product won't show accurate status"
- In calculations: `weeksRemaining = 999` (infinite)
- Status: `HEALTHY` (won't run out)

### Decimal Precision

**Scenario:** User enters 0.33 pallets (repeating decimal)

**Handling:**
```typescript
// Round to nearest carton when saving
currentStock: Math.round(pallets * cartonsPerPallet)

// Example: 0.33 pallets × 4,544 cartons/pallet = 1,499.52 → 1,500 cartons
```

### Concurrent Updates

**Scenario:** Two users from same org update inventory simultaneously

**Handling:**
- Last write wins (acceptable for this use case)
- `updated_at` timestamp shows when last modified
- Future: Add optimistic locking if needed

---

## Performance Considerations

### Query Optimization

- Indexes on `org_id` for fast filtering
- Composite primary key for unique constraint enforcement
- Batch upsert in transaction (all products in one DB call)

### Caching Strategy

- No caching initially (always fresh data)
- Future: Consider Redis cache with TTL if dashboard slow

### Pagination

- Not needed initially (typical org has 20-50 products)
- Future: Add pagination if org has 100+ products

---

## Security Considerations

### Multi-Tenancy

- All queries scoped by `user.orgId` from JWT
- Row-level security via WHERE clause
- Cascade delete protects against orphaned data

### Input Validation

```typescript
// Validate on API route
const schema = z.object({
  products: z.array(z.object({
    sku: z.string().min(1),
    currentStock: z.number().int().min(0),
    weeklyConsumption: z.number().int().min(0),
    targetSOH: z.number().int().min(1).max(52),
  }))
});

const validated = schema.parse(await request.json());
```

### SQL Injection Prevention

- Using Drizzle ORM parameterized queries
- No raw SQL with user input

---

## Future Enhancements

### Phase 2: Historical Tracking

Add `product_data_history` table to track changes over time:

```sql
CREATE TABLE product_data_history (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL,
  sku TEXT NOT NULL,
  current_stock INTEGER NOT NULL,
  weekly_consumption INTEGER NOT NULL,
  target_soh INTEGER NOT NULL,
  changed_at TIMESTAMP NOT NULL,
  changed_by_user_id TEXT
);
```

Benefits:
- Audit trail of inventory changes
- Graph historical consumption trends
- Detect unusual changes

### Phase 3: Auto-Update from Orders

Calculate consumption from delivered orders:

```typescript
// When order delivered, auto-update consumption
weeklyConsumption = calculateFromOrderHistory(completedOrders, weeks: 8);
```

Benefits:
- Reduces manual data entry
- More accurate consumption rates
- Detects seasonal patterns

### Phase 4: Inventory Alerts

Email/SMS when products reach critical levels:

```typescript
if (weeksRemaining < targetSOH - 2) {
  sendAlert(user, product, 'Running low');
}
```

---

## Success Metrics

- [ ] Users can set up inventory data on first visit (100% completion rate)
- [ ] Dashboard shows accurate status based on real data
- [ ] Update flow works seamlessly (no page refresh errors)
- [ ] New product detection catches all ERP additions
- [ ] Multi-org isolation verified (no cross-org data leaks)
- [ ] Performance: Dashboard loads in < 500ms with real data

---

## Questions & Decisions

### Resolved

✅ **Q:** Store pallets or cartons in DB?
**A:** Cartons (ERP base unit, consistent with calculations)

✅ **Q:** When to show setup modal?
**A:** First visit (blocking) + Update button (optional)

✅ **Q:** Allow partial data entry?
**A:** Yes, with warning about missing consumption values

✅ **Q:** How to handle new ERP products?
**A:** Banner notification + include in modal with defaults

### Open

❓ **Q:** Should we auto-calculate consumption from order history?
**A:** Not in Phase 1, consider for Phase 3

❓ **Q:** Should we track who last updated inventory?
**A:** Not critical for Phase 1, add `updated_by_user_id` in Phase 2 if needed

---

## Related Documentation

- [Database Models](../backend-planning/DATABASE-MODELS.md) - Full schema specification
- [ERP Integration](../guides/erp-integration.md) - How ERP data is fetched
- [Status System](../design/status-system.md) - Product status calculation logic
- [CLAUDE.md](../../CLAUDE.md) - Project overview and architecture

---

**Last Updated:** November 12, 2025
**Ready for Implementation:** Yes
