import { AlertCircle, CheckCircle, Settings, Calendar } from 'lucide-react';
import { MetricCard } from './MetricCard';
import type { Product } from '@/lib/types';

interface StatusMetricsBarProps {
  worstProduct: Product | null;
  targetSOH: number;
  urgentCount: number;
  nextOrderByDate: string | null;
  onTargetSOHClick: () => void;
  onWorstProductClick: () => void;
}

export function StatusMetricsBar({
  worstProduct,
  targetSOH,
  urgentCount,
  nextOrderByDate,
  onTargetSOHClick,
  onWorstProductClick,
}: StatusMetricsBarProps) {
  // Determine variant for worst product card
  const getWorstProductVariant = () => {
    if (!worstProduct) return 'neutral';
    if (worstProduct.weeksRemaining < 2) return 'critical';
    if (worstProduct.weeksRemaining < 6) return 'warning';
    return 'healthy';
  };

  // Determine variant for urgent count card
  const getUrgentCountVariant = () => {
    if (urgentCount === 0) return 'healthy';
    if (urgentCount >= 3) return 'critical';
    return 'warning';
  };

  // Get appropriate icon for worst product
  const getWorstProductIcon = () => {
    if (!worstProduct) return CheckCircle;
    if (worstProduct.weeksRemaining < 2) return AlertCircle;
    if (worstProduct.weeksRemaining < 6) return AlertCircle;
    return CheckCircle;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Worst Product */}
      <MetricCard
        label="Good for"
        value={worstProduct ? `${worstProduct.weeksRemaining.toFixed(1)} weeks` : 'N/A'}
        sublabel={worstProduct ? (worstProduct.name.slice(0, 30) + (worstProduct.name.length > 30 ? '...' : '')) : ''}
        variant={getWorstProductVariant()}
        icon={getWorstProductIcon()}
        onClick={onWorstProductClick}
      />

      {/* Target SOH */}
      <MetricCard
        label="Target SOH"
        value={`${targetSOH} weeks`}
        sublabel="Click to adjust"
        variant="interactive"
        icon={Settings}
        onClick={onTargetSOHClick}
      />

      {/* Urgent Containers */}
      <MetricCard
        label={urgentCount === 0 ? 'All On Track' : 'Containers Due'}
        value={urgentCount === 0 ? '✓' : urgentCount}
        sublabel={nextOrderByDate ? `Next: ${nextOrderByDate}` : 'No upcoming orders'}
        variant={getUrgentCountVariant()}
        icon={Calendar}
      />
    </div>
  );
}
