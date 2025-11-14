'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Ship, Package, Factory } from 'lucide-react';
import { OrderDetailsModal } from './OrderDetailsModal';
import type { Order } from '@/lib/types';

interface OrdersEnRouteProps {
  orders: Order[];
  highlightOrderNumber?: string | null;
}

export function OrdersEnRoute({ orders, highlightOrderNumber }: OrdersEnRouteProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const orderRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const INITIAL_COUNT = 20;
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);

  // Handle highlighting and auto-opening modal
  useEffect(() => {
    if (highlightOrderNumber) {
      const inTransitOrders = orders.filter(order => order.type === 'IN_TRANSIT');
      const index = inTransitOrders.findIndex(
        order => order.orderNumber === highlightOrderNumber
      );
      if (index >= 0) {
        // Ensure highlighted item is visible
        setVisibleCount((count) => Math.max(count, index + 1));
        const orderToHighlight = inTransitOrders[index];
        // Open the modal
        setSelectedOrder(orderToHighlight);

        // Scroll to the order on next animation frame (faster than setTimeout)
        requestAnimationFrame(() => {
          const orderElement = orderRefs.current.get(highlightOrderNumber);
          if (orderElement) {
            orderElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        });
      }
    }
  }, [highlightOrderNumber, orders]);

  // Get only in-transit orders (includes both APPROVED and IN_TRANSIT from ERP)
  const inTransitOrders = orders.filter(order => order.type === 'IN_TRANSIT');
  const visibleOrders = inTransitOrders.slice(0, visibleCount);

  // Status icon mapping
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Factory className="flex-shrink-0 w-5 h-5 text-amber-600 dark:text-amber-500" />;
      case 'IN_TRANSIT':
        return <Ship className="flex-shrink-0 w-5 h-5 text-blue-600 dark:text-blue-500" />;
      case 'COMPLETE':
        return <Package className="flex-shrink-0 w-5 h-5 text-green-600 dark:text-green-500" />;
      default:
        return <Package className="flex-shrink-0 w-5 h-5 text-gray-500 dark:text-gray-400" />;
    }
  };

  const getStatusLabel = (status: string) => {
    // Format the status for display
    return status
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getStatusBadgeClasses = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200';
      case 'IN_TRANSIT':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-200';
      case 'COMPLETE':
        return 'bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-900 dark:text-gray-200';
    }
  };

  if (inTransitOrders.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Ship className="h-12 w-12 mx-auto mb-4 opacity-20" />
        <p>No live orders currently in transit</p>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-4">
        {visibleOrders.map((order) => (
          <div
            key={order.id}
            ref={(el) => {
              if (el) {
                orderRefs.current.set(order.orderNumber, el);
              } else {
                orderRefs.current.delete(order.orderNumber);
              }
            }}
            className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded overflow-hidden hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-md transition-all"
          >
            <div className="px-6 py-5">
              {/* Order Header */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-start gap-3">
                  {getStatusIcon(order.erpStatus || order.status)}
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-bold text-gray-900 dark:text-gray-50">
                        Order #{order.orderNumber}
                      </h3>
                      <span className={`px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider rounded ${getStatusBadgeClasses(order.erpStatus || order.status)}`}>
                        {getStatusLabel(order.erpStatus || order.status)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {order.productCount} {order.productCount === 1 ? 'product' : 'products'} • {order.totalCartons.toLocaleString()} cartons
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Details */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Ordered
                    </p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-50 mt-1">
                      {order.orderedDate}
                    </p>
                  </div>
                  <div className="hidden sm:block h-10 w-px bg-gray-200 dark:bg-gray-700" />
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Expected Arrival
                    </p>
                    <p className="text-sm font-bold text-blue-600 dark:text-blue-500 mt-1">
                      {order.deliveryDate}
                    </p>
                  </div>
                  {order.shippingMethod && (
                    <>
                      <div className="hidden sm:block h-10 w-px bg-gray-200 dark:bg-gray-700" />
                      <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Shipping
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-50 mt-1">
                          {order.shippingMethod}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedOrder(order)}
                  className="w-full sm:w-auto"
                >
                  View Details
                </Button>
              </div>
            </div>
          </div>
        ))}
        {visibleCount < inTransitOrders.length && (
          <div className="flex justify-center mt-4">
            <Button variant="outline" onClick={() => setVisibleCount((c) => c + INITIAL_COUNT)}>
              Show more ({inTransitOrders.length - visibleCount} more)
            </Button>
          </div>
        )}
    </div>

    <OrderDetailsModal
      order={selectedOrder}
      open={selectedOrder !== null}
      onOpenChange={(open) => !open && setSelectedOrder(null)}
    />
    </>
  );
}
