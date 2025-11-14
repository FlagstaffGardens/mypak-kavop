# Container Recommendation Algorithm - Production Integration Plan

**Date:** November 13, 2025
**Status:** Ready for implementation
**Validated with:** Better Eggs (14 products, 52-week horizon, real ERP data)

---

## Executive Summary

**Algorithm:** Timeline simulation + 7-day coalescing window + round-robin packing + fill-to-100%

**Validation Results (Better Eggs):**
- 74 containers over 12 months
- 5.6 products per container average
- Max 8 products per container during peak periods
- Natural distribution: 2-15 containers per month
- 100% container utilization (all exactly 76 m³)

**Key Principle:** No arbitrary rules. Simulation determines when products need ordering based on real consumption data, physics (76 m³ capacity) determines container count, 7-day window groups orders within same business week.

**Production Ready:** Integrates with existing inventory system, uses per-product targetSOH from database, persists recommendations for stable planning.

---

## Core Algorithm

### Step 1: Simulate Product Consumption (Week-by-Week)

For each active product, simulate 52 weeks into the future:

```typescript
// For each product
function simulateProductOrders(product: Product): OrderEvent[] {
  const events: OrderEvent[] = [];

  // Skip discontinued products
  if (product.targetSOH === 0) {
    return events; // No orders needed
  }

  // Calculate safety threshold per product
  const safetyThreshold = product.targetSOH + SHIPPING_LEAD_TIME_WEEKS;

  let currentCoverage = calculateCurrentCoverage(product);
  let currentWeek = 0;

  while (currentWeek < PLANNING_HORIZON_WEEKS) {
    if (currentCoverage < safetyThreshold) {
      // Schedule order NOW
      const orderByDate = addWeeks(today, currentWeek);
      const quantity = product.weeklyConsumption * product.targetSOH;

      events.push({
        productId: product.id,
        sku: product.sku,
        orderByDate,
        quantity,
        volume: quantity * product.volumePerPallet / product.piecesPerPallet
      });

      // Jump to delivery date and add coverage
      currentWeek += SHIPPING_LEAD_TIME_WEEKS;
      currentCoverage += product.targetSOH;
    } else {
      // Consume one week
      currentCoverage -= 1;
      currentWeek += 1;
    }
  }

  return events;
}
```

**Key Production Details:**
- ✅ Uses `product.targetSOH` from database (per-product, user-configurable)
- ✅ Uses `SHIPPING_LEAD_TIME_WEEKS = 8` from constants
- ✅ Skips products where `targetSOH = 0` (discontinued)
- ✅ Accounts for existing orders in transit when calculating `currentCoverage`

**Example Output:**
```typescript
[
  { sku: "PF600", orderByDate: "2025-12-24", quantity: 150000, volume: 31.68 },
  { sku: "PF600", orderByDate: "2026-02-18", quantity: 150000, volume: 31.68 },
  { sku: "PHD500", orderByDate: "2025-12-26", quantity: 120000, volume: 39.84 },
  // ... more events
]
```

---

### Step 2: Cluster by 7-Day Coalescing Window

Group order events that fall within 7 days of each other:

```typescript
function clusterOrderEvents(events: OrderEvent[]): OrderCluster[] {
  // Sort chronologically
  events.sort((a, b) => a.orderByDate.getTime() - b.orderByDate.getTime());

  const clusters: OrderCluster[] = [];
  let currentCluster: OrderEvent[] = [events[0]];

  for (let i = 1; i < events.length; i++) {
    const gap = daysBetween(events[i-1].orderByDate, events[i].orderByDate);

    if (gap > COALESCING_WINDOW_DAYS) {
      // Start new cluster
      clusters.push({
        orderByDate: currentCluster[0].orderByDate,
        events: currentCluster
      });
      currentCluster = [events[i]];
    } else {
      // Add to current cluster
      currentCluster.push(events[i]);
    }
  }

  // Push final cluster
  if (currentCluster.length > 0) {
    clusters.push({
      orderByDate: currentCluster[0].orderByDate,
      events: currentCluster
    });
  }

  return clusters;
}
```

**Business Logic:** Orders within same business week (7 days) ship together for efficiency. This is the smallest meaningful business cycle—not arbitrary.

**Example Clusters:**
```
Cluster 1: Dec 24-26, 2025 (2 products, 3 days apart)
Cluster 2: Jan 7, 2026 (1 product)
Cluster 3: Feb 18-22, 2026 (4 products, 4 days apart)
```

