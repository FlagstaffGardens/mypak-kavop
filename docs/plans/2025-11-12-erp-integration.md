# ERP API Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace mock data with live ERP API integration using Server Components pattern.

**Architecture:** Server Components fetch data directly from MyPak ERP API, passing data as props to Client Component islands for interactivity. Remove dev mode switcher entirely. Use stored `kavop_token` from organizations table for authentication.

**Tech Stack:** Next.js 16 Server Components, Drizzle ORM, MyPak ERP REST API, TypeScript, Zod validation

---

## Task 1: Create ERP Client Library

**Files:**
- Create: `src/lib/erp/client.ts`
- Create: `src/lib/erp/types.ts`
- Create: `src/lib/erp/transforms.ts`

**Step 1: Create ERP types matching API responses**

Create `src/lib/erp/types.ts`:

```typescript
// Raw ERP API Response Types (snake_case from API)

export interface ErpApiResponse<T> {
  status: number;
  message: string;
  success: boolean;
  redirect: string | null;
  error: string | null;
  response: T;
}

export interface ErpProduct {
  id: number;
  sku: string;
  name: string;
  packCount: number;
  piecesPerPallet: number;
  volumePerPallet: number;
  imageUrl: string | null;
}

export interface ErpOrderLine {
  sku: string;
  productName: string;
  qty: number;
}

export interface ErpOrder {
  id: number;
  orderNumber: string;
  orderedDate: string;
  status: "APPROVED" | "IN_TRANSIT" | "COMPLETE";
  shippingTerm: string;
  customerOrderNumber: string;
  comments: string;
  eta: string | null;
  requiredEta: string;
  lines: ErpOrderLine[];
}
```

**Step 2: Create ERP fetch client**

Create `src/lib/erp/client.ts`:

```typescript
import { getCurrentUser } from '@/lib/auth/jwt';
import { db } from '@/lib/db';
import { organizations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { ErpApiResponse, ErpProduct, ErpOrder } from './types';

const ERP_BASE_URL = 'http://www.mypak.cn:8088/api/kavop';

/**
 * Get organization's kavop_token for the current user
 */
async function getOrgToken(): Promise<string> {
  const user = await getCurrentUser();

  if (!user || !user.orgId) {
    throw new Error('User not authenticated or no organization');
  }

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.org_id, user.orgId));

  if (!org) {
    throw new Error('Organization not found');
  }

  return org.kavop_token;
}

/**
 * Fetch products from ERP API
 */
export async function fetchErpProducts(): Promise<ErpProduct[]> {
  const token = await getOrgToken();

  const response = await fetch(`${ERP_BASE_URL}/product/list`, {
    headers: {
      'Authorization': token,
    },
    cache: 'no-store', // Always fresh data for now
  });

  if (!response.ok) {
    throw new Error(`ERP API error: ${response.status} ${response.statusText}`);
  }

  const data: ErpApiResponse<ErpProduct[]> = await response.json();

  if (!data.success) {
    throw new Error(`ERP API error: ${data.error}`);
  }

  return data.response;
}

/**
 * Fetch current orders (APPROVED + IN_TRANSIT) from ERP API
 */
export async function fetchErpCurrentOrders(): Promise<ErpOrder[]> {
  const token = await getOrgToken();

  const response = await fetch(`${ERP_BASE_URL}/order/current`, {
    headers: {
      'Authorization': token,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`ERP API error: ${response.status} ${response.statusText}`);
  }

  const data: ErpApiResponse<ErpOrder[]> = await response.json();

  if (!data.success) {
    throw new Error(`ERP API error: ${data.error}`);
  }

  return data.response;
}

/**
 * Fetch completed orders from ERP API
 */
export async function fetchErpCompletedOrders(): Promise<ErpOrder[]> {
  const token = await getOrgToken();

  const response = await fetch(`${ERP_BASE_URL}/order/complete`, {
    headers: {
      'Authorization': token,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`ERP API error: ${response.status} ${response.statusText}`);
  }

  const data: ErpApiResponse<ErpOrder[]> = await response.json();

  if (!data.success) {
    throw new Error(`ERP API error: ${data.error}`);
  }

  return data.response;
}
```

