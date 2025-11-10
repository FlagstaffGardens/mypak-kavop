import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ContainerCard } from './ContainerCard';
import type { ContainerRecommendation } from '@/lib/types';

interface RecommendedOrdersPanelProps {
  containers: ContainerRecommendation[];
  onOrderClick?: (containerId: number) => void;
}

export function RecommendedOrdersPanel({
  containers,
  onOrderClick,
}: RecommendedOrdersPanelProps) {
  // Separate urgent and non-urgent containers
  const urgentContainers = containers.filter(c => c.urgency === 'URGENT');
  const nonUrgentContainers = containers.filter(c => !c.urgency);

  // Auto-expand logic
  const shouldAutoExpand = (container: ContainerRecommendation) => {
    return container.urgency === 'URGENT';
  };

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

  // Limit display on dashboard
  const DASHBOARD_LIMIT = 3;
  const displayedUrgent = urgentContainers.slice(0, DASHBOARD_LIMIT);
  const displayedNonUrgent = nonUrgentContainers.slice(0, Math.max(0, DASHBOARD_LIMIT - displayedUrgent.length));
  const totalDisplayed = displayedUrgent.length + displayedNonUrgent.length;
  const hasMore = containers.length > totalDisplayed;

  return (
    <div className="flex flex-col h-full">
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

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto max-h-[500px] space-y-4">
        {/* Urgent Containers */}
        {displayedUrgent.length > 0 && (
          <div className="space-y-4">
            {displayedUrgent.map(container => (
              <ContainerCard
                key={container.id}
                container={container}
                variant="recommended"
                defaultExpanded={shouldAutoExpand(container)}
                onOrderClick={() => onOrderClick?.(container.id)}
              />
            ))}
          </div>
        )}

        {/* Divider */}
        {displayedUrgent.length > 0 && displayedNonUrgent.length > 0 && (
          <div className="border-t-2 border-dashed border-border pt-4">
            <p className="text-sm text-muted-foreground uppercase tracking-wide mb-4">
              Future Orders
            </p>
          </div>
        )}

        {/* Non-Urgent Containers */}
        {displayedNonUrgent.length > 0 && (
          <div className="space-y-4">
            {displayedNonUrgent.map(container => (
              <ContainerCard
                key={container.id}
                container={container}
                variant="recommended"
                defaultExpanded={false}
                onOrderClick={() => onOrderClick?.(container.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* View All Footer */}
      {hasMore && (
        <div className="mt-4 pt-4 border-t border-border">
          <Link href="/orders" className="cursor-pointer">
            <Button variant="outline" className="w-full group">
              View All {containers.length} Recommended Orders
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
