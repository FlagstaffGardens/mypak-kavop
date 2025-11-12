'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { X, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EditableNumberCell } from './EditableNumberCell';
import { validateCurrentStock, validateWeeklyConsumption } from '@/lib/validation';
import { calculateStockoutDate, calculateTargetStock } from '@/lib/calculations';
import type { Product } from '@/lib/types';

interface InventoryEditTableProps {
  products: Product[];
  onSave: (products: Product[]) => void;
  onCancel: () => void;
}

interface EditableProduct extends Product {
  originalStock: number;
  originalConsumption: number;
  targetSOH?: number; // Per-product target SOH override (default: 6)
}

export function InventoryEditTable({
  products,
  onSave,
  onCancel,
}: InventoryEditTableProps) {
  // Initialize editable products with original values for validation
  const [editableProducts, setEditableProducts] = useState<EditableProduct[]>(
    products.map((p) => ({
      ...p,
      originalStock: p.currentStock,
      originalConsumption: p.weeklyConsumption,
      targetSOH: p.targetSOH || 6, // Default to 6 weeks if not set
    }))
  );

  const [focusedCell, setFocusedCell] = useState<{
    rowIndex: number;
    column: 'stock' | 'consumption' | 'targetSOH';
  } | null>(null);

  const [viewingImage, setViewingImage] = useState<{ url: string; name: string } | null>(null);

  // Calculate validation states
  const getValidations = useCallback(() => {
    return editableProducts.map((product) => ({
      stock: validateCurrentStock(product.currentStock, product.weeklyConsumption),
      consumption: validateWeeklyConsumption(
        product.weeklyConsumption,
        product.originalConsumption
      ),
    }));
  }, [editableProducts]);

  const validations = getValidations();

  // Check if there are any errors
  const hasErrors = validations.some(
    (v) => v.stock.state === 'error' || v.consumption.state === 'error'
  );

  // Check if there are any warnings
  const warnings = validations.reduce<string[]>((acc, v, index) => {
    const product = editableProducts[index];
    if (v.stock.state === 'warning') {
      acc.push(`${product.name}: ${v.stock.message}`);
    }
    if (v.consumption.state === 'warning') {
      acc.push(`${product.name}: ${v.consumption.message}`);
    }
    return acc;
  }, []);

  const updateProduct = (index: number, field: 'currentStock' | 'weeklyConsumption' | 'targetSOH', value: number) => {
    setEditableProducts((prev) =>
      prev.map((p, i) => {
        if (i === index) {
          if (field === 'targetSOH') {
            return { ...p, targetSOH: value };
          }
          // Convert pallets to cartons
          const cartons = value * p.piecesPerPallet;
          if (field === 'currentStock') {
            return { ...p, currentStock: cartons, currentPallets: value };
          } else {
            return { ...p, weeklyConsumption: cartons, weeklyPallets: value };
          }
        }
        return p;
      })
    );
  };

  const handleSave = () => {
    if (hasErrors) {
      alert('Please fix all errors before saving');
      return;
    }

    if (warnings.length > 0) {
      const confirmed = confirm(
        `⚠️ ${warnings.length} warning(s) detected:\n\n${warnings.slice(0, 5).join('\n')}\n\nSave anyway?`
      );
      if (!confirmed) return;
    }

    // Recalculate derived fields and remove validation fields
    const productsToSave = editableProducts.map(({ originalStock, originalConsumption, ...product }) => {
      // Recalculate stockout metrics
      const stockoutCalc = calculateStockoutDate(product.currentStock, product.weeklyConsumption);

      // Recalculate target stock (10 weeks buffer)
      const targetStock = calculateTargetStock(product.weeklyConsumption, 10);

      return {
        ...product,
        runsOutDate: stockoutCalc.runsOutDate,
        runsOutDays: stockoutCalc.runsOutDays,
        weeksRemaining: stockoutCalc.weeksRemaining,
        status: stockoutCalc.status,
        targetStock,
      };
    });

    onSave(productsToSave);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent,
    rowIndex: number,
    column: 'stock' | 'consumption' | 'targetSOH'
  ) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        // Shift+Tab: Move left
        if (column === 'targetSOH') {
          setFocusedCell({ rowIndex, column: 'consumption' });
        } else if (column === 'consumption') {
          setFocusedCell({ rowIndex, column: 'stock' });
        } else if (rowIndex > 0) {
          setFocusedCell({ rowIndex: rowIndex - 1, column: 'targetSOH' });
        }
      } else {
        // Tab: Move right
        if (column === 'stock') {
          setFocusedCell({ rowIndex, column: 'consumption' });
        } else if (column === 'consumption') {
          setFocusedCell({ rowIndex, column: 'targetSOH' });
        } else if (rowIndex < editableProducts.length - 1) {
          setFocusedCell({ rowIndex: rowIndex + 1, column: 'stock' });
        }
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      // Enter: Move down
      if (rowIndex < editableProducts.length - 1) {
        setFocusedCell({ rowIndex: rowIndex + 1, column });
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };


  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-xl font-bold text-foreground">Update Inventory Data</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Edit current stock, weekly consumption, and target SOH for your products
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-muted/30">
          <div className="text-sm text-muted-foreground">
            {editableProducts.length} products • Use Tab to navigate, Enter to move down, Esc to cancel
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={hasErrors}>
              Save Changes
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-card z-10 border-b border-border shadow-sm">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold text-foreground w-[40%]">
                  Product Name
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-foreground w-[25%]">
                  Current Stock (Pallets)
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-foreground w-[25%]">
                  Weekly Consumption (Pallets)
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-foreground w-[10%]">
                  Target SOH (Weeks)
                </th>
              </tr>
            </thead>
            <tbody>
              {editableProducts.map((product, index) => {
                const isStockFocused =
                  focusedCell?.rowIndex === index && focusedCell?.column === 'stock';
                const isConsumptionFocused =
                  focusedCell?.rowIndex === index && focusedCell?.column === 'consumption';
                const isTargetSOHFocused =
                  focusedCell?.rowIndex === index && focusedCell?.column === 'targetSOH';

                return (
                  <tr
                    key={product.id}
                    className="border-b border-border hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">
                            {product.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {product.size} - {product.packCount}
                          </div>
                        </div>
                        {product.imageUrl && (
                          <button
                            onClick={() => setViewingImage({ url: product.imageUrl!, name: product.name })}
                            className="flex-shrink-0 mt-0.5"
                          >
                            <Info className="h-4 w-4 text-blue-500 hover:text-blue-600 cursor-pointer transition-colors" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <EditableNumberCell
                          value={product.currentPallets}
                          onChange={(value) => updateProduct(index, 'currentStock', value)}
                          validation={validations[index].stock}
                          onKeyDown={(e) => handleKeyDown(e, index, 'stock')}
                          autoFocus={isStockFocused}
                        />
                        <div className="text-xs text-muted-foreground">
                          pallets = {product.currentStock.toLocaleString()} cartons ({product.piecesPerPallet.toLocaleString()}/pallet)
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <EditableNumberCell
                          value={product.weeklyPallets}
                          onChange={(value) => updateProduct(index, 'weeklyConsumption', value)}
                          validation={validations[index].consumption}
                          onKeyDown={(e) => handleKeyDown(e, index, 'consumption')}
                          autoFocus={isConsumptionFocused}
                        />
                        <div className="text-xs text-muted-foreground">
                          pallets/week = {product.weeklyConsumption.toLocaleString()} cartons/week
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <EditableNumberCell
                          value={product.targetSOH || 6}
                          onChange={(value) => updateProduct(index, 'targetSOH', value)}
                          validation={{ state: 'valid', message: '' }}
                          onKeyDown={(e) => handleKeyDown(e, index, 'targetSOH')}
                          autoFocus={isTargetSOHFocused}
                        />
                        <div className="text-xs text-muted-foreground">
                          weeks target
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        {(hasErrors || warnings.length > 0) && (
          <div className="px-6 py-3 border-t border-border bg-muted/30">
            {hasErrors && (
              <div className="text-sm text-red-600 font-medium">
                ⚠️ Please fix errors before saving
              </div>
            )}
            {!hasErrors && warnings.length > 0 && (
              <div className="text-sm text-amber-600 font-medium">
                ⚠️ {warnings.length} warning(s) - review before saving
              </div>
            )}
          </div>
        )}
      </div>

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
    </div>
  );
}
