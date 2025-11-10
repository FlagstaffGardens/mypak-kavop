'use client';

import { mockOrders } from '@/lib/data/mock-containers';
import { Button } from '@/components/ui/button';
import { Ship, Package, Clock } from 'lucide-react';

export function OrdersEnRoute() {
  // Get only in-transit orders
  const inTransitOrders = mockOrders.filter(order => order.type === 'IN_TRANSIT');

  // Status icon mapping
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'IN_TRANSIT':
        return <Ship className="flex-shrink-0 w-5 h-5 text-blue-600 dark:text-blue-500" />;
      default:
        return <Package className="flex-shrink-0 w-5 h-5 text-gray-500 dark:text-gray-400" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'IN_TRANSIT':
        return 'In Transit';
      default:
        return status;
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
    <div className="space-y-4">
        {inTransitOrders.map((order) => (
          <div
            key={order.id}
            className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded overflow-hidden hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-md transition-all"
          >
            <div className="px-6 py-5">
              {/* Order Header */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-start gap-3">
                  {getStatusIcon(order.status)}
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-bold text-gray-900 dark:text-gray-50">
                        Order #{order.orderNumber}
                      </h3>
                      <span className="px-2.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-200 text-xs font-bold uppercase tracking-wider rounded">
                        {getStatusLabel(order.status)}
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
                  disabled
                  className="cursor-not-allowed w-full sm:w-auto"
                >
                  View Details
                </Button>
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}
