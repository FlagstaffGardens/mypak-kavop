/**
 * Recommendations Service
 *
 * Service layer for container recommendations:
 * - Generate recommendations using the timeline simulation algorithm
 * - Persist recommendations to database
 * - Fetch recommendations for display
 *
 * Triggered after inventory updates to regenerate recommendations.
 */

import { db } from '@/lib/db';
import { recommendations, organizations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { calculateRecommendations } from '@/lib/algorithms/recommendation-engine';
import type { AlgorithmOutput, AlgorithmContainer } from '@/lib/algorithms/recommendation-engine';
import type { Product, Order } from '@/lib/types';
import type { ErpProduct, ErpOrder, ErpApiResponse } from '@/lib/erp/types';
import { transformErpProduct } from '@/lib/erp/transforms';
import { getInventoryData } from '@/lib/services/inventory';
import { SHIPPING_LEAD_TIME_WEEKS } from '@/lib/constants';
import { addWeeks } from 'date-fns';

const ERP_BASE_URL = 'http://www.mypak.cn:8088/api/kavop';

// ============================================================================
// Types
// ============================================================================

export interface ContainerRecommendation {
  id: string;
  orgId: string;
  containerNumber: number;
  orderByDate: Date;
  deliveryDate: Date;
  totalCartons: number;
  totalVolume: number;
  urgency: 'OVERDUE' | 'URGENT' | 'PLANNED';
  products: {
    productId: number;
    sku: string;
    productName: string;
    quantity: number;
    volume: number;
    piecesPerPallet: number;
  }[];
  generatedAt: Date;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get organization's kavop_token for ERP API access
 */
async function getOrgToken(orgId: string): Promise<string> {
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.org_id, orgId));

  if (!org) {
    throw new Error('Organization not found');
  }

  if (!org.kavop_token || org.kavop_token.trim() === '') {
    throw new Error(`Organization "${org.org_name}" has no kavop_token configured`);
  }

  return org.kavop_token;
}

/**
 * Fetch products from ERP for a specific organization
 */
