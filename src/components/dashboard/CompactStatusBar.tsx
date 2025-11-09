import { Settings } from 'lucide-react';
import type { Product } from '@/lib/types';

interface CompactStatusBarProps {
  worstProduct: Product | null;
  targetSOH: number;
  urgentCount: number;
  nextOrderByDate: string | null;
  onTargetSOHClick: () => void;
  onWorstProductClick: () => void;
}

export function CompactStatusBar({
  worstProduct,
  targetSOH,
  urgentCount,
  nextOrderByDate,
  onTargetSOHClick,
  onWorstProductClick,
}: CompactStatusBarProps) {
  // Determine status variant based on worst product and urgent count
  const getStatusVariant = () => {
    if (!worstProduct) return 'neutral';

    // Critical: worst product < 2 weeks OR 3+ urgent containers
    if (worstProduct.weeksRemaining < 2 || urgentCount >= 3) return 'critical';

    // Warning: worst product < 6 weeks OR any urgent containers
    if (worstProduct.weeksRemaining < 6 || urgentCount > 0) return 'warning';

    // Healthy: everything on track
    return 'healthy';
  };

  const variant = getStatusVariant();

  // Styling based on variant
  const variantConfig = {
    critical: {
      badgeColor: 'bg-red-600 text-white',
      textColor: 'text-red-600 dark:text-red-500',
      mutedColor: 'text-muted-foreground',
    },
    warning: {
      badgeColor: 'bg-amber-600 text-white',
      textColor: 'text-amber-600 dark:text-amber-500',
      mutedColor: 'text-muted-foreground',
    },
    healthy: {
      badgeColor: 'bg-green-600 text-white',
      textColor: 'text-green-600 dark:text-green-500',
      mutedColor: 'text-muted-foreground',
    },
    neutral: {
      badgeColor: 'bg-gray-600 text-white',
      textColor: 'text-foreground',
      mutedColor: 'text-muted-foreground',
    },
  };

  const config = variantConfig[variant];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Left: Worst Product - Clickable Card */}
      <button
        onClick={onWorstProductClick}
        className="text-left px-5 py-4 bg-card border border-border rounded-lg hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all"
        type="button"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Good for
        </p>
        <p className={`text-2xl font-bold mt-1 ${config.textColor}`}>
          {worstProduct ? `${worstProduct.weeksRemaining.toFixed(1)} weeks` : 'N/A'}
        </p>
        {worstProduct && (
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {worstProduct.name}
          </p>
        )}
      </button>

      {/* Center: Target SOH - Interactive Button */}
      <button
        id="target-soh-button"
        onClick={onTargetSOHClick}
        type="button"
        className="w-full text-center px-5 py-4 bg-card border border-border rounded-lg hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition-all active:scale-95 cursor-pointer"
        aria-label="Adjust target stock on hand"
      >
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Target SOH
          </p>
          <p className="text-2xl font-bold text-foreground mt-1 inline-flex items-center justify-center gap-1.5">
            {targetSOH} weeks
            <Settings className="w-4 h-4 text-muted-foreground" />
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            Click to adjust
          </p>
        </div>
      </button>

      {/* Right: Status / Next Order */}
      <div className="px-5 py-4 bg-card border border-border rounded-lg text-left md:text-right flex flex-col justify-center">
        <div className="flex items-center gap-2 md:justify-end">
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${config.badgeColor}`}>
            {urgentCount === 0 ? 'Healthy' : urgentCount >= 3 ? 'Critical' : 'Urgent'}
          </span>
        </div>
        <p className={`text-2xl font-bold mt-2 ${config.textColor}`}>
          {urgentCount === 0 ? 'All On Track' : `${urgentCount} due soon`}
        </p>
        {nextOrderByDate && (
          <p className="text-xs text-muted-foreground mt-1">
            Next: {nextOrderByDate}
          </p>
        )}
      </div>
    </div>
  );
}