**Step 3: Commit ERP client library**

```bash
git add src/lib/erp/
git commit -m "feat: add ERP API client library with fetch functions"
```

---

## Task 2: Create Data Transformation Layer

**Files:**
- Create: `src/lib/erp/transforms.ts`

**Step 1: Create product transformer**

Create `src/lib/erp/transforms.ts`:

```typescript
import { calculateStockoutDate } from '@/lib/calculations';
import type { Product, Order } from '@/lib/types';
import type { ErpProduct, ErpOrder } from './types';

/**
 * Transform ERP product to app Product type
 * Note: ERP doesn't provide inventory levels - we'll need to get those separately
 * For now, return products with placeholder inventory values
 */
export function transformErpProduct(erpProduct: ErpProduct): Omit<Product, 'currentStock' | 'weeklyConsumption' | 'targetStock' | 'runsOutDate' | 'runsOutDays' | 'weeksRemaining' | 'status' | 'currentPallets' | 'weeklyPallets'> {
  return {
    id: erpProduct.id,
    name: erpProduct.name,
    brand: extractBrand(erpProduct.name),
    type: extractType(erpProduct.name),
    size: extractSize(erpProduct.name),
    packCount: erpProduct.packCount.toString(),
    sku: erpProduct.sku,
    imageUrl: erpProduct.imageUrl || undefined,
    piecesPerPallet: erpProduct.piecesPerPallet,
  };
}

/**
 * Complete product with inventory data
 * This will be called after fetching inventory levels (future task)
 */
export function completeProductWithInventory(
  product: Omit<Product, 'currentStock' | 'weeklyConsumption' | 'targetStock' | 'runsOutDate' | 'runsOutDays' | 'weeksRemaining' | 'status' | 'currentPallets' | 'weeklyPallets'>,
  currentStock: number,
  weeklyConsumption: number,
  targetSOH: number = 6
): Product {
  const stockoutCalc = calculateStockoutDate(currentStock, weeklyConsumption, targetSOH);
  const targetStock = weeklyConsumption * 10; // 10 weeks buffer

  return {
    ...product,
    currentStock,
    weeklyConsumption,
    targetStock,
    targetSOH,
    runsOutDate: stockoutCalc.runsOutDate,
    runsOutDays: stockoutCalc.runsOutDays,
    weeksRemaining: stockoutCalc.weeksRemaining,
    status: stockoutCalc.status,
    currentPallets: Math.floor(currentStock / product.piecesPerPallet),
    weeklyPallets: Number((weeklyConsumption / product.piecesPerPallet).toFixed(2)),
  };
}

/**
 * Transform ERP order to app Order type
 */
export function transformErpOrder(erpOrder: ErpOrder): Order {
  const totalCartons = erpOrder.lines.reduce((sum, line) => sum + line.qty, 0);

  return {
    id: erpOrder.id.toString(),
    orderNumber: erpOrder.orderNumber,
    type: mapErpStatusToOrderType(erpOrder.status),
    orderedDate: erpOrder.orderedDate,
    deliveryDate: erpOrder.eta || erpOrder.requiredEta,
    totalCartons,
    productCount: erpOrder.lines.length,
    products: erpOrder.lines.map(line => ({
      productId: 0, // We don't have productId from ERP, will need to map by SKU
      productName: line.productName,
      currentStock: 0,
      weeklyConsumption: 0,
      recommendedQuantity: line.qty,
      afterDeliveryStock: 0,
      weeksSupply: 0,
      runsOutDate: '',
    })),
    status: mapErpStatusToOrderType(erpOrder.status),
    shippingTerm: erpOrder.shippingTerm as 'DDP' | 'FOB' | 'CIF',
    customerOrderNumber: erpOrder.customerOrderNumber || undefined,
    comments: erpOrder.comments || undefined,
    shippingMethod: undefined,
    urgency: erpOrder.status === 'APPROVED' ? 'URGENT' : null,
  };
}

// Helper functions

function extractBrand(name: string): string {
  // Extract brand from product name (e.g., "Woolworths" from "Woolworths Free Range...")
  const match = name.match(/^([A-Za-z\s]+)/);
  return match ? match[1].trim() : 'Unknown';
}

function extractType(name: string): string {
  // Extract type (Free Range, Cage Free, etc.)
  if (name.includes('Free Range')) return 'Free Range';
  if (name.includes('Cage Free')) return 'Cage Free';
  return 'Standard';
}

function extractSize(name: string): string {
  // Extract size (e.g., "600g", "12-Egg")
  const weightMatch = name.match(/(\d+g)/);
  const eggMatch = name.match(/(\d+-Egg)/);

  if (weightMatch) return weightMatch[1];
  if (eggMatch) return eggMatch[1];
  return 'Standard';
}

function mapErpStatusToOrderType(status: ErpOrder['status']): Order['type'] {
  switch (status) {
    case 'APPROVED':
    case 'IN_TRANSIT':
      return 'IN_TRANSIT';
    case 'COMPLETE':
      return 'DELIVERED';
    default:
      return 'IN_TRANSIT';
  }
}
```

