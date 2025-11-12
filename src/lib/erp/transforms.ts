/**
 * ERP Data Transformation
 *
 * Converts ERP API responses to our app's data format.
 *
 * IMPORTANT - DATE HANDLING:
 * ERP returns dates in multiple formats (DD/MM/YYYY, YYYY-MM-DD, "ASAP", null).
 * All dates are normalized to "MMM dd, yyyy" format automatically.
 *
 * ASAP/Missing dates → orderedDate + 8 weeks
 * To change: See calculateAsapDate() function below
 *
 * Full documentation: docs/guides/erp-integration.md#date-normalization-critical
 */

import { calculateStockoutDate } from '@/lib/calculations';
import { parse, format, addWeeks } from 'date-fns';
import type { Product, Order } from '@/lib/types';
import type { ErpProduct, ErpOrder } from './types';

/**
 * Transform ERP product to app Product type
 * Note: ERP doesn't provide inventory levels - we'll need to get those separately
 * For now, return products with placeholder inventory values
 */
export function transformErpProduct(erpProduct: ErpProduct): Omit<Product, 'currentStock' | 'weeklyConsumption' | 'targetStock' | 'runsOutDate' | 'runsOutDays' | 'weeksRemaining' | 'status' | 'currentPallets' | 'weeklyPallets'> {
  return {
    id: erpProduct.id,
    name: erpProduct.name,
    brand: extractBrand(erpProduct.name),
    type: extractType(erpProduct.name),
    size: extractSize(erpProduct.name),
    packCount: erpProduct.packCount.toString(),
    sku: erpProduct.sku,
    imageUrl: erpProduct.imageUrl || undefined,
    piecesPerPallet: erpProduct.piecesPerPallet,
  };
}

/**
 * Complete product with inventory data
 * This will be called after fetching inventory levels (future task)
 */
export function completeProductWithInventory(
  product: Omit<Product, 'currentStock' | 'weeklyConsumption' | 'targetStock' | 'runsOutDate' | 'runsOutDays' | 'weeksRemaining' | 'status' | 'currentPallets' | 'weeklyPallets'>,
  currentStock: number,
  weeklyConsumption: number,
  targetSOH: number = 6
): Product {
  const stockoutCalc = calculateStockoutDate(currentStock, weeklyConsumption, targetSOH);
  const targetStock = weeklyConsumption * 10; // 10 weeks buffer

  return {
    ...product,
    currentStock,
    weeklyConsumption,
    targetStock,
    targetSOH,
    runsOutDate: stockoutCalc.runsOutDate,
    runsOutDays: stockoutCalc.runsOutDays,
    weeksRemaining: stockoutCalc.weeksRemaining,
    status: stockoutCalc.status,
    currentPallets: Math.floor(currentStock / product.piecesPerPallet),
    weeklyPallets: Number((weeklyConsumption / product.piecesPerPallet).toFixed(2)),
  };
}

/**
 * Normalize ERP date to standard "MMM dd, yyyy" format
 * Handles multiple date formats from ERP:
 * - "DD/MM/YYYY" (e.g., "26/01/2026")
 * - "YYYY-MM-DD" (e.g., "2025-11-23")
 * - "ASAP,Before Christmas" → orderedDate + 8 weeks
 * - Any other format → 8 weeks from ordered date + WARNING on screen
 *
 * CRITICAL: This function ALWAYS returns a valid date string. We never lose date info.
 */
