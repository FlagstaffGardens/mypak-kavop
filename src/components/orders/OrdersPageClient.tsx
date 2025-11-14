'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { RecommendedContainers } from '@/components/orders/RecommendedContainers';
import { OrdersEnRoute } from '@/components/orders/OrdersEnRoute';
import { OrderHistory } from '@/components/orders/OrderHistory';
import type { ContainerRecommendation, Order } from '@/lib/types';

interface OrdersPageClientProps {
  containers: ContainerRecommendation[];
  liveOrders: Order[];
  completedOrders: Order[];
}

function OrdersTabs({
  containers,
  liveOrders,
  completedOrders
}: OrdersPageClientProps) {
  const searchParams = useSearchParams();
  const highlightOrderNumber = searchParams.get('highlight');
  // Initialize from URL but keep tab client-side to avoid refetch/navigation lag
  const initialTab = useMemo(() => {
    return highlightOrderNumber ? 'live' : (searchParams.get('tab') || 'recommended');
  }, [searchParams, highlightOrderNumber]);
  const [currentTab, setCurrentTab] = useState<string>(initialTab);

  // Keep URL in sync without triggering a Next.js navigation (no re-fetch)
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', currentTab);
      window.history.replaceState(window.history.state, '', url.toString());
    } catch {
      // noop
    }
  }, [currentTab]);

  return (
    <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
      <TabsList className="h-auto p-1 bg-muted">
        <TabsTrigger value="recommended" className="data-[state=active]:bg-background cursor-pointer">
          Recommended Orders
          {containers.length > 0 && (
            <span className="ml-2 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
              {containers.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="live" className="data-[state=active]:bg-background cursor-pointer">
          Live Orders
          {liveOrders.length > 0 && (
            <span className="ml-2 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
              {liveOrders.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="completed" className="data-[state=active]:bg-background cursor-pointer">
          Completed Orders
        </TabsTrigger>
      </TabsList>

      {/* Keep mounted to avoid remount lag when switching */}
      <TabsContent value="recommended" className="mt-6" forceMount>
        <RecommendedContainers containers={containers} />
      </TabsContent>

      <TabsContent value="live" className="mt-6" forceMount>
        <OrdersEnRoute orders={liveOrders} highlightOrderNumber={highlightOrderNumber} />
      </TabsContent>

      <TabsContent value="completed" className="mt-6" forceMount>
        <OrderHistory orders={completedOrders} />
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
