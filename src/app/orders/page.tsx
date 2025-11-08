'use client';

import { RecommendedContainers } from '@/components/orders/RecommendedContainers';
import { OrdersEnRoute } from '@/components/orders/OrdersEnRoute';
import { OrderHistory } from '@/components/orders/OrderHistory';

export default function OrdersPage() {
  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Orders
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          View recommended containers, track shipments, and manage order history
        </p>
      </div>

      {/* Recommended Containers Section */}
      <RecommendedContainers />

      {/* Orders En Route Section */}
      <OrdersEnRoute />

      {/* Order History Section */}
      <OrderHistory />
    </div>
  );
}