**Step 2: Commit transformers**

```bash
git add src/lib/erp/transforms.ts
git commit -m "feat: add ERP data transformers for products and orders"
```

---

## Task 3: Create Mock Inventory Service (Temporary)

**Files:**
- Create: `src/lib/services/inventory.ts`

**Step 1: Create temporary inventory service**

Create `src/lib/services/inventory.ts`:

```typescript
/**
 * Temporary inventory service
 * TODO: Replace with real inventory tracking from ERP or separate inventory system
 *
 * For now, we'll use placeholder values based on product ID
 * This simulates inventory levels until we have real data
 */

interface InventoryData {
  currentStock: number;
  weeklyConsumption: number;
}

/**
 * Get inventory data for a product
 * TEMPORARY: Returns mock data based on product ID
 */
export function getInventoryForProduct(productId: number): InventoryData {
  // Generate consistent mock data based on product ID
  const seed = productId;

  // Random but consistent values
  const currentStock = 5000 + (seed % 50000);
  const weeklyConsumption = 500 + (seed % 3000);

  return {
    currentStock,
    weeklyConsumption,
  };
}

/**
 * Batch get inventory for multiple products
 */
export function getInventoryForProducts(productIds: number[]): Map<number, InventoryData> {
  const inventory = new Map<number, InventoryData>();

  for (const productId of productIds) {
    inventory.set(productId, getInventoryForProduct(productId));
  }

  return inventory;
}
```

**Step 2: Commit inventory service**

```bash
git add src/lib/services/inventory.ts
git commit -m "feat: add temporary inventory service with mock data"
```

---

## Task 4: Convert Dashboard to Server Component

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/components/dashboard/DashboardClient.tsx`

**Step 1: Create DashboardClient component**

Create `src/components/dashboard/DashboardClient.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/shared/ProductCard';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { InventoryEditTable } from '@/components/shared/InventoryEditTable';
import type { Product, ContainerRecommendation, Order } from '@/lib/types';

interface DashboardClientProps {
  initialProducts: Product[];
  containers: ContainerRecommendation[];
  liveOrders: Order[];
  lastUpdated: Date | null;
}

