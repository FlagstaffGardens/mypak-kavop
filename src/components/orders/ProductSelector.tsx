import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Product } from '@/lib/types';

interface ProductSelectorProps {
  availableProducts: Product[];
  onProductAdd: (product: Product) => void;
  isEmptyState?: boolean;
}

export function ProductSelector({ availableProducts, onProductAdd, isEmptyState = false }: ProductSelectorProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);

    // Immediately add product when selected
    const product = availableProducts.find(p => p.id.toString() === productId);
    if (product) {
      onProductAdd(product);

      // Reset selection after a brief delay so dropdown closes smoothly
      setTimeout(() => setSelectedProductId(''), 100);
    }
  };

  if (availableProducts.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-3 items-center">
      {!isEmptyState && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center w-11 h-11 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-950/50 hover:border-blue-300 dark:hover:border-blue-700 transition-colors cursor-pointer"
        >
          <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </button>
      )}
      <div className="flex-1">
        <Select value={selectedProductId} onValueChange={handleProductSelect} open={isOpen} onOpenChange={setIsOpen}>
          <SelectTrigger
            className={`w-full cursor-pointer transition-all ${
              isEmptyState
                ? 'h-14 text-base border-2 border-blue-500 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 shadow-sm'
                : 'h-11 border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/10 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:border-blue-300 dark:hover:border-blue-700'
            }`}
          >
            <SelectValue
              placeholder={
                isEmptyState
                  ? "Click here to select a product..."
                  : "Click to add a product..."
              }
            />
          </SelectTrigger>
          <SelectContent>
            {availableProducts.map((product) => (
              <SelectItem key={product.id} value={product.id.toString()} className="cursor-pointer">
                {product.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
