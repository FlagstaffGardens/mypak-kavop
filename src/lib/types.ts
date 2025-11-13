// Product Status Types
export type ProductStatus = "CRITICAL" | "ORDER_NOW" | "HEALTHY";

// Shipping Types
export type ShippingMethod = "standard" | "urgent" | "specific";
export type ShippingTerm = "DDP" | "FOB" | "CIF";
export type OrderStatus = "RECOMMENDED" | "IN_TRANSIT" | "DELIVERED";

// Core Product Interface
export interface Product {
  id: number;
  name: string;
  brand: string;
  type: string;
  size: string;
  packCount: string;
  sku: string;
  imageUrl?: string;
  currentStock: number;
  weeklyConsumption: number;
  targetStock: number;
  targetSOH?: number; // Per-product target SOH override (default: 6 weeks)
  runsOutDate: string;
  runsOutDays: number;
  weeksRemaining: number;
  status: ProductStatus;
  // Pallet information
  piecesPerPallet: number;
  volumePerPallet: number; // m³ per pallet (from ERP)
  currentPallets: number;
  weeklyPallets: number;
  approvedOrders?: ApprovedOrder[];
}

// Approved Order for a Product
export interface ApprovedOrder {
  orderNumber: string;
  quantity: number;
  deliveryDate: string;
  shippingMethod: string;
}

// Container Product (Product within a container recommendation)
export interface ContainerProduct {
  productId: number;
  sku?: string; // SKU from ERP
  productName: string;
  currentStock: number;
  weeklyConsumption: number;
  recommendedQuantity: number;
  afterDeliveryStock: number;
  weeksSupply: number;
  runsOutDate: string;
  piecesPerPallet?: number; // For calculating pallets from quantity
  imageUrl?: string; // Product label image
}

// Container Recommendation
export interface ContainerRecommendation {
  id: number;
  containerNumber: number;
  orderByDate: string;
  deliveryDate: string;
  totalCartons: number;
  productCount: number;
  products: ContainerProduct[];
  urgency?: "URGENT" | null;
}

// Shipping Details
export interface ShippingDetails {
  arrivalPreference: ShippingMethod;
  specificDate?: string;
  shippingTerm: ShippingTerm | null;
  customerOrderNumber: string;
  comments: string;
}

// Order
export interface Order {
  id: string;
  orderNumber: string;
  type: OrderStatus;
  orderedDate: string;
  deliveryDate: string;
  totalCartons: number;
  productCount: number;
  products: ContainerProduct[];
  status: OrderStatus;
  erpStatus?: string; // Original ERP status string for display
  shippingTerm?: ShippingTerm;
  customerOrderNumber?: string;
  comments?: string;
  shippingMethod?: string;
  urgency?: "URGENT" | null;
}

// Chart Data Point
export interface ChartDataPoint {
  date: string;
  stock: number;
  target?: number;
  isProjected?: boolean;
  isDelivery?: boolean;
  deliveryAmount?: number;
}

// Calculation Results
export interface StockoutCalculation {
  runsOutDate: string;
  runsOutDays: number;
  weeksRemaining: number;
  status: ProductStatus;
}

// Database models
export interface Organization {
  org_id: string;
  org_name: string;
  mypak_customer_name: string;
  kavop_token: string;
  created_at: Date;
  updated_at: Date;
}

export interface User {
  user_id: string;
  org_id: string | null;
  email: string;
  name: string;
  password: string;
  role: "org_user" | "platform_admin";
  created_at: Date;
  updated_at: Date;
  last_login_at: Date | null;
}
