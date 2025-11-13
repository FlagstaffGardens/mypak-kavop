/**
 * Container Recommendation Algorithm
 *
 * Timeline simulation + 7-day coalescing window + round-robin packing + fill-to-100%
 *
 * Algorithm:
 * 1. Simulate product consumption week-by-week for 52 weeks
 * 2. Cluster order events within 7-day windows
 * 3. Pack clusters with round-robin distribution (delay resilience)
 * 4. Fill containers to exactly CONTAINER_CAPACITY (75.98 m³ for 40HC)
 *
 * @see docs/plans/2025-11-13-final-recommendation-algorithm.md
 */

import { addWeeks, addDays, differenceInDays } from 'date-fns';
import type { Product, Order } from '@/lib/types';
import {
  CONTAINER_CAPACITY,
  SHIPPING_LEAD_TIME_WEEKS,
  PLANNING_HORIZON_WEEKS,
  COALESCING_WINDOW_DAYS,
} from '@/lib/constants';

// ============================================================================
// Type Definitions
// ============================================================================

export interface OrderEvent {
  productId: number;
  sku: string;
  productName: string;
  orderByDate: Date;
  quantity: number; // cartons
  volume: number; // m³
  weeklyConsumption: number; // for filler calculation
  piecesPerPallet: number; // for UI pallet calculations
}

export interface OrderCluster {
  orderByDate: Date;
  events: OrderEvent[];
}

export interface AlgorithmContainerProduct {
  productId: number;
  sku: string;
  productName: string;
  quantity: number; // cartons
  volume: number; // m³
  piecesPerPallet: number; // for UI pallet calculations
}

export interface AlgorithmContainer {
  products: AlgorithmContainerProduct[];
  totalVolume: number; // m³
  orderByDate: Date;
  deliveryDate: Date;
  urgency: 'OVERDUE' | 'URGENT' | 'PLANNED';
}

export interface AlgorithmInput {
  products: Product[];
  orders: Order[];
  today: Date;
}

