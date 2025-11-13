'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { X, Info, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { EditableNumberCell } from './EditableNumberCell';
import { validateCurrentStock, validateWeeklyConsumption, validateTargetSOH } from '@/lib/validation';
import { calculateStockoutDate, calculateTargetStock } from '@/lib/calculations';
import { DEFAULT_TARGET_SOH } from '@/lib/constants';
import { toast } from 'sonner';
import type { Product } from '@/lib/types';

interface InventoryEditTableProps {
  products: Product[]; // Initial products from page (used for display while loading)
  onSave: () => void; // Callback to reload page after save
  onCancel: () => void;
  isFirstVisit: boolean;
}

interface EditableProduct extends Product {
  originalStock: number;
  originalConsumption: number;
  targetSOH?: number; // Per-product target SOH override
}

interface ErpProduct {
  id: number;
  sku: string;
  name: string;
  piecesPerPallet: number;
}

/**
 * Inventory Edit Table - Modal for setting up and updating inventory data
 *
 * Features:
 * - Fetches ERP products and existing inventory from API
 * - Displays editable table with pallet/carton conversion
 * - Validates input (warns about zero consumption)
 * - Saves to database via API
 * - Blocks dismissal on first visit until data is saved
 * - Keyboard navigation (Tab, Enter, Escape)
 *
 * @param products - Initial products for display during loading
 * @param onSave - Callback after successful save (typically reloads page)
 * @param onCancel - Callback when user cancels (ignored on first visit)
 * @param isFirstVisit - Whether this is first-time setup (blocks dismissal)
 */
type SaveStage = 'idle' | 'saving' | 'calculating' | 'success';

