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
        <Link href="/orders?tab=recommended" className="inline-block cursor-pointer">
          <TabsTrigger value="recommended" className="data-[state=active]:bg-background cursor-pointer">
            Recommended Orders
            {recommendedCount > 0 && (
              <span className="ml-2 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
                {recommendedCount}
              </span>
            )}
          </TabsTrigger>
        </Link>
        <Link href="/orders?tab=live" className="inline-block cursor-pointer">
          <TabsTrigger value="live" className="data-[state=active]:bg-background cursor-pointer">
            Live Orders
            {liveCount > 0 && (
              <span className="ml-2 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
                {liveCount}
              </span>
            )}
          </TabsTrigger>
        </Link>
        <Link href="/orders?tab=completed" className="inline-block cursor-pointer">
          <TabsTrigger value="completed" className="data-[state=active]:bg-background cursor-pointer">
            Completed Orders
          </TabsTrigger>
        </Link>
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
    const savedState = (localStorage.getItem('demoState') as DemoState) || 'multiple_urgent';
    if (SCENARIOS[savedState]) {
      setRecommendedCount(SCENARIOS[savedState].containers.length);
      setFirstContainerId(SCENARIOS[savedState].containers[0]?.id || null);
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Orders
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            View recommended containers, track shipments, and manage order history
          </p>
        </div>
        {firstContainerId && (
          <Button asChild size="lg" className="w-full sm:w-auto">
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
