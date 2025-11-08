'use client';

import { useState } from 'react';
import { Info, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from './StatusBadge';
import { InventoryChart } from './InventoryChart';
import { ProductDetailModal } from './ProductDetailModal';
import type { Product, Order } from '@/lib/types';

interface ProductCardProps {
  product: Product;
  liveOrders?: Order[];
}

export function ProductCard({ product, liveOrders = [] }: ProductCardProps) {
  const [showModal, setShowModal] = useState(false);
  const showRunsOut = product.status === 'CRITICAL' || product.status === 'ORDER_NOW';

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
      };
    })
    .filter(o => o.quantity > 0);

  return (
    <>
      <Card className="transition-all hover:shadow-lg h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1">
            <CardTitle className="font-bold text-sm leading-snug">
              {product.name}
            </CardTitle>
            {product.sku && (
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-muted-foreground font-mono">
                  {product.sku}
                </p>
                {product.imageUrl && (
                  <div className="relative group">
                    <Info className="h-4 w-4 text-blue-500 hover:text-blue-600 cursor-help transition-colors flex-shrink-0" />
                    {/* Tooltip with product image */}
                    <div className="absolute left-0 top-6 z-50 hidden group-hover:block">
                      <div className="bg-card border-2 border-border rounded-lg shadow-xl overflow-hidden">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-48 h-48 object-cover"
                        />
                        <div className="px-3 py-2 bg-muted border-t">
                          <p className="text-xs font-semibold">{product.name}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <StatusBadge status={product.status} />
        </div>
      </CardHeader>

      <CardContent className="pt-0 flex-1 flex flex-col">
        {/* Chart */}
        <div className="h-[160px] bg-muted rounded border px-2 py-3 mb-5">
          <InventoryChart product={product} liveOrders={liveOrders} />
        </div>

        {/* Info Section */}
        <div className="space-y-2.5 text-sm mb-5">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground font-medium">Current Stock:</span>
            <span className="font-semibold text-foreground">
              {product.currentPallets} pallets
              <span className="text-muted-foreground font-normal ml-1.5">
                ({product.currentStock.toLocaleString()} cartons)
              </span>
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground font-medium">Weekly Consumption:</span>
            <span className="font-semibold text-foreground">
              {product.weeklyPallets} pallets
              <span className="text-muted-foreground font-normal ml-1.5">
                ({product.weeklyConsumption.toLocaleString()} cartons)
              </span>
            </span>
          </div>

          {/* Highlighted Runs Out Row - only for urgent products */}
          {showRunsOut && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-md p-2.5 px-3 my-1">
              <div className="flex justify-between items-center">
                <span className="text-red-800 dark:text-red-400 font-semibold">Runs Out:</span>
                <span className="text-red-600 dark:text-red-400 font-bold text-base">
                  {product.runsOutDate}
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground font-medium">
              {showRunsOut ? 'Weeks Remaining:' : 'Safe for:'}
            </span>
            <span className={`font-semibold ${showRunsOut ? 'text-foreground' : 'text-green-600 dark:text-green-500'}`}>
              {product.weeksRemaining.toFixed(1)}{showRunsOut ? ' weeks' : '+ weeks'}
            </span>
          </div>
        </div>

        {/* Live Orders */}
        {productLiveOrders.length > 0 && (
          <div className="pt-3 border-t-2 mt-auto">
            <p className="text-muted-foreground font-medium text-sm mb-1.5">
              Incoming Orders:
            </p>
            {productLiveOrders.map((order) => (
              <p key={order.orderNumber} className="text-foreground/70 text-xs mt-1">
                • Order #{order.orderNumber}: {Math.round(order.quantity / 1000)} pallets ({order.quantity.toLocaleString()} cartons) → {order.deliveryDate}
              </p>
            ))}
          </div>
        )}

        {/* View Details Button */}
        <div className={`${productLiveOrders.length > 0 ? 'mt-4' : 'mt-auto pt-3 border-t-2'}`}>
          <Button
            variant="outline"
            className="w-full justify-center gap-2"
            onClick={() => setShowModal(true)}
          >
            View Full Details
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>

      <ProductDetailModal
        product={showModal ? product : null}
        liveOrders={liveOrders}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