---

### Step 3: Pack Clusters with Round-Robin Distribution

Distribute products evenly across containers for delay resilience:

```typescript
function packCluster(cluster: OrderCluster): Container[] {
  const totalVolume = cluster.events.reduce((sum, e) => sum + e.volume, 0);
  const numContainers = Math.ceil(totalVolume / CONTAINER_CAPACITY);

  const containers: Container[] = [];

  for (let i = 0; i < numContainers; i++) {
    const container: Container = {
      products: [],
      totalVolume: 0,
      orderByDate: cluster.orderByDate
    };

    // Distribute each product evenly across all containers
    cluster.events.forEach(event => {
      const portionVolume = event.volume / numContainers;
      const portionQuantity = event.quantity / numContainers;

      container.products.push({
        productId: event.productId,
        sku: event.sku,
        quantity: Math.round(portionQuantity),
        volume: portionVolume
      });

      container.totalVolume += portionVolume;
    });

    containers.push(container);
  }

  return containers;
}
```

**Why Round-Robin?**
If Container 1 is delayed, customer still receives 90% of every product from Containers 2-4. No single product completely missing. Prevents stockouts even with shipping delays.

---

### Step 4: Fill to 100% Container Capacity

Fill remaining space with high-consumption products:

```typescript
function fillToCapacity(container: Container, products: Product[]): Container {
  const remainingSpace = CONTAINER_CAPACITY - container.totalVolume;

  if (remainingSpace <= 0) return container;

  // Find highest consumption product in this container
  const fillerProduct = container.products
    .map(cp => ({
      ...cp,
      weeklyConsumption: products.find(p => p.id === cp.productId)!.weeklyConsumption
    }))
    .sort((a, b) => b.weeklyConsumption - a.weeklyConsumption)[0];

  // Add more of this product to fill exactly to 76 m³
  fillerProduct.volume += remainingSpace;
  fillerProduct.quantity += calculateQuantityFromVolume(
    remainingSpace,
    products.find(p => p.id === fillerProduct.productId)!
  );

  container.totalVolume = CONTAINER_CAPACITY; // Exactly 76 m³

  return container;
}
```

**Result:** Every container exactly 76 m³, no wasted space, efficient shipping.

---

## Production Configuration

### Constants (`src/lib/constants.ts`)

```typescript
/**
 * Shipping & Logistics
 */

/** Container capacity in cubic meters (40HC standard) */
export const CONTAINER_CAPACITY = 76;

/** Shipping lead time from China to New Zealand in weeks */
export const SHIPPING_LEAD_TIME_WEEKS = 8;

/** Planning horizon for recommendations in weeks (12 months) */
export const PLANNING_HORIZON_WEEKS = 52;

/** Coalescing window for grouping orders (business week) */
export const COALESCING_WINDOW_DAYS = 7;
```

### Per-Product Configuration (from Database)

```typescript
// Already stored in product_data table:
interface InventoryData {
  sku: string;
  current_stock: number;        // cartons
  weekly_consumption: number;   // cartons
  target_soh: number;          // weeks (user-configurable, 0 = discontinued)
  updated_at: Date;
}
```

**Key Points:**
- ✅ `targetSOH` is per-product and user-editable via inventory modal
- ✅ `targetSOH = 0` means discontinued (skip in algorithm)
- ✅ `targetSOH` can range from 0-52 weeks
- ✅ Default is 6 weeks if not set

---

## Database Schema

### Recommendations Table

```sql
CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  container_number INTEGER NOT NULL,
  order_by_date DATE NOT NULL,
  delivery_date DATE NOT NULL,
  total_cartons INTEGER NOT NULL,
  total_volume DECIMAL(10, 2) NOT NULL,
  urgency TEXT CHECK (urgency IN ('OVERDUE', 'URGENT', 'PLANNED')),
  products JSONB NOT NULL,
  generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT recommendations_org_container UNIQUE (org_id, container_number, generated_at)
);

CREATE INDEX idx_recommendations_org ON recommendations(org_id, generated_at DESC);
CREATE INDEX idx_recommendations_order_date ON recommendations(org_id, order_by_date);
```

**Products JSONB Structure:**
```json
[
  {
    "productId": 123,
    "sku": "PF600",
    "productName": "Pulp Flats (600)",
    "quantity": 75000,
    "volume": 15.84,
    "pallets": 16.5
  }
]
```

