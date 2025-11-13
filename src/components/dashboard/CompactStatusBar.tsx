import { addWeeks, format } from 'date-fns';
import type { Product, ContainerRecommendation, Order } from '@/lib/types';

interface CompactStatusBarProps {
  products: Product[];
  containers: ContainerRecommendation[];
  liveOrders: Order[];
}

export function CompactStatusBar({
  products,
  containers,
  liveOrders,
}: CompactStatusBarProps) {
  // Calculate total coverage based on worst-case product (bottleneck)
  const calculateCoverage = () => {
    if (!products || products.length === 0) return { weeksCovered: 0, coveredUntilDate: null };

    // Filter out unconfigured products (weekly consumption or target SOH = 0)
    const validProducts = products.filter(
      p => p.weeklyConsumption > 0 && (p.targetSOH ?? 0) > 0
    );

    if (validProducts.length === 0) {
      return { weeksCovered: 0, coveredUntilDate: null };
    }

    // Find product with minimum weeks remaining (the bottleneck)
    const worstProduct = validProducts.reduce((worst, current) =>
      current.weeksRemaining < worst.weeksRemaining ? current : worst
    );

    return {
      weeksCovered: worstProduct.weeksRemaining,
      coveredUntilDate: worstProduct.runsOutDate !== 'Not configured' && worstProduct.runsOutDate !== 'Never'
        ? new Date(worstProduct.runsOutDate)
        : null,
    };
  };

  const { weeksCovered, coveredUntilDate } = calculateCoverage();

  // Calculate daily consumption across all products
  const calculateDailyConsumption = () => {
    const totalWeeklyConsumption = products.reduce((sum, p) => sum + p.weeklyConsumption, 0);
    return Math.round(totalWeeklyConsumption / 7);
  };

  const dailyConsumption = calculateDailyConsumption();

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

      {/* Card 3: Daily Carton Consumption */}
      <div className="px-5 py-4 bg-card border border-border rounded-lg">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Daily Consumption
        </p>
        <p className="text-2xl font-bold text-foreground mt-1">
          {dailyConsumption.toLocaleString()} cartons
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          per day
        </p>
      </div>
    </div>
  );
}
