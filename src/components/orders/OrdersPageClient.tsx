'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';
const RecommendedContainersLazy = dynamic(() =>
  import('@/components/orders/RecommendedContainers').then(m => ({ default: m.RecommendedContainers }))
);
const OrdersEnRouteLazy = dynamic(() =>
  import('@/components/orders/OrdersEnRoute').then(m => ({ default: m.OrdersEnRoute }))
);
const OrderHistoryLazy = dynamic(() =>
  import('@/components/orders/OrderHistory').then(m => ({ default: m.OrderHistory }))
);
import type { ContainerRecommendation, Order } from '@/lib/types';

interface OrdersPageClientProps {
  containers: ContainerRecommendation[];
  liveOrders: Order[];
  completedOrders: Order[];
}

function OrdersTabs({
  containers,
  liveOrders,
  completedOrders,
}: OrdersPageClientProps) {
  const searchParams = useSearchParams();
  const highlightOrderNumber = searchParams.get('highlight');
  const currentTab = highlightOrderNumber ? 'live' : (searchParams.get('tab') || 'recommended');

  // Keep URL in sync without triggering a Next.js navigation (no re-fetch)
  return (
    <Tabs value={currentTab} className="w-full">
      <TabsList className="h-auto p-1 bg-muted">
        <Link href="/orders?tab=recommended" className="inline-block cursor-pointer">
          <TabsTrigger value="recommended" className="data-[state=active]:bg-background cursor-pointer">
          Recommended Orders
          {containers.length > 0 && (
            <span className="ml-2 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
              {containers.length}
            </span>
          )}
          </TabsTrigger>
        </Link>
        <Link href="/orders?tab=live" className="inline-block cursor-pointer">
          <TabsTrigger value="live" className="data-[state=active]:bg-background cursor-pointer">
          Live Orders
          {liveOrders.length > 0 && (
            <span className="ml-2 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
              {liveOrders.length}
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
        <RecommendedContainersLazy containers={containers} />
      </TabsContent>

      <TabsContent value="live" className="mt-6">
        <OrdersEnRouteLazy orders={liveOrders} highlightOrderNumber={highlightOrderNumber} />
      </TabsContent>

      <TabsContent value="completed" className="mt-6">
        <OrderHistoryLazy orders={completedOrders} />
      </TabsContent>
    </Tabs>
  );
}

export function OrdersPageClient(props: OrdersPageClientProps) {
  const firstContainerId = props.containers[0]?.containerNumber || null;

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
        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link href="/orders/new">
            + Create New Order
          </Link>
        </Button>
      </div>

      {/* Tabs */}
      <Suspense fallback={<div className="h-64 flex items-center justify-center text-muted-foreground">Loading...</div>}>
        <OrdersTabs {...props} />
      </Suspense>
    </div>
  );
}
