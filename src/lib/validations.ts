import type { ShippingDetails } from './types';

export interface CapacityValidation {
  isValid: boolean;
  currentCartons: number;
  maxCartons: number;
  percentFull: number;
  warning?: 'small_order' | 'near_capacity' | 'exceeds_capacity';
  warningMessage?: string;
}

export function validateCapacity(totalCartons: number): CapacityValidation {
  const MAX_CAPACITY = 95000;
  const SMALL_ORDER_THRESHOLD = 50000;
  const NEAR_CAPACITY_THRESHOLD = 90000;

  const percentFull = (totalCartons / MAX_CAPACITY) * 100;

  if (totalCartons > MAX_CAPACITY) {
    return {
      isValid: false,
      currentCartons: totalCartons,
      maxCartons: MAX_CAPACITY,
      percentFull,
      warning: 'exceeds_capacity',
      warningMessage: `EXCEEDS CAPACITY: ${totalCartons.toLocaleString()} cartons exceeds limit of ${MAX_CAPACITY.toLocaleString()}. Remove products.`,
    };
  }

  if (totalCartons > NEAR_CAPACITY_THRESHOLD) {
    return {
      isValid: true,
      currentCartons: totalCartons,
      maxCartons: MAX_CAPACITY,
      percentFull,
      warning: 'near_capacity',
      warningMessage: `Approaching capacity: ${percentFull.toFixed(0)}% full. Consider removing products.`,
    };
  }

  if (totalCartons < SMALL_ORDER_THRESHOLD && totalCartons > 0) {
    return {
      isValid: true,
      currentCartons: totalCartons,
      maxCartons: MAX_CAPACITY,
      percentFull,
      warning: 'small_order',
      warningMessage: `Small order (${percentFull.toFixed(0)}% capacity). Consider adding more products to optimize shipping costs.`,
    };
  }

  return {
    isValid: true,
    currentCartons: totalCartons,
    maxCartons: MAX_CAPACITY,
    percentFull,
  };
}

export function validateShippingDetails(details: ShippingDetails): Record<string, string> {
  const errors: Record<string, string> = {};

  // Required: Shipping term
  if (!details.shippingTerm) {
    errors.shippingTerm = 'Shipping term is required';
  }

  // Required: Date if "specific" arrival preference
  if (details.arrivalPreference === 'specific') {
    if (!details.specificDate) {
      errors.specificDate = 'Please select a delivery date';
    } else {
      const minDate = new Date();
      minDate.setDate(minDate.getDate() + 28); // Minimum 4 weeks

      if (new Date(details.specificDate) < minDate) {
        errors.specificDate = 'Delivery date must be at least 4 weeks from today';
      }
    }
  }

  // Optional but length-limited: Comments
  if (details.comments && details.comments.length > 230) {
    errors.comments = 'Comments must be 230 characters or less';
  }

  // Optional but format-limited: Customer order number
  if (details.customerOrderNumber && details.customerOrderNumber.length > 50) {
    errors.customerOrderNumber = 'Order number must be 50 characters or less';
  }

  return errors;
}

export function validateOrder(
  quantities: Record<string, number>,
  shippingDetails: ShippingDetails
): Record<string, string> {
  const errors: Record<string, string> = {};

  // At least one product with quantity > 0
  const totalQuantity = Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
  if (totalQuantity === 0) {
    errors.products = 'Order must contain at least one product';
  }

  // Capacity validation
  const capacityValidation = validateCapacity(totalQuantity);
  if (!capacityValidation.isValid) {
    errors.capacity = capacityValidation.warningMessage || 'Order exceeds capacity';
  }

  // Shipping details validation
  const shippingErrors = validateShippingDetails(shippingDetails);
  Object.assign(errors, shippingErrors);

  return errors;
}
