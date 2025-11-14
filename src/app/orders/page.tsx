import { getCachedErpCurrentOrders, getCachedErpCompletedOrders, getCachedErpProducts } from '@/lib/erp/client';
import { transformErpOrder } from '@/lib/erp/transforms';
import { getRecommendations } from '@/lib/services/recommendations';
import { getInventoryData } from '@/lib/services/inventory';
import { getCurrentUser } from '@/lib/auth/jwt';
import { OrdersPageClient } from '@/components/orders/OrdersPageClient';
import type { Order, ContainerRecommendation } from '@/lib/types';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { organizations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  // Get current user
  const user = await getCurrentUser();

  if (!user || !user.orgId) {
    redirect('/sign-in');
  }

  // Fetch data from ERP API and database
  // Fetch org row for versioning
  const [org] = await db.select().from(organizations).where(eq(organizations.org_id, user.orgId)).limit(1);
  const version = (org?.last_inventory_update?.toISOString?.() ?? '0') as string;

  const [currentOrders, completedOrders, erpProducts, inventoryData] = await Promise.all([
    getCachedErpCurrentOrders(user.orgId, version),
    getCachedErpCompletedOrders(user.orgId, version),
    getCachedErpProducts(user.orgId, version),
    getInventoryData(user.orgId),
  ]);

  // Create SKU to product info lookup map
  const skuToProductInfo = new Map(
    erpProducts.map(p => [p.sku, { piecesPerPallet: p.piecesPerPallet, imageUrl: p.imageUrl }])
  );

  // Helper to enrich order with product info
  const enrichOrder = (order: Order): Order => ({
    ...order,
    products: order.products.map(product => {
      const productInfo = product.sku ? skuToProductInfo.get(product.sku) : undefined;
      return {
        ...product,
        piecesPerPallet: productInfo?.piecesPerPallet || 5000, // Default if product info not found
        imageUrl: productInfo?.imageUrl || undefined,
      };
    }),
  });

  // Transform and enrich orders
  const liveOrders = currentOrders.map(transformErpOrder).map(enrichOrder);
  const completedOrdersTransformed = completedOrders.map(transformErpOrder).map(enrichOrder);

  // Fetch recommendations from database
  const dbRecommendations = await getRecommendations(user.orgId);

  // Create inventory map for product data lookups
  const inventoryMap = new Map(
    inventoryData.map(inv => [inv.sku, inv])
  );

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

  // Resolve initial tab/highlight from URL for correct first paint
  const sp = await searchParams;
  const tabParamRaw = sp?.tab;
  const highlightParamRaw = sp?.highlight;
  const tabParam = Array.isArray(tabParamRaw) ? tabParamRaw[0] : tabParamRaw;
  const highlightParam = Array.isArray(highlightParamRaw) ? highlightParamRaw[0] : highlightParamRaw;
  const initialTab = (highlightParam ? 'live' : (tabParam === 'live' || tabParam === 'completed' ? tabParam : 'recommended')) as 'recommended' | 'live' | 'completed';

  return (
    <OrdersPageClient
      containers={containers}
      liveOrders={liveOrders}
      completedOrders={completedOrdersTransformed}
      initialTab={initialTab}
      initialHighlight={highlightParam || null}
    />
  );
}
