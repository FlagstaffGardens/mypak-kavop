# Status System & Target SOH

**Last Updated:** 2024-01-08

---

## Overview

The inventory status system uses a **user-configurable target SOH** (Stock On Hand in weeks) to determine product health and urgency.

---

## Target SOH Setting

**What it is:**
- User-configurable weeks of coverage desired
- Acts as the baseline for "healthy" inventory
- Typically 6-10 weeks based on lead times and business needs

**Where it lives:**
- Dashboard (prominent placement)
- Easy to change (slider or input)
- Applies globally to all products (future: per-product override)

**Default:** 6 weeks (matches current CSV data)

---

## Status Calculation Logic

```typescript
function calculateStatus(weeksRemaining: number, targetSOH: number): ProductStatus {
  if (weeksRemaining < targetSOH) return "CRITICAL";
  if (weeksRemaining < 16) return "ORDER_NOW";
  return "HEALTHY";
}
```

**Status Definitions:**

### 🔴 CRITICAL (Red)
- **Condition:** `weeksRemaining < targetSOH`
- **Meaning:** Below desired stock level → urgent action required
- **Example:** 4 weeks remaining when target is 6 weeks
- **UI:** Red borders, bold dates, urgent messaging

### 🟠 ORDER_NOW (Orange)
- **Condition:** `targetSOH ≤ weeksRemaining < 16`
- **Meaning:** At target but should plan ahead
- **Example:** 10 weeks remaining when target is 6 weeks
- **UI:** Orange borders, medium urgency messaging

### 🟢 HEALTHY (Green)
- **Condition:** `weeksRemaining ≥ 16`
- **Meaning:** All orders in system, well stocked
- **Example:** 18 weeks remaining
- **UI:** Green borders, calm proactive messaging

---

## Why 16 Weeks?

**16 weeks** is the threshold for "all orders in system" because:

1. **Lead time:** ~6-8 weeks from order to delivery (international shipping)
2. **Planning horizon:** 2-3 order cycles ahead
3. **Safety buffer:** Accounts for delays, consumption spikes
4. **Green zone:** Comfortable position where user can plan proactively, not reactively

**Calculation:**
```
Target (6 weeks) + Lead time (8 weeks) + Buffer (2 weeks) = 16 weeks
```

At 16+ weeks, all near-term orders are already placed and in transit/delivered.

---

## Example Scenarios

### Scenario 1: Target SOH = 6 weeks

| Product | Weeks Remaining | Status | Reasoning |
|---------|----------------|--------|-----------|
| Product A | 4 weeks | 🔴 CRITICAL | Below 6-week target |
| Product B | 8 weeks | 🟠 ORDER_NOW | Above target, below 16 |
| Product C | 18 weeks | 🟢 HEALTHY | 16+ weeks |

### Scenario 2: Target SOH = 10 weeks (more conservative user)

| Product | Weeks Remaining | Status | Reasoning |
|---------|----------------|--------|-----------|
| Product A | 8 weeks | 🔴 CRITICAL | Below 10-week target |
| Product B | 12 weeks | 🟠 ORDER_NOW | Above target, below 16 |
| Product C | 18 weeks | 🟢 HEALTHY | 16+ weeks |

---

## Target SOH UI Component

**Placement:** Top of dashboard, near title or in stats section

**Design:**
```
┌─────────────────────────────────────────────┐
│ Target Stock Level                          │
│                                             │
│ [====●=============================] 6 weeks│
│  4    6    8    10   12   14   16           │
│                                             │
│ Current target: Maintain 6 weeks of stock  │
└─────────────────────────────────────────────┘
```

**Features:**
- Slider: 4-16 weeks range
- Label: Shows current target
- Description: Explains what it means
- Persists: localStorage or user preferences (future: API)

**Implementation:**
```typescript
// Component
<TargetSOHSetting
  value={targetSOH}
  onChange={setTargetSOH}
  min={4}
  max={16}
  step={1}
/>

// Hook
const [targetSOH, setTargetSOH] = useState(() => {
  return parseInt(localStorage.getItem('targetSOH') || '6');
});

useEffect(() => {
  localStorage.setItem('targetSOH', targetSOH.toString());
}, [targetSOH]);
```

---

## Dashboard State Logic

**Dashboard shows different states based on product statuses:**

1. **All Green (Healthy):**
   - RecommendationCard: "All Products On Track"
   - Shows next recommended order
   - Calm, proactive messaging

2. **Single Orange/Red (Single Urgent):**
   - RecommendationCard: "Container X needs ordering"
   - Shows specific container deadline
   - Clear action required

