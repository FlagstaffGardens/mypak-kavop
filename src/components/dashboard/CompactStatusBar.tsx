import { Settings } from 'lucide-react';
import { addWeeks, format } from 'date-fns';
import type { Product, ContainerRecommendation } from '@/lib/types';

interface CompactStatusBarProps {
  products: Product[];
  containers: ContainerRecommendation[];
  targetSOH: number;
  onTargetSOHClick: () => void;
}

export function CompactStatusBar({
  products,
  containers,
  targetSOH,
  onTargetSOHClick,
}: CompactStatusBarProps) {
  // Calculate total coverage
  const calculateCoverage = () => {
    if (!products || products.length === 0) return { weeksCovered: 0, coveredUntilDate: null };

    // Sum current stock across all products
    const totalCurrentStock = products.reduce((sum, p) => sum + p.currentStock, 0);

    // Sum all container quantities
    const totalContainerQuantity = containers?.reduce((sum, c) => sum + c.totalCartons, 0) || 0;

    // Sum weekly consumption across all products
    const totalWeeklyConsumption = products.reduce((sum, p) => sum + p.weeklyConsumption, 0);

    if (totalWeeklyConsumption === 0) return { weeksCovered: 0, coveredUntilDate: null };

    // Calculate weeks covered
    const weeksCovered = (totalCurrentStock + totalContainerQuantity) / totalWeeklyConsumption;

    // Calculate covered until date
    const coveredUntilDate = addWeeks(new Date(), weeksCovered);

    return { weeksCovered, coveredUntilDate };
  };

  const { weeksCovered, coveredUntilDate } = calculateCoverage();

  // Determine status variant based on weeks covered
  const getStatusVariant = () => {
    if (weeksCovered >= 16) return 'healthy';
    if (weeksCovered >= 6) return 'warning';
    return 'critical';
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
      {/* Card 1: Weeks Covered */}
      <div className="px-5 py-4 bg-card border border-border rounded-lg">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Weeks Covered
        </p>
        <p className={`text-2xl font-bold mt-1 ${config.textColor}`}>
          {weeksCovered > 0 ? `${weeksCovered.toFixed(1)} weeks` : 'N/A'}
        </p>
      </div>

      {/* Card 2: Covered Until */}
      <div className="px-5 py-4 bg-card border border-border rounded-lg">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Covered Until
        </p>
        <p className={`text-2xl font-bold mt-1 ${config.textColor}`}>
          {coveredUntilDate ? format(coveredUntilDate, 'MMM dd, yyyy') : 'N/A'}
        </p>
      </div>

      {/* Card 3: Target SOH - Interactive */}
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
    </div>
  );
}
