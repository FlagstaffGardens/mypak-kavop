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
