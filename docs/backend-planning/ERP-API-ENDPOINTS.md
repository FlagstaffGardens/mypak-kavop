# MyPak ERP API Endpoints - Implementation Reference

**Base URL:** `http://www.mypak.cn:8088/api/kavop`

**Date Updated:** 2025-11-12

---

## Response Structure

All API responses follow this standard structure:

```json
{
  "status": 200,                    // HTTP status code
  "message": "OK",                  // Status message
  "success": true,                  // Boolean - check this to validate response
  "redirect": null,                 // Redirect URL (if applicable)
  "error": null,                    // Error message (if success=false)
  "response": { ... }               // Actual data payload
}
```

**Key Field:** Always check `success` boolean before processing `response` data.

---

## 1. Get Customer Token

**Endpoint:** `GET /customer/token`

**Purpose:** Authenticate a customer by name and receive a JWT token for subsequent API calls

**Authentication:** None (this IS the authentication endpoint)

**Request:**
```http
GET http://www.mypak.cn:8088/api/kavop/customer/token?customerName=Aginbrook
```

**Query Parameters:**
- `customerName` (required): Customer name (e.g., "Aginbrook")

**Success Response (200):**
```json
{
  "status": 200,
  "message": "OK",
  "success": true,
  "redirect": null,
  "error": null,
  "response": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJhdXRoMCIsImN1c3RvbWVySWQiOjEwMDAwNDIsImV4cCI6MTc2NTQzMjc4MH0.45wMUIaVZinmseT3qU2EJi44x4ISOiD9yROC-LaeX3s"
}
```

**Error Response (400):**
```json
{
  "status": 400,
  "message": "error",
  "success": false,
  "redirect": null,
  "error": "Invalid customer name",
  "response": null
}
```

**Token Format:** JWT token string
- Store this token for use in all subsequent API calls
- Pass in `Authorization` header as: `Authorization: {token}` (no "Bearer" prefix)

**Notes:**
- Token includes customer ID in payload
- Token has expiration (`exp` field in JWT)
- Example decoded payload: `{"iss":"auth0","customerId":1000042,"exp":1765432780}`

---

## 2. Get Product List

**Endpoint:** `GET /product/list`

**Purpose:** Retrieve all products available for the authenticated customer

**Authentication:** Required (JWT token in header)

