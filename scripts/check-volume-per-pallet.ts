/**
 * Check volumePerPallet values from database
 */

import { db } from '@/lib/db';
import { products } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

async function checkVolumes() {
  console.log('Checking volumePerPallet values from database...\n');

  const allProducts = await db.select().from(products).limit(20);

  console.log('Sample Products:');
  console.log('='.repeat(100));

  allProducts.forEach(p => {
    const pallets = 75.98 / (p.volume_per_pallet || 1);
    console.log(`SKU: ${p.sku}`);
    console.log(`Name: ${p.name}`);
    console.log(`Pieces per pallet: ${p.pieces_per_pallet}`);
    console.log(`Volume per pallet: ${p.volume_per_pallet} m³`);
    console.log(`→ Pallets that fit in 40HC: ${pallets.toFixed(1)}`);
    console.log('-'.repeat(100));
  });

  process.exit(0);
}

checkVolumes().catch(console.error);
