/**
 * Test Better Eggs Dataset
 *
 * Validates that our TypeScript implementation produces the same results
 * as the validated JavaScript prototype in testsuite/
 *
 * Expected Result: 74 containers (from testsuite/timeline-7day.md)
 */

import * as fs from 'fs';
import * as path from 'path';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { organizations, productData } from '@/lib/db/schema';
import { calculateRecommendations } from '@/lib/algorithms/recommendation-engine';
import type { Product, Order } from '@/lib/types';
import { CONTAINER_CAPACITY } from '@/lib/constants';

// Expected results from testsuite validation
const EXPECTED = {
  totalContainers: 74,
  avgProductsPerContainer: 5.6,
  totalVolume: 74 * CONTAINER_CAPACITY, // All containers should be at capacity
};

interface BetterEggsRow {
  targetStock: number; // "6 weeks stock" column
  weeklyConsumption: number; // "Weekly Estimated Volume" column
  currentStock: number; // "SOH" column
  productName: string; // "CUSTOMER'S DESCRIPTION" column
  sku: string; // "product" column
  piecesPerBundle: number;
  bundlesPerPallet: number;
  piecesPerPallet: number;
}

interface ProductsJsonProduct {
  id: number;
  sku: string;
  name: string;
  packCount: number;
  piecesPerPallet: number;
  volumePerPallet: number;
  imageUrl: string;
}

interface ProductsJsonResponse {
  success: boolean;
  response: ProductsJsonProduct[];
}

interface OrderLine {
  sku: string;
  productName: string;
  qty: number;
}

interface OrderJson {
  id: number;
  orderNumber: string;
  orderedDate: string;
  status: string;
  shippingTerm: string;
  customerOrderNumber: string;
  comments: string;
  eta: string | null;
  requiredEta: string;
  lines: OrderLine[];
}

interface OrdersJsonResponse {
  success: boolean;
  response: OrderJson[];
}

/**
 * Parse Better Eggs CSV data
 */
function parseBetterEggsData(csvPath: string): BetterEggsRow[] {
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.trim().split('\n');

  // Skip header
  const dataLines = lines.slice(1);

  return dataLines
    .filter(line => line.trim())
    .map((line, index) => {
      const cols = line.split('\t');

      if (cols.length < 8) {
        console.warn(`Skipping malformed line ${index + 2}: ${line}`);
        return null;
      }

      return {
        targetStock: parseInt(cols[0].replace(/,/g, ''), 10),
        weeklyConsumption: parseInt(cols[1].replace(/,/g, ''), 10),
        currentStock: parseInt(cols[2].replace(/,/g, ''), 10),
        productName: cols[3].trim(),
        sku: cols[4].trim(),
        piecesPerBundle: parseInt(cols[5], 10),
        bundlesPerPallet: parseInt(cols[6], 10),
        piecesPerPallet: parseInt(cols[7], 10),
      };
    })
    .filter((row): row is BetterEggsRow => row !== null);
}

/**
 * Load volume data from products JSON
 */
function loadProductVolumes(jsonPath: string): Map<string, number> {
  const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
  const data: ProductsJsonResponse = JSON.parse(jsonContent);

  const volumeMap = new Map<string, number>();
  data.response.forEach(product => {
    volumeMap.set(product.sku, product.volumePerPallet);
  });

  return volumeMap;
}

/**
 * Load orders from JSON
 */
function loadOrders(jsonPath: string): Order[] {
  const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
  const data: OrdersJsonResponse = JSON.parse(jsonContent);

  // Filter for APPROVED and IN_TRANSIT orders
  const activeOrders = data.response.filter(
    o => o.status === 'APPROVED' || o.status === 'IN_TRANSIT'
  );

  return activeOrders.map((order, index) => ({
    id: order.id.toString(),
    orderNumber: order.orderNumber,
    type: 'IN_TRANSIT' as const,
    orderedDate: order.orderedDate,
    deliveryDate: order.eta || order.requiredEta || order.orderedDate,
    totalCartons: order.lines.reduce((sum, line) => sum + line.qty, 0),
    productCount: order.lines.length,
    status: 'IN_TRANSIT' as const,
    products: order.lines.map((line, i) => ({
      productId: i,
      sku: line.sku,
      productName: line.productName,
      currentStock: 0,
      weeklyConsumption: 0,
      recommendedQuantity: line.qty,
      afterDeliveryStock: 0,
      weeksSupply: 0,
      runsOutDate: '',
    })),
  }));
}

