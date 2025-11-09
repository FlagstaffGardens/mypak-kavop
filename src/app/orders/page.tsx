'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { RecommendedContainers } from '@/components/orders/RecommendedContainers';
import { OrdersEnRoute } from '@/components/orders/OrdersEnRoute';
import { OrderHistory } from '@/components/orders/OrderHistory';
import { SCENARIOS } from '@/lib/data/mock-scenarios';
import { mockLiveOrders } from '@/lib/data/mock-orders';

type DemoState = 'healthy' | 'single_urgent' | 'multiple_urgent';

// Component that uses useSearchParams
function OrdersTabs({ recommendedCount, liveCount }: { recommendedCount: number; liveCount: number }) {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'recommended';

  return (
    <Tabs value={currentTab} className="w-full">
      <TabsList className="h-auto p-1 bg-muted">
        <TabsTrigger value="recommended" className="data-[state=active]:bg-background">
          Recommended Orders
          {recommendedCount > 0 && (
            <span className="ml-2 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
              {recommendedCount}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="live" className="data-[state=active]:bg-background">
          Live Orders
          {liveCount > 0 && (
            <span className="ml-2 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
              {liveCount}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="completed" className="data-[state=active]:bg-background">
          Completed Orders
        </TabsTrigger>
      </TabsList>

      <TabsContent value="recommended" className="mt-6">
        <RecommendedContainers />
      </TabsContent>

      <TabsContent value="live" className="mt-6">
        <OrdersEnRoute />
      </TabsContent>

      <TabsContent value="completed" className="mt-6">
        <OrderHistory />
      </TabsContent>
    </Tabs>
  );
}

export default function OrdersPage() {
  const [recommendedCount, setRecommendedCount] = useState(0);
  const [firstContainerId, setFirstContainerId] = useState<number | null>(null);
  const [liveCount] = useState(mockLiveOrders.length);

  useEffect(() => {
    const savedState = (localStorage.getItem('demoState') as DemoState) || 'healthy';
    if (SCENARIOS[savedState]) {
      setRecommendedCount(SCENARIOS[savedState].containers.length);
      setFirstContainerId(SCENARIOS[savedState].containers[0]?.id || null);
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Orders
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            View recommended containers, track shipments, and manage order history
          </p>
        </div>
        {firstContainerId && (
          <Button asChild size="lg">
            <Link href={`/orders/review/${firstContainerId}`}>
              + Create New Order
            </Link>
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Suspense fallback={<div className="h-64 flex items-center justify-center text-muted-foreground">Loading...</div>}>
        <OrdersTabs recommendedCount={recommendedCount} liveCount={liveCount} />
      </Suspense>
    </div>
  );
}
