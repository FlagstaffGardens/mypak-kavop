'use client';

import { useState, useEffect } from 'react';
import { Edit3, X, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/shared/ProductCard';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { InventoryEditTable } from '@/components/shared/InventoryEditTable';
import type { Product, ContainerRecommendation, Order } from '@/lib/types';

interface DashboardClientProps {
  initialProducts: Product[];
  containers: ContainerRecommendation[];
  liveOrders: Order[];
  lastUpdated: Date | null;
  isFirstVisit: boolean;
  newProductCount: number;
}

/**
 * Dashboard Client Component - Main inventory dashboard with real-time data
 *
 * Features:
 * - Groups products by status (CRITICAL, ORDER_NOW, HEALTHY)
 * - Shows "Update Inventory Data" button in header
 * - Displays new products banner when ERP has products not in database
 * - Auto-opens inventory modal on first visit (no data in database)
 * - Loading overlay during page reload after save
 * - Formats last updated timestamp with relative time
 *
 * @param initialProducts - Products with inventory data from server
 * @param containers - Container recommendations (currently mock data)
 * @param liveOrders - Current orders from ERP
 * @param lastUpdated - Timestamp of last inventory update
 * @param isFirstVisit - Whether user has any inventory data (triggers blocking modal)
 * @param newProductCount - Number of products in ERP not yet configured
 */
export function DashboardClient({
  initialProducts,
  containers,
  liveOrders,
  lastUpdated,
  isFirstVisit,
  newProductCount,
}: DashboardClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [showEditTable, setShowEditTable] = useState(isFirstVisit); // Auto-show on first visit
  const [lastUpdatedTime, setLastUpdatedTime] = useState<Date | null>(lastUpdated);
  const [showNewProductsBanner, setShowNewProductsBanner] = useState(newProductCount > 0 && !isFirstVisit);
  const [isReloading, setIsReloading] = useState(false);

  // Sync modal state with isFirstVisit prop
  useEffect(() => {
    setShowEditTable(isFirstVisit);
  }, [isFirstVisit]);

  // Calculate worst product
  const worstProduct = products.length > 0
    ? products.reduce((worst, product) =>
        product.weeksRemaining < worst.weeksRemaining ? product : worst
      )
    : null;

  // Group products by status
  const criticalProducts = products.filter(p => p.status === 'CRITICAL');
  const orderNowProducts = products.filter(p => p.status === 'ORDER_NOW');
  const healthyProducts = products.filter(p => p.status === 'HEALTHY');

  // Handle inventory data save - reload page to get fresh data
  const handleSaveInventory = () => {
    setIsReloading(true);
    // Give a brief moment for the state to update before reload
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  // Format last updated timestamp
  const formatLastUpdated = (date: Date | null) => {
    if (!date) return 'Never';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'min' : 'mins'} ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;

    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="space-y-8 relative">
      {/* Reloading Overlay */}
      {isReloading && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-card border border-border rounded-lg p-6 flex flex-col items-center gap-3">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium">Reloading dashboard...</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Inventory Dashboard
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Monitor your egg carton inventory and receive order recommendations
          </p>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-2">
          <Button onClick={() => setShowEditTable(true)} size="lg" className="gap-2 w-full sm:w-auto">
            <Edit3 className="h-4 w-4" />
            <span className="hidden sm:inline">Update Inventory Data</span>
            <span className="sm:hidden">Update Inventory</span>
          </Button>
          <p className="text-xs text-muted-foreground">
            Last updated: <span className="font-medium">{formatLastUpdated(lastUpdatedTime)}</span>
          </p>
        </div>
      </div>

      {/* New Products Banner */}
      {showNewProductsBanner && (
        <div className="flex items-center justify-between gap-4 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">
                New products detected
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                {newProductCount} new {newProductCount === 1 ? 'product' : 'products'} found in ERP.
                Update your inventory data to see accurate status on the dashboard.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              onClick={() => {
                setShowEditTable(true);
                setShowNewProductsBanner(false);
              }}
              size="sm"
              variant="outline"
              className="bg-white dark:bg-gray-800"
            >
              Update Now
            </Button>
            <Button
              onClick={() => setShowNewProductsBanner(false)}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Dashboard Command Center */}
      <DashboardOverview
        worstProduct={worstProduct}
        containers={containers}
        products={products}
        liveOrders={liveOrders}
      />

      {/* Critical Products */}
      {criticalProducts.length > 0 && (
        <div>
          <h2 className="mb-4 text-sm font-semibold text-foreground/70 uppercase tracking-wider">
            Critical - Immediate Action Required
          </h2>
          <div className="grid gap-5 md:grid-cols-2">
            {criticalProducts.map((product) => (
              <div key={product.id} id={`product-${product.id}`}>
                <ProductCard product={product} liveOrders={liveOrders} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order Now Products */}
      {orderNowProducts.length > 0 && (
        <div>
          <h2 className="mb-4 text-sm font-semibold text-foreground/70 uppercase tracking-wider">
            Order Now - Running Low
          </h2>
          <div className="grid gap-5 md:grid-cols-2">
            {orderNowProducts.map((product) => (
              <div key={product.id} id={`product-${product.id}`}>
                <ProductCard product={product} liveOrders={liveOrders} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Healthy Products */}
      {healthyProducts.length > 0 && (
        <div className="mt-8">
          <div className="flex justify-between items-center p-4 px-6 bg-card border rounded mb-6">
            <h2 className="text-sm font-semibold text-green-600 dark:text-green-500 uppercase tracking-wider">
              ✓ {healthyProducts.length} HEALTHY PRODUCTS (16+ weeks supply)
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {healthyProducts.map((product) => (
              <div key={product.id} id={`product-${product.id}`}>
                <ProductCard product={product} liveOrders={liveOrders} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inventory Edit Table */}
      {showEditTable && (
        <InventoryEditTable
          products={products}
          onSave={handleSaveInventory}
          onCancel={() => setShowEditTable(false)}
          isFirstVisit={isFirstVisit}
        />
      )}
    </div>
  );
}
