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
}

export function ProductSelector({ availableProducts, onProductAdd }: ProductSelectorProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  const handleAdd = () => {
    if (!selectedProductId) return;

    const product = availableProducts.find(p => p.id.toString() === selectedProductId);
    if (product) {
      onProductAdd(product);
      setSelectedProductId(''); // Reset selection
    }
  };

  if (availableProducts.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-2 items-end">
      <div className="flex-1">
        <Select value={selectedProductId} onValueChange={setSelectedProductId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a product to add..." />
          </SelectTrigger>
          <SelectContent>
            {availableProducts.map((product) => (
              <SelectItem key={product.id} value={product.id.toString()}>
                {product.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        onClick={handleAdd}
        disabled={!selectedProductId}
        className="gap-2"
      >
        <Plus className="h-4 w-4" />
        Add Product
      </Button>
    </div>
  );
}
