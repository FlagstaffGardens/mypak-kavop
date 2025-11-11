# API Specification - Backend Implementation

## Overview

This document specifies all API endpoints required for MyPak Connect production.

**Base URL:** `https://api.mypak.com` (TBD)

**Authentication:** All endpoints require authentication. Use JWT token in header:
```
Authorization: Bearer <token>
```

---

## Endpoints

### 1. GET `/api/dashboard`

Returns all data needed for dashboard page.

**Response:**
```json
{
  "products": [
    {
      "sku": "ABC-123",
      "name": "Free Range Mxd Grade 12 Pack",
      "brand": "MyBrand",
      "type": "Free Range",
      "size": "Size 7",
      "pack_count": "18 cartons",
      "pieces_per_pallet": 5760,
      "image_url": "https://...",
      "current_stock": 400000,
      "weekly_consumption": 25000,
      "target_soh": 6,
      "weeks_remaining": 16.0,
      "runs_out_date": "2025-04-15",
      "status": "HEALTHY",
      "updated_at": "2025-01-10T14:30:00Z"
    }
  ],
  "recommendations": [
    {
      "container_number": 1,
      "order_by_date": "2025-02-01",
      "delivery_date": "2025-03-15",
      "total_cartons": 85000,
      "urgency": "URGENT",
      "products": [
        {
          "sku": "ABC-123",
          "product_name": "Free Range Mxd Grade 12 Pack",
          "current_stock": 50000,
          "weekly_consumption": 10000,
          "recommended_quantity": 50000,
          "after_delivery_stock": 100000,
          "weeks_supply": 10.0,
          "runs_out_date": "2025-05-20"
        }
      ]
    }
  ],
  "live_orders": [
    {
      "order_number": "ORD-2025-001",
      "ordered_date": "2025-01-05",
      "delivery_date": "2025-02-20",
      "total_cartons": 45000,
      "status": "IN_TRANSIT",
      "products": [
        {
          "sku": "ABC-123",
          "product_name": "Free Range Mxd Grade 12 Pack",
          "quantity_cartons": 25000
        }
      ]
    }
  ],
  "daily_consumption": 3571
}
```

**Backend Logic:**
1. Fetch product master data from ERP by customer
2. Join with `product_data` table (our app DB)
3. Calculate `weeks_remaining`, `status`, `runs_out_date`
4. Generate container recommendations (algorithm)
5. Fetch live orders from ERP (status = `IN_TRANSIT` or `APPROVED`)
6. Calculate total daily consumption

**Performance:** < 500ms

---

### 2. GET `/api/products`

Returns product list with current data (for Update Inventory table).

**Response:**
```json
{
  "products": [
    {
      "sku": "ABC-123",
      "name": "Free Range Mxd Grade 12 Pack",
      "brand": "MyBrand",
      "type": "Free Range",
      "size": "Size 7",
      "pack_count": "18 cartons",
      "pieces_per_pallet": 5760,
      "current_stock": 400000,
      "weekly_consumption": 25000,
      "target_soh": 6,
      "updated_at": "2025-01-10T14:30:00Z"
    }
  ]
}
```

**Backend Logic:**
1. Fetch product master from ERP
2. Join with `product_data` table
3. Return combined data

---

### 3. POST `/api/products/update`

Updates product inventory data (stock, consumption, target SOH).

**Request:**
```json
{
  "products": [
    {
      "sku": "ABC-123",
      "current_stock": 400000,
      "weekly_consumption": 25000,
      "target_soh": 6
    },
    {
      "sku": "DEF-456",
      "current_stock": 320000,
      "weekly_consumption": 18000,
      "target_soh": 8
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "updated_count": 2,
  "updated_at": "2025-01-10T15:45:00Z"
}
```

**Backend Logic:**
1. Validate input (all SKUs exist for this customer)
2. Upsert into `product_data` table
3. Set `updated_at` to current timestamp
4. Return confirmation

---

### 4. GET `/api/orders/recommended`

Returns all container recommendations (for Orders page - Recommended tab).

**Response:**
```json
{
  "recommendations": [
    {
      "container_number": 1,
      "order_by_date": "2025-02-01",
      "delivery_date": "2025-03-15",
      "total_cartons": 85000,
      "urgency": "URGENT",
      "products": [
        {
          "sku": "ABC-123",
          "product_name": "Free Range Mxd Grade 12 Pack",
          "current_stock": 50000,
          "weekly_consumption": 10000,
          "recommended_quantity": 50000,
          "after_delivery_stock": 100000,
          "weeks_supply": 10.0,
          "runs_out_date": "2025-05-20"
        }
      ]
    }
  ]
}
```

**Backend Logic:**
Same algorithm as dashboard, but return ALL recommendations (not limited).

---

### 5. GET `/api/orders/live`

Returns all in-transit/approved orders.

**Response:**
```json
{
  "orders": [
    {
      "order_number": "ORD-2025-001",
      "ordered_date": "2025-01-05",
      "delivery_date": "2025-02-20",
      "total_cartons": 45000,
      "status": "IN_TRANSIT",
      "shipping_method": "standard",
      "customer_order_number": "PO-12345",
      "products": [
        {
          "sku": "ABC-123",
          "product_name": "Free Range Mxd Grade 12 Pack",
          "quantity_cartons": 25000
        }
      ]
    }
  ]
}
```

**Backend Logic:**
Fetch from ERP where status = `IN_TRANSIT` or `APPROVED`.

