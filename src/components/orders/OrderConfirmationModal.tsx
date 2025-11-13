import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface OrderProduct {
  name: string;
  quantity: number;
  pallets: number;
}

interface OrderConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  containerNumber: number;
  products: OrderProduct[];
  totalCartons: number;
  totalPallets: number;
  shippingMethod: string;
  shippingTerm: string;
  customerOrderNumber?: string;
  estimatedDelivery: string;
  userEmail: string;
  isSubmitting: boolean;
}

export function OrderConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  containerNumber,
  products,
  totalCartons,
  totalPallets,
  shippingMethod,
  shippingTerm,
  customerOrderNumber,
  estimatedDelivery,
  userEmail,
  isSubmitting,
}: OrderConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Confirm Order</DialogTitle>
          <DialogDescription>
            Review your order details before submitting
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Container Info */}
          <div>
            <h3 className="font-semibold text-foreground mb-2">Container {containerNumber}</h3>
          </div>

          {/* Products */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-2">Products:</h4>
            <ul className="space-y-1.5 text-sm">
              {products.map((product, index) => (
                <li key={index} className="text-muted-foreground">
                  • {product.name}: <span className="font-medium text-foreground">{product.quantity.toLocaleString()} cartons</span> ({product.pallets.toFixed(1)} pallets)
                </li>
              ))}
            </ul>
          </div>

          {/* Total */}
          <div className="pt-2 border-t">
            <p className="text-base font-semibold text-foreground">
              Total: {totalCartons.toLocaleString()} cartons ({totalPallets.toFixed(1)} pallets)
            </p>
          </div>

          {/* Shipping Details */}
          <div className="pt-2 border-t">
            <h4 className="text-sm font-semibold text-foreground mb-2">Shipping Details:</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>
                Arrival: <span className="font-medium text-foreground">{shippingMethod}</span>
              </p>
              <p>
                Shipping Term: <span className="font-medium text-foreground">{shippingTerm}</span>
              </p>
              {customerOrderNumber && (
                <p>
                  Customer PO: <span className="font-medium text-foreground">{customerOrderNumber}</span>
                </p>
              )}
              <p>
                Estimated Delivery: <span className="font-medium text-foreground">{estimatedDelivery}</span>
              </p>
            </div>
          </div>

          {/* Email Notice */}
          <div className="pt-2 border-t bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-400">
              ℹ️ You&apos;ll receive email confirmation at: <span className="font-semibold">{userEmail}</span>
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Go Back
          </Button>
          <Button onClick={onConfirm} disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Confirm & Submit'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