**Request:**
```http
GET http://www.mypak.cn:8088/api/kavop/product/list
Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Headers:**
- `Authorization: {token}` (JWT token from endpoint #1)

**Success Response (200):**
```json
{
  "status": 200,
  "message": "OK",
  "success": true,
  "redirect": null,
  "error": null,
  "response": [
    {
      "id": 1003833,
      "sku": "AGI-AWR600a-S12G9C-IL1",
      "name": "Woolworths Free Range 600g/EmbossPak(9G)12-Egg/ Champagne Carton/1",
      "packCount": 142.0,
      "piecesPerPallet": 4544.0,
      "volumePerPallet": 3.06989898989899,
      "imageUrl": "http://mypak.dyndns.org/label/AGI/AGI-AWR600a-S12G9-L1.jpg"
    },
    {
      "id": 1003832,
      "sku": "AGI-AWR700a-S12G9C-IL1",
      "name": "Woolworths Free Range 700g/EmbossPak(9G)12-Egg/ Champagne Carton/1",
      "packCount": 142.0,
      "piecesPerPallet": 4544.0,
      "volumePerPallet": 3.06989898989899,
      "imageUrl": "http://mypak.dyndns.org/label/AGI/AGI-AWR700a-S12G9-L1.jpg"
    }
  ]
}
```

**Response Fields:**
- `id` (number): Internal product ID
- `sku` (string): Product SKU code
- `name` (string): Full product name/description
- `packCount` (number): Number of packs per pallet
- `piecesPerPallet` (number): Total pieces (cartons) per pallet
- `volumePerPallet` (number): Volume in cubic meters per pallet
- `imageUrl` (string): URL to product label image

**Notes:**
- Returns ALL products for the authenticated customer
- No pagination in current implementation
- Numbers are returned as floats (e.g., `142.0`)

---

## 3. Get Current Orders

**Endpoint:** `GET /order/current`

**Purpose:** Retrieve all orders that are not yet completed (APPROVED or IN_TRANSIT status)

**Authentication:** Required (JWT token in header)

**Request:**
```http
GET http://www.mypak.cn:8088/api/kavop/order/current
Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Headers:**
- `Authorization: {token}` (JWT token from endpoint #1)

**Success Response (200):**
```json
{
  "status": 200,
  "message": "OK",
  "success": true,
  "redirect": null,
  "error": null,
  "response": [
    {
      "id": 1014110,
      "orderNumber": "515872",
      "orderedDate": "2025-11-03",
      "status": "APPROVED",
      "shippingTerm": "DDP",
      "customerOrderNumber": "",
      "comments": "Manual order.Extra Container Woolworths",
      "eta": null,
      "requiredEta": "ASAP",
      "lines": [
        {
          "sku": "AGI-AWR600a-S12G9C-IL1",
          "productName": "Woolworths Free Range 600g/EmbossPak(9G)12-Egg/ Champagne Carton/1",
          "qty": 97270.0
        }
      ]
    },
    {
      "id": 1014109,
      "orderNumber": "515871",
      "orderedDate": "2025-11-03",
      "status": "APPROVED",
      "shippingTerm": "DDP",
      "customerOrderNumber": "",
      "comments": "Manual order.Extra Container Woolworths",
      "eta": null,
      "requiredEta": "ASAP",
      "lines": [
        {
          "sku": "AGI-AWR700a-S12G9C-IL1",
          "productName": "Woolworths Free Range 700g/EmbossPak(9G)12-Egg/ Champagne Carton/1",
          "qty": 97270.0
        }
      ]
    }
  ]
}
```

**Order Status Enum:**
- `APPROVED`: Order confirmed but not yet shipped
- `IN_TRANSIT`: Order has been shipped, in transit to customer
- `COMPLETE`: Order delivered (not returned by this endpoint)

**Response Fields:**
- `id` (number): Internal order ID
- `orderNumber` (string): Order number/reference
- `orderedDate` (string): Date order was placed (ISO 8601: "YYYY-MM-DD")
- `status` (enum): Order status (APPROVED | IN_TRANSIT)
- `shippingTerm` (string): Shipping terms (e.g., "DDP", "FOB")
- `customerOrderNumber` (string): Customer's PO number (may be empty)
- `comments` (string): Order notes/comments
- `eta` (string | null): Estimated arrival date (ISO 8601 format if set, null if not set)
- `requiredEta` (string): Required ETA - may be date format ("2025-12-15") or text ("ASAP", "end of September")
- `lines` (array): Order line items
  - `sku` (string): Product SKU
  - `productName` (string): Full product name
  - `qty` (number): Quantity in cartons

**Important Notes:**
- `requiredEta` can be either a date string OR free-text (e.g., "ASAP", "end of September")
- `eta` is always a date string (ISO 8601) or null
- Handle both date and text formats when parsing `requiredEta`

---

## 4. Get Completed Orders

**Endpoint:** `GET /order/complete`

**Purpose:** Retrieve order history (all orders with COMPLETE status)

**Authentication:** Required (JWT token in header)

**Request:**
```http
GET http://www.mypak.cn:8088/api/kavop/order/complete
Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Headers:**
- `Authorization: {token}` (JWT token from endpoint #1)

**Success Response (200):**
```json
{
  "status": 200,
  "message": "OK",
  "success": true,
  "redirect": null,
  "error": null,
  "response": [
    {
      "id": 1013600,
      "orderNumber": "515363",
      "orderedDate": "2025-08-15",
      "status": "COMPLETE",
      "shippingTerm": "DDP",
      "customerOrderNumber": "",
      "comments": "Manual order, via Howard in wechat group",
      "eta": "2025-09-25",
      "requiredEta": "end of September",
      "lines": [
        {
          "sku": "AGI-MPR700d-S12G9C-IL1",
          "productName": "Mornington Peninsula Free Range 700g / EmbossPak (9G) 12-Egg/ Champagne Carton / 1",
          "qty": 47712.0
        },
        {
          "sku": "AGI-MPR800d-S12G9C-IL1",
          "productName": "Mornington Peninsula Free Range 800g / EmbossPak (9G) 12-Egg/ Champagne Carton / 1",
          "qty": 49558.0
        }
      ]
    },
    {
      "id": 1013599,
      "orderNumber": "515362",
      "orderedDate": "2025-08-15",
      "status": "COMPLETE",
      "shippingTerm": "DDP",
      "customerOrderNumber": "",
      "comments": "Manual order, via Howard in wechat group",
      "eta": "2025-10-01",
      "requiredEta": "ASAP",
      "lines": [
        {
          "sku": "AGI-AR#700e-S12G9C-IL1",
          "productName": "Aginbrook Free Range 700g/ EmbossPak (9G) 12-Egg / Champagne Carton/ 1",
          "qty": 18176.0
        },
        {
          "sku": "AGI-MPR330c-S06G3C-IL1",
          "productName": "Mornington Peninsula Free Range 330g / EmbossPak (3G)  2 x6-Egg/ Champagne Carton / 1",
          "qty": 18176.0
        },
        {
          "sku": "AGI-MPG700d-S12G9C-IL1",
          "productName": "Mornington Peninsula Cage Free 700g / EmbossPak (9G) 12-Egg/ Champagne Carton / 1",
          "qty": 60918.0
        }
      ]
    }
  ]
}
```

**Response Structure:** Identical to endpoint #3, but:
- `status` is always "COMPLETE"
- `eta` should always be set (date when order was delivered)
- Returns historical orders (no limit specified in API)

**Important Notes:**
- Same date format handling as endpoint #3
- `requiredEta` can still be text or date format
- `eta` should be a date string (when order was actually delivered)

---

## 5. Batch Create Customer Orders

**Endpoint:** `POST /order/create`

**Purpose:** Create one or multiple orders in a single API call

**Authentication:** Required (JWT token in header)

**Method:** POST

**Request:**
```http
POST http://www.mypak.cn:8088/api/kavop/order/create
Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Headers:**
- `Authorization: {token}` (JWT token from endpoint #1)
- `Content-Type: application/json`

**Request Body:**
Array of order objects:
```json
[
  {
    "comments": "test",
    "signer": "jj",
    "requiredEta": "2025-11-23",
    "customerOrderNumber": "12345678",
    "shippingTerm": "DDP",
    "lines": [
      {
        "qty": 10000,
        "sku": "AGI-AWR600a-S12G9C-IL1",
        "productId": 1003833
      },
      {
        "qty": 20000,
        "sku": "AGI-AWR700a-S12G9C-IL1",
        "productId": 1003832
      }
    ]
  }
]
```

**Required Fields:**
- `signer` (string): Name of person creating the order
- `requiredEta` (string): Required delivery date in ISO 8601 format ("YYYY-MM-DD")
- `shippingTerm` (enum): Shipping terms - MUST be uppercase
- `lines` (array): Order line items (at least one required)
  - `qty` (number): Quantity in cartons
  - `sku` (string): Product SKU code
  - `productId` (number): Product ID (from endpoint #2)

**Optional Fields:**
- `comments` (string): Order notes/comments
- `customerOrderNumber` (string): Customer's PO number

**Shipping Terms Enum:**
Valid values (MUST be uppercase):
- `"DDU"` - Delivered Duty Unpaid
- `"CIF"` - Cost, Insurance, and Freight
- `"DDP"` - Delivered Duty Paid
- `"EXW"` - Ex Works
- `"FOB"` - Free on Board

**Success Response (200):**
```json
{
  "status": 200,
  "message": "OK",
  "success": true,
  "redirect": null,
  "error": null,
  "response": "Successfully created orders"
}
```

**Error Response (400):**
```json
{
  "status": 400,
  "message": "error",
  "success": false,
  "redirect": null,
  "error": "Validation error message here",
  "response": null
}
```

**Validation Rules:**
- `requiredEta` must be in "YYYY-MM-DD" format
- `shippingTerm` must be one of the allowed values (case-sensitive, uppercase only)
- `lines` array cannot be empty
- Each line must have valid `qty`, `sku`, and `productId`
- `productId` must exist in customer's product list (from endpoint #2)

**Important Notes:**
- Request body is a JSON array (can contain multiple orders)
- All orders in the batch are created or none (atomic operation assumed)
- Date format is strict: "YYYY-MM-DD" only
- `shippingTerm` is case-sensitive and must be UPPERCASE
- New orders will have status "APPROVED" initially

**Example - Single Order:**
```json
[
  {
    "signer": "John Smith",
    "requiredEta": "2025-12-15",
    "shippingTerm": "DDP",
    "customerOrderNumber": "PO-2025-001",
    "comments": "Urgent - holiday rush order",
    "lines": [
      {
        "qty": 50000,
        "sku": "AGI-AWR600a-S12G9C-IL1",
        "productId": 1003833
      }
    ]
  }
]
```

**Example - Multiple Orders:**
```json
[
  {
    "signer": "John Smith",
    "requiredEta": "2025-12-15",
    "shippingTerm": "DDP",
    "lines": [
      { "qty": 50000, "sku": "AGI-AWR600a-S12G9C-IL1", "productId": 1003833 }
    ]
  },
  {
    "signer": "Jane Doe",
    "requiredEta": "2025-12-20",
    "shippingTerm": "FOB",
    "lines": [
      { "qty": 30000, "sku": "AGI-AWR700a-S12G9C-IL1", "productId": 1003832 }
    ]
  }
]
```

---

## Authentication Flow

**Typical Integration Pattern:**

1. **Login/Session Start:**
   ```
   GET /customer/token?customerName=Aginbrook
   → Store token in session/state
   ```

2. **Fetch Data:**
   ```
   GET /product/list (with Authorization header)
   GET /order/current (with Authorization header)
   GET /order/complete (with Authorization header)
   ```

3. **Token Expiration:**
   - Monitor for 401 Unauthorized responses
   - Re-authenticate with endpoint #1 when token expires
   - Tokens contain `exp` (expiration timestamp) in JWT payload

---

## Error Handling

**Standard Error Response:**
```json
{
  "status": 400,
  "message": "error",
  "success": false,
  "redirect": null,
  "error": "Error description here",
  "response": null
}
```

**Common Error Scenarios:**
- 400: Invalid customer name, bad request
- 401: Missing/invalid authentication token
- 404: Resource not found
- 500: Server error

**Best Practice:** Always check `success` field before processing `response`:
```typescript
if (apiResponse.success) {
  const data = apiResponse.response;
  // Process data
} else {
  console.error(apiResponse.error);
  // Handle error
}
```

---

## Data Type Notes

**Numbers:**
- All numeric values returned as floats (e.g., `142.0`, `97270.0`)
- Quantities are in cartons unless otherwise specified

**Dates:**
- Order dates in ISO 8601 format: "YYYY-MM-DD"
- `requiredEta` can be date string OR free text
- `eta` is date string or null

**Strings:**
- Empty strings returned as `""` (not null)
- Comments and customer order numbers may be empty

---

## Implementation Checklist

**GET Endpoints (Read Operations):**
- [ ] Store JWT token securely after authentication
- [ ] Pass token in `Authorization` header (no "Bearer" prefix)
- [ ] Check `success` boolean before processing responses
- [ ] Handle both date and text formats for `requiredEta` field
- [ ] Handle null values for `eta` field
- [ ] Parse numeric values as floats
- [ ] Implement token refresh on expiration
- [ ] Display product images from `imageUrl` field
- [ ] Convert quantities to pallets for display (qty ÷ piecesPerPallet)

**POST Endpoints (Write Operations):**
- [ ] Validate date format ("YYYY-MM-DD") before sending
- [ ] Ensure `shippingTerm` is UPPERCASE before sending
- [ ] Validate required fields: `signer`, `requiredEta`, `shippingTerm`, `lines`
- [ ] Validate `productId` exists in customer's product list
- [ ] Set `Content-Type: application/json` header
- [ ] Wrap single order in array format
- [ ] Handle batch order creation (multiple orders)
- [ ] Display success/error messages to user
- [ ] Refresh order list after successful creation

---

## Related Documentation

- **Requirements Template:** `ERP-INTEGRATION-REQUIREMENTS.md`
- **Authentication Details:** `AUTHENTICATION.md`
- **Database Models:** `DATABASE-MODELS.md`
