import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/jwt';
import { upsertInventoryData, type InventoryInput } from '@/lib/services/inventory';
import { generateAndSaveRecommendations } from '@/lib/services/recommendations';
import { MIN_TARGET_SOH_WEEKS, MAX_TARGET_SOH_WEEKS } from '@/lib/constants';
import { z } from 'zod';

// Validation schema
const inventorySchema = z.object({
  products: z.array(z.object({
    sku: z.string().min(1),
    currentStock: z.number().int().min(0),
    weeklyConsumption: z.number().int().min(0),
    targetSOH: z.number().int().min(MIN_TARGET_SOH_WEEKS).max(MAX_TARGET_SOH_WEEKS),
  }))
});

/**
 * POST /api/inventory/save
 *
 * Upsert inventory data for multiple products
 */
export async function POST(request: Request) {
  try {
    // Get current user
    const user = await getCurrentUser();

    if (!user || !user.orgId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validated = inventorySchema.parse(body);

    // 1. Upsert inventory data
    await upsertInventoryData(user.orgId, validated.products as InventoryInput[]);

    // 2. Regenerate recommendations (synchronous - user waits)
    console.log('[API] Regenerating recommendations...');
    await generateAndSaveRecommendations(user.orgId);
    console.log('[API] Recommendations regenerated successfully');

    return NextResponse.json({
      success: true,
      message: 'Inventory saved and recommendations updated',
    });
  } catch (error) {
    console.error('[API] /api/inventory/save error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to save inventory data' },
      { status: 500 }
    );
  }
}