function normalizeErpDate(erpDate: string | null, orderedDate: string): string {
  const originalDate = erpDate?.trim() || '';

  // Handle null/empty or ASAP cases
  if (!originalDate || originalDate.includes('ASAP') || originalDate.toLowerCase().includes('before christmas')) {
    console.log(`📅 [Date Parser] ASAP/Special date detected: "${originalDate}" → Using orderedDate + 8 weeks`);
    return calculateAsapDate(orderedDate);
  }

  try {
    // Try DD/MM/YYYY format (e.g., "26/01/2026")
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(originalDate)) {
      const parsed = parse(originalDate, 'dd/MM/yyyy', new Date());
      if (isValidDate(parsed)) {
        const formatted = format(parsed, 'MMM dd, yyyy');
        console.log(`📅 [Date Parser] DD/MM/YYYY: "${originalDate}" → "${formatted}"`);
        return formatted;
      }
    }

    // Try YYYY-MM-DD format (e.g., "2025-11-23")
    if (/^\d{4}-\d{2}-\d{2}$/.test(originalDate)) {
      const parsed = parse(originalDate, 'yyyy-MM-dd', new Date());
      if (isValidDate(parsed)) {
        const formatted = format(parsed, 'MMM dd, yyyy');
        console.log(`📅 [Date Parser] YYYY-MM-DD: "${originalDate}" → "${formatted}"`);
        return formatted;
      }
    }

    // Try D/M/YYYY or DD/M/YYYY or D/MM/YYYY (loose format)
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(originalDate)) {
      const parsed = parse(originalDate, 'd/M/yyyy', new Date());
      if (isValidDate(parsed)) {
        const formatted = format(parsed, 'MMM dd, yyyy');
        console.log(`📅 [Date Parser] D/M/YYYY (loose): "${originalDate}" → "${formatted}"`);
        return formatted;
      }
    }

    // Try MMM dd, yyyy format (already in correct format)
    if (/^[A-Za-z]{3}\s+\d{1,2},\s+\d{4}$/.test(originalDate)) {
      const parsed = parse(originalDate, 'MMM dd, yyyy', new Date());
      if (isValidDate(parsed)) {
        console.log(`📅 [Date Parser] Already correct format: "${originalDate}"`);
        return originalDate;
      }
    }

    // CRITICAL: Unknown format - use ASAP calculation but LOG WARNING
    console.warn(`⚠️ [Date Parser] UNKNOWN FORMAT: "${originalDate}" - Using orderedDate + 8 weeks as fallback. PLEASE CHECK ERP DATA!`);
    return calculateAsapDate(orderedDate);

  } catch (error) {
    // CRITICAL: Parsing error - use ASAP calculation but LOG ERROR
    console.error(`❌ [Date Parser] PARSING ERROR for "${originalDate}":`, error);
    console.error(`❌ Using orderedDate + 8 weeks as fallback. Original date: "${originalDate}"`);
    return calculateAsapDate(orderedDate);
  }
}

/**
 * Validate that a date is actually valid (not Invalid Date)
 */
function isValidDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Calculate ASAP delivery date (orderedDate + 8 weeks)
 *
 * WHY 8 WEEKS?
 * - Manufacturing: ~3-4 weeks
 * - Shipping: ~3-4 weeks
 * - Buffer: ~1 week
 * Total: ~8 weeks typical lead time
 *
 * HOW TO CHANGE:
 * Change the number in addWeeks() below. This is the ONLY place to change it.
 * DO NOT hardcode ASAP calculation anywhere else in the codebase.
 *
 * See: docs/guides/erp-integration.md#date-normalization-critical
 *
 * BULLETPROOF: This function ALWAYS returns a valid date, no matter what.
 */
function calculateAsapDate(orderedDate: string): string {
  try {
    let orderDate: Date | null = null;

    // Try to parse ordered date (handle multiple formats)
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(orderedDate)) {
      const parsed = parse(orderedDate, 'dd/MM/yyyy', new Date());
      if (isValidDate(parsed)) orderDate = parsed;
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(orderedDate)) {
      const parsed = parse(orderedDate, 'yyyy-MM-dd', new Date());
      if (isValidDate(parsed)) orderDate = parsed;
    } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(orderedDate)) {
      const parsed = parse(orderedDate, 'd/M/yyyy', new Date());
      if (isValidDate(parsed)) orderDate = parsed;
    }

    // If we couldn't parse ordered date, use today
    if (!orderDate) {
      console.warn(`⚠️ [Date Parser] Could not parse orderedDate "${orderedDate}", using today as base`);
      orderDate = new Date();
    }

    // Add 8 weeks for ASAP
    const asapDate = addWeeks(orderDate, 8);

    if (!isValidDate(asapDate)) {
      // This should never happen, but just in case...
      throw new Error('ASAP date calculation resulted in invalid date');
    }

    return format(asapDate, 'MMM dd, yyyy');

  } catch (error) {
    // ABSOLUTE LAST RESORT: Today + 8 weeks
    console.error(`❌ [Date Parser] CRITICAL: Failed to calculate ASAP date from "${orderedDate}"`, error);
    console.error(`❌ Using TODAY + 8 weeks as absolute fallback`);

    const today = new Date();
    const fallbackDate = addWeeks(today, 8);
    return format(fallbackDate, 'MMM dd, yyyy');
  }
}

