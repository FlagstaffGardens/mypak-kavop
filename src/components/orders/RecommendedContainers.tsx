'use client';

import { useState } from 'react';
import Link from 'next/link';
import { mockContainers } from '@/lib/data/mock-containers';
import { SCENARIOS } from '@/lib/data/mock-scenarios';
import { Button } from '@/components/ui/button';
import { Package } from 'lucide-react';

type DemoState = 'production' | 'healthy' | 'single_urgent' | 'multiple_urgent' | 'mixed';

function getInitialContainers() {
  if (typeof window === 'undefined') return mockContainers;
  const savedState = (localStorage.getItem('demoState') as DemoState) || 'production';

  if (savedState !== 'production' && SCENARIOS[savedState]) {
    return SCENARIOS[savedState].containers;
  }
  return mockContainers;
}

export function RecommendedContainers() {
  const [containers] = useState(getInitialContainers);

  return (
    <section>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">
            Recommended Containers
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Based on current consumption rates and target stock levels
          </p>
        </div>
        {containers.length > 0 && (
          <Button
            asChild
            variant="outline"
            size="sm"
          >
            <Link href={`/orders/review/${containers[0].id}`}>
              + Create New Order
            </Link>
          </Button>
        )}
      </div>

      {/* Container Cards */}
      <div className="space-y-4">
        {containers.map((container) => (
          <div
            key={container.id}
            className={`bg-card border rounded overflow-hidden transition-all hover:shadow-md ${
              container.urgency === 'URGENT'
                ? 'border-l-4 border-l-amber-500 border-y border-r'
                : ''
            }`}
          >
            <div className="px-6 py-5">
              {/* Container Header */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-start gap-3">
                  <Package className={`flex-shrink-0 w-5 h-5 mt-0.5 ${
                    container.urgency === 'URGENT'
                      ? 'text-amber-600 dark:text-amber-500'
                      : 'text-muted-foreground'
                  }`} />
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-card-foreground">
                        Container {container.containerNumber}
                      </h3>
                      {container.urgency === 'URGENT' && (
                        <span className="px-2.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200 text-xs font-bold uppercase tracking-wider rounded">
                          Urgent
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {container.productCount} {container.productCount === 1 ? 'product' : 'products'} • {container.totalCartons.toLocaleString()} cartons
                    </p>
                  </div>
                </div>
              </div>

              {/* Dates and Action */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Order By
                    </p>
                    <p className={`text-sm font-bold mt-1 ${
                      container.urgency === 'URGENT'
                        ? 'text-amber-900 dark:text-amber-100'
                        : 'text-card-foreground'
                    }`}>
                      {container.orderByDate}
                    </p>
                  </div>
                  <div className="h-10 w-px bg-border" />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Estimated Delivery
                    </p>
                    <p className="text-sm font-semibold text-card-foreground mt-1">
                      {container.deliveryDate}
                    </p>
                  </div>
                </div>

                <Button
                  asChild
                  variant={container.urgency === 'URGENT' ? 'default' : 'outline'}
                  className={container.urgency === 'URGENT'
                    ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700'
                    : ''
                  }
                >
                  <Link href={`/orders/review/${container.id}`}>
                    Review Container {container.containerNumber}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