**Why JSONB?**
- Fast to generate (single write per container)
- Complete snapshot (can reconstruct "why this recommendation")
- Easy to query and display
- Can normalize later if needed

---

## Architecture

### Layer 1: Pure Algorithm (`src/lib/algorithms/recommendation-engine.ts`)

```typescript
export interface AlgorithmInput {
  products: Product[];
  orders: Order[];
  today: Date;
}

export interface AlgorithmOutput {
  containers: ContainerRecommendation[];
  metadata: {
    totalContainers: number;
    planningHorizon: string;
    generatedAt: Date;
  };
}

/**
 * Pure algorithm function - no database access
 * Takes data, returns recommendations
 */
export function calculateRecommendations(
  input: AlgorithmInput
): AlgorithmOutput {
  // 1. Simulate orders for each product
  const orderEvents = input.products
    .filter(p => p.targetSOH > 0) // Skip discontinued
    .flatMap(p => simulateProductOrders(p, input.orders));

  // 2. Cluster by 7-day window
  const clusters = clusterOrderEvents(orderEvents);

  // 3. Pack with round-robin
  const containers = clusters.flatMap(packCluster);

  // 4. Fill to 100%
  containers.forEach(c => fillToCapacity(c, input.products));

  // 5. Calculate urgency
  containers.forEach(c => {
    c.urgency = calculateUrgency(c.orderByDate, input.today);
  });

  return {
    containers,
    metadata: {
      totalContainers: containers.length,
      planningHorizon: `${input.today} to ${addWeeks(input.today, 52)}`,
      generatedAt: new Date()
    }
  };
}
```

**Benefits:**
- ✅ Testable without database
- ✅ Pure function (same input → same output)
- ✅ Can unit test with mock data
- ✅ Easy to validate against testsuite results

---

### Layer 2: Service Layer (`src/lib/services/recommendations.ts`)

```typescript
/**
 * Generate and save recommendations for an organization
 * Called after inventory updates
 */
export async function generateAndSaveRecommendations(
  orgId: string
): Promise<void> {
  // 1. Fetch data from ERP
  const erpProducts = await fetchErpProducts();
  const erpOrders = await fetchErpCurrentOrders();

  // 2. Fetch inventory from database
  const inventoryData = await getInventoryData(orgId);

  // 3. Merge ERP + inventory
  const products = mergeProductData(erpProducts, inventoryData);

  // 4. Run algorithm
  const recommendations = calculateRecommendations({
    products,
    orders: transformOrders(erpOrders),
    today: new Date()
  });

  // 5. Save to database (replace old recommendations)
  await saveRecommendations(orgId, recommendations);
}

/**
 * Get current recommendations for an organization
 */
export async function getRecommendations(
  orgId: string
): Promise<ContainerRecommendation[]> {
  const rows = await db
    .select()
    .from(recommendations)
    .where(eq(recommendations.org_id, orgId))
    .orderBy(recommendations.order_by_date);

  return rows.map(transformRecommendationRow);
}

/**
 * Save recommendations (replace existing)
 */
async function saveRecommendations(
  orgId: string,
  output: AlgorithmOutput
): Promise<void> {
  await db.transaction(async (tx) => {
    // Delete old recommendations
    await tx
      .delete(recommendations)
      .where(eq(recommendations.org_id, orgId));

    // Insert new recommendations
    await tx.insert(recommendations).values(
      output.containers.map((container, index) => ({
        org_id: orgId,
        container_number: index + 1,
        order_by_date: container.orderByDate,
        delivery_date: addWeeks(container.orderByDate, SHIPPING_LEAD_TIME_WEEKS),
        total_cartons: container.products.reduce((sum, p) => sum + p.quantity, 0),
        total_volume: container.totalVolume,
        urgency: container.urgency,
        products: container.products,
        generated_at: output.metadata.generatedAt
      }))
    );
  });
}
```

---

### Layer 3: Dashboard Integration

**Trigger:** User saves inventory data

```typescript
// src/app/api/inventory/save/route.ts

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const { products } = await request.json();

  // 1. Save inventory to database
  await upsertInventoryData(user.orgId, products);

  // 2. Regenerate recommendations
  await generateAndSaveRecommendations(user.orgId);

  return Response.json({ success: true });
}
```

**Display:** Dashboard loads saved recommendations

