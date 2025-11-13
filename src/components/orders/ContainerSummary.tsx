import { Card, CardContent } from '@/components/ui/card';
import type { CapacityValidation } from '@/lib/validations';

interface ContainerSummaryProps {
  containerNumber: number;
  orderByDate: string;
  deliveryDate: string;
  totalCartons: number;
  totalPallets: number;
  capacityValidation: CapacityValidation;
}

export function ContainerSummary({
  containerNumber,
  orderByDate,
  deliveryDate,
  totalCartons,
  totalPallets,
  capacityValidation,
}: ContainerSummaryProps) {
  const getCapacityColor = () => {
    if (capacityValidation.warning === 'exceeds_capacity') return 'text-red-600 dark:text-red-400';
    if (capacityValidation.warning === 'near_capacity') return 'text-amber-600 dark:text-amber-500';
    if (capacityValidation.warning === 'small_order') return 'text-blue-600 dark:text-blue-500';
    return 'text-green-600 dark:text-green-500';
  };

  const getWarningBg = () => {
    if (capacityValidation.warning === 'exceeds_capacity') return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50';
    if (capacityValidation.warning === 'near_capacity') return 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50';
    if (capacityValidation.warning === 'small_order') return 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50';
    return '';
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div className="flex-1">
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">
              Container {containerNumber}
            </h2>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>Order by: <span className="font-medium text-foreground">{orderByDate}</span></p>
              <p>Expected delivery: <span className="font-medium text-foreground">{deliveryDate}</span></p>
            </div>
          </div>

          <div className="text-left md:text-right">
            <p className="text-3xl md:text-4xl font-bold text-foreground">
              {totalCartons.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">
              cartons ({totalPallets.toFixed(1)} pallets)
            </p>
          </div>
        </div>

        {/* Capacity Indicator */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Container Capacity</span>
            <span className={`text-sm font-semibold ${getCapacityColor()}`}>
              {capacityValidation.percentFull.toFixed(0)}% full
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                capacityValidation.warning === 'exceeds_capacity'
                  ? 'bg-red-600'
                  : capacityValidation.warning === 'near_capacity'
                  ? 'bg-amber-500'
                  : 'bg-green-600'
              }`}
              style={{ width: `${Math.min(capacityValidation.percentFull, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {capacityValidation.currentCartons.toLocaleString()} / {capacityValidation.maxCartons.toLocaleString()} cartons
          </p>
        </div>

        {/* Warning Message */}
        {capacityValidation.warning && (
          <div className={`mt-4 p-3 rounded-lg border ${getWarningBg()}`}>
            <p className={`text-sm font-medium ${getCapacityColor()}`}>
              ⚠ {capacityValidation.warningMessage}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
