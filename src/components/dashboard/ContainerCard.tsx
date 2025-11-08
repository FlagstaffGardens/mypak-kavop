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

  // Calculate total pallets (assuming 1000 cartons per pallet)
  const totalPallets = Math.round(container.totalCartons / 1000);

  return (
    <div
      className={`
        rounded-md bg-card transition-all
        ${getBorderClass()}
        ${variant === 'recommended' ? 'hover:shadow-md' : ''}
      `}
    >
      <div className="px-6 py-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-xl font-semibold text-foreground">
              Container {container.containerNumber}
            </h3>
          </div>
          <Badge variant={getBadgeVariant()}>
            {getBadgeText()}
          </Badge>
        </div>

        {/* Dates */}
        <div className="flex gap-6 text-sm text-muted-foreground mb-4">
          <div>
            <span className="font-medium">Order by:</span> {container.orderByDate}
          </div>
          <div>
            <span className="font-medium">Delivery:</span> {container.deliveryDate}
          </div>
        </div>

        {/* Summary */}
        <div className="text-base font-medium text-foreground mb-4">
          {totalPallets} pallets
          <span className="text-muted-foreground font-normal ml-1.5">
            ({container.totalCartons.toLocaleString()} cartons)
          </span>
          <span className="text-muted-foreground mx-2">•</span>
          <span className="text-muted-foreground font-normal">
            {container.productCount} products
          </span>
        </div>

        {/* Product List (Expandable) */}
        {isExpanded && container.products.length > 0 && (
          <div className="mb-4 px-4 py-3 bg-muted/50 rounded border border-border space-y-2">
            {container.products.map((product) => (
              <ProductRow key={product.productId} product={product} />
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-600 dark:text-blue-500 hover:underline font-medium flex items-center gap-1"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Hide Products
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show Products
              </>
            )}
          </button>

          {variant === 'recommended' && onOrderClick && (
            <Button
              onClick={onOrderClick}
              variant={container.urgency === 'URGENT' ? 'default' : 'outline'}
              size="sm"
              className="h-9"
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
    <div className="flex items-center justify-between text-sm">
      <span className="text-foreground font-medium truncate flex-1 mr-4">
        {product.productName.slice(0, 40)}{product.productName.length > 40 ? '...' : ''}
      </span>
      <div className="flex items-center gap-4 flex-shrink-0">
        <span className="text-muted-foreground">
          {Math.round(product.recommendedQuantity / 1000)} pallets
        </span>
        <span className={`font-medium min-w-[60px] text-right ${getWeeksColor()}`}>
          {product.weeksSupply.toFixed(1)} wks
        </span>
      </div>
    </div>
  );
}
