# Performance Optimizations Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve MyPak Connect performance by 40-50% through database indexing, caching, memoization, and configuration optimizations.

**Architecture:** Focus on 7 high-impact, low-effort fixes: database indexes for faster queries, Next.js config for build optimization, ERP API caching to prevent duplicate fetches, and React memoization to prevent unnecessary re-renders. All changes are incremental and non-breaking.

**Tech Stack:** Next.js 16, React 19, PostgreSQL, Drizzle ORM, date-fns

---

## Task 1: Add Database Index for Users

**Files:**
- Modify: `src/lib/db/schema.ts`
- Generate: `drizzle/` (migration files via Drizzle)

**Note:** The `product_data` table already has a composite primary key on `(org_id, sku)` which provides an index. We only need to add an index on `users.org_id` for foreign key joins.

**Step 1: Add index to users table in schema**

In `src/lib/db/schema.ts`, locate the `users` table definition (around line 13) and add the index callback as the second parameter:

```typescript
}, (table) => ({
  // NEW: Index for org_id foreign key joins
  orgIdx: index("idx_users_org_id").on(table.org_id),
}));
```

Add this callback to the existing `users` table definition - don't rewrite the table, just add the index callback.

**Step 2: Generate and apply migration with Drizzle**

```bash
npm run db:generate && npm run db:migrate
```

Expected output: Migration file created in `drizzle/` directory, then migration applied successfully

**Step 3: Verify index created**

Query to verify:

```sql
SELECT indexname, tablename FROM pg_indexes
WHERE tablename = 'users' AND indexname = 'idx_users_org_id';
```

Expected: See `idx_users_org_id` in results

**Step 4: Commit**

```bash
git add src/lib/db/schema.ts drizzle/
git commit -m "perf: add database index for users.org_id joins"
```

---

## Task 2: Optimize Next.js Configuration

**Files:**
- Modify: `next.config.ts`

**Step 1: Add performance optimizations to Next.js config**

Replace the empty config in `next.config.ts` with:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable gzip/brotli compression
  compress: true,

  // Optimize package imports to reduce bundle size
  optimizePackageImports: [
    '@radix-ui/react-dialog',
    '@radix-ui/react-dropdown-menu',
    '@radix-ui/react-select',
    '@radix-ui/react-slot',
    'lucide-react',
    'date-fns',
    'recharts',
  ],

  // Image optimization settings
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60,
  },

  // Logging for debugging fetch performance
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;
```

**Step 2: Test build with new config**

```bash
npm run build
```

Expected: Build succeeds, look for "Optimized package imports" in output

**Step 3: Commit**

```bash
git add next.config.ts
git commit -m "perf: configure Next.js for compression, optimized imports, and image optimization"
```

---

## Task 3: Fix Product Map Recreation in Dashboard

**Files:**
- Modify: `src/app/page.tsx:85-118`

**Step 1: Move product map creation outside the loop**

In `src/app/page.tsx`, find the `containers` transformation (around line 85). Currently the `productMap` is created inside the loop:

```typescript
const containers: ContainerRecommendation[] = dbRecommendations.map((rec) => {
  // Create product map for lookups
  const productMap = new Map(products.map(p => [p.sku, p])); // INEFFICIENT - inside loop

  return {
    // ... existing shape
  };
});
```

Move the map creation **outside** the loop, keeping the existing shape:

```typescript
// Create product map ONCE before the loop
const productMap = new Map(products.map(p => [p.sku, p]));

