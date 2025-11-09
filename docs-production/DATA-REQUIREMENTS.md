# ERP Data Requirements for Production

## Overview
This document specifies the exact data needed from the ERP system to power the VMI dashboard.

---

## 1. Customer/Account Master Data
**Endpoint:** `GET /api/customers/{customerId}`

```json
{
  "customerId": "string",
  "name": "string",
  "email": "string",
  "targetSOH": 6,  // User-configurable target weeks of stock (default: 6)
  "leadTimeDays": 45  // Shipping lead time in days (default: 45)
}
```

**Required for:**
- User authentication
- Personalizing recommendations
- Status calculations

---

## 2. Product Inventory (CRITICAL - Main Data Source)
**Endpoint:** `GET /api/customers/{customerId}/inventory`

**Update Frequency:** Real-time or daily sync

```json
{
  "products": [
    {
      "id": "number",
      "sku": "string",
      "name": "string",
      "brand": "string",
      "type": "string",  // e.g., "Free Range", "Cage Free"
      "size": "string",  // e.g., "Size 7", "Mixed"
      "packCount": "string",  // e.g., "18 cartons"
      "currentStock": "number",  // Current inventory in cartons
      "piecesPerPallet": "number",  // Container size for this product
      "imageUrl": "string (optional)"  // Product image if available
    }
  ]
}
```

**Critical Fields:**
- `id`, `sku`, `name` - Product identification
- `currentStock` - Current inventory level
- `piecesPerPallet` - For pallet calculations

**Notes:**
- All inventory in **cartons** (not pallets, not pieces)
- App handles pallet conversion on frontend

---

## 3. Shipment History (For Consumption Calculation)
**Endpoint:** `GET /api/customers/{customerId}/shipments`

**Query Params:** `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` (last 12 weeks minimum)

```json
{
  "shipments": [
    {
      "date": "YYYY-MM-DD",
      "productId": "number",
      "sku": "string",
      "quantity": "number"  // Cartons shipped
    }
  ]
}
```

**Required for:**
- Calculating `weeklyConsumption` (burn rate)
- Algorithm uses last 4-8 weeks to determine average

**Calculation:**
```
weeklyConsumption = sum(last 4 weeks shipments) / 4
```

---

## 4. Approved/In-Transit Orders
**Endpoint:** `GET /api/customers/{customerId}/orders?status=approved,in_transit`

```json
{
  "orders": [
    {
      "orderNumber": "string",
      "orderedDate": "YYYY-MM-DD",
      "expectedDeliveryDate": "YYYY-MM-DD",
      "status": "approved | in_transit | delivered",
      "shippingMethod": "string (optional)",
      "shippingTerm": "DDP | FOB | CIF (optional)",
      "customerOrderNumber": "string (optional)",
      "products": [
        {
          "productId": "number",
          "sku": "string",
          "quantity": "number"  // Cartons ordered
        }
      ]
    }
  ]
}
```

**Required for:**
- Showing "Live Orders" tab
- Calculating stock projections (currentStock + pendingDeliveries)
- Preventing duplicate recommendations

---

## 5. Order History (Completed)
**Endpoint:** `GET /api/customers/{customerId}/orders?status=delivered&limit=50`

**Same structure as #4 above**

**Required for:**
- "Completed Orders" tab
- Historical reference

---

## 6. Order Submission (Write Endpoint)
**Endpoint:** `POST /api/customers/{customerId}/orders`

```json
{
  "orderDate": "YYYY-MM-DD",
  "requestedDeliveryDate": "YYYY-MM-DD",
  "shippingMethod": "standard | urgent | specific",
  "specificDate": "YYYY-MM-DD (optional)",
  "shippingTerm": "DDP | FOB | CIF | null",
  "customerOrderNumber": "string",
  "comments": "string",
  "products": [
    {
      "productId": "number",
      "sku": "string",
      "quantity": "number"  // Cartons
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "orderNumber": "string",
  "message": "Order submitted successfully"
}
```

---

## Algorithm Overview (What Backend Does)

### Step 1: Calculate Weeks Remaining per Product
```
weeksRemaining = currentStock / weeklyConsumption
```

### Step 2: Determine Product Status
```
if weeksRemaining < targetSOH (6 weeks): CRITICAL ⚠️
else if weeksRemaining < 16 weeks: ORDER_NOW 🟠
else: HEALTHY ✅
```

### Step 3: Generate Container Recommendations
```
For each product where status = CRITICAL or ORDER_NOW:
  recommendedQuantity = targetStock - currentStock - pendingDeliveries
  targetStock = weeklyConsumption * 10 weeks

Group products into containers (90,000 cartons max per container)
Calculate delivery dates based on lead time (45 days default)
```

### Step 4: Mark Urgent Containers
```
If any product in container has weeksRemaining < targetSOH:
  Mark entire container as URGENT
```

**All calculations already implemented in:** `/src/lib/calculations.ts`

---

## Data Flow Architecture

```
ERP Database
     ↓
Backend API (Node/Python/Whatever)
     ↓ (REST or GraphQL)
Next.js Frontend
     ↓
User Dashboard
```

**Backend Responsibilities:**
1. Fetch data from ERP
2. Transform to JSON format above
3. Run recommendation algorithm
4. Serve via API endpoints
5. Handle order submissions back to ERP

**Frontend Responsibilities:**
1. Display data beautifully (already done ✅)
2. Handle user interactions
3. Form submissions

---

## Minimum Viable Data (MVP)

To launch with 3 pilot customers, you **MUST** have:

1. ✅ Customer account info (name, email, targetSOH)
2. ✅ Product inventory (currentStock, sku, name)
3. ✅ Shipment history (last 8 weeks minimum)
4. ✅ Order submission endpoint

**Nice-to-have (can add later):**
- Product images
- Historical orders (can start empty)
- Real-time sync (can start with daily batch)

---

## Testing Data Checklist

Before pilot launch, verify ERP provides:
- [ ] At least 10-20 products per customer
- [ ] Shipment history covers 8+ weeks
- [ ] Stock levels are accurate and up-to-date
- [ ] SKU/product names match what customers expect
- [ ] Lead time is realistic (45 days?)
- [ ] Weekly consumption can be calculated from shipment history

---

## Security Requirements

1. **Authentication:** JWT or session-based auth per customer
2. **Authorization:** Customer can only see their own data
3. **API Keys:** Backend → ERP requires secure API key
4. **HTTPS:** All endpoints must use HTTPS
5. **Rate Limiting:** Prevent abuse

---

## Performance Requirements

- Product inventory load: < 500ms
- Recommendation calculation: < 1s
- Order submission: < 2s
- Dashboard page load: < 1.5s total

---

## Questions for ERP Team

1. **Does your ERP expose REST APIs or do we need to build a connector?**
2. **How is shipment history stored?** (Weekly aggregates or transaction-level?)
3. **What's the data freshness?** (Real-time, hourly batch, daily batch?)
4. **How do you track "approved orders"?** (Status field, separate table?)
5. **Can we get a test environment with sample data for 3 customers?**
6. **What's your authentication mechanism?** (OAuth, API keys, sessions?)

---

## Timeline Impact

**If ERP provides clean REST APIs:** 3-4 weeks total
**If ERP requires custom connector/scraping:** Add 2-3 weeks

The difference maker is **data quality and API availability**.
