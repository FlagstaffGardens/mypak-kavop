'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StatusMetricsBar } from './StatusMetricsBar';
import { RecommendedOrdersPanel } from './RecommendedOrdersPanel';
import { LiveOrdersPanel } from './LiveOrdersPanel';
import { TargetSOHSlider } from '../shared/TargetSOHSlider';
import { OrderDetailsModal } from './OrderDetailsModal';
import type { Product, ContainerRecommendation, Order } from '@/lib/types';

interface DashboardOverviewProps {
  worstProduct: Product | null;
  targetSOH: number;
  containers: ContainerRecommendation[];
  products: Product[];
  liveOrders: Order[];
  onTargetSOHChange: (value: number) => void;
}

export function DashboardOverview({
  worstProduct,
  targetSOH,
  containers,
  products,
  liveOrders,
  onTargetSOHChange,
}: DashboardOverviewProps) {
  const router = useRouter();
  const [showTargetEditor, setShowTargetEditor] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Calculate metrics
  const urgentContainers = containers.filter(c => c.urgency === 'URGENT');
  const nextContainer = containers[0];
  const nextOrderByDate = nextContainer?.orderByDate || null;

  // Handle worst product click - scroll to product
  const handleWorstProductClick = () => {
    if (!worstProduct) return;
    const productElement = document.getElementById(`product-${worstProduct.id}`);
    if (productElement) {
      productElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      productElement.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
      setTimeout(() => {
        productElement.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
      }, 2000);
    }
  };

  // Handle order click - navigate to review page
  const handleOrderClick = (containerId: number) => {
    router.push(`/orders/review/${containerId}`);
  };

  return (
    <div className="space-y-8">
      {/* Status Metrics Bar */}
      <StatusMetricsBar
        worstProduct={worstProduct}
        targetSOH={targetSOH}
        urgentCount={urgentContainers.length}
        nextOrderByDate={nextOrderByDate}
        onTargetSOHClick={() => setShowTargetEditor(true)}
        onWorstProductClick={handleWorstProductClick}
      />

      {/* Target SOH Editor (Modal) */}
      {showTargetEditor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowTargetEditor(false)}>
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-6">Adjust Target Stock Level</h3>
            <TargetSOHSlider
              initialValue={targetSOH}
              onChange={(value) => {
                onTargetSOHChange(value);
                setShowTargetEditor(false);
              }}
              onCancel={() => setShowTargetEditor(false)}
            />
          </div>
        </div>
      )}

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
