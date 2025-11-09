'use client';

import { use, useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ContainerSummary } from '@/components/orders/ContainerSummary';
import { ProductQuantityRow } from '@/components/orders/ProductQuantityRow';
import { ProductSelector } from '@/components/orders/ProductSelector';
import { ShippingDetailsForm } from '@/components/orders/ShippingDetailsForm';
import { OrderConfirmationModal } from '@/components/orders/OrderConfirmationModal';
import { validateCapacity, validateOrder } from '@/lib/validations';
import { mockContainers } from '@/lib/data/mock-containers';
import { mockProducts } from '@/lib/data/mock-products';
import { SCENARIOS } from '@/lib/data/mock-scenarios';
import { addDays, format } from 'date-fns';
import type { ContainerRecommendation, ShippingDetails, ShippingMethod, Order, Product, ContainerProduct } from '@/lib/types';

export default function OrderReviewPage({ params }: { params: Promise<{ containerId: string }> }) {
  const { containerId } = use(params);
  const router = useRouter();
  const { toast } = useToast();

  // Data state
  const [container, setContainer] = useState<ContainerRecommendation | null>(null);
  const [addedProducts, setAddedProducts] = useState<ContainerProduct[]>([]);

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

  // Load container data
  useEffect(() => {
    const loadContainer = () => {
      const demoState = typeof window !== 'undefined' ? localStorage.getItem('demoState') : 'healthy';

      const containerData = SCENARIOS[demoState as keyof typeof SCENARIOS]?.containers.find(
        (c) => c.id.toString() === containerId
      );

      if (containerData) {
        setContainer(containerData);

        // Initialize quantities from recommended amounts
        const initialQuantities: Record<string, number> = {};
        containerData.products.forEach((p) => {
          initialQuantities[p.productId.toString()] = p.recommendedQuantity;
        });
        setQuantities(initialQuantities);
      }
    };

    loadContainer();
  }, [containerId]);

  // Computed values
  const totalCartons = useMemo(() => {
    return Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
  }, [quantities]);

  const totalPallets = useMemo(() => {
    if (!container) return 0;
    // Use first product's piecesPerPallet as default, or 200
    const piecesPerPallet = 200; // Could be refined per product
    return Math.ceil(totalCartons / piecesPerPallet);
  }, [totalCartons, container]);

  const capacityValidation = useMemo(() => {
    return validateCapacity(totalCartons);
  }, [totalCartons]);

  const estimatedDelivery = useMemo(() => {
    if (shippingDetails.arrivalPreference === 'specific' && shippingDetails.specificDate) {
      return format(new Date(shippingDetails.specificDate), 'MMM dd, yyyy');
    }

    const weeksToAdd = shippingDetails.arrivalPreference === 'urgent' ? 4 : 6;
    return format(addDays(new Date(), weeksToAdd * 7), 'MMM dd, yyyy');
  }, [shippingDetails.arrivalPreference, shippingDetails.specificDate]);

  // All products in the order (container + added)
  const allProducts = useMemo(() => {
    if (!container) return [];
    return [...container.products, ...addedProducts];
  }, [container, addedProducts]);

  // Available products for adding (exclude ones already in order)
  const availableProducts = useMemo(() => {
    const productsInOrder = new Set(allProducts.map(p => p.productId));
    return mockProducts.filter(p => !productsInOrder.has(p.id));
  }, [allProducts]);

  // Handlers
  const handleProductAdd = (product: Product) => {
    // Convert Product to ContainerProduct format
    const containerProduct: ContainerProduct = {
      productId: product.id,
      productName: product.name,
      currentStock: product.currentStock,
      weeklyConsumption: product.weeklyConsumption,
      weeksSupply: product.weeksRemaining,
      runsOutDate: product.runsOutDate,
      recommendedQuantity: 0, // User will set this
      afterDeliveryStock: product.currentStock, // Will be updated when quantity changes
    };

    setAddedProducts(prev => [...prev, containerProduct]);
    setQuantities(prev => ({ ...prev, [product.id.toString()]: 0 }));

    toast({
      title: 'Product added',
      description: `${product.name} has been added to the order.`,
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
    if (!container) return;

    setIsSubmitting(true);

    try {
      // Generate order number
      const orderNumber = `CO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

      // Build order object
      const order: Partial<Order> = {
        id: orderNumber,
        orderNumber,
        type: 'IN_TRANSIT',
        orderedDate: format(new Date(), 'MMM dd, yyyy'),
        deliveryDate: estimatedDelivery,
        totalCartons,
        productCount: Object.values(quantities).filter(q => q > 0).length,
        products: allProducts
          .filter(p => quantities[p.productId.toString()] > 0)
          .map(p => ({
            ...p,
            recommendedQuantity: quantities[p.productId.toString()],
          })),
        status: 'IN_TRANSIT',
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
            <Button
              variant="link"
              size="sm"
              className="p-0 h-auto"
              onClick={() => router.push(`/orders?highlight=${orderNumber}`)}
            >
              View Order Details
            </Button>
          </div>
        ),
        duration: 8000,
      });

      // Navigate back to dashboard after short delay
      setTimeout(() => {
        router.push('/');
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

  if (!container) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-muted-foreground">Container not found</p>
        <Button variant="link" onClick={() => router.push('/')} className="mx-auto block mt-4">
          Return to Dashboard
        </Button>
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
            onClick={() => router.push('/')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-24">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6 max-w-4xl">
          {/* Page Title */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">Review Order</h1>
            <span className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wide">
              Status: Draft
            </span>
          </div>

          {/* Container Summary */}
          <ContainerSummary
            containerNumber={container.containerNumber}
            orderByDate={container.orderByDate}
            deliveryDate={container.deliveryDate}
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
                {allProducts.length} product{allProducts.length !== 1 ? 's' : ''}
              </span>
            </div>

            {allProducts.map((product) => (
              <ProductQuantityRow
                key={product.productId}
                product={product}
                quantity={quantities[product.productId.toString()] || 0}
                onQuantityChange={(qty) => handleQuantityChange(product.productId.toString(), qty)}
                piecesPerPallet={200}
              />
            ))}

            {/* Add Product Selector */}
            <ProductSelector
              availableProducts={availableProducts}
              onProductAdd={handleProductAdd}
            />
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
            <Button variant="outline" onClick={() => router.push('/')} className="w-full md:w-auto">
              Cancel
            </Button>
            <Button
              size="lg"
              onClick={handleApprove}
              disabled={!capacityValidation.isValid || isSubmitting}
              className="w-full md:w-auto"
            >
              {capacityValidation.warning === 'exceeds_capacity'
                ? 'EXCEEDS CAPACITY - REMOVE PRODUCTS'
                : `APPROVE ORDER — ${totalCartons.toLocaleString()} CARTONS`}
            </Button>
          </div>
        </div>
      </footer>

      {/* Confirmation Modal */}
      <OrderConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirmSubmit}
        containerNumber={container.containerNumber}
        products={allProducts
          .filter(p => quantities[p.productId.toString()] > 0)
          .map((p) => ({
            name: p.productName,
            quantity: quantities[p.productId.toString()],
            pallets: Math.ceil(quantities[p.productId.toString()] / 200),
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
