# Developer Handoff Guide
## Backend Integration for VMI Dashboard

---

## TL;DR

**Your job:** Build a backend that connects this Next.js frontend to the ERP system.

**Timeline:** 3-4 weeks to production with 3 pilot customers

**What's done:**
- ✅ Complete frontend UI (this repo)
- ✅ All calculations and business logic (`/src/lib/calculations.ts`)
- ✅ TypeScript interfaces (`/src/lib/types.ts`)
- ✅ Design system and components

**What you need to build:**
- Backend API (Node.js/Python/whatever)
- ERP integration layer
- Authentication system
- Order submission

---

## Quick Start

### 1. Understand the Data Flow
```
ERP Database
    ↓ (Your connector)
Backend API
    ↓ (REST/GraphQL)
Next.js Frontend (already built ✅)
    ↓
User Dashboard
```

### 2. Read These Files First

**Data Requirements:**
- `DATA-REQUIREMENTS.md` - Exact JSON structures needed

**Business Logic:**
- `src/lib/types.ts` - All TypeScript interfaces
- `src/lib/calculations.ts` - Algorithm already implemented
- `src/lib/data/mock-scenarios.ts` - Example data structures

**Timeline:**
- `IMPLEMENTATION-TIMELINE.md` - 28-day breakdown

### 3. Key Endpoints to Build

#### GET /api/customers/:id/dashboard
Returns summary data for dashboard cards.

```json
{
  "summary": {
    "weeksCovered": 8.5,
    "coveredUntilDate": "2025-02-15",
    "targetSOH": 6
  },
  "products": [...],  // See DATA-REQUIREMENTS.md
  "recommendations": [...],  // See DATA-REQUIREMENTS.md
  "liveOrders": [...]
}
```

#### GET /api/customers/:id/recommendations
Returns container recommendations using the algorithm.

**Algorithm (already coded in `/src/lib/calculations.ts`):**
1. Fetch products from ERP
2. Fetch shipment history (last 8 weeks)
3. Calculate `weeklyConsumption = avg(shipments)`
4. Calculate `weeksRemaining = currentStock / weeklyConsumption`
5. Filter products where `weeksRemaining < 16`
6. Group into containers (90K cartons max)
7. Mark urgent if `weeksRemaining < targetSOH (6 weeks)`

**You can literally port the TypeScript functions to your backend language.**

#### POST /api/customers/:id/orders
Submits order back to ERP.

```json
{
  "orderDate": "2025-01-15",
  "requestedDeliveryDate": "2025-03-01",
  "products": [
    { "productId": 1, "sku": "ABC123", "quantity": 25000 }
  ],
  "shippingMethod": "standard",
  "shippingTerm": "DDP",
  "customerOrderNumber": "PO-12345",
  "comments": "Urgent delivery needed"
}
```

---

## Frontend Integration Points

The frontend currently uses mock data. You'll replace these:

### Before (Mock Data)
```typescript
// src/app/page.tsx
const products = mockProducts;  // ❌ Remove
const containers = SCENARIOS[demoState].containers;  // ❌ Remove
```

### After (Real API)
```typescript
// src/app/page.tsx
const { data: dashboardData } = await fetch('/api/customers/123/dashboard');
const products = dashboardData.products;  // ✅ Real data
const containers = dashboardData.recommendations;  // ✅ Real data
```

### Files That Need API Integration

1. **`src/app/page.tsx`** - Dashboard page
   - Fetch products
   - Fetch recommendations
   - Fetch summary stats

2. **`src/app/orders/page.tsx`** - Orders page
   - Fetch recommended orders
   - Fetch live orders
   - Fetch completed orders

3. **`src/app/orders/review/[containerId]/page.tsx`** - Order review
   - Fetch container details
   - Submit order (POST)

4. **`src/components/shared/Sidebar.tsx`** - User info
   - Fetch customer name, email

**That's it. Only 4 files need changes.**

---

## Authentication Flow

### Recommended: JWT Tokens

1. User logs in → Backend returns JWT
2. Frontend stores JWT in localStorage
3. Every API call includes: `Authorization: Bearer <token>`
4. Backend validates token, extracts customerId
5. Backend only returns data for that customerId

