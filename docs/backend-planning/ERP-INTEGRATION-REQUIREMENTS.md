# ERP Integration Requirements

**Summary:** 4 GET endpoints (customer lookup, products, orders) + 1 POST endpoint (submit order)


## Authentication

**Fill in your details:**
```
Base URL: _______________________________________________
Auth Type: [ ] API Key  [ ] Bearer Token  [ ] Basic Auth
Auth Header: _____________________________________________
Customer ID Format: Numeric (e.g., "1000042", "1000227")
```

**CRITICAL:** Every request needs YOUR `customer_id` - tell us how to pass it:
- [ ] Query parameter: `?customer_id=...`
- [ ] Request header: `X-Customer-ID: ...`
- [ ] Path parameter: `/api/{customer_id}/products`
- [ ] Other: _____________

---

## 1. GET Customer Lookup (Onboarding Only)

**We call this when:** MyPak business team creates a new customer account (one-time setup)

**Purpose:** Get ERP customer_id by customer name to establish the link between our system and yours

**Request:**
```http
GET {BASE_URL}/customers/search?name={CUSTOMER_NAME}
Authorization: {YOUR_AUTH}
```

**Example:**
```http
GET https://erp.example.com/api/customers/search?name=Aginbrook
```

**Response (200 OK):**
```json
{
  "customer_id": "1000042",
  "customer_name": "Aginbrook"
}
```

**Response (404 Not Found):**
```json
{
  "error": "Customer not found"
}
```

**Your endpoint:** `_______________________________________________`

**Notes:**
- This is used ONLY during initial customer setup
- Business team searches by customer name (e.g., "Aginbrook", "Joshs Rainbow Eggs")
- We store the returned customer_id in our database (organizations.erp_customer_id)
- After setup, all other endpoints use this customer_id

---

## 2. GET Products

**We call this when:** Customer opens the app (every page load)

**Request:**
```http
GET {BASE_URL}/products?customer_id={CUSTOMER_ID}
Authorization: {YOUR_AUTH}
```

**Example:**
```http
GET https://erp.example.com/api/products?customer_id=1000042
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

## 3. GET Current Orders (In-Transit + Approved)

**We call this when:** Customer opens orders page

**Request:**
```http
GET {BASE_URL}/orders?customer_id={CUSTOMER_ID}&status=current
Authorization: {YOUR_AUTH}
```

**Example:**
```http
GET https://erp.example.com/api/orders?customer_id=1000042&status=current
```

**Response (200 OK):**
```json
[
  {
    "order_number": "ORD-2025-001",
    "customer_id": "1000042",
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

## 4. GET Delivered Orders (History)

**We call this when:** Customer views order history

**Request:**
```http
GET {BASE_URL}/orders?customer_id={CUSTOMER_ID}&status=delivered&limit=50
Authorization: {YOUR_AUTH}
```

**Example:**
```http
GET https://erp.example.com/api/orders?customer_id=1000042&status=delivered&limit=50
```

**Response:** Same format as #3, but `status = "DELIVERED"`

**Your endpoint:** `_______________________________________________`

**How to filter?** `_______________________________________________`
  Example: `?status=delivered&limit=50`

---

## 5. POST New Order

**We call this when:** Customer clicks "Submit Order"

**Request:**
```http
POST {BASE_URL}/orders
Authorization: {YOUR_AUTH}
Content-Type: application/json

{
  "customer_id": "1000042",
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

**Your System:** Uses numeric `customer_id` (examples: "1000042", "1000227", "1000212")

**Our System:** Uses `org_id` (internal UUID)

**Mapping:**
```
organizations table:
  org_id: "550e8400-..."           ← Our internal ID
  org_name: "Aginbrook"            ← Customer name
  erp_customer_id: "1000042"       ← YOUR customer ID (stored here)
```

**Onboarding Flow:**
1. Business team creates new customer account in MyPak
2. During setup, we call `GET /customers/search?name=Aginbrook`
3. ERP returns `customer_id: "1000042"`
4. We store this in `organizations.erp_customer_id`
5. From then on, all API calls use YOUR `customer_id`

---
