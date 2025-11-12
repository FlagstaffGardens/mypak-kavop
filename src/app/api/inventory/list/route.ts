import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/jwt';
import { fetchErpProducts } from '@/lib/erp/client';
import { getInventoryData } from '@/lib/services/inventory';

/**
 * GET /api/inventory/list
 *
 * Returns ERP products + existing inventory data for the modal
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

    // Fetch ERP products
    const erpProducts = await fetchErpProducts();

    // Fetch stored inventory data
    const inventoryRows = await getInventoryData(user.orgId);

    // Map by SKU for easy lookup
    const inventoryMap: Record<string, {
      current_stock: number;
      weekly_consumption: number;
      target_soh: number;
      updated_at: string;
    }> = {};

    inventoryRows.forEach(row => {
      inventoryMap[row.sku] = {
        current_stock: row.current_stock,
        weekly_consumption: row.weekly_consumption,
        target_soh: row.target_soh,
        updated_at: row.updated_at.toISOString(),
      };
    });

    return NextResponse.json({
      erpProducts,
      inventoryMap,
    });
  } catch (error) {
    console.error('[API] /api/inventory/list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory data' },
      { status: 500 }
    );
  }
}
