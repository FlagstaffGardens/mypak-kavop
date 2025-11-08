'use client';

import { useState, useEffect, useMemo } from 'react';
import { Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/shared/ProductCard';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { InventoryEditTable } from '@/components/shared/InventoryEditTable';
import { mockProducts } from '@/lib/data/mock-products';
import { SCENARIOS } from '@/lib/data/mock-scenarios';
import { mockLiveOrders } from '@/lib/data/mock-orders';
import type { Product, ContainerRecommendation } from '@/lib/types';

type DemoState = 'production' | 'healthy' | 'single_urgent' | 'multiple_urgent' | 'mixed';

function getInitialState() {
  if (typeof window === 'undefined') return 'production' as DemoState;
  return (localStorage.getItem('demoState') as DemoState) || 'production';
}

function getInitialData() {
  if (typeof window === 'undefined') {
    return { products: mockProducts, containers: SCENARIOS.production.containers };
  }

  const savedState = (localStorage.getItem('demoState') as DemoState) || 'production';
  if (savedState !== 'production' && SCENARIOS[savedState]) {
    const scenario = SCENARIOS[savedState];
    return {
      products: scenario.products.length > 0 ? scenario.products : mockProducts,
      containers: scenario.containers,
    };
  }
  return { products: mockProducts, containers: SCENARIOS.production.containers };
}

function getInitialTimestamp() {
  if (typeof window === 'undefined') return null;
  const savedTimestamp = localStorage.getItem('inventoryLastUpdated');
  return savedTimestamp ? new Date(savedTimestamp) : null;
}

export default function Dashboard() {
  const [demoState] = useState<DemoState>(getInitialState);
  const [products, setProducts] = useState<Product[]>(() => getInitialData().products);
  const [containers, setContainers] = useState<ContainerRecommendation[]>(() => getInitialData().containers);
  const [targetSOH, setTargetSOH] = useState(6);
  const [showEditTable, setShowEditTable] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(getInitialTimestamp);

  // Calculate worst product
  const worstProduct = useMemo(() => {
    if (products.length === 0) return null;
    return products.reduce((worst, product) =>
      product.weeksRemaining < worst.weeksRemaining ? product : worst
    );
  }, [products]);

  // Group products by status
  const criticalProducts = products.filter(p => p.status === 'CRITICAL');
  const orderNowProducts = products.filter(p => p.status === 'ORDER_NOW');
  const healthyProducts = products.filter(p => p.status === 'HEALTHY');

  // Handle inventory data save
  const handleSaveInventory = (updatedProducts: Product[]) => {
    const now = new Date();
    setProducts(updatedProducts);
    setLastUpdated(now);
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

    // Format as "Nov 8, 2:30 PM"
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Inventory Dashboard
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Monitor your egg carton inventory and receive order recommendations
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Button onClick={() => setShowEditTable(true)} size="lg" className="gap-2">
            <Edit3 className="h-4 w-4" />
            Update Inventory Data
          </Button>
          <p className="text-xs text-muted-foreground">
            Last updated: <span className="font-medium">{formatLastUpdated(lastUpdated)}</span>
          </p>
        </div>
      </div>

      {/* Dashboard Command Center */}
      <DashboardOverview
        worstProduct={worstProduct}
        targetSOH={targetSOH}
        containers={containers}
        products={products}
        liveOrders={mockLiveOrders}
        onTargetSOHChange={setTargetSOH}
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
                <ProductCard product={product} liveOrders={mockLiveOrders} />
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
                <ProductCard product={product} liveOrders={mockLiveOrders} />
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
                <ProductCard product={product} liveOrders={mockLiveOrders} />
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
