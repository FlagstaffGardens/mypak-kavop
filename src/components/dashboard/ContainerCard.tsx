'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ContainerRecommendation, ContainerProduct } from '@/lib/types';

interface ContainerCardProps {
  container: ContainerRecommendation;
  variant?: 'recommended' | 'live';
  defaultExpanded?: boolean;
  onOrderClick?: () => void;
}

export function ContainerCard({
  container,
  variant = 'recommended',
  defaultExpanded = false,
  onOrderClick,
}: ContainerCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Determine border styling based on urgency
  const getBorderClass = () => {
    if (variant === 'live') return 'border border-border';
    if (container.urgency === 'URGENT') {
      return container.products.some(p => p.weeksSupply < 2)
        ? 'border-l-4 border-l-red-500 border-y border-r border-border'
        : 'border-l-4 border-l-amber-500 border-y border-r border-border';
    }
    return 'border border-border';
  };

  // Determine badge variant
  const getBadgeVariant = () => {
    if (variant === 'live') return 'default';
    if (container.urgency === 'URGENT') {
      return container.products.some(p => p.weeksSupply < 2) ? 'destructive' : 'default';
    }
    return 'outline';
  };

  // Determine badge text
  const getBadgeText = () => {
    if (variant === 'live') return 'IN TRANSIT';
    if (container.urgency === 'URGENT') {
      return container.products.some(p => p.weeksSupply < 2) ? 'CRITICAL' : 'URGENT';
    }
    return 'ON TRACK';
  };

  // Calculate total pallets using actual piecesPerPallet for each product
  const totalPallets = container.products.reduce((sum, product) => {
    return sum + (product.recommendedQuantity / product.piecesPerPallet);
  }, 0);

  return (
    <div
      className={`
        rounded-md bg-card transition-all
        ${getBorderClass()}
        ${variant === 'recommended' ? 'hover:shadow-md' : ''}
      `}
    >
      <div className="px-4 py-3">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-base font-semibold text-foreground">
              Container {container.containerNumber}
            </h3>
          </div>
          <Badge variant={getBadgeVariant()} className="text-xs">
            {getBadgeText()}
          </Badge>
        </div>

        {/* Summary and Dates in One Line */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm mb-2 gap-1 sm:gap-0">
          <div className="text-foreground">
            <span className="font-medium">{totalPallets.toFixed(1)} pallets</span>
            <span className="text-muted-foreground font-normal ml-1">
              ({container.totalCartons.toLocaleString()} cartons)
            </span>
            <span className="text-muted-foreground mx-1.5">•</span>
            <span className="text-muted-foreground font-normal">
              {container.productCount} {container.productCount === 1 ? 'product' : 'products'}
            </span>
          </div>
        </div>

        {/* Dates */}
        <div className="flex flex-col sm:flex-row sm:gap-4 text-xs text-muted-foreground mb-3 gap-0.5 sm:gap-4">
          <div>
            <span className="font-medium">Order by:</span> {container.orderByDate}
          </div>
          <div>
            <span className="font-medium">Delivery:</span> {container.deliveryDate}
          </div>
        </div>

        {/* Product List (Expandable) */}
        {isExpanded && container.products.length > 0 && (
          <div className="mb-3 px-3 py-2 bg-muted/50 rounded border border-border space-y-1.5">
            {container.products.map((product) => (
              <ProductRow key={product.productId} product={product} />
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-blue-600 dark:text-blue-500 hover:underline font-medium flex items-center gap-1 cursor-pointer"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3 h-3" />
                Hide Products
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                Show Products
              </>
            )}
          </button>

          {variant === 'recommended' && onOrderClick && (
            <Button
              onClick={onOrderClick}
              variant={container.urgency === 'URGENT' ? 'default' : 'outline'}
              size="sm"
              className="h-8 text-xs"
            >
              Review Order →
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Product row component
function ProductRow({ product }: { product: ContainerProduct }) {
  const getWeeksColor = () => {
    if (product.weeksSupply < 2) return 'text-red-600 dark:text-red-500';
    if (product.weeksSupply < 6) return 'text-amber-600 dark:text-amber-500';
    return 'text-green-600 dark:text-green-500';
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm gap-1 sm:gap-0">
      <span className="text-foreground font-medium flex-1 sm:mr-4 break-words">
        {product.productName}
      </span>
      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0 text-xs sm:text-sm">
        <span className="text-muted-foreground">
          {(product.recommendedQuantity / product.piecesPerPallet).toFixed(1)} pallets
        </span>
        <span className={`font-medium min-w-[50px] sm:min-w-[60px] text-right ${getWeeksColor()}`}>
          {product.weeksSupply.toFixed(1)} wks
        </span>
      </div>
    </div>
  );
}