/**
 * Transform Better Eggs data to Product format for algorithm
 */
function transformToProducts(betterEggsData: BetterEggsRow[], volumeMap: Map<string, number>): Product[] {
  return betterEggsData.map((row, index) => {
    const targetSOH = Math.round(row.targetStock / row.weeklyConsumption);
    const volumePerPallet = volumeMap.get(row.sku) || 1.0; // Use actual volume from JSON

    if (!volumeMap.has(row.sku)) {
      console.warn(`⚠️  No volume data for SKU: ${row.sku}, using default 1.0 m³`);
    }

    return {
      id: index + 1,
      name: row.productName,
      brand: 'Better Eggs',
      type: 'Carton',
      size: '12pk',
      packCount: '18',
      sku: row.sku,
      currentStock: row.currentStock,
      weeklyConsumption: row.weeklyConsumption,
      targetStock: row.targetStock,
      targetSOH: targetSOH,
      runsOutDate: '',
      runsOutDays: 0,
      weeksRemaining: row.weeklyConsumption > 0 ? row.currentStock / row.weeklyConsumption : 999,
      status: 'HEALTHY' as const,
      piecesPerPallet: row.piecesPerPallet,
      volumePerPallet: volumePerPallet,
      currentPallets: Math.floor(row.currentStock / row.piecesPerPallet),
      weeklyPallets: row.weeklyConsumption / row.piecesPerPallet,
    };
  });
}

/**
 * Main test function
 */