export function DashboardClient({
  initialProducts,
  containers,
  liveOrders,
  lastUpdated,
}: DashboardClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [showEditTable, setShowEditTable] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<Date | null>(lastUpdated);

  // Calculate worst product
  const worstProduct = products.length > 0
    ? products.reduce((worst, product) =>
        product.weeksRemaining < worst.weeksRemaining ? product : worst
      )
    : null;

  // Group products by status
  const criticalProducts = products.filter(p => p.status === 'CRITICAL');
  const orderNowProducts = products.filter(p => p.status === 'ORDER_NOW');
  const healthyProducts = products.filter(p => p.status === 'HEALTHY');

  // Handle inventory data save
  const handleSaveInventory = (updatedProducts: Product[]) => {
    const now = new Date();
    setProducts(updatedProducts);
    setLastUpdatedTime(now);
    setShowEditTable(false);

    // Save timestamp to localStorage
    localStorage.setItem('inventoryLastUpdated', now.toISOString());
  };

  // Format last updated timestamp
  const formatLastUpdated = (date: Date | null) => {
    if (!date) return 'Never';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'min' : 'mins'} ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;

    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Inventory Dashboard
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Monitor your egg carton inventory and receive order recommendations
          </p>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-2">
          <Button onClick={() => setShowEditTable(true)} size="lg" className="gap-2 w-full sm:w-auto">
            <Edit3 className="h-4 w-4" />
            <span className="hidden sm:inline">Update Inventory Data</span>
            <span className="sm:hidden">Update Inventory</span>
          </Button>
          <p className="text-xs text-muted-foreground">
            Last updated: <span className="font-medium">{formatLastUpdated(lastUpdatedTime)}</span>
          </p>
        </div>
      </div>

      {/* Dashboard Command Center */}
      <DashboardOverview
        worstProduct={worstProduct}
        containers={containers}
        products={products}
        liveOrders={liveOrders}
      />

      {/* Critical Products */}
      {criticalProducts.length > 0 && (
        <div>
          <h2 className="mb-4 text-sm font-semibold text-foreground/70 uppercase tracking-wider">
            Critical - Immediate Action Required
          </h2>
          <div className="grid gap-5 md:grid-cols-2">
            {criticalProducts.map((product) => (
              <div key={product.id} id={`product-${product.id}`}>
                <ProductCard product={product} liveOrders={liveOrders} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order Now Products */}
      {orderNowProducts.length > 0 && (
        <div>
          <h2 className="mb-4 text-sm font-semibold text-foreground/70 uppercase tracking-wider">
            Order Now - Running Low
          </h2>
          <div className="grid gap-5 md:grid-cols-2">
            {orderNowProducts.map((product) => (
              <div key={product.id} id={`product-${product.id}`}>
                <ProductCard product={product} liveOrders={liveOrders} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Healthy Products */}
      {healthyProducts.length > 0 && (
        <div className="mt-8">
          <div className="flex justify-between items-center p-4 px-6 bg-card border rounded mb-6">
            <h2 className="text-sm font-semibold text-green-600 dark:text-green-500 uppercase tracking-wider">
              ✓ {healthyProducts.length} HEALTHY PRODUCTS (16+ weeks supply)
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {healthyProducts.map((product) => (
              <div key={product.id} id={`product-${product.id}`}>
                <ProductCard product={product} liveOrders={liveOrders} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inventory Edit Table */}
      {showEditTable && (
        <InventoryEditTable
          products={products}
          onSave={handleSaveInventory}
          onCancel={() => setShowEditTable(false)}
        />
      )}
    </div>
  );
}
```

**Step 2: Convert page.tsx to Server Component**

Modify `src/app/page.tsx`:

```typescript
import { fetchErpProducts, fetchErpCurrentOrders } from '@/lib/erp/client';
import { transformErpProduct, transformErpOrder, completeProductWithInventory } from '@/lib/erp/transforms';
import { getInventoryForProducts } from '@/lib/services/inventory';
import { DashboardClient } from '@/components/dashboard/DashboardClient';
import { mockContainers } from '@/lib/data/mock-containers';
import type { Product } from '@/lib/types';

export default async function Dashboard() {
  // Fetch data from ERP API
  const erpProducts = await fetchErpProducts();
  const erpOrders = await fetchErpCurrentOrders();

  // Transform products
  const partialProducts = erpProducts.map(transformErpProduct);

  // Get inventory data (temporary mock)
  const productIds = partialProducts.map(p => p.id);
  const inventoryMap = getInventoryForProducts(productIds);

  // Complete products with inventory
  const products: Product[] = partialProducts.map(partial => {
    const inventory = inventoryMap.get(partial.id);
    if (!inventory) {
      throw new Error(`Missing inventory for product ${partial.id}`);
    }
    return completeProductWithInventory(
      partial,
      inventory.currentStock,
      inventory.weeklyConsumption
    );
  });

  // Transform orders
  const liveOrders = erpOrders.map(transformErpOrder);

  // TODO: Replace mock containers with calculated recommendations
  const containers = mockContainers;

  // Get last updated from localStorage (client-side only)
  const lastUpdated = null; // Will be hydrated on client

  return (
    <DashboardClient
      initialProducts={products}
      containers={containers}
      liveOrders={liveOrders}
      lastUpdated={lastUpdated}
    />
  );
}
```

**Step 3: Commit dashboard conversion**

```bash
git add src/app/page.tsx src/components/dashboard/DashboardClient.tsx
git commit -m "feat: convert dashboard to Server Component with ERP data"
```

---

## Task 5: Remove Dev Mode from Sidebar

**Files:**
- Modify: `src/components/shared/Sidebar.tsx`

**Step 1: Remove dev mode panel from Sidebar**

Read the current Sidebar.tsx, locate the dev mode panel (lines 160-217), and remove it entirely:

```typescript
// Remove this entire section:
{/* Dev Tools - Only show in development */}
{process.env.NODE_ENV === 'development' && (
  <div className="mt-auto border-t pt-4">
    {/* ... dev mode code ... */}
  </div>
)}
```

Keep the rest of the Sidebar intact (navigation links, logo, etc.).

**Step 2: Remove DemoState type and state config**

Remove these type definitions and config objects:

```typescript
type DemoState = 'healthy' | 'single_urgent' | 'multiple_urgent';

const STATE_CONFIG = {
  // ... remove entire config object
}
```

**Step 3: Commit sidebar cleanup**

```bash
git add src/components/shared/Sidebar.tsx
git commit -m "feat: remove dev mode switcher from sidebar"
```

---

## Task 6: Convert Orders Page to Server Component

**Files:**
- Modify: `src/app/orders/page.tsx`
- Create: `src/components/orders/OrdersPageClient.tsx`

**Step 1: Create OrdersPageClient component**

Create `src/components/orders/OrdersPageClient.tsx`:

```typescript
'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { RecommendedContainers } from '@/components/orders/RecommendedContainers';
import { OrdersEnRoute } from '@/components/orders/OrdersEnRoute';
import { OrderHistory } from '@/components/orders/OrderHistory';
import type { ContainerRecommendation, Order } from '@/lib/types';

interface OrdersPageClientProps {
  containers: ContainerRecommendation[];
  liveOrders: Order[];
  completedOrders: Order[];
}

function OrdersTabs({
  containers,
  liveOrders,
  completedOrders
}: OrdersPageClientProps) {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'recommended';

  return (
    <Tabs value={currentTab} className="w-full">
      <TabsList className="h-auto p-1 bg-muted">
        <Link href="/orders?tab=recommended" className="inline-block cursor-pointer">
          <TabsTrigger value="recommended" className="data-[state=active]:bg-background cursor-pointer">
            Recommended Orders
            {containers.length > 0 && (
              <span className="ml-2 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
                {containers.length}
              </span>
            )}
          </TabsTrigger>
        </Link>
        <Link href="/orders?tab=live" className="inline-block cursor-pointer">
          <TabsTrigger value="live" className="data-[state=active]:bg-background cursor-pointer">
            Live Orders
            {liveOrders.length > 0 && (
              <span className="ml-2 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
                {liveOrders.length}
              </span>
            )}
          </TabsTrigger>
        </Link>
        <Link href="/orders?tab=completed" className="inline-block cursor-pointer">
          <TabsTrigger value="completed" className="data-[state=active]:bg-background cursor-pointer">
            Completed Orders
          </TabsTrigger>
        </Link>
      </TabsList>

      <TabsContent value="recommended" className="mt-6">
        <RecommendedContainers />
      </TabsContent>

      <TabsContent value="live" className="mt-6">
        <OrdersEnRoute />
      </TabsContent>

      <TabsContent value="completed" className="mt-6">
        <OrderHistory />
      </TabsContent>
    </Tabs>
  );
}

export function OrdersPageClient(props: OrdersPageClientProps) {
  const firstContainerId = props.containers[0]?.id || null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Orders
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            View recommended containers, track shipments, and manage order history
          </p>
        </div>
        {firstContainerId && (
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href={`/orders/review/${firstContainerId}`}>
              + Create New Order
            </Link>
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Suspense fallback={<div className="h-64 flex items-center justify-center text-muted-foreground">Loading...</div>}>
        <OrdersTabs {...props} />
      </Suspense>
    </div>
  );
}
```

**Step 2: Convert orders page to Server Component**

Modify `src/app/orders/page.tsx`:

```typescript
import { fetchErpCurrentOrders, fetchErpCompletedOrders } from '@/lib/erp/client';
import { transformErpOrder } from '@/lib/erp/transforms';
import { mockContainers } from '@/lib/data/mock-containers';
import { OrdersPageClient } from '@/components/orders/OrdersPageClient';

export default async function OrdersPage() {
  // Fetch data from ERP API
  const [currentOrders, completedOrders] = await Promise.all([
    fetchErpCurrentOrders(),
    fetchErpCompletedOrders(),
  ]);

  // Transform orders
  const liveOrders = currentOrders.map(transformErpOrder);
  const completedOrdersTransformed = completedOrders.map(transformErpOrder);

  // TODO: Replace mock containers with calculated recommendations
  const containers = mockContainers;

  return (
    <OrdersPageClient
      containers={containers}
      liveOrders={liveOrders}
      completedOrders={completedOrdersTransformed}
    />
  );
}
```

**Step 3: Commit orders page conversion**

```bash
git add src/app/orders/page.tsx src/components/orders/OrdersPageClient.tsx
git commit -m "feat: convert orders page to Server Component with ERP data"
```

---

## Task 7: Update Mock Data References

**Files:**
- Modify: `src/components/orders/RecommendedContainers.tsx`
- Modify: `src/components/orders/OrdersEnRoute.tsx`
- Modify: `src/components/orders/OrderHistory.tsx`

**Step 1: Pass data via props to RecommendedContainers**

Currently `RecommendedContainers` loads from localStorage. Update to accept props:

```typescript
// src/components/orders/RecommendedContainers.tsx
// Change from loading localStorage to accepting props

interface RecommendedContainersProps {
  containers: ContainerRecommendation[];
}

export function RecommendedContainers({ containers }: RecommendedContainersProps) {
  // Remove useEffect and localStorage logic
  // Use containers prop directly

  // Rest of component stays the same
}
```

**Step 2: Update OrdersPageClient to pass props**

Update `OrdersPageClient` to pass data to child components:

```typescript
<TabsContent value="recommended" className="mt-6">
  <RecommendedContainers containers={props.containers} />
</TabsContent>

<TabsContent value="live" className="mt-6">
  <OrdersEnRoute orders={props.liveOrders} />
</TabsContent>

<TabsContent value="completed" className="mt-6">
  <OrderHistory orders={props.completedOrders} />
</TabsContent>
```

**Step 3: Update OrdersEnRoute and OrderHistory**

Similarly update these components to accept orders via props instead of loading mock data.

**Step 4: Commit data flow updates**

```bash
git add src/components/orders/
git commit -m "feat: update order components to use props instead of mock data"
```

---

## Task 8: Add Error Handling

**Files:**
- Create: `src/app/error.tsx`
- Create: `src/app/orders/error.tsx`

**Step 1: Create root error boundary**

Create `src/app/error.tsx`:

```typescript
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
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Something went wrong!</h2>
        <p className="mt-2 text-muted-foreground">
          {error.message || 'Failed to load data from ERP system'}
        </p>
      </div>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
```

**Step 2: Create orders error boundary**

Create `src/app/orders/error.tsx` with similar content.

**Step 3: Commit error boundaries**

```bash
git add src/app/error.tsx src/app/orders/error.tsx
git commit -m "feat: add error boundaries for ERP data fetching"
```

---

## Task 9: Add Loading States

**Files:**
- Create: `src/app/loading.tsx`
- Create: `src/app/orders/loading.tsx`

**Step 1: Create root loading state**

Create `src/app/loading.tsx`:

```typescript
export default function Loading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-20 bg-muted rounded" />
      <div className="h-64 bg-muted rounded" />
      <div className="grid gap-5 md:grid-cols-2">
        <div className="h-96 bg-muted rounded" />
        <div className="h-96 bg-muted rounded" />
      </div>
    </div>
  );
}
```

**Step 2: Create orders loading state**

Create `src/app/orders/loading.tsx` with similar skeleton.

**Step 3: Commit loading states**

```bash
git add src/app/loading.tsx src/app/orders/loading.tsx
git commit -m "feat: add loading states for async data fetching"
```

---

## Task 10: Update Documentation

**Files:**
- Modify: `CLAUDE.md`
- Create: `docs/guides/erp-integration.md`

**Step 1: Update CLAUDE.md**

Update the project overview section to reflect ERP integration:

```markdown
**Current Phase:** Production-ready with live ERP integration. Data fetched from MyPak ERP API.

## Data Flow

### Live Data (Production)
- Dashboard fetches products from MyPak ERP `/product/list`
- Orders page fetches from `/order/current` and `/order/complete`
- Server Components pattern: data fetched on server, passed to client islands
- Authentication: Uses stored `kavop_token` from organizations table

### Temporary Mock Data
- Inventory levels (currentStock, weeklyConsumption) - using placeholder values
- Container recommendations - TODO: implement recommendation algorithm

## State Management Pattern (REMOVED)
~~The dev-only state switcher has been removed.~~
```

**Step 2: Create ERP integration guide**

Create `docs/guides/erp-integration.md`:

```markdown
# ERP Integration Guide

## Overview

MyPak Connect integrates with MyPak ERP API to fetch live product and order data.

## Architecture

**Pattern:** Server Components with Client Islands

```
Server Component (page.tsx)
  ↓ Fetch from ERP API
  ↓ Transform data
  ↓ Pass as props
Client Component (interactive UI)
```

## Data Sources

### Live from ERP
- Products (`/api/kavop/product/list`)
- Current orders (`/api/kavop/order/current`)
- Completed orders (`/api/kavop/order/complete`)

### Temporary Mock Data
- Inventory levels (TODO: implement real inventory tracking)
- Container recommendations (TODO: implement algorithm)

## Authentication

Uses stored `kavop_token` from database:
1. User logs in → JWT cookie with `orgId`
2. Server Component calls ERP client
3. ERP client queries DB for org's `kavop_token`
4. Token sent in `Authorization` header to ERP API

## Error Handling

- Error boundaries catch fetch failures
- Loading states show during data fetch
- User-friendly error messages

## Future Enhancements

1. Implement real inventory tracking
2. Build recommendation algorithm
3. Add caching with Next.js 16 cache API
4. Add revalidation on demand
```

**Step 3: Commit documentation**

```bash
git add CLAUDE.md docs/guides/erp-integration.md
git commit -m "docs: update documentation for ERP integration"
```

---

## Task 11: Clean Up Old Mock Files (Optional)

**Files:**
- Review: `src/lib/data/mock-scenarios.ts`
- Consider deprecating dev-only mock data

**Step 1: Add deprecation notice to mock-scenarios.ts**

Add comment at top of file:

```typescript
/**
 * @deprecated Dev mode state switcher has been removed
 * This file is kept for reference only
 * Real data now comes from ERP API
 */
```

**Step 2: Commit cleanup**

```bash
git add src/lib/data/mock-scenarios.ts
git commit -m "chore: mark mock scenarios as deprecated"
```

---

## Testing Checklist

After implementation, verify:

- [ ] Dashboard loads products from ERP API
- [ ] Orders page shows live orders from ERP
- [ ] Authentication works (org's kavop_token is used)
- [ ] Error boundaries catch API failures gracefully
- [ ] Loading states show during data fetch
- [ ] No references to localStorage demo state remain
- [ ] Dev mode panel removed from sidebar
- [ ] Product cards display correctly with ERP data
- [ ] Order cards show live order data
- [ ] Inventory edit modal still works (updates local state)

---

## Known Limitations & TODOs

1. **Inventory Data:** Currently using mock inventory values. Need to implement real inventory tracking.
2. **Container Recommendations:** Still using mock data. Need to implement recommendation algorithm.
3. **Caching:** No caching yet - every page load fetches from ERP. Add Next.js cache() later.
4. **Product Mapping:** ERP orders don't include productId - need SKU-based mapping.
5. **Approved Orders:** Need to map to Product.approvedOrders array for display in ProductCard.

---

## Next Steps After This Plan

1. Implement real inventory tracking system
2. Build container recommendation algorithm
3. Add caching with revalidation
4. Map ERP orders to product approved orders
5. Add order submission endpoint integration
