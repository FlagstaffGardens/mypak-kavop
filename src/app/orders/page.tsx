import { fetchErpCurrentOrders, fetchErpCompletedOrders, fetchErpProducts } from '@/lib/erp/client';
import { transformErpOrder } from '@/lib/erp/transforms';
import { mockContainers } from '@/lib/data/mock-containers';
import { OrdersPageClient } from '@/components/orders/OrdersPageClient';
import type { Order } from '@/lib/types';

export default async function OrdersPage() {
  // Fetch data from ERP API
  const [currentOrders, completedOrders, erpProducts] = await Promise.all([
    fetchErpCurrentOrders(),
    fetchErpCompletedOrders(),
    fetchErpProducts(),
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
        piecesPerPallet: productInfo?.piecesPerPallet,
        imageUrl: productInfo?.imageUrl || undefined,
      };
    }),
  });

  // Transform and enrich orders
  const liveOrders = currentOrders.map(transformErpOrder).map(enrichOrder);
  const completedOrdersTransformed = completedOrders.map(transformErpOrder).map(enrichOrder);

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