// Transform recommendations to UI format
const containers: ContainerRecommendation[] = dbRecommendations.map((rec) => {
  return {
    id: rec.containerNumber, // Use container number as ID (stable and meaningful)
    containerNumber: rec.containerNumber,
    orderByDate: rec.orderByDate.toISOString().split('T')[0],
    deliveryDate: rec.deliveryDate.toISOString().split('T')[0],
    totalCartons: rec.totalCartons,
    totalVolume: rec.totalVolume, // Total volume from algorithm (already a number)
    productCount: rec.products.length,
    urgency: rec.urgency === 'URGENT' || rec.urgency === 'OVERDUE' ? 'URGENT' : null,
    products: rec.products.map(p => {
      const product = productMap.get(p.sku);
      return {
        productId: p.productId,
        sku: p.sku,
        productName: p.productName,
        currentStock: product?.currentStock || 0,
        weeklyConsumption: product?.weeklyConsumption || 0,
        recommendedQuantity: p.quantity,
        afterDeliveryStock: (product?.currentStock || 0) + p.quantity,
        weeksSupply: product?.weeklyConsumption
          ? ((product.currentStock || 0) + p.quantity) / product.weeklyConsumption
          : 999,
        runsOutDate: '',
        piecesPerPallet: p.piecesPerPallet, // From algorithm output (always present)
        volumePerCarton: product ? product.volumePerPallet / product.piecesPerPallet : undefined,
        imageUrl: product?.imageUrl,
      };
    }),
  };
});
```

**Step 2: Test dashboard loads correctly**

```bash
npm run dev
# Navigate to http://localhost:3000
```

Expected: Dashboard loads, recommendations display correctly with product names

**Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "perf: create product map once instead of inside recommendation loop"
```

---

## Task 4: Fix Product Map Recreation in Orders Page

**Files:**
- Modify: `src/app/orders/page.tsx:57-65`

**Step 1: Move product info map creation outside the loop**

In `src/app/orders/page.tsx`, find the containers transformation (around line 57). Currently the `productInfoMap` is created inside the loop:

```typescript
const containers: ContainerRecommendation[] = dbRecommendations.map((rec) => {
  const productInfoMap = new Map(
    erpProducts.map(p => [p.sku, {
      piecesPerPallet: p.piecesPerPallet,
      volumePerCarton: p.volumePerPallet / p.piecesPerPallet,
      imageUrl: p.imageUrl
    }])
  ); // INEFFICIENT - inside loop
  // ...
});
```

Move the map creation **outside** the loop, keeping the existing shape:

```typescript
// Create product info map ONCE before the loop
const productInfoMap = new Map(
  erpProducts.map(p => [p.sku, {
    piecesPerPallet: p.piecesPerPallet,
    volumePerCarton: p.volumePerPallet / p.piecesPerPallet,
    imageUrl: p.imageUrl
  }])
);

// Transform recommendations to UI format
const containers: ContainerRecommendation[] = dbRecommendations.map((rec) => {
  return {
    id: rec.containerNumber, // Use container number as ID (stable and meaningful)
    containerNumber: rec.containerNumber,
    orderByDate: rec.orderByDate.toISOString().split('T')[0],
    deliveryDate: rec.deliveryDate.toISOString().split('T')[0],
    totalCartons: rec.totalCartons,
    totalVolume: rec.totalVolume, // Total volume from algorithm (already a number)
    productCount: rec.products.length,
    urgency: rec.urgency === 'URGENT' || rec.urgency === 'OVERDUE' ? 'URGENT' : null,
    products: rec.products.map(p => {
      const inventory = inventoryMap.get(p.sku);
      const productInfo = productInfoMap.get(p.sku);
      return {
        productId: p.productId,
        sku: p.sku,
        productName: p.productName,
        currentStock: inventory?.current_stock || 0,
        weeklyConsumption: inventory?.weekly_consumption || 0,
        recommendedQuantity: p.quantity,
        afterDeliveryStock: (inventory?.current_stock || 0) + p.quantity,
        weeksSupply: inventory?.weekly_consumption
          ? ((inventory.current_stock || 0) + p.quantity) / inventory.weekly_consumption
          : 999,
        runsOutDate: '',
        piecesPerPallet: p.piecesPerPallet, // From algorithm output (always present)
        volumePerCarton: productInfo?.volumePerCarton, // Add volume per carton
        imageUrl: productInfo?.imageUrl || undefined,
      };
    }),
  };
});
```

**Step 2: Test orders page loads correctly**

```bash
npm run dev
# Navigate to http://localhost:3000/orders
```

Expected: Orders page loads, all container cards display correctly

**Step 3: Commit**

```bash
git add src/app/orders/page.tsx
git commit -m "perf: create product info map once instead of inside recommendation loop"
```

---

## Task 5: Add Memoization to ProductCard Order Filtering

