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
