'use client';

import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { ContainerCard } from '@/components/dashboard/ContainerCard';
import type { ContainerRecommendation } from '@/lib/types';

interface RecommendedContainersProps {
  containers: ContainerRecommendation[];
}

export function RecommendedContainers({ containers }: RecommendedContainersProps) {
  const router = useRouter();

  // Separate urgent and non-urgent containers
  const urgentContainers = containers.filter(c => c.urgency === 'URGENT');
  const nonUrgentContainers = containers.filter(c => !c.urgency);

  // Empty state
  if (containers.length === 0) {
    return (
      <div className="border border-border rounded-lg bg-card px-8 py-12 text-center">
        <p className="text-lg font-medium text-green-600 dark:text-green-500 mb-2">
          ✓ All Caught Up!
        </p>
        <p className="text-sm text-muted-foreground">
          No containers need ordering at this time
        </p>
      </div>
    );
  }

  const handleOrderClick = (containerNumber: number) => {
    router.push(`/orders/review/${containerNumber}`);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground uppercase tracking-wide">
          Recommended Orders
        </h2>
        {urgentContainers.length > 0 && (
          <Badge variant="destructive">
            {urgentContainers.length} Urgent
          </Badge>
        )}
      </div>

      {/* Container List */}
      <div className="space-y-4">
        {/* Urgent Containers */}
        {urgentContainers.length > 0 && (
          <div className="space-y-4">
            {urgentContainers.map(container => (
              <ContainerCard
                key={container.containerNumber}
                container={container}
                variant="recommended"
                defaultExpanded={true}
                onOrderClick={() => handleOrderClick(container.containerNumber)}
              />
            ))}
          </div>
        )}

        {/* Divider */}
        {urgentContainers.length > 0 && nonUrgentContainers.length > 0 && (
          <div className="border-t-2 border-dashed border-border pt-4">
            <p className="text-sm text-muted-foreground uppercase tracking-wide mb-4">
              Future Orders
            </p>
          </div>
        )}

        {/* Non-Urgent Containers */}
        {nonUrgentContainers.length > 0 && (
          <div className="space-y-4">
            {nonUrgentContainers.map(container => (
              <ContainerCard
                key={container.containerNumber}
                container={container}
                variant="recommended"
                defaultExpanded={false}
                onOrderClick={() => handleOrderClick(container.containerNumber)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
