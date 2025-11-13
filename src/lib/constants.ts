/**
 * Application-wide constants
 *
 * This file centralizes magic numbers and configuration values used throughout the app.
 * Always import from here rather than hardcoding values to maintain consistency.
 *
 * @example
 * ```typescript
 * import { DEFAULT_TARGET_SOH, MAX_TARGET_SOH_WEEKS } from '@/lib/constants';
 *
 * // Use in validation
 * targetSOH: z.number().int().min(1).max(MAX_TARGET_SOH_WEEKS)
 *
 * // Use as default value
 * const targetSOH = product.targetSOH || DEFAULT_TARGET_SOH;
 * ```
 */

/**
 * Inventory Configuration
 */

/** Default target stock on hand in weeks (user can override per product) */
export const DEFAULT_TARGET_SOH = 6;

/** Maximum allowed target SOH in weeks (one year) */
export const MAX_TARGET_SOH_WEEKS = 52;

/** Minimum allowed target SOH in weeks (0 = product no longer needed, won't trigger warnings) */
export const MIN_TARGET_SOH_WEEKS = 0;

/**
 * Status Thresholds
 *
 * Why 16 weeks for HEALTHY threshold?
 * Target (6) + Lead time (8) + Buffer (2) = 16 weeks
 * At 16+ weeks, all near-term orders are already placed
 */

/** Weeks remaining threshold for HEALTHY status */
export const HEALTHY_THRESHOLD_WEEKS = 16;

/**
 * Shipping & Logistics
 */

/** Container capacity in cubic meters (40HC standard) */
export const CONTAINER_CAPACITY = 76;

/** Shipping lead time from China to New Zealand in weeks */
export const SHIPPING_LEAD_TIME_WEEKS = 8;

/** Planning horizon for recommendations in weeks (12 months) */
export const PLANNING_HORIZON_WEEKS = 52;

/** Coalescing window for grouping orders (business week) */
export const COALESCING_WINDOW_DAYS = 7;
