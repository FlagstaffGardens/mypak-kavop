'use client';

import { useState } from 'react';
import { Ship, Factory, Package, Info, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Order } from '@/lib/types';

interface OrderDetailsModalProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDetailsModal({ order, open, onOpenChange }: OrderDetailsModalProps) {
  const [viewingImage, setViewingImage] = useState<{ url: string; name: string } | null>(null);

  if (!order) return null;

  // Use raw ERP status for display, fallback to mapped status
  const displayStatus = order.erpStatus || order.status;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Factory className="w-5 h-5 text-amber-600 dark:text-amber-500" />;
      case 'IN_TRANSIT':
        return <Ship className="w-5 h-5 text-blue-600 dark:text-blue-500" />;
      case 'COMPLETE':
        return <Package className="w-5 h-5 text-green-600 dark:text-green-500" />;
      default:
        return <Package className="w-5 h-5 text-gray-500 dark:text-gray-400" />;
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

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {getStatusIcon(displayStatus)}
            <span>Order #{order.orderNumber}</span>
            <span className={`px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider rounded ${getStatusBadgeClasses(displayStatus)}`}>
              {getStatusLabel(displayStatus)}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Summary */}
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {order.productCount} {order.productCount === 1 ? 'product' : 'products'} • {order.totalCartons.toLocaleString()} cartons
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Ordered
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-50 mt-1">
                  {order.orderedDate}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Expected Arrival
                </p>
                <p className="text-sm font-bold text-blue-600 dark:text-blue-500 mt-1">
                  {order.deliveryDate}
                </p>
              </div>
              {order.shippingTerm && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Shipping Term
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-50 mt-1">
                    {order.shippingTerm}
                  </p>
                </div>
              )}
              {order.customerOrderNumber && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Customer PO
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-50 mt-1">
                    {order.customerOrderNumber}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Products Section */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              Products
            </h3>

            {/* Desktop Table */}
            <div className="hidden sm:block border border-gray-200 dark:border-gray-800 rounded overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      SKU
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Product Name
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Pallets
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-950 divide-y divide-gray-200 dark:divide-gray-800">
                  {order.products.map((product, index) => {
                    const pallets = product.piecesPerPallet
                      ? (product.recommendedQuantity / product.piecesPerPallet).toFixed(1)
                      : null;

                    return (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-50">
                          <div className="flex items-center gap-2">
                            <span className="font-mono">{product.sku || 'N/A'}</span>
                            {product.imageUrl && (
                              <button
                                onClick={() => setViewingImage({ url: product.imageUrl!, name: product.productName })}
                                className="flex-shrink-0"
                              >
                                <Info className="h-4 w-4 text-blue-500 hover:text-blue-600 cursor-pointer transition-colors" />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-50">
                          {product.productName}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-50 text-right font-semibold">
                          {product.recommendedQuantity.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-50 text-right font-semibold">
                          {pallets !== null ? pallets : 'N/A'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden space-y-3">
              {order.products.map((product, index) => {
                const pallets = product.piecesPerPallet
                  ? (product.recommendedQuantity / product.piecesPerPallet).toFixed(1)
                  : null;

                return (
                  <div
                    key={index}
                    className="border border-gray-200 dark:border-gray-800 rounded p-4 space-y-2"
                  >
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                      {product.productName}
                    </p>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">SKU:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900 dark:text-gray-50 font-mono">
                          {product.sku || 'N/A'}
                        </span>
                        {product.imageUrl && (
                          <button
                            onClick={() => setViewingImage({ url: product.imageUrl!, name: product.productName })}
                            className="flex-shrink-0"
                          >
                            <Info className="h-4 w-4 text-blue-500 hover:text-blue-600 cursor-pointer transition-colors" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Quantity:</span>
                      <span className="text-gray-900 dark:text-gray-50 font-semibold">
                        {product.recommendedQuantity.toLocaleString()} cartons
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Pallets:</span>
                      <span className="text-gray-900 dark:text-gray-50 font-semibold">
                        {pallets !== null ? pallets : 'N/A'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Comments Section (conditional) */}
          {order.comments && order.comments.trim() !== '' && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                Comments
              </h3>
              <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded p-4">
                <p className="text-sm text-gray-900 dark:text-gray-50 whitespace-pre-wrap break-words">
                  {order.comments}
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>

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
