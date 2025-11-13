import type { ShippingDetails } from './types';
import { CONTAINER_CAPACITY } from './constants';

export interface CapacityValidation {
  isValid: boolean;
  currentVolume: number;
  maxVolume: number;
  percentFull: number;
  warning?: 'small_order' | 'near_capacity' | 'exceeds_capacity';
  warningMessage?: string;
}

/**
 * Validate container capacity based on VOLUME (m³), not cartons
 *
 * 40HC container capacity: 75.98 m³
 * Each product has different volume per carton, so we validate by total volume
 */
export function validateCapacity(totalVolume: number): CapacityValidation {
  const MAX_VOLUME = CONTAINER_CAPACITY; // 75.98 m³ for 40HC
  const SMALL_ORDER_THRESHOLD = MAX_VOLUME * 0.5; // 50% of capacity
  const NEAR_CAPACITY_THRESHOLD = MAX_VOLUME * 0.95; // 95% of capacity
  const TOLERANCE = 0.01; // Allow small floating point errors (0.01 m³ ≈ 0.013%)

  const percentFull = (totalVolume / MAX_VOLUME) * 100;

  // Only invalid if TRULY exceeds capacity (accounting for floating point precision)
  if (totalVolume > MAX_VOLUME + TOLERANCE) {
    return {
      isValid: false,
      currentVolume: totalVolume,
      maxVolume: MAX_VOLUME,
      percentFull,
      warning: 'exceeds_capacity',
      warningMessage: `EXCEEDS CAPACITY: ${totalVolume.toFixed(2)} m³ exceeds 40HC limit of ${MAX_VOLUME} m³. Remove products.`,
    };
  }

  if (totalVolume > NEAR_CAPACITY_THRESHOLD) {
    return {
      isValid: true,
      currentVolume: totalVolume,
      maxVolume: MAX_VOLUME,
      percentFull,
      warning: 'near_capacity',
      warningMessage: `Approaching capacity: ${percentFull.toFixed(0)}% full. Consider removing products.`,
    };
  }

  if (totalVolume < SMALL_ORDER_THRESHOLD && totalVolume > 0) {
    return {
      isValid: true,
      currentVolume: totalVolume,
      maxVolume: MAX_VOLUME,
      percentFull,
      warning: 'small_order',
      warningMessage: `Small order (${percentFull.toFixed(0)}% capacity). Consider adding more products to optimize shipping costs.`,
    };
  }

  return {
    isValid: true,
    currentVolume: totalVolume,
    maxVolume: MAX_VOLUME,
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

  // NOTE: Volume capacity validation is now handled in the review page
  // where we have access to product volume data

  // Shipping details validation
  const shippingErrors = validateShippingDetails(shippingDetails);
  Object.assign(errors, shippingErrors);

  return errors;
}
