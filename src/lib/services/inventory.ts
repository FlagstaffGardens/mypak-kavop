/**
 * Inventory service - Database-backed inventory tracking
 * Stores current stock, weekly consumption, and target SOH per organization per SKU
 */

import { db } from '@/lib/db';
import { productData } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export interface InventoryData {
  sku: string;
  current_stock: number; // cartons
  weekly_consumption: number; // cartons
  target_soh: number; // weeks
  updated_at: Date;
}

export interface InventoryInput {
  sku: string;
  currentStock: number; // cartons
  weeklyConsumption: number; // cartons
  targetSOH: number; // weeks
}

/**
 * Get all inventory data for an organization
 */
export async function getInventoryData(orgId: string): Promise<InventoryData[]> {
  const data = await db
    .select()
    .from(productData)
    .where(eq(productData.org_id, orgId));

  return data;
}

/**
 * Get inventory data for a specific product
 */
export async function getInventoryForProduct(
  orgId: string,
  sku: string
): Promise<InventoryData | undefined> {
  const [data] = await db
    .select()
    .from(productData)
    .where(
      and(
        eq(productData.org_id, orgId),
        eq(productData.sku, sku)
      )
    );

  return data;
}

/**
 * Upsert inventory data for multiple products
 * Used by the inventory setup/update modal
 */
export async function upsertInventoryData(
  orgId: string,
  products: InventoryInput[]
): Promise<void> {
  await db.transaction(async (tx) => {
    for (const product of products) {
      await tx
        .insert(productData)
        .values({
          org_id: orgId,
          sku: product.sku,
          current_stock: product.currentStock,
          weekly_consumption: product.weeklyConsumption,
          target_soh: product.targetSOH,
          updated_at: new Date(),
        })
        .onConflictDoUpdate({
          target: [productData.org_id, productData.sku],
          set: {
            current_stock: product.currentStock,
            weekly_consumption: product.weeklyConsumption,
            target_soh: product.targetSOH,
            updated_at: new Date(),
          },
        });
    }
  });
}

/**
 * Delete inventory data for a specific product
 * Rarely used - mainly for cleanup
 */
export async function deleteInventoryData(
  orgId: string,
  sku: string
): Promise<void> {
  await db
    .delete(productData)
    .where(
      and(
        eq(productData.org_id, orgId),
        eq(productData.sku, sku)
      )
    );
}
