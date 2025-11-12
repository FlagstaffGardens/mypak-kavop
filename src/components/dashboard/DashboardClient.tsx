'use client';

import { useState } from 'react';
import { Edit3 } from 'lucide-react';
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
}

export function DashboardClient({
  initialProducts,
  containers,
  liveOrders,
  lastUpdated,
}: DashboardClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [showEditTable, setShowEditTable] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<Date | null>(lastUpdated);

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

  // Handle inventory data save
  const handleSaveInventory = (updatedProducts: Product[]) => {
    const now = new Date();
    setProducts(updatedProducts);
    setLastUpdatedTime(now);
    setShowEditTable(false);

    // Save timestamp to localStorage
    localStorage.setItem('inventoryLastUpdated', now.toISOString());
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
    <div className="space-y-8">
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
        />
      )}
    </div>
  );
}
