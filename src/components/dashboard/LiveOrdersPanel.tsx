'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Ship, CheckCircle2, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Order } from '@/lib/types';

interface LiveOrdersPanelProps {
  orders: Order[];
  onOrderClick?: (order: Order) => void;
}

export function LiveOrdersPanel({ orders = [], onOrderClick }: LiveOrdersPanelProps) {
  // Limit display on dashboard
  const DASHBOARD_LIMIT = 3;
  const displayedOrders = orders.slice(0, DASHBOARD_LIMIT);
  const hasMore = orders.length > DASHBOARD_LIMIT;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground uppercase tracking-wide">
          Live Orders
        </h2>
        {orders.length > 0 && (
          <span className="text-sm text-muted-foreground">
            {orders.length} en route
          </span>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto max-h-[500px]">
        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="border border-border rounded-lg bg-muted/30 px-8 py-12 text-center">
            <p className="text-base font-medium text-muted-foreground mb-2">
              No orders in transit
            </p>
            <p className="text-sm text-muted-foreground">
              Your next order will appear here once approved
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onClick={() => onOrderClick?.(order)}
              />
            ))}
          </div>
        )}
      </div>

      {/* View All Footer */}
      {hasMore && (
        <div className="mt-4 pt-4 border-t border-border">
          <Link href="/orders" className="cursor-pointer">
            <Button variant="outline" className="w-full group">
              View All {orders.length} Live Orders
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

// Order card component
function OrderCard({ order, onClick }: { order: Order; onClick?: () => void }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusBadge = () => {
    if (order.status === 'IN_TRANSIT') {
      return { variant: 'default' as const, text: 'IN TRANSIT', icon: Ship };
    }
    if (order.status === 'DELIVERED') {
      return { variant: 'secondary' as const, text: 'DELIVERED', icon: CheckCircle2 };
    }
    return { variant: 'outline' as const, text: order.status, icon: Ship };
  };

  const badge = getStatusBadge();
  const StatusIcon = badge.icon;
  const totalPallets = Math.round(order.totalCartons / 1000);

  return (
    <div
      className="rounded-md bg-card border border-border transition-all hover:shadow-md cursor-pointer"
      onClick={onClick}
    >
      <div className="px-4 py-3">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <StatusIcon className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-base font-semibold text-foreground">
              {order.orderNumber}
            </h3>
          </div>
          <Badge variant={badge.variant} className="text-xs">
            {badge.text}
          </Badge>
        </div>

        {/* Summary */}
        <div className="text-sm mb-2">
          <span className="font-medium text-foreground">{totalPallets} pallets</span>
          <span className="text-muted-foreground font-normal ml-1">
            ({order.totalCartons.toLocaleString()} cartons)
          </span>
          <span className="text-muted-foreground mx-1.5">•</span>
          <span className="text-muted-foreground font-normal">
            {order.productCount} {order.productCount === 1 ? 'product' : 'products'}
          </span>
        </div>

        {/* Details */}
        <div className="flex gap-3 text-xs text-muted-foreground mb-3">
          <div>
            <span className="font-medium">Arriving:</span> {order.deliveryDate}
          </div>
          {order.shippingTerm && (
            <>
              <span>•</span>
              <div>{order.shippingTerm}</div>
            </>
          )}
          {order.shippingMethod && (
            <>
              <span>•</span>
              <div>{order.shippingMethod}</div>
            </>
          )}
        </div>

        {/* Product List (Expandable) */}
        {isExpanded && order.products && order.products.length > 0 && (
          <div className="mb-3 px-3 py-2 bg-muted/50 rounded border border-border space-y-1.5">
            {order.products.map((product) => (
              <div key={product.productId} className="flex items-center justify-between text-sm">
                <span className="text-foreground font-medium truncate flex-1 mr-4">
                  {product.productName.slice(0, 40)}{product.productName.length > 40 ? '...' : ''}
                </span>
                <span className="text-muted-foreground flex-shrink-0">
                  {Math.round(product.recommendedQuantity / 1000)} pallets
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Expand/Collapse */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="text-xs text-blue-600 dark:text-blue-500 hover:underline font-medium flex items-center gap-1 cursor-pointer"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-3 h-3" />
              Hide Products
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" />
              Show Products
            </>
          )}
        </button>
      </div>
    </div>
  );
}
