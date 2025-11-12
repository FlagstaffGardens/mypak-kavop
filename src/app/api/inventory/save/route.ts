import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/jwt';
import { upsertInventoryData, type InventoryInput } from '@/lib/services/inventory';
import { z } from 'zod';

// Validation schema
const inventorySchema = z.object({
  products: z.array(z.object({
    sku: z.string().min(1),
    currentStock: z.number().int().min(0),
    weeklyConsumption: z.number().int().min(0),
    targetSOH: z.number().int().min(1).max(52),
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

    // Upsert inventory data
    await upsertInventoryData(user.orgId, validated.products as InventoryInput[]);

    return NextResponse.json({
      success: true,
      message: 'Inventory data saved successfully',
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
