import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/jwt';
import { getRecommendations } from '@/lib/services/recommendations';
import { getCachedErpProducts } from '@/lib/erp/client';
import { getInventoryData } from '@/lib/services/inventory';
import { db } from '@/lib/db';
import { organizations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { addDays, format } from 'date-fns';
import type { ContainerRecommendation } from '@/lib/types';

/**
 * GET /api/recommendations
 * Fetch all container recommendations for the current user's organization
 */
export async function GET() {
  try {
    // Get current user
    const user = await getCurrentUser();

    if (!user || !user.orgId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch data
    const [org] = await db.select().from(organizations).where(eq(organizations.org_id, user.orgId)).limit(1);
    const version = (org?.last_inventory_update?.toISOString?.() ?? '0') as string;
    const [dbRecommendations, erpProducts, inventoryData] = await Promise.all([
      getRecommendations(user.orgId),
      getCachedErpProducts(user.orgId, version),
      getInventoryData(user.orgId),
    ]);

    // Create inventory map
    const inventoryMap = new Map(
      inventoryData.map(inv => [inv.sku, inv])
    );

    // Create product info map (with volume data)
    const productInfoMap = new Map(
      erpProducts.map(p => [p.sku, {
        piecesPerPallet: p.piecesPerPallet,
        volumePerPallet: p.volumePerPallet,
        volumePerCarton: p.volumePerPallet / p.piecesPerPallet, // Calculate m³ per carton
        imageUrl: p.imageUrl
      }])
    );

    // Transform recommendations to UI format
    const containers: ContainerRecommendation[] = dbRecommendations.map((rec) => ({
      id: rec.containerNumber, // Use container number as ID (stable and meaningful)
      containerNumber: rec.containerNumber,
      orderByDate: rec.orderByDate.toISOString().split('T')[0],
      deliveryDate: rec.deliveryDate.toISOString().split('T')[0],
      totalCartons: rec.totalCartons,
      totalVolume: rec.totalVolume, // Total volume from algorithm (already a number)
      productCount: rec.products.length,
      urgency: rec.urgency === 'URGENT' || rec.urgency === 'OVERDUE' ? 'URGENT' : null,
      products: rec.products.map(p => {
        const inventory = inventoryMap.get(p.sku);
        const productInfo = productInfoMap.get(p.sku);

        const currentStock = inventory?.current_stock || 0;
        const weeklyConsumption = inventory?.weekly_consumption || 0;

        // Calculate CURRENT weeks supply and runs out date
        const weeksSupply = weeklyConsumption > 0 ? currentStock / weeklyConsumption : 999;
        const daysRemaining = Math.floor(weeksSupply * 7);
        const runsOutDate = weeklyConsumption > 0
          ? format(addDays(new Date(), daysRemaining), 'MMM dd, yyyy')
          : 'Never';

        return {
          productId: p.productId,
          sku: p.sku,
          productName: p.productName,
          currentStock,
          weeklyConsumption,
          recommendedQuantity: p.quantity,
          afterDeliveryStock: currentStock + p.quantity,
          weeksSupply, // Current weeks supply (not after delivery)
          runsOutDate,
          piecesPerPallet: p.piecesPerPallet,
          volumePerCarton: productInfo?.volumePerCarton,
          imageUrl: productInfo?.imageUrl || undefined,
        };
      }),
    }));

    return NextResponse.json({ containers });
  } catch (error) {
    console.error('Failed to fetch recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}
