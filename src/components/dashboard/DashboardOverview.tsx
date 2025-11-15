'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CompactStatusBar } from './CompactStatusBar';
import { RecommendedOrdersPanel } from './RecommendedOrdersPanel';
import { LiveOrdersPanel } from './LiveOrdersPanel';
import { OrderDetailsModal } from './OrderDetailsModal';
import type { Product, ContainerRecommendation, Order } from '@/lib/types';

interface DashboardOverviewProps {
  worstProduct: Product | null;
  containers: ContainerRecommendation[];
  products: Product[];
  liveOrders: Order[];
}

export function DashboardOverview({
  worstProduct,
  containers,
  products,
  liveOrders,
}: DashboardOverviewProps) {
  const router = useRouter();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Handle order click - navigate to review page
  const handleOrderClick = (containerId: number) => {
    router.push(`/orders/review/${containerId}`);
  };

  return (
    <div className="space-y-8">
      {/* Compact Status Bar */}
      <CompactStatusBar
        products={products}
        containers={containers}
        liveOrders={liveOrders}
      />

      {/* Two-Column Layout: Recommended Orders | Live Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recommended Orders (2/3 width) */}
        <div className="lg:col-span-2">
          <RecommendedOrdersPanel
            containers={containers}
            onOrderClick={handleOrderClick}
          />
        </div>

        {/* Live Orders (1/3 width) */}
        <div className="lg:col-span-1">
          <LiveOrdersPanel
            orders={liveOrders}
            onOrderClick={(order) => setSelectedOrder(order)}
          />
        </div>
      </div>

      {/* Order Details Modal */}
      <OrderDetailsModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </div>
  );
}
