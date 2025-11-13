'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ContainerSummary } from '@/components/orders/ContainerSummary';
import { ProductQuantityRow } from '@/components/orders/ProductQuantityRow';
import { ProductSelector, type ProductSelectorRef } from '@/components/orders/ProductSelector';
import { ShippingDetailsForm } from '@/components/orders/ShippingDetailsForm';
import { OrderConfirmationModal } from '@/components/orders/OrderConfirmationModal';
import { validateCapacity, validateOrder } from '@/lib/validations';
import { addDays, format } from 'date-fns';
import type { ShippingDetails, Product, ContainerProduct } from '@/lib/types';

export default function NewOrderPage() {
  const router = useRouter();
  const { toast } = useToast();
  const productSelectorRef = useRef<ProductSelectorRef>(null);

  // Data state
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [orderProducts, setOrderProducts] = useState<ContainerProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [shippingDetails, setShippingDetails] = useState<ShippingDetails>({
    arrivalPreference: 'standard',
    shippingTerm: null,
    customerOrderNumber: '',
    comments: '',
  });

  // UI state
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load available products from ERP
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true);

        // Fetch products from API (we'll create this endpoint)
        const response = await fetch('/api/products');
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }

        const data = await response.json();
        setAvailableProducts(data.products || []);
      } catch (error) {
        console.error('Failed to load products:', error);
        toast({
          title: 'Error loading products',
          description: 'Failed to load product data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, [toast]);

  // Computed values
  const totalCartons = useMemo(() => {
    return Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
  }, [quantities]);

  const totalPallets = useMemo(() => {
    return orderProducts.reduce((sum, product) => {
      const productQuantity = quantities[product.productId.toString()] || 0;
      const productPallets = productQuantity / product.piecesPerPallet;
      return sum + productPallets;
    }, 0);
  }, [quantities, orderProducts]);

  const totalVolume = useMemo(() => {
    return orderProducts.reduce((sum, product) => {
      const productQuantity = quantities[product.productId.toString()] || 0;
      const volumePerCarton = product.volumePerCarton || 0;
      return sum + (productQuantity * volumePerCarton);
    }, 0);
  }, [quantities, orderProducts]);

  const capacityValidation = useMemo(() => {
    // For new orders, require 100%+ capacity
    return validateCapacity(totalVolume, true);
  }, [totalVolume]);

  const estimatedDelivery = useMemo(() => {
    if (shippingDetails.arrivalPreference === 'specific' && shippingDetails.specificDate) {
      return format(new Date(shippingDetails.specificDate), 'MMM dd, yyyy');
    }

    const weeksToAdd = shippingDetails.arrivalPreference === 'urgent' ? 4 : 6;
    return format(addDays(new Date(), weeksToAdd * 7), 'MMM dd, yyyy');
  }, [shippingDetails.arrivalPreference, shippingDetails.specificDate]);

  // Available products (exclude ones already added)
  const filteredAvailableProducts = useMemo(() => {
    const productsInOrder = new Set(orderProducts.map(p => p.productId));
    return availableProducts.filter(p => !productsInOrder.has(p.id));
  }, [availableProducts, orderProducts]);

  // Handlers
  const handleProductAdd = (product: Product) => {
    // Calculate smart default quantity in PALLETS (whole pallets only):
    // - If has weekly consumption: 4 weeks worth (rounded up to nearest pallet)
    // - Otherwise: 1 pallet minimum
    let defaultQuantity = product.piecesPerPallet; // Start with 1 pallet
    if (product.weeklyConsumption > 0) {
      const fourWeeksWorth = product.weeklyConsumption * 4;
      // Round up to nearest whole pallet
      const palletsNeeded = Math.ceil(fourWeeksWorth / product.piecesPerPallet);
      defaultQuantity = palletsNeeded * product.piecesPerPallet;
    }

    // Convert Product to ContainerProduct format
    const containerProduct: ContainerProduct = {
      productId: product.id,
      sku: product.sku,
      productName: product.name,
      currentStock: product.currentStock,
      weeklyConsumption: product.weeklyConsumption,
      weeksSupply: product.weeksRemaining,
      runsOutDate: product.runsOutDate,
      recommendedQuantity: defaultQuantity,
      afterDeliveryStock: product.currentStock + defaultQuantity,
      piecesPerPallet: product.piecesPerPallet,
      volumePerCarton: product.volumePerPallet / product.piecesPerPallet,
      imageUrl: product.imageUrl,
    };

    setOrderProducts(prev => [...prev, containerProduct]);
    setQuantities(prev => ({ ...prev, [product.id.toString()]: defaultQuantity }));

    const pallets = defaultQuantity / product.piecesPerPallet;
    toast({
      title: 'Product added',
      description: `${product.name} added with ${pallets.toFixed(1)} pallets.`,
    });
  };

  const handleProductRemove = (productId: number) => {
    setOrderProducts(prev => prev.filter(p => p.productId !== productId));
    setQuantities(prev => {
      const newQuantities = { ...prev };
      delete newQuantities[productId.toString()];
      return newQuantities;
    });
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    setQuantities((prev) => ({ ...prev, [productId]: quantity }));
  };

  const handleShippingChange = (updates: Partial<ShippingDetails>) => {
    setShippingDetails((prev) => ({ ...prev, ...updates }));
  };

  const handleApprove = () => {
    const validationErrors = validateOrder(quantities, shippingDetails);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast({
        title: 'Please fix errors',
        description: 'Some required fields are missing or invalid.',
        variant: 'destructive',
      });
      return;
    }

    setErrors({});
    setShowConfirmation(true);
  };

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Generate order number
      const orderNumber = `CO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

      // Build order object (in real implementation, submit to API)
      const order = {
        orderNumber,
        orderedDate: format(new Date(), 'MMM dd, yyyy'),
        deliveryDate: estimatedDelivery,
        totalCartons,
        productCount: Object.values(quantities).filter(q => q > 0).length,
        products: orderProducts
          .filter(p => quantities[p.productId.toString()] > 0)
          .map(p => ({
            ...p,
            recommendedQuantity: quantities[p.productId.toString()],
          })),
        shippingTerm: shippingDetails.shippingTerm!,
        customerOrderNumber: shippingDetails.customerOrderNumber,
        comments: shippingDetails.comments,
        shippingMethod: 'Sea freight',
      };

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Close modal
      setShowConfirmation(false);

      // Show success toast
      toast({
        title: '✓ Order submitted successfully',
        description: (
          <div className="space-y-2">
            <p>Order #{orderNumber}</p>
            <p className="text-sm text-muted-foreground">
              Confirmation email sent
            </p>
          </div>
        ),
        duration: 8000,
      });

      // Navigate back to orders
      setTimeout(() => {
        router.push('/orders?tab=live');
      }, 2000);
    } catch (error) {
      console.error('Order submission failed:', error);
      setErrors({ submit: 'Failed to submit order. Please try again.' });
      toast({
        title: 'Submission failed',
        description: 'Failed to submit order. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getShippingMethodLabel = () => {
    switch (shippingDetails.arrivalPreference) {
      case 'urgent':
        return 'Urgent';
      case 'specific':
        return `Specific Date (${shippingDetails.specificDate ? format(new Date(shippingDetails.specificDate), 'MMM dd') : 'Not set'})`;
      default:
        return 'Standard (~6 weeks)';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-muted-foreground">Loading products...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 bg-background border-b z-10">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/orders')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-24">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6 max-w-4xl">
          {/* Page Title */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">Create New Order</h1>
            <span className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wide">
              Status: Draft
            </span>
          </div>

          {/* Container Summary */}
          <ContainerSummary
            containerNumber={null}
            orderByDate={null}
            deliveryDate={estimatedDelivery}
            totalCartons={totalCartons}
            totalPallets={totalPallets}
            capacityValidation={capacityValidation}
          />

          {/* Products */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                Products in This Order
              </h2>
              <span className="text-xs text-muted-foreground">
                {orderProducts.length} product{orderProducts.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Add Product Selector - Show prominently when empty */}
            {orderProducts.length === 0 ? (
              <div className="space-y-3">
                <div
                  className="border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 px-6 py-10 text-center cursor-pointer hover:bg-blue-100/50 dark:hover:bg-blue-950/30 hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
                  onClick={() => productSelectorRef.current?.openDropdown()}
                >
                  <div className="mb-4">
                    <svg className="mx-auto h-12 w-12 text-blue-400 dark:text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <p className="text-lg font-semibold text-foreground mb-1">
                    Add products to start your order
                  </p>
                  <p className="text-sm text-muted-foreground mb-6">
                    Click the dropdown below to select products
                  </p>
                  <div
                    className="max-w-md mx-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <ProductSelector
                      ref={productSelectorRef}
                      availableProducts={filteredAvailableProducts}
                      onProductAdd={handleProductAdd}
                      isEmptyState={true}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <>
                {orderProducts.map((product) => (
                  <ProductQuantityRow
                    key={product.productId}
                    product={product}
                    quantity={quantities[product.productId.toString()] || 0}
                    onQuantityChange={(qty) => handleQuantityChange(product.productId.toString(), qty)}
                    piecesPerPallet={product.piecesPerPallet}
                    onRemove={() => handleProductRemove(product.productId)}
                    unit="pallets"
                  />
                ))}
                {/* Add Product Selector - Compact version when products exist */}
                <ProductSelector
                  availableProducts={filteredAvailableProducts}
                  onProductAdd={handleProductAdd}
                  isEmptyState={false}
                />
              </>
            )}
          </div>

          {/* Shipping Details */}
          <ShippingDetailsForm
            values={shippingDetails}
            onChange={handleShippingChange}
            errors={errors}
          />
        </div>
      </main>

      {/* Footer Actions */}
      <footer className="sticky bottom-0 bg-background border-t z-10">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <div className="flex flex-col md:flex-row gap-3 md:justify-between">
            <Button variant="outline" onClick={() => router.push('/orders')} className="w-full md:w-auto">
              Cancel
            </Button>
            <Button
              size="lg"
              onClick={handleApprove}
              disabled={!capacityValidation.isValid || isSubmitting || orderProducts.length === 0}
              className="w-full md:w-auto"
            >
              {orderProducts.length === 0
                ? 'ADD PRODUCTS TO CONTINUE'
                : capacityValidation.warning === 'exceeds_capacity'
                ? 'EXCEEDS CAPACITY - REMOVE PALLETS'
                : capacityValidation.warning === 'small_order' && !capacityValidation.isValid
                ? `ADD MORE PALLETS - ${capacityValidation.percentFull.toFixed(0)}% FULL`
                : `APPROVE ORDER — ${totalPallets.toFixed(1)} PALLETS`}
            </Button>
          </div>
        </div>
      </footer>

      {/* Confirmation Modal */}
      <OrderConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirmSubmit}
        containerNumber={null}
        products={orderProducts
          .filter(p => quantities[p.productId.toString()] > 0)
          .map((p) => ({
            name: p.productName,
            quantity: quantities[p.productId.toString()],
            pallets: quantities[p.productId.toString()] / p.piecesPerPallet,
          }))}
        totalCartons={totalCartons}
        totalPallets={totalPallets}
        shippingMethod={getShippingMethodLabel()}
        shippingTerm={shippingDetails.shippingTerm || ''}
        customerOrderNumber={shippingDetails.customerOrderNumber}
        estimatedDelivery={estimatedDelivery}
        userEmail="farm@example.com"
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
