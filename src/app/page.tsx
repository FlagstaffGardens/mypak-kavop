import { redirect } from 'next/navigation';
import { fetchErpProducts, fetchErpCurrentOrders } from '@/lib/erp/client';
import { transformErpProduct, transformErpOrder, completeProductWithInventory } from '@/lib/erp/transforms';
import { getInventoryData } from '@/lib/services/inventory';
import { getCurrentUser } from '@/lib/auth/jwt';
import { DashboardClient } from '@/components/dashboard/DashboardClient';
import { mockContainers } from '@/lib/data/mock-containers';
import { DEFAULT_TARGET_SOH } from '@/lib/constants';
import type { Product } from '@/lib/types';

export default async function Dashboard() {
  // Get current user
  const user = await getCurrentUser();

  if (!user || !user.orgId) {
    redirect('/sign-in');
  }

  // Fetch data from ERP API
  const erpProducts = await fetchErpProducts();
  const erpOrders = await fetchErpCurrentOrders();

  // Fetch inventory from database
  const inventoryRows = await getInventoryData(user.orgId);

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
      isFirstVisit={isFirstVisit}
      newProductCount={newProducts.length}
    />
  );
}