```typescript
// src/app/page.tsx (Server Component)

export default async function Dashboard() {
  const user = await getCurrentUser();

  // Fetch ERP data
  const erpProducts = await fetchErpProducts();
  const erpOrders = await fetchErpCurrentOrders();

  // Fetch inventory
  const inventoryData = await getInventoryData(user.orgId);

  // Fetch recommendations (from database, not recalculated)
  const recommendations = await getRecommendations(user.orgId);

  // Merge and transform
  const products = mergeProductData(erpProducts, inventoryData);

  return (
    <DashboardClient
      products={products}
      orders={transformOrders(erpOrders)}
      recommendations={recommendations}
    />
  );
}
```

---

## Persistence Strategy

### When to Generate

**Trigger 1: Inventory Update (Primary)**
- User clicks "Save Changes" in inventory modal
- API saves inventory → triggers `generateAndSaveRecommendations()`
- Old recommendations deleted, new recommendations generated and saved
- Dashboard shows updated recommendations on next load

**Trigger 2: Manual Refresh (Optional)**
- "Refresh Recommendations" button in dashboard
- Useful if ERP orders change but inventory didn't

**NOT triggered by:**
- ❌ Every dashboard page load (too expensive)
- ❌ Background cron job (not needed, inventory updates are infrequent)

### Staleness Handling

Show `generated_at` timestamp in UI:
```tsx
<div className="text-sm text-gray-500">
  Recommendations generated {formatDistanceToNow(generatedAt)} ago
</div>
```

If stale, show banner:
```tsx
{daysSince(generatedAt) > 7 && (
  <Alert>
    Recommendations may be outdated. Update inventory to refresh.
  </Alert>
)}
```

---

## Edge Cases & Special Handling

### Case 1: Discontinued Products (`targetSOH = 0`)

```typescript
// In simulation
if (product.targetSOH === 0) {
  return []; // No order events generated
}
```

**UI Display:**
- Product shows in inventory list (so user can reactivate)
- Status badge: "DISCONTINUED" (gray)
- Not included in any recommendations

---

### Case 2: No Recommendations Needed

```typescript
// If algorithm returns empty array
if (recommendations.length === 0) {
  return (
    <EmptyState
      icon={CheckCircle}
      title="All products well stocked"
      description="No orders needed for the next 52 weeks"
    />
  );
}
```

---

### Case 3: Product Needs >1 Container Alone

Example: High-volume product needs 150 m³ (2 containers worth)

**Handled:** Round-robin distributes across 2 containers:
- Container 1: 76 m³ of product
- Container 2: 74 m³ of product

Both containers deliver on same date, both have same single product.

---

### Case 4: Zero Weekly Consumption

```typescript
if (product.weeklyConsumption === 0) {
  return []; // Infinite coverage = no orders needed
}
```

**UI:** Validation warning when user sets consumption to 0 (handled in existing inventory modal).

---

### Case 5: 8 Products in Peak Clusters

**Validated with Better Eggs:** 31 containers have 8 products during peak (Jun-Nov 2026).

**This is mathematically correct:** Products with similar consumption naturally align.

**UI Solution:** Progressive disclosure
- Collapsed view: "8 products - 74,500 cartons total"
- Expanded view: Full product list with quantities
- Download PDF: Detailed packing list

---

## Implementation Checklist

### Phase 1: Core Algorithm (Week 1)

- [ ] Create `src/lib/constants.ts` with shipping constants
- [ ] Add `SHIPPING_LEAD_TIME_WEEKS = 8`
- [ ] Create `src/lib/algorithms/recommendation-engine.ts`
- [ ] Implement `simulateProductOrders()` function
- [ ] Implement `clusterOrderEvents()` function
- [ ] Implement `packCluster()` function
- [ ] Implement `fillToCapacity()` function
- [ ] Implement main `calculateRecommendations()` export
- [ ] Write unit tests for each function
- [ ] Validate output matches testsuite results for Better Eggs

### Phase 2: Database & Service Layer (Week 1-2)

- [ ] Create migration: `0004_add_recommendations.sql`
- [ ] Add `recommendations` table to schema
- [ ] Run migration on development database
- [ ] Create `src/lib/services/recommendations.ts`
- [ ] Implement `generateAndSaveRecommendations()`
- [ ] Implement `getRecommendations()`
- [ ] Implement `saveRecommendations()` (with transaction)
- [ ] Test service functions with real data

### Phase 3: Integration (Week 2)

