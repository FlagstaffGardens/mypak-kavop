/**
 * Temporary inventory service
 * TODO: Replace with real inventory tracking from ERP or separate inventory system
 *
 * For now, we'll use placeholder values based on product ID
 * This simulates inventory levels until we have real data
 */

interface InventoryData {
  currentStock: number;
  weeklyConsumption: number;
}

/**
 * Get inventory data for a product
 * TEMPORARY: Returns mock data based on product ID
 */
export function getInventoryForProduct(productId: number): InventoryData {
  // Generate consistent mock data based on product ID
  const seed = productId;

  // Random but consistent values
  const currentStock = 5000 + (seed % 50000);
  const weeklyConsumption = 500 + (seed % 3000);

  return {
    currentStock,
    weeklyConsumption,
  };
}

/**
 * Batch get inventory for multiple products
 */
export function getInventoryForProducts(productIds: number[]): Map<number, InventoryData> {
  const inventory = new Map<number, InventoryData>();

  for (const productId of productIds) {
    inventory.set(productId, getInventoryForProduct(productId));
  }

  return inventory;
}
