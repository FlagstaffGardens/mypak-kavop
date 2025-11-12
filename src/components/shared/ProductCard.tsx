'use client';

import { useState } from 'react';
import { Info, ChevronRight, X } from 'lucide-react';
import { parse, addWeeks } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  const [viewingImage, setViewingImage] = useState<{ url: string; name: string } | null>(null);
  const showRunsOut = product.status === 'CRITICAL' || product.status === 'ORDER_NOW';

  // Calculate chart timeframe cutoff (6 weeks from today)
  const today = new Date();
  const chartEndDate = addWeeks(today, 6);

  // Filter live orders for this specific product
  const allProductOrders = liveOrders
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

  // Show only orders within the chart's 6-week visible timeframe
  const productLiveOrders = allProductOrders
    .filter(order => {
      try {
        const deliveryDate = parse(order.deliveryDate, 'MMM dd, yyyy', new Date());
        return deliveryDate <= chartEndDate;
      } catch {
        // If we can't parse the date, include it (better to show than hide)
        return true;
      }
    })
    .sort((a, b) => {
      // Sort by delivery date (soonest first)
      try {
        const dateA = parse(a.deliveryDate, 'MMM dd, yyyy', new Date());
        const dateB = parse(b.deliveryDate, 'MMM dd, yyyy', new Date());
        return dateA.getTime() - dateB.getTime();
      } catch {
        return 0;
      }
    });

  // Count total orders for display
  const totalOrders = allProductOrders.length;
  const hiddenOrders = totalOrders - productLiveOrders.length;

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
                  <button
                    onClick={() => setViewingImage({ url: product.imageUrl!, name: product.name })}
                    className="flex-shrink-0"
                  >
                    <Info className="h-4 w-4 text-blue-500 hover:text-blue-600 cursor-pointer transition-colors" />
                  </button>
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

        {/* Live Orders - Only show orders within chart timeframe (6 weeks) */}
        {productLiveOrders.length > 0 && (
          <div className="pt-3 border-t-2 mt-auto">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-muted-foreground font-medium text-sm">
                Incoming Orders (Next 6 Weeks):
              </p>
              {hiddenOrders > 0 && (
                <span className="text-xs text-muted-foreground/70">
                  +{hiddenOrders} more
                </span>
              )}
            </div>
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

      {/* Image Viewer Modal */}
      {viewingImage && (
        <Dialog open={!!viewingImage} onOpenChange={() => setViewingImage(null)}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] p-0">
            <DialogHeader className="sr-only">
              <DialogTitle>Product Label Image</DialogTitle>
            </DialogHeader>
            <div className="relative w-full h-full flex flex-col">
              {/* Close button */}
              <button
                onClick={() => setViewingImage(null)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="h-6 w-6" />
              </button>

              {/* Image */}
              <div className="flex-1 flex items-center justify-center p-4 bg-black/95">
                <img
                  src={viewingImage.url}
                  alt={viewingImage.name}
                  className="max-w-full max-h-[85vh] object-contain"
                />
              </div>

              {/* Product name footer */}
              <div className="bg-card border-t px-6 py-4">
                <p className="text-sm font-semibold text-center">{viewingImage.name}</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