async function testBetterEggs() {
  console.log('=== Better Eggs Dataset Validation ===\n');

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }

  const client = postgres(dbUrl);
  const db = drizzle(client, { schema: { organizations, productData } });

  try {
    // Step 1: Load CSV data
    console.log('Step 1: Loading Better Eggs data from CSV...');
    const csvPath = path.join(__dirname, '../testsuite/test-data.csv');
    const betterEggsData = parseBetterEggsData(csvPath);
    console.log(`✅ Loaded ${betterEggsData.length} products\n`);

    // Step 1b: Load volume data from JSON
    console.log('Step 1b: Loading volume data from products JSON...');
    const productsJsonPath = path.join(__dirname, '../testsuite/products_bettereggs.json');
    const volumeMap = loadProductVolumes(productsJsonPath);
    console.log(`✅ Loaded volume data for ${volumeMap.size} products\n`);

    // Step 1c: Load orders from JSON
    console.log('Step 1c: Loading existing orders from JSON...');
    const ordersJsonPath = path.join(__dirname, '../testsuite/orders_bettereggs');
    const orders = loadOrders(ordersJsonPath);
    console.log(`✅ Loaded ${orders.length} active orders\n`);

    // Step 2: Transform to Product format
    console.log('Step 2: Transforming to algorithm input format...');
    const products = transformToProducts(betterEggsData, volumeMap);
    console.log(`✅ Transformed ${products.length} products\n`);

    // Show sample product
    console.log('Sample product:');
    const sample = products[0];
    console.log(`  Name: ${sample.name}`);
    console.log(`  SKU: ${sample.sku}`);
    console.log(`  Current Stock: ${sample.currentStock.toLocaleString()} cartons`);
    console.log(`  Weekly Consumption: ${sample.weeklyConsumption.toLocaleString()} cartons`);
    console.log(`  Target SOH: ${sample.targetSOH} weeks`);
    console.log(`  Weeks Remaining: ${sample.weeksRemaining.toFixed(1)} weeks`);
    console.log(`  Volume per Pallet: ${sample.volumePerPallet.toFixed(2)} m³\n`);

    // Step 3: Run algorithm with existing orders
    console.log('Step 3: Running recommendation algorithm...');
    console.log(`   Input: ${products.length} products, ${orders.length} orders`);
    const startTime = Date.now();
    const result = calculateRecommendations({
      products,
      orders: orders,
      today: new Date('2025-11-13'), // Use consistent date for reproducibility
    });
    const duration = Date.now() - startTime;
    console.log(`✅ Algorithm completed in ${duration}ms\n`);

    // Step 4: Validate results
    console.log('Step 4: Validating results...\n');
    console.log('=== RESULTS ===');
    console.log(`Total containers: ${result.containers.length}`);
    console.log(`Expected: ${EXPECTED.totalContainers}`);
    console.log(`Match: ${result.containers.length === EXPECTED.totalContainers ? '✅ PASS' : '❌ FAIL'}\n`);

    // Calculate metrics
    const totalVolume = result.containers.reduce((sum, c) => sum + c.totalVolume, 0);
    const avgProducts = result.containers.reduce((sum, c) => sum + c.products.length, 0) / result.containers.length;
    const totalCartons = result.containers.reduce((sum, c) => sum + c.products.reduce((s, p) => s + p.quantity, 0), 0);

    console.log('=== METRICS ===');
    console.log(`Total volume: ${totalVolume.toFixed(2)} m³`);
    console.log(`Total cartons: ${totalCartons.toLocaleString()}`);
    console.log(`Avg products per container: ${avgProducts.toFixed(1)}`);
    console.log(`Expected avg: ${EXPECTED.avgProductsPerContainer}`);
    console.log(`Match: ${Math.abs(avgProducts - EXPECTED.avgProductsPerContainer) < 0.2 ? '✅ PASS' : '⚠️  CLOSE'}\n`);

    // Show urgency breakdown
    const urgencyBreakdown = result.containers.reduce((acc, c) => {
      acc[c.urgency] = (acc[c.urgency] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('=== URGENCY BREAKDOWN ===');
    Object.entries(urgencyBreakdown).forEach(([urgency, count]) => {
      console.log(`${urgency}: ${count} containers`);
    });
    console.log();

    // Show first 5 containers
    console.log('=== FIRST 5 CONTAINERS ===');
    result.containers.slice(0, 5).forEach(container => {
      console.log(`\nContainer #${container.containerNumber}:`);
      console.log(`  Order by: ${container.orderByDate.toISOString().split('T')[0]}`);
      console.log(`  Volume: ${container.totalVolume.toFixed(2)} m³ (${((container.totalVolume / CONTAINER_CAPACITY) * 100).toFixed(1)}% full)`);
      console.log(`  Products: ${container.products.length}`);
      console.log(`  Urgency: ${container.urgency}`);
    });
    console.log();

    // Volume utilization check
    const perfectlyFull = result.containers.filter(c => c.totalVolume === CONTAINER_CAPACITY).length;
    const utilizationPercent = (totalVolume / (result.containers.length * CONTAINER_CAPACITY)) * 100;
    console.log('=== VOLUME UTILIZATION ===');
    console.log(`Containers at 100% capacity: ${perfectlyFull}/${result.containers.length}`);
    console.log(`Overall utilization: ${utilizationPercent.toFixed(1)}%\n`);

    // Final verdict
    const containerCountMatch = result.containers.length === EXPECTED.totalContainers;
    const avgProductsMatch = Math.abs(avgProducts - EXPECTED.avgProductsPerContainer) < 0.5;

    if (containerCountMatch && avgProductsMatch) {
      console.log('🎉 ✅ VALIDATION PASSED!');
      console.log('   TypeScript implementation matches JavaScript prototype results.');
    } else {
      console.log('⚠️  VALIDATION FAILED');
      if (!containerCountMatch) {
        console.log(`   Expected ${EXPECTED.totalContainers} containers, got ${result.containers.length}`);
      }
      if (!avgProductsMatch) {
        console.log(`   Expected ${EXPECTED.avgProductsPerContainer} avg products, got ${avgProducts.toFixed(1)}`);
      }
    }
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

testBetterEggs()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
