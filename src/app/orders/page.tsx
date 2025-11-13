import { fetchErpCurrentOrders, fetchErpCompletedOrders, fetchErpProducts } from '@/lib/erp/client';
import { transformErpOrder } from '@/lib/erp/transforms';
import { getRecommendations } from '@/lib/services/recommendations';
import { getInventoryData } from '@/lib/services/inventory';
import { getCurrentUser } from '@/lib/auth/jwt';
import { OrdersPageClient } from '@/components/orders/OrdersPageClient';
import type { Order, ContainerRecommendation } from '@/lib/types';
import { redirect } from 'next/navigation';

export default async function OrdersPage() {
  // Get current user
  const user = await getCurrentUser();

  if (!user || !user.orgId) {
    redirect('/sign-in');
  }

  // Fetch data from ERP API and database
  const [currentOrders, completedOrders, erpProducts, inventoryData] = await Promise.all([
    fetchErpCurrentOrders(),
    fetchErpCompletedOrders(),
    fetchErpProducts(),
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

  // Transform recommendations to UI format
  const containers: ContainerRecommendation[] = dbRecommendations.map((rec, index) => {
    const productInfoMap = new Map(
      erpProducts.map(p => [p.sku, { piecesPerPallet: p.piecesPerPallet, imageUrl: p.imageUrl }])
    );

    return {
      id: index + 1,
      containerNumber: rec.containerNumber,
      orderByDate: rec.orderByDate.toISOString().split('T')[0],
      deliveryDate: rec.deliveryDate.toISOString().split('T')[0],
      totalCartons: rec.totalCartons,
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
          imageUrl: productInfo?.imageUrl || undefined,
        };
      }),
    };
  });

  return (
    <OrdersPageClient
      containers={containers}
      liveOrders={liveOrders}
      completedOrders={completedOrdersTransformed}
    />
  );
}
