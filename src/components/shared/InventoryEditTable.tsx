'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
                      <div className="text-sm font-medium text-foreground truncate">
                        {product.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {product.size} - {product.packCount}
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
    </div>
  );
}