export interface AlgorithmOutput {
  containers: AlgorithmContainer[];
  metadata: {
    totalContainers: number;
    planningHorizon: string;
    generatedAt: Date;
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate current coverage in weeks for a product
 * Includes current stock + orders in transit
 */
function calculateCurrentCoverage(product: Product, orders: Order[]): number {
  if (product.weeklyConsumption === 0) {
    return Infinity; // No consumption = infinite coverage
  }

  // Current stock
  let totalStock = product.currentStock;

  // Add orders in transit for this product
  const productOrders = orders.filter(order =>
    order.products.some(p => p.sku === product.sku)
  );

  productOrders.forEach(order => {
    const productInOrder = order.products.find(p => p.sku === product.sku);
    if (productInOrder) {
      totalStock += productInOrder.recommendedQuantity;
    }
  });

  return totalStock / product.weeklyConsumption;
}

/**
 * Calculate urgency based on order-by date
 */
function calculateUrgency(orderByDate: Date, today: Date): 'OVERDUE' | 'URGENT' | 'PLANNED' {
  const daysUntil = differenceInDays(orderByDate, today);

  if (daysUntil < 0) return 'OVERDUE';
  if (daysUntil < 14) return 'URGENT';
  return 'PLANNED';
}

/**
 * Calculate quantity from volume for a product
 */
function calculateQuantityFromVolume(volume: number, product: Product): number {
  // volume = (quantity / piecesPerPallet) * volumePerPallet
  // quantity = (volume / volumePerPallet) * piecesPerPallet
  return Math.round((volume / product.volumePerPallet) * product.piecesPerPallet);
}

// ============================================================================
// Core Algorithm Functions
// ============================================================================

/**
 * Step 1: Simulate product orders over planning horizon
 *
 * For each product, simulate week-by-week consumption and determine when
 * orders need to be placed based on safety threshold (targetSOH + leadTime)
 */
function simulateProductOrders(
  product: Product,
  orders: Order[],
  today: Date
): OrderEvent[] {
  const events: OrderEvent[] = [];

  // Skip discontinued products
  if (!product.targetSOH || product.targetSOH === 0) {
    return events;
  }

  // Skip products with no consumption
  if (product.weeklyConsumption === 0) {
    return events;
  }

  // Calculate safety threshold per product
  const safetyThreshold = product.targetSOH + SHIPPING_LEAD_TIME_WEEKS;

  let currentCoverage = calculateCurrentCoverage(product, orders);
  let currentWeek = 0;

  while (currentWeek < PLANNING_HORIZON_WEEKS) {
    if (currentCoverage < safetyThreshold) {
      // Schedule order NOW
      const orderByWeek = currentWeek;
      const orderByDate = addWeeks(today, orderByWeek);
      const deliveryWeek = orderByWeek + SHIPPING_LEAD_TIME_WEEKS;
      const quantity = product.weeklyConsumption * product.targetSOH;
      const volume = (quantity / product.piecesPerPallet) * product.volumePerPallet;

      events.push({
        productId: product.id,
        sku: product.sku,
        productName: product.name,
        orderByDate,
        quantity,
        volume,
        weeklyConsumption: product.weeklyConsumption,
        piecesPerPallet: product.piecesPerPallet,
      });

      // Jump to delivery week and add coverage
      // CRITICAL: Must subtract weeks consumed DURING shipping
      const weeksConsumed = deliveryWeek - currentWeek;
      currentCoverage = currentCoverage - weeksConsumed + product.targetSOH;
      currentWeek = deliveryWeek;
    } else {
      // Consume one week
      currentCoverage -= 1;
      currentWeek += 1;
    }
  }

  return events;
}

/**
 * Step 2: Cluster order events by 7-day coalescing window
 *
 * Orders within 7 days of each other ship together for efficiency
 */
function clusterOrderEvents(events: OrderEvent[]): OrderCluster[] {
  if (events.length === 0) return [];

  // Sort chronologically
  const sortedEvents = [...events].sort(
    (a, b) => a.orderByDate.getTime() - b.orderByDate.getTime()
  );

  const clusters: OrderCluster[] = [];
  let currentCluster: OrderEvent[] = [sortedEvents[0]];

  for (let i = 1; i < sortedEvents.length; i++) {
    const gap = differenceInDays(
      sortedEvents[i].orderByDate,
      sortedEvents[i - 1].orderByDate
    );

    if (gap > COALESCING_WINDOW_DAYS) {
      // Start new cluster
      clusters.push({
        orderByDate: currentCluster[0].orderByDate,
        events: currentCluster,
      });
      currentCluster = [sortedEvents[i]];
    } else {
      // Add to current cluster
      currentCluster.push(sortedEvents[i]);
    }
  }

  // Push final cluster
  if (currentCluster.length > 0) {
    clusters.push({
      orderByDate: currentCluster[0].orderByDate,
      events: currentCluster,
    });
  }

  return clusters;
}

/**
 * Step 3: Pack cluster with round-robin distribution
 *
 * Distribute products evenly across containers for delay resilience
 */
function packCluster(cluster: OrderCluster): AlgorithmContainer[] {
  const totalVolume = cluster.events.reduce((sum, e) => sum + e.volume, 0);
  const numContainers = Math.ceil(totalVolume / CONTAINER_CAPACITY);

  const containers: AlgorithmContainer[] = [];

  for (let i = 0; i < numContainers; i++) {
    const container: AlgorithmContainer = {
      products: [],
      totalVolume: 0,
      orderByDate: cluster.orderByDate,
      deliveryDate: addWeeks(cluster.orderByDate, SHIPPING_LEAD_TIME_WEEKS),
      urgency: 'PLANNED', // Will be calculated later
    };

    // Distribute each product evenly across all containers
    cluster.events.forEach(event => {
      const portionVolume = event.volume / numContainers;
      const portionQuantity = event.quantity / numContainers;

      container.products.push({
        productId: event.productId,
        sku: event.sku,
        productName: event.productName,
        quantity: Math.round(portionQuantity),
        volume: portionVolume,
        piecesPerPallet: event.piecesPerPallet,
      });

      container.totalVolume += portionVolume;
    });

    containers.push(container);
  }

  return containers;
}

/**
 * Step 4: Fill container to 100% capacity
 *
 * Add more of high-consumption product to fill remaining space
 */
function fillToCapacity(container: AlgorithmContainer, products: Product[]): AlgorithmContainer {
  const remainingSpace = CONTAINER_CAPACITY - container.totalVolume;

  if (remainingSpace <= 0.01) return container; // Already full (within tolerance)

  // Find highest consumption product in this container
  const containerProductsWithMeta = container.products.map(cp => {
    const product = products.find(p => p.id === cp.productId);
    return {
      containerProduct: cp,
      weeklyConsumption: product?.weeklyConsumption || 0,
      product,
    };
  });

  const fillerMeta = containerProductsWithMeta.sort(
    (a, b) => b.weeklyConsumption - a.weeklyConsumption
  )[0];

  if (!fillerMeta.product) return container;

  // Add more of this product to fill exactly to CONTAINER_CAPACITY
  // Modify the actual container product (not a copy)
  fillerMeta.containerProduct.volume += remainingSpace;
  fillerMeta.containerProduct.quantity += calculateQuantityFromVolume(
    remainingSpace,
    fillerMeta.product
  );

  container.totalVolume = CONTAINER_CAPACITY; // Fill to full capacity (75.98 m³)

  return container;
}

// ============================================================================
// Main Export
// ============================================================================

/**
 * Calculate container recommendations for an organization
 *
 * Pure function - takes data, returns recommendations (no database access)
 *
 * @param input - Products, orders, and today's date
 * @returns Container recommendations with metadata
 */
export function calculateRecommendations(input: AlgorithmInput): AlgorithmOutput {
  const { products, orders, today } = input;

  // 1. Simulate orders for each product
  const orderEvents = products
    .filter(p => p.targetSOH && p.targetSOH > 0) // Skip discontinued
    .flatMap(p => simulateProductOrders(p, orders, today));

  // 2. Cluster by 7-day window
  const clusters = clusterOrderEvents(orderEvents);

  // 3. Pack with round-robin
  const containers = clusters.flatMap(packCluster);

  // 4. Fill to 100%
  containers.forEach(c => fillToCapacity(c, products));

  // 5. Calculate urgency
  containers.forEach(c => {
    c.urgency = calculateUrgency(c.orderByDate, today);
  });

  return {
    containers,
    metadata: {
      totalContainers: containers.length,
      planningHorizon: `${today.toISOString().split('T')[0]} to ${
        addWeeks(today, PLANNING_HORIZON_WEEKS).toISOString().split('T')[0]
      }`,
      generatedAt: new Date(),
    },
  };
}
