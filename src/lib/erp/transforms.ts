import { calculateStockoutDate } from '@/lib/calculations';
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
 * Transform ERP order to app Order type
 */
export function transformErpOrder(erpOrder: ErpOrder): Order {
  const totalCartons = erpOrder.lines.reduce((sum, line) => sum + line.qty, 0);

  return {
    id: erpOrder.id.toString(),
    orderNumber: erpOrder.orderNumber,
    type: mapErpStatusToOrderType(erpOrder.status),
    orderedDate: erpOrder.orderedDate,
    deliveryDate: erpOrder.eta || erpOrder.requiredEta,
    totalCartons,
    productCount: erpOrder.lines.length,
    products: erpOrder.lines.map(line => ({
      productId: 0, // We don't have productId from ERP, will need to map by SKU
      productName: line.productName,
      currentStock: 0,
      weeklyConsumption: 0,
      recommendedQuantity: line.qty,
      afterDeliveryStock: 0,
      weeksSupply: 0,
      runsOutDate: '',
    })),
    status: mapErpStatusToOrderType(erpOrder.status),
    shippingTerm: erpOrder.shippingTerm as 'DDP' | 'FOB' | 'CIF',
    customerOrderNumber: erpOrder.customerOrderNumber || undefined,
    comments: erpOrder.comments || undefined,
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
