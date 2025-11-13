import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, Info } from 'lucide-react';
import type { ContainerProduct } from '@/lib/types';

interface ProductQuantityRowProps {
  product: ContainerProduct;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  piecesPerPallet: number;
  onRemove?: () => void;
  unit?: 'cartons' | 'pallets'; // Default is 'cartons' for backward compatibility
}

export function ProductQuantityRow({
  product,
  quantity,
  onQuantityChange,
  piecesPerPallet,
  onRemove,
  unit = 'cartons',
}: ProductQuantityRowProps) {
  const [viewingImage, setViewingImage] = useState<{ url: string; name: string } | null>(null);
  const [inputValue, setInputValue] = useState<string>('');

  const pallets = quantity / piecesPerPallet;
  const afterDeliveryStock = product.currentStock + quantity;
  const afterDeliveryWeeks = product.weeklyConsumption > 0
    ? (afterDeliveryStock / product.weeklyConsumption).toFixed(1)
    : '∞';

  // Display value depends on unit
  const displayValue = unit === 'pallets' ? pallets : quantity;
  const step = unit === 'pallets' ? 1 : 1000;

  const handleChange = (value: string) => {
    // Allow empty string while typing
    if (value === '') {
      setInputValue('');
      onQuantityChange(0);
      return;
    }

    // Strip leading zeros (e.g., "02" becomes "2")
    const strippedValue = value.replace(/^0+(?=\d)/, '');
    setInputValue(strippedValue);

    const numValue = parseFloat(strippedValue);
    if (isNaN(numValue)) return;

    if (unit === 'pallets') {
      // Convert pallets to cartons
      const cartons = Math.round(numValue * piecesPerPallet);
      onQuantityChange(Math.max(0, cartons));
    } else {
      // Direct cartons input
      onQuantityChange(Math.max(0, Math.round(numValue)));
    }
  };

  const handleBlur = () => {
    // Reset input value to show calculated displayValue on blur
    setInputValue('');
  };

  return (
    <>
    <Card className="relative">
      <CardContent className="pt-6">
        {onRemove && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="absolute top-4 right-4 h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground z-10"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">
              Product
            </Label>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {product.productName}
            </h3>
            {product.sku && (
              <div className="flex items-center gap-2 mb-3">
                <p className="text-xs text-muted-foreground font-mono">
                  SKU: {product.sku}
                </p>
                {product.imageUrl && (
                  <button
                    onClick={() => setViewingImage({ url: product.imageUrl!, name: product.productName })}
                    type="button"
                    className="flex-shrink-0"
                  >
                    <Info className="h-4 w-4 text-blue-500 hover:text-blue-600 cursor-pointer transition-colors" />
                  </button>
                )}
              </div>
            )}

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
              Quantity {unit === 'pallets' && <span className="text-blue-600 dark:text-blue-400">(Pallets)</span>}
            </Label>
            <Input
              id={`quantity-${product.productId}`}
              type="number"
              value={inputValue || displayValue}
              onChange={(e) => handleChange(e.target.value)}
              onFocus={(e) => e.target.select()}
              onBlur={handleBlur}
              className="text-base font-medium h-12"
              min="0"
              step={step}
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              {unit === 'pallets' ? (
                <>
                  {pallets.toFixed(1)} pallets ({quantity.toLocaleString()} cartons)
                </>
              ) : (
                <>
                  {quantity.toLocaleString()} cartons ({pallets.toFixed(1)} pallets)
                </>
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Image Viewer Modal */}
    {viewingImage && (
      <Dialog open={!!viewingImage} onOpenChange={() => setViewingImage(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Product Label Image</DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-full flex flex-col">
            {/* Close button */}
            <button
              onClick={() => setViewingImage(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Image */}
            <div className="flex-1 flex items-center justify-center p-4 bg-black/95">
              <img
                src={viewingImage.url}
                alt={viewingImage.name}
                className="max-w-full max-h-[85vh] object-contain"
              />
            </div>

            {/* Product name footer */}
            <div className="bg-card border-t px-6 py-4">
              <p className="text-sm font-semibold text-center">{viewingImage.name}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )}
  </>
  );
}
