import { addDays, format } from "date-fns";
import type { ProductStatus, StockoutCalculation } from "./types";

/**
 * Calculate product status based on weeks remaining and target SOH
 *
 * Status Logic:
 * - CRITICAL (Red): weeksRemaining < targetSOH → Below desired stock level
 * - ORDER_NOW (Orange): targetSOH ≤ weeksRemaining < 16 → At target but should plan ahead
 * - HEALTHY (Green): weeksRemaining ≥ 16 → All orders in system, well stocked
 *
 * @param weeksRemaining - Current weeks of stock remaining
 * @param targetSOH - User's target Stock On Hand in weeks (default: 6)
 * @returns ProductStatus
 *
 * @see docs-dev/design/status-system.md for detailed documentation
 */
export function calculateProductStatus(
  weeksRemaining: number,
  targetSOH: number = 6
): ProductStatus {
  if (weeksRemaining < targetSOH) return "CRITICAL";
  if (weeksRemaining < 16) return "ORDER_NOW";
  return "HEALTHY";
}

/**
 * Calculate when a product will run out based on current stock and weekly consumption
 *
 * @param currentStock - Current stock level (in cartons)
 * @param weeklyConsumption - Weekly consumption rate (in cartons)
 * @param targetSOH - User's target Stock On Hand in weeks (default: 6)
 */
export function calculateStockoutDate(
  currentStock: number,
  weeklyConsumption: number,
  targetSOH: number = 6
): StockoutCalculation {
  if (weeklyConsumption <= 0) {
    return {
      runsOutDate: "Never",
      runsOutDays: Infinity,
      weeksRemaining: Infinity,
      status: "HEALTHY",
    };
  }

  const weeksRemaining = currentStock / weeklyConsumption;
  const daysRemaining = Math.floor(weeksRemaining * 7);
  const runsOutDate = addDays(new Date(), daysRemaining);

  return {
    runsOutDate: format(runsOutDate, "MMM dd, yyyy"),
    runsOutDays: daysRemaining,
    weeksRemaining,
    status: calculateProductStatus(weeksRemaining, targetSOH),
  };
}

/**
 * Calculate target stock level (default: 10 weeks of supply)
 */
export function calculateTargetStock(
  weeklyConsumption: number,
  weeksBuffer: number = 10
): number {
  return weeklyConsumption * weeksBuffer;
}

/**
 * Calculate recommended order quantity to reach target stock
 */
export function calculateRecommendedQuantity(
  currentStock: number,
  targetStock: number,
  pendingDeliveries: number = 0
): number {
  const needed = targetStock - currentStock - pendingDeliveries;
  return Math.max(0, Math.ceil(needed / 1000) * 1000); // Round up to nearest 1000
}

/**
 * Calculate stock level after delivery
 */
export function calculateAfterDeliveryStock(
  currentStock: number,
  deliveryQuantity: number
): number {
  return currentStock + deliveryQuantity;
}

/**
 * Calculate weeks of supply after delivery
 */
export function calculateWeeksSupply(
  stock: number,
  weeklyConsumption: number
): number {
  if (weeklyConsumption <= 0) return Infinity;
  return Number((stock / weeklyConsumption).toFixed(1));
}

/**
 * Calculate burn rate from shipment history (last 4 weeks)
 */
export function calculateBurnRate(
  shipmentHistory: { date: string; quantity: number }[]
): number {
  if (shipmentHistory.length === 0) return 0;

  const last4Weeks = shipmentHistory.slice(0, 4);
  const totalShipped = last4Weeks.reduce((sum, s) => sum + s.quantity, 0);
  const averagePerWeek = totalShipped / Math.min(last4Weeks.length, 4);

  return Math.round(averagePerWeek);
}

/**
 * Calculate order-by date (delivery date minus lead time)
 */
export function calculateOrderByDate(
  deliveryDate: Date,
  leadTimeDays: number = 45
): string {
  const orderByDate = addDays(deliveryDate, -leadTimeDays);
  return format(orderByDate, "MMM dd, yyyy");
}

/**
 * Group products into containers (90,000 cartons per container)
 */
export function groupProductsIntoContainers(
  products: { id: number; quantity: number }[],
  containerCapacity: number = 90000
): { products: typeof products; total: number }[] {
  const containers: { products: typeof products; total: number }[] = [];
  let currentContainer: typeof products = [];
  let currentTotal = 0;

  for (const product of products) {
    if (currentTotal + product.quantity > containerCapacity) {
      // Start new container
      if (currentContainer.length > 0) {
        containers.push({ products: currentContainer, total: currentTotal });
      }
      currentContainer = [product];
      currentTotal = product.quantity;
    } else {
      currentContainer.push(product);
      currentTotal += product.quantity;
    }
  }

  // Add last container
  if (currentContainer.length > 0) {
    containers.push({ products: currentContainer, total: currentTotal });
  }

  return containers;
}
