/**
 * Test recommendations service with real data
 *
 * This script tests the full flow:
 * 1. Generate recommendations for an organization
 * 2. Fetch and display the recommendations
 * 3. Verify database records
 */

import { generateAndSaveRecommendations, getRecommendations } from '@/lib/services/recommendations';
import { db } from '@/lib/db';
import { organizations } from '@/lib/db/schema';

async function testRecommendationsService() {
  try {
    console.log('=== Testing Recommendations Service ===\n');

    // 1. Find an organization to test with
    console.log('Step 1: Finding organization...');
    const orgs = await db.select().from(organizations).limit(1);

    if (orgs.length === 0) {
      console.error('❌ No organizations found in database');
      console.error('   Please create an organization first');
      process.exit(1);
    }

    const org = orgs[0];
    console.log(`✅ Found organization: ${org.org_name} (${org.org_id})\n`);

    // 2. Generate recommendations
    console.log('Step 2: Generating recommendations...');
    console.log('   This will:');
    console.log('   - Fetch products from ERP');
    console.log('   - Fetch orders from ERP');
    console.log('   - Fetch inventory from database');
    console.log('   - Run recommendation algorithm');
    console.log('   - Save results to database\n');

    const startTime = Date.now();
    await generateAndSaveRecommendations(org.org_id);
    const duration = Date.now() - startTime;

    console.log(`✅ Generation complete in ${duration}ms\n`);

    // 3. Fetch recommendations
    console.log('Step 3: Fetching saved recommendations...');
    const recommendations = await getRecommendations(org.org_id);

    console.log(`✅ Found ${recommendations.length} container recommendations\n`);

    // 4. Display summary
    if (recommendations.length > 0) {
      console.log('=== Recommendations Summary ===\n');

      // Group by urgency
      const byUrgency = recommendations.reduce((acc, rec) => {
        acc[rec.urgency] = (acc[rec.urgency] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log('By urgency:');
      Object.entries(byUrgency).forEach(([urgency, count]) => {
        console.log(`  ${urgency}: ${count} containers`);
      });

      // Show first 5 containers
      console.log('\nFirst 5 containers:');
      recommendations.slice(0, 5).forEach(rec => {
        console.log(`\nContainer #${rec.containerNumber}:`);
        console.log(`  Order by: ${rec.orderByDate.toISOString().split('T')[0]}`);
        console.log(`  Delivery: ${rec.deliveryDate.toISOString().split('T')[0]}`);
        console.log(`  Urgency: ${rec.urgency}`);
        console.log(`  Volume: ${rec.totalVolume.toFixed(2)} m³`);
        console.log(`  Cartons: ${rec.totalCartons.toLocaleString()}`);
        console.log(`  Products: ${rec.products.length}`);
      });

      // Calculate totals
      const totalCartons = recommendations.reduce((sum, rec) => sum + rec.totalCartons, 0);
      const totalVolume = recommendations.reduce((sum, rec) => sum + rec.totalVolume, 0);
      const avgProductsPerContainer =
        recommendations.reduce((sum, rec) => sum + rec.products.length, 0) / recommendations.length;

      console.log('\n=== Overall Metrics ===');
      console.log(`Total containers: ${recommendations.length}`);
      console.log(`Total cartons: ${totalCartons.toLocaleString()}`);
      console.log(`Total volume: ${totalVolume.toFixed(2)} m³`);
      console.log(`Avg products per container: ${avgProductsPerContainer.toFixed(1)}`);
      console.log(`Generated at: ${recommendations[0].generatedAt.toISOString()}`);

      console.log('\n✅ Test successful!');
    } else {
      console.log('⚠️ No recommendations generated');
      console.log('   This could mean:');
      console.log('   - All products are well-stocked');
      console.log('   - No inventory data exists');
      console.log('   - No products have consumption data');
    }
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  }
}

testRecommendationsService()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