async function fetchErpProductsForOrg(orgId: string): Promise<ErpProduct[]> {
  const token = await getOrgToken(orgId);

  const response = await fetch(`${ERP_BASE_URL}/product/list`, {
    headers: {
      'Authorization': token,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`ERP API error: ${response.status} ${response.statusText}`);
  }

  const data: ErpApiResponse<ErpProduct[]> = await response.json();

  if (!data.success) {
    throw new Error(`ERP API error: ${data.error}`);
  }

  return data.response;
}

/**
 * Fetch current orders from ERP for a specific organization
 */
async function fetchErpCurrentOrdersForOrg(orgId: string): Promise<ErpOrder[]> {
  const token = await getOrgToken(orgId);

  const response = await fetch(`${ERP_BASE_URL}/order/current`, {
    headers: {
      'Authorization': token,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`ERP API error: ${response.status} ${response.statusText}`);
  }

  const data: ErpApiResponse<ErpOrder[]> = await response.json();

  if (!data.success) {
    throw new Error(`ERP API error: ${data.error}`);
  }

  return data.response;
}

/**
 * Merge ERP product data with inventory data from database
 */
function mergeProductData(
  erpProducts: ErpProduct[],
  inventoryData: Awaited<ReturnType<typeof getInventoryData>>
): Product[] {
  // Create inventory lookup map
  const inventoryMap = new Map(
    inventoryData.map(inv => [inv.sku, inv])
  );

  // Transform and merge
  return erpProducts.map((erpProduct, index) => {
    const inventory = inventoryMap.get(erpProduct.sku);

    const baseProduct = transformErpProduct(erpProduct);

    return {
      ...baseProduct,
      id: index + 1,
      currentStock: inventory?.current_stock || 0,
      weeklyConsumption: inventory?.weekly_consumption || 0,
      targetSOH: inventory?.target_soh || 6,
      // Calculate derived fields
      targetStock: (inventory?.weekly_consumption || 0) * (inventory?.target_soh || 6),
      weeksRemaining:
        (inventory?.weekly_consumption || 0) > 0
          ? (inventory?.current_stock || 0) / (inventory?.weekly_consumption || 0)
          : 999,
      runsOutDate: '',
      runsOutDays: 0,
      status: 'HEALTHY' as const,
      currentPallets:
        erpProduct.piecesPerPallet > 0
          ? Math.floor((inventory?.current_stock || 0) / erpProduct.piecesPerPallet)
          : 0,
      weeklyPallets:
        erpProduct.piecesPerPallet > 0
          ? (inventory?.weekly_consumption || 0) / erpProduct.piecesPerPallet
          : 0,
    };
  });
}

/**
 * Transform ERP orders to app Order type
 */
function transformOrders(erpOrders: ErpOrder[]): Order[] {
  return erpOrders.map((erpOrder, index) => ({
    id: index.toString(),
    orderNumber: erpOrder.orderNumber || `ORD-${index}`,
    type: 'IN_TRANSIT' as const,
    orderedDate: erpOrder.orderedDate || new Date().toISOString(),
    deliveryDate: erpOrder.eta || new Date().toISOString(),
    totalCartons: erpOrder.lines?.reduce((sum, line) => sum + line.qty, 0) || 0,
    productCount: erpOrder.lines?.length || 0,
    products:
      erpOrder.lines?.map((line, i) => ({
        productId: i,
        sku: line.sku,
        productName: line.productName,
        currentStock: 0,
        weeklyConsumption: 0,
        recommendedQuantity: line.qty,
        afterDeliveryStock: 0,
        weeksSupply: 0,
        runsOutDate: '',
        piecesPerPallet: 5000, // Default, will be enriched with actual value later
      })) || [],
    status: 'IN_TRANSIT' as const,
  }));
}

/**
 * Transform database row to ContainerRecommendation
 */
function transformRecommendationRow(row: typeof recommendations.$inferSelect): ContainerRecommendation {
  return {
    id: row.id,
    orgId: row.org_id,
    containerNumber: row.container_number,
    orderByDate: new Date(row.order_by_date),
    deliveryDate: new Date(row.delivery_date),
    totalCartons: row.total_cartons,
    totalVolume: parseFloat(row.total_volume),
    urgency: row.urgency as 'OVERDUE' | 'URGENT' | 'PLANNED',
    products: row.products as any, // Already JSONB
    generatedAt: row.generated_at,
  };
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Generate and save recommendations for an organization
 *
 * This is the main entry point, typically called after inventory updates.
 * It fetches all required data, runs the algorithm, and persists results.
 *
 * @param orgId - Organization UUID
 */
export async function generateAndSaveRecommendations(orgId: string): Promise<void> {
  console.log(`[Recommendations] Generating for org: ${orgId}`);

  // 1. Fetch ERP data
  const [erpProducts, erpOrders] = await Promise.all([
    fetchErpProductsForOrg(orgId),
    fetchErpCurrentOrdersForOrg(orgId),
  ]);

  console.log(`[Recommendations] Fetched ${erpProducts.length} products, ${erpOrders.length} orders`);

  // 2. Fetch inventory from database
  const inventoryData = await getInventoryData(orgId);
  console.log(`[Recommendations] Fetched ${inventoryData.length} inventory records`);

  // 3. Merge ERP + inventory
  const products = mergeProductData(erpProducts, inventoryData);
  const orders = transformOrders(erpOrders);

  // 4. Run algorithm
  const output = calculateRecommendations({
    products,
    orders,
    today: new Date(),
  });

  console.log(`[Recommendations] Algorithm generated ${output.containers.length} containers`);

  // 5. Save to database
  await saveRecommendations(orgId, output);

  console.log(`[Recommendations] Saved successfully`);
}

/**
 * Get current recommendations for an organization
 *
 * Returns recommendations sorted by container number.
 *
 * @param orgId - Organization UUID
 * @returns Array of container recommendations
 */
export async function getRecommendations(orgId: string): Promise<ContainerRecommendation[]> {
  const rows = await db
    .select()
    .from(recommendations)
    .where(eq(recommendations.org_id, orgId))
    .orderBy(recommendations.container_number);

  return rows.map(transformRecommendationRow);
}

/**
 * Save recommendations to database (replace existing)
 *
 * Uses a transaction to ensure atomicity:
 * 1. Delete all old recommendations for this org
 * 2. Insert new recommendations
 *
 * @param orgId - Organization UUID
 * @param output - Algorithm output
 */
async function saveRecommendations(orgId: string, output: AlgorithmOutput): Promise<void> {
  await db.transaction(async (tx) => {
    // Delete old recommendations
    await tx.delete(recommendations).where(eq(recommendations.org_id, orgId));

    // Insert new recommendations
    if (output.containers.length > 0) {
      await tx.insert(recommendations).values(
        output.containers.map((container, index) => ({
          org_id: orgId,
          container_number: index + 1,
          order_by_date: container.orderByDate.toISOString().split('T')[0], // date string
          delivery_date: addWeeks(container.orderByDate, SHIPPING_LEAD_TIME_WEEKS)
            .toISOString()
            .split('T')[0],
          total_cartons: container.products.reduce((sum, p) => sum + p.quantity, 0),
          total_volume: container.totalVolume.toFixed(2),
          urgency: container.urgency,
          products: container.products,
          generated_at: output.metadata.generatedAt,
        }))
      );
    }
  });
}