export function InventoryEditTable({
  products,
  onSave,
  onCancel,
  isFirstVisit,
}: InventoryEditTableProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [saveStage, setSaveStage] = useState<SaveStage>('idle');
  const [editableProducts, setEditableProducts] = useState<EditableProduct[]>([]);
  const [showWarningDialog, setShowWarningDialog] = useState(false);

  const [focusedCell, setFocusedCell] = useState<{
    rowIndex: number;
    column: 'stock' | 'consumption' | 'targetSOH';
  } | null>(null);

  const [viewingImage, setViewingImage] = useState<{ url: string; name: string } | null>(null);

  // Track timers for cleanup on unmount
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  // Cleanup timers on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, []);

  // Load data from API on mount
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/inventory/list');

        if (!response.ok) {
          throw new Error('Failed to load inventory data');
        }

        const data = await response.json();

        // Merge ERP products with inventory data (or smart defaults)
        const merged: EditableProduct[] = data.erpProducts.map((erpProduct: ErpProduct) => {
          const inventory = data.inventoryMap[erpProduct.sku];

          if (inventory) {
            // Has inventory data - use it
            const currentPallets = inventory.current_stock / erpProduct.piecesPerPallet;
            const weeklyPallets = inventory.weekly_consumption / erpProduct.piecesPerPallet;

            // Find matching product from initial products for additional fields
            const matchingProduct = products.find(p => p.sku === erpProduct.sku);

            return {
              ...erpProduct,
              brand: matchingProduct?.brand || '',
              type: matchingProduct?.type || '',
              size: matchingProduct?.size || '',
              packCount: matchingProduct?.packCount || '',
              imageUrl: matchingProduct?.imageUrl,
              currentStock: inventory.current_stock,
              weeklyConsumption: inventory.weekly_consumption,
              targetStock: 0,
              targetSOH: inventory.target_soh,
              runsOutDate: '',
              runsOutDays: 0,
              weeksRemaining: 0,
              status: 'HEALTHY' as const,
              currentPallets,
              weeklyPallets,
              originalStock: inventory.current_stock,
              originalConsumption: inventory.weekly_consumption,
            };
          } else {
            // No inventory data - use smart defaults
            const matchingProduct = products.find(p => p.sku === erpProduct.sku);
            const currentPallets = 1; // Default: 1 pallet
            const weeklyPallets = 0; // Default: 0 (must be set)
            const currentStock = Math.round(currentPallets * erpProduct.piecesPerPallet);
            const weeklyConsumption = Math.round(weeklyPallets * erpProduct.piecesPerPallet);

            return {
              ...erpProduct,
              brand: matchingProduct?.brand || '',
              type: matchingProduct?.type || '',
              size: matchingProduct?.size || '',
              packCount: matchingProduct?.packCount || '',
              imageUrl: matchingProduct?.imageUrl,
              currentStock,
              weeklyConsumption,
              targetStock: 0,
              targetSOH: DEFAULT_TARGET_SOH,
              runsOutDate: '',
              runsOutDays: 0,
              weeksRemaining: 0,
              status: 'CRITICAL' as const,
              currentPallets,
              weeklyPallets,
              originalStock: currentStock,
              originalConsumption: weeklyConsumption,
            };
          }
        });

        setEditableProducts(merged);
      } catch (error) {
        console.error('Failed to load inventory data:', error);
        toast.error('Failed to load inventory data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [products]);

  // Calculate validation states
  const getValidations = useCallback(() => {
    return editableProducts.map((product) => ({
      stock: validateCurrentStock(product.currentStock, product.weeklyConsumption),
      consumption: validateWeeklyConsumption(
        product.weeklyConsumption,
        product.originalConsumption
      ),
      targetSOH: validateTargetSOH(product.targetSOH || DEFAULT_TARGET_SOH),
    }));
  }, [editableProducts]);

  const validations = getValidations();

  // Check if there are any errors
  const hasErrors = validations.some(
    (v) => v.stock.state === 'error' || v.consumption.state === 'error' || v.targetSOH.state === 'error'
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
    if (v.targetSOH.state === 'warning') {
      acc.push(`${product.name}: ${v.targetSOH.message}`);
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
          // Convert pallets to cartons, rounding to nearest carton
          // Example: 0.33 pallets × 4,544 cartons/pallet = 1,499.52 → 1,500 cartons
          const cartons = Math.round(value * p.piecesPerPallet);
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

  const handleSave = async () => {
    if (hasErrors) {
      toast.error('Please fix all errors before saving');
      return;
    }

    // Show warning dialog if there are warnings
    if (warnings.length > 0) {
      setShowWarningDialog(true);
      return;
    }

    // No warnings, proceed with save
    await performSave();
  };

  const performSave = async () => {
    try {
      setSaveStage('saving');

      // Convert to API format (cartons)
      const dataToSave = editableProducts.map(p => ({
        sku: p.sku,
        currentStock: p.currentStock,
        weeklyConsumption: p.weeklyConsumption,
        targetSOH: p.targetSOH || DEFAULT_TARGET_SOH,
      }));

      // Show "calculating" stage after 1.5s to indicate progress
      const calculatingTimer = setTimeout(() => {
        setSaveStage('calculating');
      }, 1500);
      timersRef.current.push(calculatingTimer);

      const response = await fetch('/api/inventory/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: dataToSave }),
      });

      // Clear timer if request finishes early
      clearTimeout(calculatingTimer);
      timersRef.current = timersRef.current.filter(t => t !== calculatingTimer);

      if (!response.ok) {
        throw new Error('Failed to save inventory data');
      }

      // Show success state briefly
      setSaveStage('success');

      // Call onSave after brief success display
      const successTimer = setTimeout(() => {
        onSave();
      }, 800);
      timersRef.current.push(successTimer);
    } catch (error) {
      // Clear all timers on error
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];

      console.error('Failed to save inventory data:', error);
      toast.error('Failed to save inventory data. Please try again.');
      setSaveStage('idle');
    }
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
    } else if (e.key === 'Escape' && !isFirstVisit) {
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
            <h2 className="text-xl font-bold text-foreground">
              {isFirstVisit ? 'Set Up Inventory Data' : 'Update Inventory Data'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isFirstVisit
                ? 'Configure inventory for your products to get started'
                : 'Edit current stock, weekly consumption, and target SOH for your products'
              }
            </p>
          </div>
          {!isFirstVisit && (
            <Button variant="ghost" size="icon" onClick={onCancel} disabled={saveStage !== 'idle'}>
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-muted/30">
          <div className="text-sm text-muted-foreground">
            {isLoading ? (
              'Loading products...'
            ) : (
              `${editableProducts.length} products • Use Tab to navigate, Enter to move down${!isFirstVisit ? ', Esc to cancel' : ''}`
            )}
          </div>
          <div className="flex gap-2">
            {!isFirstVisit && (
              <Button variant="outline" onClick={onCancel} disabled={saveStage !== 'idle' || isLoading}>
                Cancel
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={hasErrors || saveStage !== 'idle' || isLoading}
              className={saveStage === 'success' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {saveStage === 'saving' && (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving inventory...
                </>
              )}
              {saveStage === 'calculating' && (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Recalculating recommendations...
                </>
              )}
              {saveStage === 'success' && (
                <>
                  <span className="mr-2">✓</span>
                  Saved!
                </>
              )}
              {saveStage === 'idle' && 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto relative">
          {/* Saving Overlay */}
          {saveStage !== 'idle' && (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="bg-card border border-border rounded-lg p-6 shadow-lg">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <div className="text-center">
                    <p className="font-medium">
                      {saveStage === 'saving' && 'Saving inventory...'}
                      {saveStage === 'calculating' && 'Recalculating recommendations...'}
                      {saveStage === 'success' && '✓ Complete!'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {saveStage === 'calculating' && 'This may take a few seconds...'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
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
                              {product.sku}
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
                            allowDecimals={true}
                            maxDecimals={1}
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
                            allowDecimals={true}
                            maxDecimals={1}
                          />
                          <div className="text-xs text-muted-foreground">
                            pallets/week = {product.weeklyConsumption.toLocaleString()} cartons/week
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <EditableNumberCell
                            value={product.targetSOH || DEFAULT_TARGET_SOH}
                            onChange={(value) => updateProduct(index, 'targetSOH', value)}
                            validation={validations[index].targetSOH}
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
          )}
        </div>

        {/* Footer Summary */}
        {!isLoading && (hasErrors || warnings.length > 0) && (
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

      {/* Warning Confirmation Dialog */}
      <AlertDialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              {warnings.length} Warning{warnings.length !== 1 ? 's' : ''} Detected
            </AlertDialogTitle>
            <div className="space-y-3 text-muted-foreground text-sm">
              <p>The following products have warnings:</p>
              <ul className="space-y-2">
                {warnings.slice(0, 5).map((warning, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{warning}</span>
                  </li>
                ))}
                {warnings.length > 5 && (
                  <li className="text-sm text-muted-foreground italic">
                    ...and {warnings.length - 5} more warning{warnings.length - 5 !== 1 ? 's' : ''}
                  </li>
                )}
              </ul>
              <p className="text-sm font-medium">Do you want to save anyway?</p>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowWarningDialog(false);
                performSave();
              }}
            >
              Save Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
