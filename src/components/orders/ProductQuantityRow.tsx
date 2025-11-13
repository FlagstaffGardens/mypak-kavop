import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { ContainerProduct } from '@/lib/types';

interface ProductQuantityRowProps {
  product: ContainerProduct;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  piecesPerPallet: number;
  onRemove?: () => void;
}

export function ProductQuantityRow({
  product,
  quantity,
  onQuantityChange,
  piecesPerPallet,
  onRemove,
}: ProductQuantityRowProps) {
  const pallets = (quantity / piecesPerPallet).toFixed(1);
  const afterDeliveryStock = product.currentStock + quantity;
  const afterDeliveryWeeks = product.weeklyConsumption > 0
    ? (afterDeliveryStock / product.weeklyConsumption).toFixed(1)
    : '∞';

  const handleChange = (value: string) => {
    const numValue = parseInt(value) || 0;
    onQuantityChange(Math.max(0, numValue));
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2 mb-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                Product
              </Label>
              {onRemove && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRemove}
                  className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-3">
              {product.productName}
            </h3>

            <div className="space-y-1 text-sm text-muted-foreground">
              <p>
                <span className="text-xs uppercase tracking-wide">Current:</span> <span className="font-medium text-foreground">{product.weeksSupply.toFixed(1)} weeks</span>
                {' → '}
                <span className="text-xs uppercase tracking-wide">Runs out:</span>{' '}
                <span className="font-medium text-foreground">{product.runsOutDate}</span>
              </p>
              <p>
                <span className="text-xs uppercase tracking-wide">After delivery:</span> <span className="font-medium text-green-600 dark:text-green-500">{afterDeliveryWeeks} weeks supply</span>
              </p>
            </div>
          </div>

          <div className="md:w-64">
            <Label htmlFor={`quantity-${product.productId}`} className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">
              Quantity
            </Label>
            <Input
              id={`quantity-${product.productId}`}
              type="number"
              value={quantity}
              onChange={(e) => handleChange(e.target.value)}
              className="text-base font-medium h-12"
              min="0"
              step="1000"
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              {quantity.toLocaleString()} cartons ({pallets} pallets)
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