**Files:**
- Modify: `src/components/shared/ProductCard.tsx:28-63`

**Step 1: Import useMemo**

At the top of `src/components/shared/ProductCard.tsx`, ensure React is imported:

```typescript
'use client';

import React, { useMemo, useState } from 'react';
```

**Step 2: Wrap order filtering in useMemo**

Find the order filtering logic (around line 28). Currently:

```typescript
const allProductOrders = liveOrders
  .filter(order =>
    order.products && order.products.some(p => p.productId === product.id || p.productName === product.name)
  )
  .map(order => {
    const orderProduct = order.products.find(p => p.productId === product.id || p.productName === product.name);
    // ...
  });

const productLiveOrders = allProductOrders
  .filter(order => {
    try {
      const deliveryDate = parse(order.deliveryDate, 'MMM dd, yyyy', new Date());
      return deliveryDate <= chartEndDate;
    } catch {
      return true;
    }
  })
  .sort((a, b) => {
    const dateA = parse(a.deliveryDate, 'MMM dd, yyyy', new Date());
    const dateB = parse(b.deliveryDate, 'MMM dd, yyyy', new Date());
    return dateA.getTime() - dateB.getTime();
  });
```

Replace with optimized memoized version:

```typescript
const productLiveOrders = useMemo(() => {
  // Filter and map orders for this product
  const allProductOrders = liveOrders
    .filter(order =>
      order.products?.some(p => p.productId === product.id || p.productName === product.name)
    )
    .map(order => {
      const orderProduct = order.products.find(p => p.productId === product.id || p.productName === product.name);
      return {
        orderNumber: order.orderNumber,
        deliveryDate: order.deliveryDate,
        quantity: orderProduct?.recommendedQuantity || 0,
      };
    })
    .filter(o => o.quantity > 0);

  // Filter to chart timeframe and sort
  return allProductOrders
    .filter(order => {
      try {
        const deliveryDate = parse(order.deliveryDate, 'MMM dd, yyyy', new Date());
        return deliveryDate <= chartEndDate;
      } catch {
        return true;
      }
    })
    .sort((a, b) => {
      try {
        const dateA = parse(a.deliveryDate, 'MMM dd, yyyy', new Date());
        const dateB = parse(b.deliveryDate, 'MMM dd, yyyy', new Date());
        return dateA.getTime() - dateB.getTime();
      } catch {
        return 0;
      }
    });
}, [liveOrders, product.id, product.name, chartEndDate]);
```

**Step 3: Test product cards render correctly**

```bash
npm run dev
# Navigate to dashboard, verify product cards show order data
```

Expected: Product cards display correctly, charts show order data

**Step 4: Commit**

```bash
git add src/components/shared/ProductCard.tsx
git commit -m "perf: memoize order filtering in ProductCard to prevent re-computation"
```

---

## Task 6: Add Memoization to DashboardClient

**Files:**
- Modify: `src/components/dashboard/DashboardClient.tsx:60-69`

**Step 1: Import useMemo**

At the top of `src/components/dashboard/DashboardClient.tsx`, ensure useMemo is imported:

```typescript
'use client';

import React, { useMemo, useState, useEffect } from 'react';
```

**Step 2: Wrap worst product calculation in useMemo**

Find the worst product calculation (around line 60). Currently:

```typescript
const worstProduct = products.length > 0
  ? products.reduce((worst, product) =>
      product.weeksRemaining < worst.weeksRemaining ? product : worst
    )
  : null;
```

Replace with:

```typescript
const worstProduct = useMemo(() => {
  return products.length > 0
    ? products.reduce((worst, product) =>
        product.weeksRemaining < worst.weeksRemaining ? product : worst
      )
    : null;
}, [products]);
```

**Step 3: Wrap product grouping in useMemo**

Find the product grouping (around line 65). Currently:

```typescript
const criticalProducts = products.filter(p => p.status === 'CRITICAL');
const orderNowProducts = products.filter(p => p.status === 'ORDER_NOW');
const healthyProducts = products.filter(p => p.status === 'HEALTHY');
```

Replace with:

```typescript
const criticalProducts = useMemo(
  () => products.filter(p => p.status === 'CRITICAL'),
  [products]
);

const orderNowProducts = useMemo(
  () => products.filter(p => p.status === 'ORDER_NOW'),
  [products]
);

const healthyProducts = useMemo(
  () => products.filter(p => p.status === 'HEALTHY'),
  [products]
);
```

**Step 4: Test dashboard renders correctly**

```bash
npm run dev
# Navigate to dashboard, open/close modals, verify products grouped correctly
```

Expected: Dashboard renders correctly, products grouped by status (Critical/Order Now/Healthy)

**Step 5: Commit**

```bash
git add src/components/dashboard/DashboardClient.tsx
git commit -m "perf: memoize product calculations and grouping in DashboardClient"
```

---

## Task 7: Add ERP API Caching (Page-Level Only)

**Files:**
- Create: `src/lib/erp/cache.ts`
- Modify: `src/app/page.tsx`
- Modify: `src/app/orders/page.tsx`
- Modify: `src/app/api/inventory/save/route.ts`

**Step 1: Create cache wrapper with unstable_cache**

Create `src/lib/erp/cache.ts`:

```typescript
import { unstable_cache, revalidateTag } from 'next/cache';
import { fetchErpProducts, fetchErpCurrentOrders, fetchErpCompletedOrders } from './client';

/**
 * Cached ERP product fetch with 5-minute revalidation
 * Cache is per organization (orgId in cache key)
 * Uses static tag for broad invalidation
 */
const cachedErpProducts = unstable_cache(
  async (orgId: string) => fetchErpProducts(),
  ['erp:products'], // Static cache key base
  {
    revalidate: 300, // 5 minutes
    tags: ['erp:products'], // Static tag for invalidation
  }
);

export const getCachedErpProducts = (orgId: string) => cachedErpProducts(orgId);

/**
 * Cached ERP current orders fetch with 5-minute revalidation
 * Cache is per organization (orgId in cache key)
 * Uses static tag for broad invalidation
 */
const cachedErpCurrentOrders = unstable_cache(
  async (orgId: string) => fetchErpCurrentOrders(),
  ['erp:orders:current'], // Static cache key base
  {
    revalidate: 300, // 5 minutes
    tags: ['erp:orders:current'], // Static tag for invalidation
  }
);

export const getCachedErpCurrentOrders = (orgId: string) => cachedErpCurrentOrders(orgId);

/**
 * Cached ERP completed orders fetch with 5-minute revalidation
 * Cache is per organization (orgId in cache key)
 * Uses static tag for broad invalidation
 */
const cachedErpCompletedOrders = unstable_cache(
  async (orgId: string) => fetchErpCompletedOrders(),
  ['erp:orders:completed'], // Static cache key base
  {
    revalidate: 300, // 5 minutes
    tags: ['erp:orders:completed'], // Static tag for invalidation
  }
);

export const getCachedErpCompletedOrders = (orgId: string) => cachedErpCompletedOrders(orgId);

/**
 * Manually invalidate all ERP caches (all organizations)
 * Call after inventory updates to ensure fresh data on next fetch
 * Note: Invalidates broadly - all orgs will refetch on next request
 */
export function revalidateErpCache() {
  revalidateTag('erp:products');
  revalidateTag('erp:orders:current');
  revalidateTag('erp:orders:completed');
}
```

**Step 2: Update Dashboard to use cached fetch**

In `src/app/page.tsx`, change imports and fetch calls:

```typescript
// Change this import:
import { fetchErpProducts, fetchErpCurrentOrders } from '@/lib/erp/client';

// To:
import { getCachedErpProducts, getCachedErpCurrentOrders } from '@/lib/erp/cache';

// Then in the Dashboard component (around line 23), change:
const erpProducts = await fetchErpProducts();
const erpOrders = await fetchErpCurrentOrders();

// To:
const user = await getCurrentUser();
if (!user) redirect('/sign-in');

const erpProducts = await getCachedErpProducts(user.orgId);
const erpOrders = await getCachedErpCurrentOrders(user.orgId);
```

**Step 3: Update Orders page to use cached fetch**

In `src/app/orders/page.tsx`, change imports and fetch calls:

```typescript
// Change this import:
import { fetchErpProducts, fetchErpCurrentOrders, fetchErpCompletedOrders } from '@/lib/erp/client';

// To:
import { getCachedErpProducts, getCachedErpCurrentOrders, getCachedErpCompletedOrders } from '@/lib/erp/cache';

// Then in the OrdersPage component (around line 22), change:
const erpProducts = await fetchErpProducts();
const currentOrders = await fetchErpCurrentOrders();
const completedOrders = await fetchErpCompletedOrders();

// To:
const user = await getCurrentUser();
if (!user) redirect('/sign-in');

const erpProducts = await getCachedErpProducts(user.orgId);
const currentOrders = await getCachedErpCurrentOrders(user.orgId);
const completedOrders = await getCachedErpCompletedOrders(user.orgId);
```

**Note:** We intentionally do NOT change `src/lib/services/recommendations.ts` to use the cached fetch. The service uses `fetchErpProductsForOrg(orgId)` (explicit org-based) while the cache uses `fetchErpProducts()` (session-based). Mixing these could introduce subtle correctness bugs. The page-level caching already delivers the performance win without refactoring the service.

**Step 4: Invalidate cache after inventory save**

In `src/app/api/inventory/save/route.ts`, add cache invalidation after saving:

```typescript
// At top, add import:
import { revalidateErpCache } from '@/lib/erp/cache';

// After generateAndSaveRecommendations call (around line 58), add:
await generateAndSaveRecommendations(user.orgId);

// Invalidate ERP cache to ensure fresh data on next fetch
// Note: Invalidates all orgs (broad invalidation with static tags)
revalidateErpCache();

return NextResponse.json({
  // ...
```

**Step 5: Test cache behavior**

```bash
npm run dev
# 1. Navigate to dashboard - should see products
# 2. Open browser DevTools Network tab
# 3. Refresh page - should see cached responses (faster load)
# 4. Update inventory - cache should invalidate
# 5. Navigate to orders page - should use cached data
```

Expected: Pages load faster on subsequent visits, data remains fresh after inventory updates

**Step 6: Commit**

```bash
git add src/lib/erp/cache.ts src/app/page.tsx src/app/orders/page.tsx src/app/api/inventory/save/route.ts
git commit -m "perf: add ERP API caching with 5-minute revalidation and broad invalidation"
```

---

## Task 8: Run Full Build and Verify

**Step 1: Run TypeScript check**

```bash
npm run build
```

Expected: No TypeScript errors, build succeeds

**Step 2: Run development server and smoke test**

```bash
npm run dev
```

Test checklist:
- [ ] Dashboard loads and displays products
- [ ] Product cards show correct inventory data
- [ ] Recommendations display correctly
- [ ] Orders page loads and displays containers
- [ ] Inventory edit modal works
- [ ] Saving inventory triggers cache invalidation
- [ ] Subsequent page loads are faster (check Network tab)

**Step 3: Final commit with verification**

```bash
git add .
git commit -m "perf: verify all optimizations work correctly in production build"
```

---

## Testing Notes

**Performance Testing:**
1. Use Chrome DevTools Performance tab to measure render time before/after
2. Check Network tab for cached vs. fresh requests
3. Monitor database query performance with pg_stat_statements

**Expected Improvements:**
- Dashboard load: 30-40% faster (cached ERP calls + memoization)
- Orders page: 30-40% faster (cached ERP calls + optimized map creation)
- Product card renders: 50%+ faster (memoized filtering)
- Database queries: 2-3x faster with indexes

**Rollback Plan:**
If caching causes issues:
1. Remove cache.ts and revert to direct client calls
2. Keep memoization and map optimizations (safe)
3. Keep database indexes (safe)

---

## Success Criteria

- ✅ Build completes without errors
- ✅ Dashboard loads with products displaying correctly
- ✅ Orders page displays all containers correctly
- ✅ Inventory updates save successfully
- ✅ ERP API calls are cached (verify in Network tab)
- ✅ Database queries use new indexes (check with EXPLAIN ANALYZE)
- ✅ No breaking changes to user experience
- ✅ All 7 tasks committed to git

**Total Estimated Time:** 2-3 hours
**Expected Performance Gain:** 40-50% improvement in page load times