- [ ] Update `/api/inventory/save` to trigger recommendations
- [ ] Update `src/app/page.tsx` to load recommendations from DB
- [ ] Update dashboard client to display recommendations
- [ ] Remove mock containers (`src/lib/data/mock-containers.ts`)
- [ ] Add loading states for recommendations
- [ ] Add error handling for failed generation
- [ ] Test first-visit flow (inventory save → recommendations generate)
- [ ] Test update flow (inventory update → recommendations regenerate)

### Phase 4: UI Polish (Week 2-3)

- [ ] Add `generated_at` timestamp display
- [ ] Add "Refresh Recommendations" button (optional)
- [ ] Add staleness banner (if >7 days old)
- [ ] Handle 8-product containers with progressive disclosure
- [ ] Add empty state for "no recommendations needed"
- [ ] Show discontinued products separately
- [ ] Test UI with various scenarios (0-100 containers)

### Phase 5: Validation (Week 3)

- [ ] Test with Better Eggs data (validate 74 containers)
- [ ] Test with 2-3 additional customer datasets
- [ ] Verify per-product targetSOH is respected
- [ ] Verify targetSOH = 0 products are skipped
- [ ] Verify recommendations persist after page reload
- [ ] Verify multi-org isolation (Org A can't see Org B recommendations)
- [ ] Performance test with 50+ products
- [ ] Load test: Generate 1000 recommendations

### Phase 6: Production Deploy (Week 3-4)

- [ ] Code review
- [ ] TypeScript compilation check (`npm run build`)
- [ ] Staging deployment
- [ ] Smoke tests on staging
- [ ] Production database migration
- [ ] Production deployment
- [ ] Monitor error logs
- [ ] Collect user feedback

---

## Success Metrics

### Algorithm Correctness
- ✅ All containers exactly 76 m³ (±0.01 tolerance for rounding)
- ✅ No product stockouts in simulation (coverage never drops to 0)
- ✅ Recommendations respect per-product targetSOH
- ✅ Discontinued products (targetSOH = 0) are skipped
- ✅ Round-robin distribution verified (products evenly split)

### Performance
- ✅ Generation completes in <2 seconds for 50 products
- ✅ Database save completes in <500ms for 100 containers
- ✅ Dashboard loads in <1 second with recommendations

### Business Outcomes
- Customers maintain 6-52 weeks forward planning
- Zero stockouts reported
- Container utilization >95%
- Recommendations followed (not ignored)

---

## Migration from Mock Data

### Current State
```typescript
// src/lib/data/mock-containers.ts
export const mockContainers = [ /* ... */ ];
```

Dashboard loads mock data on every page load.

### New State
```typescript
// src/app/page.tsx
const recommendations = await getRecommendations(user.orgId);
```

Dashboard loads real recommendations from database.

### Migration Steps
1. Implement algorithm + database
2. Generate recommendations for all orgs
3. Update dashboard to load from database
4. Verify UI displays correctly
5. Delete `mock-containers.ts`
6. Remove all imports/references

---

## Testing Strategy

### Unit Tests

```typescript
// src/lib/algorithms/recommendation-engine.test.ts

describe('simulateProductOrders', () => {
  it('should skip products with targetSOH = 0', () => {
    const product = createMockProduct({ targetSOH: 0 });
    const events = simulateProductOrders(product, []);
    expect(events).toEqual([]);
  });

  it('should use per-product targetSOH', () => {
    const product = createMockProduct({ targetSOH: 8, weeklyConsumption: 1000 });
    const events = simulateProductOrders(product, []);
    expect(events[0].quantity).toBe(8000); // 8 weeks * 1000
  });

  it('should account for orders in transit', () => {
    const product = createMockProduct({ currentStock: 10000 });
    const orders = [{ sku: product.sku, quantity: 5000, eta: future }];
    const events = simulateProductOrders(product, orders);
    expect(events.length).toBeLessThan(6); // Fewer orders needed
  });
});
```

### Integration Tests

```typescript
// Test with Better Eggs dataset
it('should generate 74 containers for Better Eggs', async () => {
  const input = loadBetterEggsData();
  const output = calculateRecommendations(input);
  expect(output.containers.length).toBe(74);
  expect(output.containers.every(c => c.totalVolume === 76)).toBe(true);
});
```

### E2E Tests

```typescript
// Test full flow
it('should regenerate recommendations on inventory save', async () => {
  // 1. Save inventory
  await POST('/api/inventory/save', { products: [...] });

  // 2. Load dashboard
  const recommendations = await getRecommendations(orgId);

  // 3. Verify recommendations exist
  expect(recommendations.length).toBeGreaterThan(0);

  // 4. Verify recommendations reflect new inventory
  expect(recommendations[0].orderByDate).toBeAfter(today);
});
```

---

## Rollback Plan

If algorithm produces incorrect results in production:

1. **Immediate:** Revert to mock containers
   ```typescript
   // src/app/page.tsx
   const recommendations = useMockContainers
     ? mockContainers
     : await getRecommendations(user.orgId);
   ```

2. **Debug:** Review recommendations in database
   ```sql
   SELECT * FROM recommendations WHERE org_id = 'xxx' ORDER BY order_by_date;
   ```

3. **Fix:** Update algorithm, regenerate for affected orgs
   ```typescript
   await generateAndSaveRecommendations(affectedOrgId);
   ```

4. **Redeploy:** Push fix, verify, remove fallback

---

## Documentation

### For Engineers

- This file (`docs/plans/2025-11-13-final-recommendation-algorithm.md`)
- Code comments in `recommendation-engine.ts`
- README in `testsuite/` explaining validation approach

### For Users

- Help article: "How Container Recommendations Work"
- FAQ: "Why do some containers have 8 products?"
- Video: "Understanding Your Recommendation Timeline"

---

## Future Enhancements

### Phase 2: Configurable Coalescing Window

Allow user to adjust `COALESCING_WINDOW_DAYS` (3, 7, or 14 days):

```typescript
// Add to organization settings
interface Organization {
  coalescing_window_days: number; // default: 7
}
```

**Use Case:** Large customers might prefer 3-day window (fewer products per container), small customers might prefer 14-day window (fewer total containers).

### Phase 3: Seasonal Adjustments

Detect seasonal patterns and adjust consumption forecasts:

```typescript
// Use historical data to calculate seasonal multipliers
const seasonalConsumption = baseConsumption * getSeasonalMultiplier(month);
```

### Phase 4: Constraint-Based Packing

Add business constraints to packing algorithm:

```typescript
// Don't pack competing products together
const constraints = {
  cannotMixBrands: ['BrandA', 'BrandB'],
  cannotMixSizes: ['600', '700']
};
```

---

## Related Files

**Algorithm Implementation:**
- `testsuite/timeline-simulation.js` - Validated JavaScript prototype
- `testsuite/timeline-7day.md` - Full Better Eggs output (74 containers)
- `testsuite/7DAY-RESULTS.md` - Analysis and 8-product discussion
- `testsuite/ALGORITHM-COMPARISON.md` - Why this approach vs alternatives

**Production Code (To Be Created):**
- `src/lib/algorithms/recommendation-engine.ts` - Pure algorithm
- `src/lib/services/recommendations.ts` - Service layer
- `src/lib/constants.ts` - Add shipping constants
- `migrations/0004_add_recommendations.sql` - Database migration

**Integration Points:**
- `src/app/api/inventory/save/route.ts` - Trigger recommendations
- `src/app/page.tsx` - Load and display recommendations
- `src/lib/erp/client.ts` - Fetch ERP data
- `src/lib/services/inventory.ts` - Fetch inventory data

---

## Questions & Decisions

### ✅ Resolved

**Q:** Should targetSOH be per-product or global?
**A:** Per-product, user-configurable in inventory modal (already implemented)

**Q:** How to handle discontinued products?
**A:** Set targetSOH = 0, algorithm skips them

**Q:** When to regenerate recommendations?
**A:** After inventory updates (primary trigger)

**Q:** Where to store lead time?
**A:** Global constant (SHIPPING_LEAD_TIME_WEEKS = 8), same for all products/customers

**Q:** How to persist recommendations?
**A:** Save to database after generation, load from DB on dashboard

**Q:** What about 8-product containers?
**A:** Accept as mathematically correct, improve UI with progressive disclosure

### 🔄 Open (Can Decide During Implementation)

**Q:** Should we show staleness banner?
**A:** TBD - depends on how often customers update inventory

**Q:** Should we add "Refresh" button?
**A:** TBD - maybe Phase 2, not MVP

**Q:** Should we support per-org coalescing window?
**A:** Not MVP, consider Phase 2 if customers request

---

**Last Updated:** November 13, 2025
**Ready for Implementation:** ✅ Yes
**Estimated Timeline:** 3-4 weeks from start to production
