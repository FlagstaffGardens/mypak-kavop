'use client';

import { X, Ship, CheckCircle2, Calendar, Package, Truck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Order } from '@/lib/types';

interface OrderDetailsModalProps {
  order: Order | null;
  onClose: () => void;
}

export function OrderDetailsModal({ order, onClose }: OrderDetailsModalProps) {
  if (!order) return null;

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

  // Calculate total pallets using actual piecesPerPallet for each product
  const totalPallets = order.products?.reduce((sum, product) => {
    return sum + (product.recommendedQuantity / product.piecesPerPallet);
  }, 0) || 0;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-lg max-w-3xl w-full max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StatusIcon className="w-6 h-6 text-muted-foreground" />
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {order.orderNumber}
              </h2>
              {order.customerOrderNumber && (
                <p className="text-sm text-muted-foreground">
                  Customer PO: {order.customerOrderNumber}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={badge.variant}>{badge.text}</Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Key Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Ordered
                </p>
                <p className="text-sm font-medium text-foreground">
                  {order.orderedDate}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  {order.status === 'DELIVERED' ? 'Delivered' : 'Arriving'}
                </p>
                <p className="text-sm font-medium text-foreground">
                  {order.deliveryDate}
                </p>
              </div>
            </div>

            {order.shippingTerm && (
              <div className="flex items-start gap-2">
                <Truck className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Shipping Term
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {order.shippingTerm}
                  </p>
                </div>
              </div>
            )}

            {order.shippingMethod && (
              <div className="flex items-start gap-2">
                <Ship className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Method
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {order.shippingMethod}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="bg-muted/50 rounded-lg border border-border px-6 py-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-5 h-5 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                Order Summary
              </h3>
            </div>
            <div className="text-lg font-medium text-foreground">
              {totalPallets.toFixed(1)} pallets
              <span className="text-muted-foreground font-normal ml-1.5">
                ({order.totalCartons.toLocaleString()} cartons)
              </span>
              <span className="text-muted-foreground mx-2">•</span>
              <span className="text-muted-foreground font-normal">
                {order.productCount} products
              </span>
            </div>
          </div>

          {/* Comments */}
          {order.comments && (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-lg px-4 py-3">
              <p className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wider font-medium mb-1">
                Notes
              </p>
              <p className="text-sm text-blue-900 dark:text-blue-100">
                {order.comments}
              </p>
            </div>
          )}

          {/* Products List */}
          {order.products && order.products.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">
                Products ({order.products.length})
              </h3>
              <div className="space-y-2">
                {order.products.map((product) => (
                  <div
                    key={product.productId}
                    className="bg-card border border-border rounded-lg px-4 py-3 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base font-medium text-foreground mb-1">
                          {product.productName}
                        </h4>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <span>
                            Current: {(product.currentStock / 1000).toFixed(1)}k cartons
                          </span>
                          <span>
                            Weekly use: {(product.weeklyConsumption / 1000).toFixed(1)}k
                          </span>
                          {product.afterDeliveryStock && (
                            <span>
                              After delivery: {(product.afterDeliveryStock / 1000).toFixed(1)}k
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <div className="text-lg font-semibold text-foreground">
                          {(product.recommendedQuantity / product.piecesPerPallet).toFixed(1)} pallets
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {product.recommendedQuantity.toLocaleString()} cartons
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 flex justify-end">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
