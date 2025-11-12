# ERP Integration Guide

**Complete guide to integrating with the MyPak ERP API**

This document explains how MyPak Connect integrates with the MyPak ERP API to fetch live product and order data in real-time.

**Last Updated:** November 12, 2024

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [ERP API Reference](#erp-api-reference)
4. [Authentication Flow](#authentication-flow)
5. [Data Transformation](#data-transformation)
6. [Error Handling](#error-handling)
7. [Caching Strategy](#caching-strategy)
8. [Code Examples](#code-examples)
9. [Troubleshooting](#troubleshooting)
10. [Future Enhancements](#future-enhancements)

---

## Overview

### What is the ERP Integration?

MyPak Connect connects to the **MyPak ERP API** to fetch:
- ✅ Product catalog (carton types available to customer)
- ✅ Current orders (IN_TRANSIT, APPROVED)
- ✅ Completed orders (order history)
- 📝 Order creation (POST endpoint ready, not yet used)

### Why Direct Integration?

Instead of syncing data to our database, we **fetch directly from ERP** on each page load:

**Benefits:**
- ✅ Always up-to-date (no sync lag)
- ✅ Single source of truth (ERP)
- ✅ Simpler architecture (no sync jobs)
- ✅ Less storage needed (only config data)

**Trade-offs:**
- ⚠️ Slower page loads (ERP fetch takes 1-2s)
- ⚠️ Dependent on ERP uptime
- ⚠️ No offline mode

---

## Architecture

### Server Components Pattern

We use **Next.js 15 Server Components** to fetch ERP data on the server:

```
┌────────────────────────────────────────────────┐
│         Browser (Client)                        │
│  ┌──────────────────────────────────────────┐  │
│  │  Client Components                       │  │
│  │  - ProductCard (interactive UI)          │  │
│  │  - OrderCard (expandable details)        │  │
│  │  - RecommendationCard (CTAs)             │  │
│  └──────────────────────────────────────────┘  │
└────────────────────┬───────────────────────────┘
                     │ Props (serialized data)
                     │
┌────────────────────▼───────────────────────────┐
│         Next.js Server                          │
│  ┌──────────────────────────────────────────┐  │
│  │  Server Components (async functions)     │  │
│  │                                           │  │
│  │  export default async function Page() {  │  │
│  │    const products = await fetchErpProducts();│
│  │    return <ClientComponent products={products} />;│
│  │  }                                        │  │
│  └──────────────────┬───────────────────────┘  │
│                     │                           │
│  ┌──────────────────▼───────────────────────┐  │
│  │  ERP Client (src/lib/erp/client.ts)      │  │
│  │                                           │  │
│  │  1. getOrgToken() - Query database       │  │
│  │  2. fetch() - Call ERP API with token    │  │
│  │  3. transform() - ERP → App types        │  │
│  └──────────────────┬───────────────────────┘  │
│                     │                           │
│  ┌──────────────────▼───────────────────────┐  │
│  │  Database (PostgreSQL)                    │  │
│  │  - organizations.kavop_token              │  │
│  └───────────────────────────────────────────┘  │
└────────────────────┬───────────────────────────┘
                     │ HTTP Request
                     │
┌────────────────────▼───────────────────────────┐
│         MyPak ERP API                           │
│  http://www.mypak.cn:8088/api/kavop            │
│                                                 │
│  - GET /product/list                            │
│  - GET /order/current                           │
│  - GET /order/complete                          │
│  - POST /order/create                           │
└─────────────────────────────────────────────────┘
```

### Data Flow Step-by-Step

1. **User navigates** to Dashboard (`/`)
2. **Server Component executes** `src/app/page.tsx`
3. **Fetch from ERP:**
   - Calls `fetchErpProducts()`
   - Which calls `getOrgToken()` → queries database for `kavop_token`
   - Which calls ERP API with token
4. **Transform data** from ERP format to app format
5. **Pass to Client Component** as props
6. **Client Component renders** with interactive UI

---

## ERP API Reference

### Base URL

```
http://www.mypak.cn:8088/api/kavop
```

### Endpoints We Use

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/product/list` | GET | Fetch customer's product catalog | ✅ In use |
| `/order/current` | GET | Fetch IN_TRANSIT + APPROVED orders | ✅ In use |
| `/order/complete` | GET | Fetch order history | ✅ In use |
| `/order/create` | POST | Create new orders | 📝 Ready, not used |

**Complete API documentation:** [docs/backend-planning/ERP-API-ENDPOINTS.md](../backend-planning/ERP-API-ENDPOINTS.md)

### Authentication

All requests require an `Authorization` header:

```http
GET /api/kavop/product/list HTTP/1.1
Host: www.mypak.cn:8088
Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

The token is a **JWT** issued by MyPak ERP, stored in our database per organization.

---

## Authentication Flow

### How We Get the Token

```typescript
// src/lib/erp/client.ts

async function getOrgToken(): Promise<string> {
  // 1. Get current user from JWT cookie
  const user = await getCurrentUser();

  if (!user || !user.orgId) {
    throw new Error('User not authenticated');
  }

  // 2. Query database for organization's token
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.org_id, user.orgId));

  if (!org) {
    throw new Error('Organization not found');
  }

  // 3. Validate token exists
  if (!org.kavop_token || org.kavop_token.trim() === '') {
    throw new Error(`Organization "${org.org_name}" has no kavop_token configured`);
  }

  // 4. Return token
  return org.kavop_token;
}
```

### Where Tokens Come From

**MyPak ERP Team provides tokens** for each customer:

1. Customer name (e.g., "Aginbrook") is registered in ERP
2. ERP team generates JWT token for that customer
3. We store token in `organizations.kavop_token` column
4. Our app uses token for all API calls

**Token Management:**
- Tokens are **long-lived** (expire in ~1 year)
- Stored securely in database (not exposed to client)
- One token per organization
- Platform admins can update tokens via Admin UI

---

## Data Transformation

### Why Transform?

ERP API returns data in **ERP's format**. We transform it to **our app's format** for consistency.

---

## Date Normalization (CRITICAL)

### Problem: ERP Returns Multiple Date Formats

The ERP backend returns delivery dates in **inconsistent formats**:

```
"26/01/2026"              // DD/MM/YYYY
"2025-11-23"              // YYYY-MM-DD
"5/3/2026"                // D/M/YYYY (loose format)
"ASAP,Before Christmas"   // Special text
null                      // Missing dates
```

Our app needs **one standard format**: `"MMM dd, yyyy"` (e.g., "Jan 26, 2026")

### Solution: Automatic Date Normalization

**Location:** `src/lib/erp/transforms.ts:53-176`

**Function:** `normalizeErpDate(erpDate, orderedDate)`

**How It Works:**

```typescript
// All these become "Jan 26, 2026":
normalizeErpDate("26/01/2026", "...")     // DD/MM/YYYY
normalizeErpDate("2026-01-26", "...")     // YYYY-MM-DD
normalizeErpDate("26/1/2026", "...")      // D/M/YYYY

// Special handling:
normalizeErpDate("ASAP,Before Christmas", "2025-11-12")
// → orderedDate + 8 weeks = "Jan 07, 2026"

normalizeErpDate(null, "2025-11-12")
// → orderedDate + 8 weeks = "Jan 07, 2026"
```

### The "ASAP = +8 Weeks" Rule

**WHY 8 WEEKS?**

When ERP returns `"ASAP"`, `"Before Christmas"`, or missing dates, we need a reasonable estimate for when the order will actually arrive. Based on typical lead times:

- **Manufacturing:** ~3-4 weeks
- **Shipping:** ~3-4 weeks
- **Buffer:** ~1 week

**Total:** ~8 weeks from order date

**IMPORTANT:** This is an **estimate**, not a guarantee. The actual delivery date depends on production capacity and shipping schedules.

**HOW TO CHANGE:**

If lead times change, update **ONE place**:

```typescript
// src/lib/erp/transforms.ts:135

function calculateAsapDate(orderedDate: string): string {
  // Change this number to adjust ASAP calculation
  const asapDate = addWeeks(orderDate, 8);  // ← Change 8 to new weeks
  return format(asapDate, 'MMM dd, yyyy');
}
```

**DO NOT** hardcode this logic anywhere else in the codebase.

### Fallback Chain (Bulletproof)

The normalization has **multiple safety layers** to guarantee we never lose date info:

```
1. Try to parse with known formats (DD/MM/YYYY, YYYY-MM-DD, etc.)
   ↓ Failed?
2. Use orderedDate + 8 weeks
   ↓ Can't parse orderedDate?
3. Use TODAY + 8 weeks
   ↓ GUARANTEED: Always returns valid date
```

**Original date preserved** in order `comments` field if unusual:
```
comments: "[Original ERP date: "ASAP,Before Christmas"]"
```

### Logging & Debugging

All date parsing operations log to console:

**Success (📅):**
```
📅 [Date Parser] DD/MM/YYYY: "26/01/2026" → "Jan 26, 2026"
📅 [Date Parser] ASAP/Special date detected: "ASAP,Before Christmas" → Using orderedDate + 8 weeks
```

**Warnings (⚠️):**
```
⚠️ [Date Parser] UNKNOWN FORMAT: "Q4 2026" - Using orderedDate + 8 weeks as fallback. PLEASE CHECK ERP DATA!
```

**Errors (❌):**
```
❌ [Date Parser] PARSING ERROR for "gibberish data"
❌ Using orderedDate + 8 weeks as fallback. Original date: "gibberish data"
```

**Check server console** (terminal where `npm run dev` is running) to see these logs.

### Supported Date Formats

| Format | Example | Regex | Notes |
|--------|---------|-------|-------|
| DD/MM/YYYY | `"26/01/2026"` | `^\d{2}/\d{2}/\d{4}$` | Standard European |
| YYYY-MM-DD | `"2025-11-23"` | `^\d{4}-\d{2}-\d{2}$` | ISO 8601 |
| D/M/YYYY | `"5/3/2026"` | `^\d{1,2}/\d{1,2}/\d{4}$` | Loose format |
| MMM dd, yyyy | `"Nov 23, 2025"` | `^[A-Za-z]{3}\s+\d{1,2},\s+\d{4}$` | Already normalized |
| "ASAP" variants | `"ASAP,Before Christmas"` | Contains "ASAP" | orderedDate + 8 weeks |
| Empty/null | `null` or `""` | N/A | orderedDate + 8 weeks |

**Unrecognized formats** → Fallback to orderedDate + 8 weeks with warning logged.

### For Engineers: Adding New Date Formats

**IF** ERP starts returning a new date format (e.g., "MM-DD-YYYY"):

1. **Add to `normalizeErpDate()`** in `src/lib/erp/transforms.ts`:

```typescript
// Add after existing format checks
if (/^\d{2}-\d{2}-\d{4}$/.test(originalDate)) {
  const parsed = parse(originalDate, 'MM-dd-yyyy', new Date());
  if (isValidDate(parsed)) {
    const formatted = format(parsed, 'MMM dd, yyyy');
    console.log(`📅 [Date Parser] MM-DD-YYYY: "${originalDate}" → "${formatted}"`);
    return formatted;
  }
}
```

2. **Update documentation** (this section) with new format in table above

3. **DO NOT** add date parsing logic anywhere else

**That's it.** All components automatically use the normalized dates from `transformErpOrder()`.

---

### Example: Product Transformation

**ERP Format:**
```json
{
  "id": 1003833,
  "sku": "AGI-AWR600a-S12G9C-IL1",
  "name": "Woolworths Free Range 600g/EmbossPak(9G)12-Egg/ Champagne Carton/1",
  "packCount": 142.0,
  "piecesPerPallet": 4544.0,
  "volumePerPallet": 3.06989898989899,
  "imageUrl": "http://mypak.dyndns.org/label/AGI/AGI-AWR600a-S12G9-L1.jpg"
}
```

**App Format:**
```typescript
{
  id: "1003833",
  name: "Woolworths Free Range 600g...",
  sku: "AGI-AWR600a-S12G9C-IL1",
  imageUrl: "http://mypak.dyndns.org/label/AGI/AGI-AWR600a-S12G9-L1.jpg",
  cartonsPerPallet: 4544,
  packsPerPallet: 142,
  volumePerPallet: 3.07,
  // Added by us (from inventory service):
  currentStock: 50000,
  weeklyConsumption: 8000,
  weeksRemaining: 6.25,
  status: "ORDER_NOW"
}
```

### Transform Function

```typescript
// src/lib/erp/transforms.ts

export function transformErpProduct(erp: ErpProduct): PartialProduct {
  return {
    id: String(erp.id),
    name: erp.name,
    sku: erp.sku,
    imageUrl: erp.imageUrl,
    cartonsPerPallet: Math.floor(erp.piecesPerPallet),
    packsPerPallet: Math.floor(erp.packCount),
    volumePerPallet: Number(erp.volumePerPallet.toFixed(2))
  };
}
```

**Why `PartialProduct`?**
We don't have inventory data yet (currentStock, weeklyConsumption). Those are added later from our inventory service.

### Complete Example

```typescript
// src/app/page.tsx

export default async function Dashboard() {
  // 1. Fetch from ERP
  const erpProducts = await fetchErpProducts();

  // 2. Transform ERP → Partial
  const partialProducts = erpProducts.map(transformErpProduct);

  // 3. Add inventory data (temporary mock)
  const inventoryMap = getInventoryForProducts(
    partialProducts.map(p => p.id)
  );

  // 4. Complete products with calculations
  const products: Product[] = partialProducts.map(partial => {
    const inventory = inventoryMap.get(partial.id);
    return completeProductWithInventory(
      partial,
      inventory.currentStock,
      inventory.weeklyConsumption
    );
  });

  // 5. Pass to client
  return <DashboardClient products={products} />;
}
```

---

## Error Handling

### Levels of Error Handling

**1. ERP Client Level** (`src/lib/erp/client.ts`):

```typescript
export async function fetchErpProducts(): Promise<ErpProduct[]> {
  const token = await getOrgToken();

  const response = await fetch(`${ERP_BASE_URL}/product/list`, {
    headers: { 'Authorization': token },
    cache: 'no-store'
  });

  // Handle HTTP errors
  if (!response.ok) {
    throw new Error(`ERP API error: ${response.status} ${response.statusText}`);
  }

  const data: ErpApiResponse<ErpProduct[]> = await response.json();

  // Handle API-level errors
  if (!data.success) {
    throw new Error(`ERP API error: ${data.error}`);
  }

  return data.response;
}
```

**2. Page Level** (`src/app/page.tsx`):

```typescript
export default async function Dashboard() {
  try {
    const erpProducts = await fetchErpProducts();
    // ... transform and render
  } catch (error) {
    // Error is caught by error boundary
    throw error;
  }
}
```

**3. Error Boundary** (`src/app/error.tsx`):

```typescript
'use client';

export default function Error({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong loading the dashboard</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

### Common Errors

| Error Message | Cause | Solution |
|---------------|-------|----------|
| "User not authenticated" | No JWT cookie | Sign in again |
| "Organization not found" | User's orgId doesn't exist in DB | Check user.orgId value |
| "has no kavop_token configured" | Empty kavop_token in database | Admin: set token for org |
| "ERP API error: 401" | Invalid/expired token | Get new token from MyPak team |
| "ERP API error: For input string: ''" | Empty token sent to ERP | Check token in database |

### Diagnostic Logging

We added diagnostic logging to help debug issues:

```typescript
async function getOrgToken(): Promise<string> {
  const user = await getCurrentUser();
  console.log('🔍 [ERP Client] Current user:', user ? {
    userId: user.userId,
    orgId: user.orgId,
    email: user.email
  } : 'null');

  // ... rest of function

  console.log('🔍 [ERP Client] Organization found:', org ? {
    org_id: org.org_id,
    org_name: org.org_name,
    has_token: !!org.kavop_token,
    token_length: org.kavop_token?.length || 0
  } : 'null');
}
```

**Check terminal for 🔍 logs when debugging ERP issues.**

---

## Caching Strategy

### Current: No Caching

```typescript
const response = await fetch(`${ERP_BASE_URL}/product/list`, {
  cache: 'no-store'  // ← Always fresh data
});
```

**Why?** During development, we want to always see latest ERP data.

### Future: ISR with Revalidation

**Incremental Static Regeneration** - cache with time-based revalidation:

```typescript
const response = await fetch(`${ERP_BASE_URL}/product/list`, {
  next: { revalidate: 300 }  // Re-fetch every 5 minutes
});
```

**Benefits:**
- ✅ Faster page loads (cached data)
- ✅ Still relatively fresh (5 min old max)
- ✅ Reduced ERP API load

**Trade-offs:**
- ⚠️ Data can be stale for up to 5 minutes
- ⚠️ First user after cache expires sees slow load

### Future: On-Demand Revalidation

Allow manual cache refresh:

```typescript
// After creating order, revalidate:
revalidatePath('/orders');
```

---

## Code Examples

### Example 1: Fetching Products in Server Component

```typescript
// src/app/page.tsx

import { fetchErpProducts } from '@/lib/erp/client';
import { transformErpProduct } from '@/lib/erp/transforms';
import { DashboardClient } from '@/components/dashboard/DashboardClient';

export default async function Dashboard() {
  // Fetch from ERP (server-side)
  const erpProducts = await fetchErpProducts();

  // Transform to app types
  const products = erpProducts.map(transformErpProduct);

  // Pass to client for interactivity
  return <DashboardClient products={products} />;
}
```

### Example 2: Adding Error Boundary

```typescript
// src/app/error.tsx

'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">
        Failed to load dashboard
      </h2>
      <p className="text-gray-600 mb-6">{error.message}</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
```

### Example 3: Adding Loading State

```typescript
// src/app/loading.tsx

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse">
        <div className="h-32 bg-gray-200 rounded-lg mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-64 bg-gray-200 rounded-lg" />
          <div className="h-64 bg-gray-200 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
```

### Example 4: Testing ERP Integration Locally

```typescript
// Test file: test-erp.ts

import { fetchErpProducts } from './src/lib/erp/client';

async function testErpIntegration() {
  console.log('Testing ERP integration...');

  try {
    const products = await fetchErpProducts();
    console.log(`✅ Success! Fetched ${products.length} products`);
    console.log('First product:', products[0]);
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
}

testErpIntegration();
```

Run with:
```bash
npx tsx test-erp.ts
```

---

## Troubleshooting

### Debug Checklist

When ERP integration isn't working:

1. **Check user is authenticated:**
   ```typescript
   const user = await getCurrentUser();
   console.log('User:', user);
   ```

2. **Check organization exists:**
   ```sql
   SELECT org_id, org_name, kavop_token
   FROM organizations
   WHERE org_id = '<user.orgId>';
   ```

3. **Check token is valid:**
   - Token should be a long JWT string
   - Not empty or "undefined"
   - Length should be 200+ characters

4. **Test ERP API directly:**
   ```bash
   curl -H "Authorization: eyJhbGci..." \
     http://www.mypak.cn:8088/api/kavop/product/list
   ```

5. **Check terminal for 🔍 diagnostic logs**

### Common Issues

**Issue:** "Organization has no kavop_token configured"

**Solution:**
```sql
UPDATE organizations
SET kavop_token = 'eyJhbGci...'  -- Get from MyPak team
WHERE org_name = 'Your Organization';
```

**Issue:** Products/Orders show empty

**Solution:**
1. Check ERP returned data: Look for 🔍 logs
2. Test ERP API with curl
3. Verify customer name matches in ERP system
4. Contact MyPak team to verify account

**Issue:** Slow page loads

**Solution:**
- Check ERP API response time (should be < 2s)
- Consider implementing caching (ISR)
- Check network connection to ERP server

---

## Future Enhancements

### Phase 2: Real Inventory Tracking

**Current:** Mock data in `src/lib/services/inventory.ts`

**Future Options:**

**Option 1: Track in Database**
```sql
CREATE TABLE inventory_levels (
  product_id TEXT PRIMARY KEY,
  org_id UUID REFERENCES organizations(org_id),
  current_stock INTEGER,
  weekly_consumption INTEGER,
  last_updated TIMESTAMP
);
```

**Option 2: Calculate from Order History**
```typescript
// Calculate consumption from completed orders
const consumption = calculateConsumption(completedOrders, weeks);
```

**Option 3: Integrate with Farm System**
```typescript
// Fetch from farm's own inventory system
const inventory = await fetchFarmInventory(productId);
```

### Phase 2: Container Recommendation Algorithm

**Current:** Mock data in `src/lib/data/mock-containers.ts`

**Future:** Implement algorithm from [RECOMMENDATION-ALGORITHM.md](../backend-planning/RECOMMENDATION-ALGORITHM.md)

```typescript
export function generateRecommendations(
  products: Product[],
  leadTimeDays: number,
  targetSOH: number
): ContainerRecommendation[] {
  // 1. Find products that need ordering
  const urgentProducts = products.filter(p =>
    p.weeksRemaining < targetSOH + (leadTimeDays / 7)
  );

  // 2. Group into containers (maximize volume)
  const containers = groupIntoContainers(urgentProducts);

  // 3. Calculate order-by dates
  containers.forEach(container => {
    container.orderByDate = calculateOrderByDate(
      container.products,
      leadTimeDays
    );
  });

  return containers;
}
```

### Phase 2: Order Creation

**Endpoint Ready:** `POST /order/create` in ERP API

**TODO:** Build UI flow:
1. Review container page
2. Edit quantities
3. Add shipping details
4. Submit to ERP

```typescript
// Future: src/app/api/orders/submit/route.ts

export async function POST(request: Request) {
  const orderData = await request.json();

  // Submit to ERP
  await createErpOrder({
    signer: orderData.signer,
    requiredEta: orderData.requiredEta,
    shippingTerm: orderData.shippingTerm,
    lines: orderData.products.map(p => ({
      qty: p.quantity,
      sku: p.sku,
      productId: p.erpId
    }))
  });

  // Revalidate orders page
  revalidatePath('/orders');

  return NextResponse.json({ success: true });
}
```

---

## Related Documentation

- **Complete API Reference:** [ERP-API-ENDPOINTS.md](../backend-planning/ERP-API-ENDPOINTS.md)
- **Authentication System:** [AUTHENTICATION.md](../backend-planning/AUTHENTICATION.md)
- **Database Schema:** [DATABASE-MODELS.md](../backend-planning/DATABASE-MODELS.md)
- **Developer Onboarding:** [developer-onboarding.md](developer-onboarding.md)

---

## Summary

MyPak Connect uses **Server Components** to fetch data directly from **MyPak ERP API** on each page load. This ensures always-fresh data while keeping ERP tokens secure on the server.

**Key Points:**
- ✅ Server Components fetch from ERP
- ✅ Client Components provide interactivity
- ✅ Transform ERP format → App format
- ✅ Comprehensive error handling
- 🚧 No caching yet (coming in Phase 2)
- 🚧 Inventory & recommendations still mock (coming in Phase 2)

**For Questions:** Check [ERP-API-ENDPOINTS.md](../backend-planning/ERP-API-ENDPOINTS.md) or ask the team.

---

Last Updated: November 12, 2024
