import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/jwt';
import { getRecommendations } from '@/lib/services/recommendations';
import { fetchErpProducts } from '@/lib/erp/client';
import { getInventoryData } from '@/lib/services/inventory';
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
    const [dbRecommendations, erpProducts, inventoryData] = await Promise.all([
      getRecommendations(user.orgId),
      fetchErpProducts(),
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
        return {
          productId: p.productId,
          sku: p.sku,
          productName: p.productName,
          currentStock: inventory?.current_stock || 0,
          weeklyConsumption: inventory?.weekly_consumption || 0,
          recommendedQuantity: p.quantity,
          afterDeliveryStock: (inventory?.current_stock || 0) + p.quantity,
          weeksSupply: inventory?.weekly_consumption
            ? ((inventory.current_stock || 0) + p.quantity) / inventory.weekly_consumption
            : 999,
          runsOutDate: '',
          piecesPerPallet: p.piecesPerPallet,
          volumePerCarton: productInfo?.volumePerCarton, // Add volume per carton
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
