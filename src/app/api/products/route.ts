import { NextResponse } from 'next/server';
import { getCachedErpProducts } from '@/lib/erp/client';
import { getInventoryData } from '@/lib/services/inventory';
import { db } from '@/lib/db';
import { organizations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { completeProductWithInventory } from '@/lib/erp/transforms';
import { transformErpProduct } from '@/lib/erp/transforms';
import { DEFAULT_TARGET_SOH } from '@/lib/constants';
import type { Product } from '@/lib/types';
import { auth } from "@/lib/auth";
import { getCurrentOrgId } from "@/lib/utils/get-org";
import { headers } from "next/headers";

/**
 * GET /api/products
 * Fetch all products for the current user's organization (for manual order creation)
 */
export async function GET() {
  try {
    // Get current user
    const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;

    const orgId = await getCurrentOrgId();
  if (!user || !orgId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch data
    const [org] = await db.select().from(organizations).where(eq(organizations.org_id, orgId)).limit(1);
    const version = (org?.last_inventory_update?.toISOString?.() ?? '0') as string;
    const [erpProducts, inventoryData] = await Promise.all([
      getCachedErpProducts(orgId, version),
      getInventoryData(orgId),
    ]);

    // Transform products
    const partialProducts = erpProducts.map(transformErpProduct);

    // Create inventory map by SKU
    const inventoryMap = new Map(
      inventoryData.map(row => [row.sku, row])
    );

    // Complete products with inventory
    const products: Product[] = partialProducts.map(partial => {
      const inventory = inventoryMap.get(partial.sku);

      if (!inventory) {
        // Product not configured yet - return placeholder
        return {
          ...partial,
          currentStock: 0,
          weeklyConsumption: 0,
          targetStock: 0,
          targetSOH: DEFAULT_TARGET_SOH,
          runsOutDate: 'Not configured',
          runsOutDays: 0,
          weeksRemaining: 0,
          status: 'CRITICAL' as const,
          currentPallets: 0,
          weeklyPallets: 0,
        };
      }

      // Complete with real inventory data
      return completeProductWithInventory(
        partial,
        inventory.current_stock,
        inventory.weekly_consumption,
        inventory.target_soh
      );
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