/**
 * Transform ERP order to app Order type
 */
export function transformErpOrder(erpOrder: ErpOrder): Order {
  const totalCartons = erpOrder.lines.reduce((sum, line) => sum + line.qty, 0);

  // Preserve original ERP date for reference
  const originalErpDate = erpOrder.eta || erpOrder.requiredEta;

  // Normalize delivery date to "MMM dd, yyyy" format
  const deliveryDate = normalizeErpDate(
    originalErpDate,
    erpOrder.orderedDate
  );

  // Preserve original date in comments if it was unusual
  let comments = erpOrder.comments || '';
  if (originalErpDate && (originalErpDate.includes('ASAP') || originalErpDate.toLowerCase().includes('before christmas') || !originalErpDate.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/) && !originalErpDate.match(/^\d{4}-\d{2}-\d{2}$/))) {
    const dateNote = `[Original ERP date: "${originalErpDate}"]`;
    comments = comments ? `${comments} ${dateNote}` : dateNote;
  }

  return {
    id: erpOrder.id.toString(),
    orderNumber: erpOrder.orderNumber,
    type: mapErpStatusToOrderType(erpOrder.status),
    orderedDate: erpOrder.orderedDate,
    deliveryDate,
    totalCartons,
    productCount: erpOrder.lines.length,
    products: erpOrder.lines.map(line => ({
      productId: 0, // We don't have productId from ERP, will need to map by SKU
      sku: line.sku,
      productName: line.productName,
      currentStock: 0,
      weeklyConsumption: 0,
      recommendedQuantity: line.qty,
      afterDeliveryStock: 0,
      weeksSupply: 0,
      runsOutDate: '',
    })),
    status: mapErpStatusToOrderType(erpOrder.status),
    erpStatus: erpOrder.status, // Pass through raw ERP status
    shippingTerm: erpOrder.shippingTerm as 'DDP' | 'FOB' | 'CIF',
    customerOrderNumber: erpOrder.customerOrderNumber || undefined,
    comments: comments || undefined,
    shippingMethod: undefined,
    urgency: erpOrder.status === 'APPROVED' ? 'URGENT' : null,
  };
}

// Helper functions

function extractBrand(name: string): string {
  // Extract brand from product name (e.g., "Woolworths" from "Woolworths Free Range...")
  const match = name.match(/^([A-Za-z\s]+)/);
  return match ? match[1].trim() : 'Unknown';
}

function extractType(name: string): string {
  // Extract type (Free Range, Cage Free, etc.)
  if (name.includes('Free Range')) return 'Free Range';
  if (name.includes('Cage Free')) return 'Cage Free';
  return 'Standard';
}

function extractSize(name: string): string {
  // Extract size (e.g., "600g", "12-Egg")
  const weightMatch = name.match(/(\d+g)/);
  const eggMatch = name.match(/(\d+-Egg)/);

  if (weightMatch) return weightMatch[1];
  if (eggMatch) return eggMatch[1];
  return 'Standard';
}

function mapErpStatusToOrderType(status: ErpOrder['status']): Order['type'] {
  switch (status) {
    case 'APPROVED':
    case 'IN_TRANSIT':
      return 'IN_TRANSIT';
    case 'COMPLETE':
      return 'DELIVERED';
    default:
      return 'IN_TRANSIT';
  }
}
