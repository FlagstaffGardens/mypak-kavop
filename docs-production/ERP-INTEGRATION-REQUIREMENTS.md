# ERP Integration Requirements

**Summary:** 3 GET endpoints (products, orders) + 1 POST endpoint (submit order)

---

## Data Flow Overview

**What we pull from your ERP:**
1. Product master data (SKU, name, pack info, volume) → Used for calculations
2. Order status (current + delivered orders) → Shown to customer

**What we store in our database:**
- Customer inventory metrics: `current_stock`, `weekly_consumption`, `target_soh` per SKU
- Order submission audit trail

**What we calculate fresh (not stored):**
- Container recommendations based on inventory + orders
- Stockout predictions and urgency levels

**What we send to your ERP:**
- New orders when customer clicks "Submit Order"

---

## Authentication

**Fill in your details:**
```
Base URL: _______________________________________________
Auth Type: [ ] API Key  [ ] Bearer Token  [ ] Basic Auth
Auth Header: _____________________________________________
Customer ID Format: ______________________________________
  Example: "CUST-123" or "12345" or "ABC Corp"
```

**CRITICAL:** Every request needs YOUR `customer_id` - tell us how to pass it:
- [ ] Query parameter: `?customer_id=...`
- [ ] Request header: `X-Customer-ID: ...`
- [ ] Path parameter: `/api/{customer_id}/products`
- [ ] Other: _____________

---

## 1. GET Products

**We call this when:** Customer opens the app (every page load)

**Request:**
```http
GET {BASE_URL}/products?customer_id={CUSTOMER_ID}
Authorization: {YOUR_AUTH}
```

**Response (200 OK):**
```json
[
  {
    "sku": "ABC-123",
    "name": "Free Range Mxd Grade 12 Pack - Size 7",
    "pack_count": 18,
    "pieces_per_pallet": 5760,
    "volume_per_pallet": 1.25,
    "image_url": "https://..." // optional
  }
]
```

**Your endpoint:** `_______________________________________________`

---

## 2. GET Current Orders (In-Transit + Approved)

**We call this when:** Customer opens orders page

**Request:**
```http
GET {BASE_URL}/orders?customer_id={CUSTOMER_ID}&status=current
Authorization: {YOUR_AUTH}
```

**Response (200 OK):**
```json
[
  {
    "order_number": "ORD-2025-001",
    "customer_id": "CUST-123",
    "ordered_date": "2025-01-05",
    "delivery_date": "2025-02-20",
    "status": "IN_TRANSIT", // or "APPROVED"
    "shipping_method": "Sea Freight", // optional: actual transport method
    "shipping_term": "DDP", // optional: DDP/FOB/CIF
    "customer_order_number": "PO-12345", // optional: their PO number
    "comments": "Rush delivery", // optional
    "products": [
      {
        "sku": "ABC-123",
        "product_name": "Free Range...",
        "quantity_cartons": 25000
      }
    ]
  }
]
```

**Your endpoint:** `_______________________________________________`

**How to filter?** `_______________________________________________`
  Example: `?status=current` or `?delivered=false`

---

## 3. GET Delivered Orders (History)

**We call this when:** Customer views order history

**Request:**
```http
GET {BASE_URL}/orders?customer_id={CUSTOMER_ID}&status=delivered&limit=50
Authorization: {YOUR_AUTH}
```

**Response:** Same format as #2, but `status = "DELIVERED"`

**Your endpoint:** `_______________________________________________`

**How to filter?** `_______________________________________________`
  Example: `?status=delivered&limit=50`

---

## 4. POST New Order

**We call this when:** Customer clicks "Submit Order"

**Request:**
```http
POST {BASE_URL}/orders
Authorization: {YOUR_AUTH}
Content-Type: application/json

{
  "customer_id": "CUST-123",
  "delivery_date": "2025-03-15",
  "shipping_method": "standard", // arrival preference: "standard" | "urgent" | "specific"
  "shipping_term": "DDP", // DDP | FOB | CIF
  "customer_order_number": "PO-12345",
  "comments": "Urgent delivery",
  "products": [
    { "sku": "ABC-123", "quantity_cartons": 50000 },
    { "sku": "DEF-456", "quantity_cartons": 35000 }
  ]
}
```

**Note:** `shipping_method` is the arrival preference ("standard" = ~6 weeks, "urgent" = ~4 weeks, "specific" = see delivery_date). You decide the actual transport method (Sea/Air) based on this + delivery_date.

**Response (200 OK):**
```json
{
  "success": true,
  "order_number": "ORD-2025-123"
}
```

**Response (400/500 Error):**
```json
{
  "success": false,
  "error": "Not enough inventory"
}
```

**Your endpoint:** `_______________________________________________`


## Customer ID Mapping

**Your System:** Uses `customer_id` (example: "CUST-123")
**Our System:** Uses `org_id` (internal UUID)

**Mapping:**
```
organizations table:
  org_id: "550e8400-..."           ← Our internal ID
  erp_customer_id: "CUST-123"      ← YOUR customer ID (stored here)
```

When calling YOUR APIs, we ALWAYS use YOUR `customer_id`.

---