### Implementation
```typescript
// Frontend: src/lib/api-client.ts
const token = localStorage.getItem('auth_token');

fetch('/api/customers/123/dashboard', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

---

## ERP Integration Architecture

### Option A: Direct API Calls (Preferred)
```
Your Backend → ERP REST API
```
- Fastest to implement
- Use if ERP has good API docs

### Option B: Database Connector
```
Your Backend → SQL Connection → ERP Database
```
- Use if ERP doesn't have APIs
- Requires VPN/network access

### Option C: File-Based Sync
```
ERP exports CSV → Your Backend imports → Cache in DB
```
- Fallback if no API access
- Daily batch sync

**Ask the client which option is available.**

---

## Algorithm Implementation Example

Here's the recommendation algorithm in pseudocode:

```python
def generate_recommendations(customer_id):
    # 1. Get products
    products = erp.get_inventory(customer_id)

    # 2. Get shipment history (last 8 weeks)
    shipments = erp.get_shipments(customer_id, weeks=8)

    # 3. Calculate weekly consumption
    for product in products:
        product.weeklyConsumption = avg(shipments[product.id])
        product.weeksRemaining = product.currentStock / product.weeklyConsumption

    # 4. Filter products needing orders
    needs_order = [p for p in products if p.weeksRemaining < 16]

    # 5. Calculate recommended quantities
    for product in needs_order:
        target = product.weeklyConsumption * 10  # 10 weeks target
        product.recommendedQty = target - product.currentStock

    # 6. Group into containers (90K max)
    containers = []
    current = []
    total = 0

    for product in needs_order:
        if total + product.recommendedQty > 90000:
            containers.append(current)
            current = [product]
            total = product.recommendedQty
        else:
            current.append(product)
            total += product.recommendedQty

    containers.append(current)

    # 7. Mark urgent containers
    for container in containers:
        if any(p.weeksRemaining < 6 for p in container.products):
            container.urgency = "URGENT"

    return containers
```

**The TypeScript version is already in `/src/lib/calculations.ts` - just port it.**

---

## Testing Strategy

### Phase 1: Unit Tests
Test each calculation function:
- `calculateWeeksRemaining()`
- `calculateProductStatus()`
- `groupProductsIntoContainers()`

### Phase 2: Integration Tests
Test API endpoints with mock ERP data:
- Login returns valid token
- Dashboard returns correct structure
- Recommendations algorithm works

### Phase 3: E2E Tests
Test with real ERP data:
- Fetch real products
- Calculate real recommendations
- Submit test order to ERP

---

## Deployment Checklist

### Backend
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] ERP credentials secured
- [ ] HTTPS enabled
- [ ] CORS configured for frontend domain
- [ ] Rate limiting enabled
- [ ] Logging/monitoring setup
- [ ] Health check endpoint (`/health`)

### Frontend
- [ ] API base URL configured (env variable)
- [ ] Remove all mock data imports
- [ ] Remove dev mode state switcher (production only)
- [ ] Build passes (`npm run build`)
- [ ] Deploy to Vercel/Netlify

---

## Common Pitfalls to Avoid

1. **Don't overcomplicate auth** - Simple JWT is fine for MVP
2. **Don't optimize prematurely** - Get it working first
3. **Don't skip data validation** - ERP data might be messy
4. **Don't forget error handling** - Show user-friendly messages
5. **Don't ignore loading states** - Prevent UI jank
6. **Don't hardcode customer IDs** - Use auth token to extract

---

## Questions? Check These First

**"Where's the algorithm?"**
→ `/src/lib/calculations.ts`

**"What data structure?"**
→ `/src/lib/types.ts`

**"What does the UI expect?"**
→ Look at `/src/lib/data/mock-products.ts` and `/src/lib/data/mock-scenarios.ts`

**"How do I test locally?"**
→ Frontend runs on `npm run dev` (port 3000)
→ Your backend should run on port 3001 (or use proxy)

**"What if ERP data is different?"**
→ Transform it in your backend. Frontend expects the format in `types.ts`

---

## Success Criteria

By end of Week 4, you should have:
- ✅ Backend deployed and running
- ✅ All 6 API endpoints working
- ✅ Algorithm generating correct recommendations
- ✅ 3 customers can log in and place orders
- ✅ Frontend connected to real data (no mock data)
- ✅ < 2 second page load times
- ✅ Orders successfully submitted to ERP

---

## Next Steps

1. **Day 1:** Read these docs + ERP API documentation
2. **Day 1:** Set up backend project structure
3. **Day 2-3:** Build ERP connector (hardest part)
4. **Day 4:** Test data fetching with real customer
5. **Day 5-7:** Implement algorithm + API endpoints
6. **Week 2:** Frontend integration
7. **Week 3-4:** Testing + pilot customers

**You got this. The frontend is done, the algorithm is coded, you just need to connect the dots.**

---

## Contact

If you get stuck:
1. Check the TypeScript implementation first
2. Review the mock data examples
3. Ask about ERP specifics (API docs, auth, etc.)

Good luck! 🚀