---

### 6. GET `/api/orders/completed`

Returns completed/delivered orders.

**Response:**
```json
{
  "orders": [
    {
      "order_number": "ORD-2024-999",
      "ordered_date": "2024-12-01",
      "delivery_date": "2025-01-15",
      "total_cartons": 60000,
      "status": "DELIVERED",
      "shipping_method": "urgent",
      "customer_order_number": "PO-11111",
      "products": [
        {
          "sku": "ABC-123",
          "product_name": "Free Range Mxd Grade 12 Pack",
          "quantity_cartons": 35000
        }
      ]
    }
  ]
}
```

**Backend Logic:**
Fetch from ERP where status = `DELIVERED`.

---

### 7. GET `/api/orders/recommendation/:container_number`

Returns details for a specific container recommendation (for Order Review page).

**Path Parameters:**
- `container_number` - Integer (1, 2, 3, etc.)

**Response:**
```json
{
  "container_number": 1,
  "order_by_date": "2025-02-01",
  "delivery_date": "2025-03-15",
  "total_cartons": 85000,
  "urgency": "URGENT",
  "products": [
    {
      "sku": "ABC-123",
      "product_name": "Free Range Mxd Grade 12 Pack",
      "brand": "MyBrand",
      "type": "Free Range",
      "size": "Size 7",
      "pack_count": "18 cartons",
      "current_stock": 50000,
      "weekly_consumption": 10000,
      "recommended_quantity": 50000,
      "after_delivery_stock": 100000,
      "weeks_supply": 10.0,
      "runs_out_date": "2025-05-20"
    }
  ]
}
```

**Backend Logic:**
1. Generate all recommendations
2. Find container by `container_number`
3. Return full details

---

### 8. POST `/api/orders/submit`

Submits an order to ERP.

**Request:**
```json
{
  "delivery_date": "2025-03-15",
  "shipping_method": "standard",
  "shipping_term": "DDP",
  "customer_order_number": "PO-12345",
  "comments": "Urgent delivery needed",
  "products": [
    {
      "sku": "ABC-123",
      "quantity_cartons": 50000
    },
    {
      "sku": "DEF-456",
      "quantity_cartons": 35000
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "order_number": "ORD-2025-123",
  "message": "Order submitted successfully"
}
```

**Backend Logic:**
1. Create order record in our `orders` table (status = `PENDING`)
2. Create line items in `order_items` table
3. Submit to ERP API
4. If successful:
   - Update status to `SUBMITTED`
   - Store `order_number` from ERP
   - Set `submitted_to_erp_at` timestamp
5. If failed:
   - Update status to `FAILED`
   - Return error

**Error Response:**
```json
{
  "success": false,
  "error": "ERP submission failed: [reason]"
}
```

---

## Authentication

### POST `/api/auth/login`

**Request:**
```json
{
  "email": "customer@example.com",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "customer_id": "CUST-001",
  "name": "Acme Farms",
  "expires_at": "2025-01-11T14:30:00Z"
}
```

**Notes:**
- Token must include `customer_id` in payload
- All subsequent API calls use this token
- Frontend stores in `localStorage`

---

## Error Handling

**Standard Error Response:**
```json
{
  "success": false,
  "error": "Error message here",
  "code": "ERROR_CODE"
}
```

**Common Error Codes:**
- `UNAUTHORIZED` - Invalid or expired token
- `FORBIDDEN` - User doesn't have access to this resource
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid request data
- `ERP_ERROR` - ERP system error
- `INTERNAL_ERROR` - Server error

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad request (validation error)
- `401` - Unauthorized (invalid token)
- `403` - Forbidden (wrong customer_id)
- `404` - Not found
- `500` - Internal server error
- `503` - ERP unavailable

---

## Performance Requirements

- Dashboard load: < 500ms
- Product list: < 300ms
- Order submission: < 2s
- Recommendation generation: < 1s

**Optimization:**
- Cache ERP product data for 5-15 minutes
- Use database indexes on `customer_id`
- Implement pagination for order history (50 per page)

---

## Security Requirements

1. **JWT Authentication**: All endpoints require valid token
2. **Customer Isolation**: Users can only access their own `customer_id` data
3. **HTTPS Only**: All API calls over TLS
4. **Rate Limiting**: 100 requests per minute per customer
5. **Input Validation**: Validate all request data
6. **SQL Injection Prevention**: Use parameterized queries

---

## CORS Configuration

Allow frontend domains:
```
Access-Control-Allow-Origin: https://app.mypak.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Authorization, Content-Type
```

---

## Questions for ERP Team

1. **ERP API Base URL**: What's the endpoint?
2. **ERP Authentication**: API key, OAuth, or other?
3. **Product Endpoint**: How to fetch product master by customer?
4. **Order Endpoint**: How to fetch orders by customer and status?
5. **Order Submission Format**: What JSON structure does ERP expect?
6. **Rate Limits**: Any throttling on ERP API calls?
7. **Webhooks**: Can ERP notify us when order status changes?

---

## Development Checklist

- [ ] Set up backend server (Node.js/Python)
- [ ] Create database schema (PostgreSQL/MySQL)
- [ ] Implement authentication (JWT)
- [ ] Build ERP connector service
- [ ] Implement all 8 API endpoints
- [ ] Add error handling and logging
- [ ] Write unit tests
- [ ] Set up staging environment
- [ ] Performance testing
- [ ] Security audit
- [ ] Deploy to production