3. **Multiple Orange/Red (Multiple Urgent):**
   - RecommendationCard: "X Containers Need Ordering"
   - Shows top 2 deadlines
   - Directs to /orders page

**State determination:**
```typescript
const criticalProducts = products.filter(p => p.status === 'CRITICAL');
const orderNowProducts = products.filter(p => p.status === 'ORDER_NOW');

if (criticalProducts.length === 0 && orderNowProducts.length === 0) {
  dashboardState = 'healthy';
} else if (criticalProducts.length + orderNowProducts.length === 1) {
  dashboardState = 'single_urgent';
} else {
  dashboardState = 'multiple_urgent';
}
```

---

## Updating Mock Data

**Current approach:**
```typescript
// src/lib/data/mock-products.ts
function getStatus(weeksRemaining: number): ProductStatus {
  if (weeksRemaining < 2) return "CRITICAL";  // ❌ Hard-coded
  if (weeksRemaining < 6) return "ORDER_NOW";
  return "HEALTHY";
}
```

**Updated approach:**
```typescript
// src/lib/calculations.ts
export function calculateProductStatus(
  weeksRemaining: number,
  targetSOH: number = 6
): ProductStatus {
  if (weeksRemaining < targetSOH) return "CRITICAL";
  if (weeksRemaining < 16) return "ORDER_NOW";
  return "HEALTHY";
}

// Usage in components
const targetSOH = useTargetSOH(); // Hook that reads from localStorage
const status = calculateProductStatus(product.weeksRemaining, targetSOH);
```

---

## Container Recommendation Logic

**When to recommend a container:**
- Product drops below 16 weeks (orange zone)
- Order quantity: Brings product back to target + lead time buffer

**Example:**
```
Product A:
- Current: 12 weeks (ORANGE)
- Weekly: 1000 cartons
- Target: 6 weeks
- Lead time: 8 weeks

Order quantity calculation:
  Target coverage = 6 weeks (target) + 8 weeks (lead time) = 14 weeks
  Current shortage = 14 weeks - 12 weeks = 2 weeks
  Order quantity = 2 weeks × 1000 cartons = 2,000 cartons
```

**Container grouping:**
- Group products with similar delivery timing
- Optimize for full container utilization
- Consider supplier constraints

---

## Migration Plan

### Phase 1: Document (Current)
- ✅ Create this documentation
- ✅ Define status system clearly
- ✅ Plan UI component

### Phase 2: Update Calculations
- [ ] Move status logic to `src/lib/calculations.ts`
- [ ] Accept `targetSOH` parameter
- [ ] Update all products to use new function

### Phase 3: Add UI Setting
- [ ] Create `TargetSOHSetting` component
- [ ] Add to dashboard
- [ ] Wire up with localStorage

### Phase 4: Dynamic Updates
- [ ] Create `useTargetSOH` hook
- [ ] Recalculate product statuses when target changes
- [ ] Update dashboard state accordingly

### Phase 5: Container Logic
- [ ] Update container recommendation algorithm
- [ ] Use targetSOH + lead time for order quantities
- [ ] Test with different target values

---

## Testing Scenarios

**Test with different target SOH values:**

1. **Conservative (10 weeks):**
   - More products in orange/red
   - More frequent orders
   - Larger safety buffer

2. **Standard (6 weeks):**
   - Balanced approach
   - Moderate order frequency
   - Current default

3. **Aggressive (4 weeks):**
   - Fewer urgent products
   - Less frequent orders
   - Tighter inventory

**Verify:**
- Status colors update correctly
- Dashboard state changes appropriately
- Container recommendations adjust
- UI messaging reflects urgency

---

## Open Questions

1. **Should target SOH be per-product or global?**
   - Initial: Global (simpler)
   - Future: Per-product override (more flexible)

2. **Should we show what target SOH does?**
   - "Your target: 6 weeks → Products below 6 weeks show as urgent"
   - Help text or tooltip

3. **Should we suggest optimal target?**
   - Based on historical data, lead times
   - "Recommended: 8 weeks based on your order patterns"

4. **Visual feedback when changing target?**
   - Show how many products would change status
   - "Setting to 8 weeks would mark 3 more products as urgent"

---

## Related Documentation

- [Component System](./component-system.md) - How components adapt to status
- [Healthy State](../states/healthy.md) - Green state design
- [State Management](../guides/state-management.md) - Demo state system

---

**Next Steps:**
1. Update `src/lib/calculations.ts` with new status function
2. Create `TargetSOHSetting` component
3. Add setting to dashboard
4. Update mock data to use dynamic calculation
