'use client';

import { useState } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from './StatusBadge';
import { InventoryChart } from './InventoryChart';
import type { Product, Order } from '@/lib/types';

interface ProductDetailModalProps {
  product: Product | null;
  liveOrders?: Order[];
  onClose: () => void;
}

export function ProductDetailModal({ product, liveOrders = [], onClose }: ProductDetailModalProps) {
  // Timeframe state
  const [selectedTimeframe, setSelectedTimeframe] = useState<'4w' | '6w' | '12w' | '6m' | '1y'>('6w');

  if (!product) return null;

  const showRunsOut = product.status === 'CRITICAL' || product.status === 'ORDER_NOW';

  // Chart heights based on timeframe
  const chartHeights: Record<typeof selectedTimeframe, number> = {
    '4w': 320,
    '6w': 400,
    '12w': 400,
    '6m': 480,
    '1y': 480,
  };

  // Filter live orders for this specific product
  const productLiveOrders = liveOrders
    .filter(order =>
      order.products && order.products.some(p => p.productId === product.id || p.productName === product.name)
    )
    .map(order => {
      const orderProduct = order.products.find(p => p.productId === product.id || p.productName === product.name);
      return {
        orderNumber: order.orderNumber,
        deliveryDate: order.deliveryDate,
        quantity: orderProduct?.recommendedQuantity || 0,
        shippingMethod: order.shippingMethod,
      };
    })
    .filter(o => o.quantity > 0);

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-start justify-between gap-4 z-10">
          <div className="flex-1">
            <div className="flex items-start gap-3 mb-2">
              <h2 className="text-2xl font-bold text-foreground flex-1">
                {product.name}
              </h2>
              <StatusBadge status={product.status} />
            </div>
            {product.sku && (
              <p className="text-xs text-muted-foreground font-mono mb-1">
                SKU: {product.sku}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              {product.size} - {product.packCount}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Extended Chart */}
          <div>
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                Stock Projection
              </h3>

              {/* Timeframe Controls */}
              <div className="inline-flex rounded-lg border border-border bg-muted/30 p-1">
                {(['4w', '6w', '12w', '6m', '1y'] as const).map((timeframe) => (
                  <button
                    key={timeframe}
                    onClick={() => setSelectedTimeframe(timeframe)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                      selectedTimeframe === timeframe
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {timeframe}
                  </button>
                ))}
              </div>
            </div>
            <div
              className="bg-muted rounded-lg border px-4 py-4 transition-all"
              style={{ height: `${chartHeights[selectedTimeframe]}px` }}
            >
              <InventoryChart
                product={product}
                liveOrders={liveOrders}
                timeframe={selectedTimeframe}
              />
            </div>
          </div>

          {/* Key Metrics */}
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">
              Key Metrics
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/50 rounded-lg border border-border px-4 py-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  Current Stock
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {product.currentPallets} pallets
                </p>
                <p className="text-sm text-muted-foreground">
                  {product.currentStock.toLocaleString()} cartons
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg border border-border px-4 py-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  Weekly Consumption
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {product.weeklyPallets} pallets
                </p>
                <p className="text-sm text-muted-foreground">
                  {product.weeklyConsumption.toLocaleString()} cartons/week
                </p>
              </div>

              {showRunsOut && (
                <div className="bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900/50 px-4 py-3">
                  <p className="text-xs text-red-800 dark:text-red-400 uppercase tracking-wider mb-1">
                    Runs Out
                  </p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {product.runsOutDate}
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-500">
                    {product.weeksRemaining.toFixed(1)} weeks remaining
                  </p>
                </div>
              )}

              <div className={`rounded-lg border px-4 py-3 ${
                showRunsOut
                  ? 'bg-muted/50 border-border'
                  : 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/50'
              }`}>
                <p className={`text-xs uppercase tracking-wider mb-1 ${
                  showRunsOut
                    ? 'text-muted-foreground'
                    : 'text-green-800 dark:text-green-400'
                }`}>
                  {showRunsOut ? 'Weeks Remaining' : 'Safe For'}
                </p>
                <p className={`text-2xl font-bold ${
                  showRunsOut
                    ? 'text-foreground'
                    : 'text-green-600 dark:text-green-500'
                }`}>
                  {product.weeksRemaining.toFixed(1)}{showRunsOut ? '' : '+'} weeks
                </p>
                <p className={`text-sm ${
                  showRunsOut
                    ? 'text-muted-foreground'
                    : 'text-green-700 dark:text-green-600'
                }`}>
                  Well stocked
                </p>
              </div>
            </div>
          </div>

          {/* Incoming Orders */}
          {productLiveOrders.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">
                Incoming Orders ({productLiveOrders.length})
              </h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {productLiveOrders.map((order) => (
                  <a
                    key={order.orderNumber}
                    href={`/orders?highlight=${order.orderNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group cursor-pointer rounded-lg border border-border transition-all hover:bg-muted/50 hover:border-foreground/20 block px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: Order details */}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-semibold text-foreground">
                            Order #{order.orderNumber}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">
                            {Math.round(order.quantity / 1000)} pallets
                          </span>
                          <span className="text-muted-foreground">
                            {' '}({order.quantity.toLocaleString()} cartons)
                          </span>
                          {order.shippingMethod && (
                            <>
                              {' • '}
                              <span>{order.shippingMethod}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Right: Date + icon */}
                      <div className="flex items-start gap-3">
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">
                            Arriving
                          </div>
                          <div className="text-sm font-medium text-foreground">
                            {order.deliveryDate}
                          </div>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors mt-0.5 flex-shrink-0" />
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 flex justify-end z-10">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
