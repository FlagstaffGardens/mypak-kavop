import { redirect } from 'next/navigation';
import { getCachedErpProducts, getCachedErpCurrentOrders } from '@/lib/erp/client';
import { transformErpProduct, transformErpOrder, completeProductWithInventory } from '@/lib/erp/transforms';
import { getInventoryData } from '@/lib/services/inventory';
import { getRecommendations } from '@/lib/services/recommendations';
import { DashboardClient } from '@/components/dashboard/DashboardClient';
import { DEFAULT_TARGET_SOH } from '@/lib/constants';
import type { Product, ContainerRecommendation } from '@/lib/types';
import { db } from '@/lib/db';
import { organizations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getCurrentOrgId } from "@/lib/utils/get-org";

export default async function Dashboard() {
  // Get current user
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;
  const orgId = await getCurrentOrgId();

  if (!user || !orgId) {
    redirect('/sign-in');
  }

  // Fetch data from ERP API and database
  const [inventoryRows, org] = await Promise.all([
    getInventoryData(orgId),
    db.select().from(organizations).where(eq(organizations.org_id, orgId)).limit(1),
  ]);

  // Use last inventory update as version to bust cache per org on save
  const version = (org[0]?.last_inventory_update?.toISOString?.() ?? '0') as string;

  // Fetch ERP data with per-org versioned cache
  const [erpProducts, erpOrders] = await Promise.all([
    getCachedErpProducts(orgId, version),
    getCachedErpCurrentOrders(orgId, version),
  ]);

  // Get last updated timestamp from organization
  const lastUpdated = org[0]?.last_inventory_update || null;

  // Check first visit (no inventory data)
  const isFirstVisit = inventoryRows.length === 0;

  // Detect new products (in ERP but not in DB)
  const dbSkus = new Set(inventoryRows.map(row => row.sku));
  const newProducts = erpProducts.filter(p => !dbSkus.has(p.sku));

  // Transform products
  const partialProducts = erpProducts.map(transformErpProduct);

  // Create inventory map by SKU
  const inventoryMap = new Map(
    inventoryRows.map(row => [row.sku, row])
  );

  // Complete products with inventory
  const products: Product[] = partialProducts.map(partial => {
    const inventory = inventoryMap.get(partial.sku);

    if (!inventory) {
      // Product not configured yet - return placeholder
      return {
        ...partial,
        currentStock: 0,
        weeklyConsumption: 0,
        targetStock: 0,
        targetSOH: DEFAULT_TARGET_SOH,
        runsOutDate: 'Not configured',
        runsOutDays: 0,
        weeksRemaining: 0,
        status: 'CRITICAL' as const,
        currentPallets: 0,
        weeklyPallets: 0,
      };
    }

    // Complete with real inventory data
    return completeProductWithInventory(
      partial,
      inventory.current_stock,
      inventory.weekly_consumption,
      inventory.target_soh
    );
  });

  // Transform orders
  const liveOrders = erpOrders.map(transformErpOrder);

  // Fetch recommendations from database
  const dbRecommendations = await getRecommendations(orgId);

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

  return (
    <DashboardClient
      initialProducts={products}
      containers={containers}
      liveOrders={liveOrders}
      lastUpdated={lastUpdated}
      isFirstVisit={isFirstVisit}
      newProductCount={newProducts.length}
    />
  );
}
