/**
 * Test the full recommendations flow
 * Run this after configuring inventory to see if recommendations generate
 */
import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';

async function testFlow() {
  try {
    console.log('=== Database State Check ===\n');

    // Check organizations
    const orgs = await db.execute(sql`
      SELECT org_id, org_name, mypak_customer_name
      FROM organizations;
    `);

    console.log(`Organizations: ${(orgs as any).length}`);
    (orgs as any).forEach((org: any) => {
      console.log(`  - ${org.org_name} (${org.mypak_customer_name})`);
    });

    // Check inventory data
    const inventory = await db.execute(sql`
      SELECT org_id, COUNT(*) as product_count
      FROM product_data
      GROUP BY org_id;
    `);

    console.log(`\nInventory configured for ${(inventory as any).length} organizations:`);
    (inventory as any).forEach((inv: any) => {
      console.log(`  - Org ${inv.org_id}: ${inv.product_count} products`);
    });

    // Check recommendations
    const recs = await db.execute(sql`
      SELECT org_id, COUNT(*) as container_count
      FROM recommendations
      GROUP BY org_id;
    `);

    if ((recs as any).length > 0) {
      console.log(`\n✓ Recommendations generated for ${(recs as any).length} organizations:`);
      (recs as any).forEach((rec: any) => {
        console.log(`  - Org ${rec.org_id}: ${rec.container_count} containers`);
      });
    } else {
      console.log('\n⚠ No recommendations generated yet');
      console.log('   → Configure inventory on dashboard to trigger generation');
    }

  } catch (error) {
    console.error('Error:', error);
  }

  process.exit(0);
}

testFlow();
