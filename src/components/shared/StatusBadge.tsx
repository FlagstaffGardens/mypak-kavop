import type { ProductStatus, OrderStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: ProductStatus | OrderStatus | 'URGENT';
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variants = {
    CRITICAL: 'bg-red-600 text-white',
    ORDER_NOW: 'bg-red-50 text-red-700 border border-red-200',
    HEALTHY: 'bg-green-50 text-green-700 border border-green-200',
    URGENT: 'bg-red-600 text-white',
    IN_TRANSIT: 'bg-cyan-50 text-cyan-700 border border-cyan-200',
    DELIVERED: 'bg-green-50 text-green-700 border border-green-200',
    RECOMMENDED: 'bg-blue-50 text-blue-700 border border-blue-200',
  };

  const labels = {
    ORDER_NOW: 'ORDER NOW',
    IN_TRANSIT: 'IN TRANSIT',
    CRITICAL: 'CRITICAL',
    HEALTHY: 'HEALTHY',
    URGENT: 'URGENT',
    DELIVERED: 'DELIVERED',
    RECOMMENDED: 'RECOMMENDED',
  };

  return (
    <span
      className={cn(
        'px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap tracking-wider',
        variants[status],
        className
      )}
    >
      {labels[status as keyof typeof labels] || status}
    </span>
  );
}
