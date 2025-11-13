// Raw ERP API Response Types (snake_case from API)

export interface ErpApiResponse<T> {
  status: number;
  message: string;
  success: boolean;
  redirect: string | null;
  error: string | null;
  response: T;
}

export interface ErpProduct {
  id: number;
  sku: string;
  name: string;
  packCount: number;
  piecesPerPallet: number;
  volumePerPallet: number;
  imageUrl: string | null;
}

export interface ErpOrderLine {
  sku: string;
  productName: string;
  qty: number;
}

export interface ErpOrder {
  id: number;
  orderNumber: string;
  orderedDate: string;
  status: "APPROVED" | "IN_TRANSIT" | "COMPLETE";
  shippingTerm: string;
  customerOrderNumber: string;
  comments: string;
  eta: string | null;
  requiredEta: string;
  lines: ErpOrderLine[];
}
