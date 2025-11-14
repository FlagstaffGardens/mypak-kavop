'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Search } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { OrderDetailsModal } from './OrderDetailsModal';
import type { Order } from '@/lib/types';

type StatusFilter = 'all' | 'delivered';
type TimeFilter = '3months' | '6months' | '12months' | 'all';

interface OrderHistoryProps {
  orders: Order[];
}

export function OrderHistory({ orders }: OrderHistoryProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('12months');
  const [searchQuery, setSearchQuery] = useState('');
  const INITIAL_COUNT = 20;
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);

  // Get delivered orders
  const deliveredOrders = useMemo(() => orders.filter(order => order.type === 'DELIVERED'), [orders]);

  // Apply filters
  const filteredOrders = useMemo(() => deliveredOrders.filter(order => {
    // Status filter
    if (statusFilter === 'delivered' && order.status !== 'DELIVERED') return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        order.orderNumber.toLowerCase().includes(query) ||
        order.products.some(p => p.productName.toLowerCase().includes(query))
      );
    }

    return true;
  }), [deliveredOrders, statusFilter, searchQuery]);

  // Reset visible count when filters change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisibleCount(INITIAL_COUNT);
  }, [statusFilter, searchQuery, timeFilter]);

  const visibleOrders = filteredOrders.slice(0, visibleCount);

  if (deliveredOrders.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
        <p>No completed orders yet</p>
      </div>
    );
  }

  return (
    <>
    <div>
      {/* Filters Row */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="All Orders" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
            </SelectContent>
          </Select>

          {/* Time Range Filter */}
          <Select value={timeFilter} onValueChange={(value) => setTimeFilter(value as TimeFilter)}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Last 12 months" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">Last 3 months</SelectItem>
              <SelectItem value="6months">Last 6 months</SelectItem>
              <SelectItem value="12months">Last 12 months</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>

          {/* Search */}
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders or products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-50 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Order Cards */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded px-6 py-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">No orders found matching your filters</p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded overflow-hidden hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-md transition-all"
            >
              <div className="px-6 py-5">
                {/* Order Header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="flex-shrink-0 w-5 h-5 text-green-600 dark:text-green-500 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-base font-bold text-gray-900 dark:text-gray-50">
                          Order #{order.orderNumber}
                        </h3>
                        <span className="px-2.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-200 text-xs font-bold uppercase tracking-wider rounded">
                          Delivered
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
                        Delivered
                      </p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-50 mt-1">
                        {order.deliveryDate}
                      </p>
                    </div>
                    {order.shippingTerm && (
                      <>
                        <div className="hidden sm:block h-10 w-px bg-gray-200 dark:bg-gray-700" />
                        <div>
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Terms
                          </p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-50 mt-1">
                            {order.shippingTerm}
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
          {visibleCount < filteredOrders.length && (
            <div className="flex justify-center mt-4">
              <Button variant="outline" onClick={() => setVisibleCount((c) => c + INITIAL_COUNT)}>
                Show more ({filteredOrders.length - visibleCount} more)
              </Button>
            </div>
          )}
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
