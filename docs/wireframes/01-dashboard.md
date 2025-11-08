# Dashboard (Home)

**Entry point:** User logs into MyPak Connect → Lands on Dashboard

---

## Navigation

```
┌─────────────────────────────────────────────────────────────┐
│  MyPak Connect        [Dashboard] | Orders                  │
│                                    Valley Park Farms • Ian   │
└─────────────────────────────────────────────────────────────┘
```

---

## Page Structure

```
[SECTION 1: RECOMMENDATION CARD]

[SECTION 2: PRODUCT CHARTS - ORDER NOW]

[SECTION 3: HEALTHY PRODUCTS (collapsed)]
```

---

## Section 1: Recommendation Card

### State: Urgent Container

```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️  ACTION REQUIRED                                  [URGENT]│
│                                                             │
│  Container 1 — Order by Nov 12                              │
│  3 products running out Dec 18-23, 2025                     │
│                                                             │
│  Woolworths 700g • FYFE 800g • Coles 800g                  │
│                                                             │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃                                                       ┃  │
│  ┃  REVIEW CONTAINER 1 — 91,000 CARTONS                 ┃  │
│  ┃                                                       ┃  │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
└─────────────────────────────────────────────────────────────┘
```

### State: All Healthy

```
┌─────────────────────────────────────────────────────────────┐
│  ✓  ALL PRODUCTS HEALTHY                                    │
│                                                             │
│  All 10 products have sufficient supply                     │
│  Next order recommended: Dec 3 (Container 2)                │
└─────────────────────────────────────────────────────────────┘
```

### State: Multiple Containers

```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️  MULTIPLE ORDERS NEEDED                           [URGENT]│
│                                                             │
│  Container 1 — Order by Nov 12 (3 products)                 │
│  Container 2 — Order by Nov 15 (3 products)                 │
│                                                             │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃  REVIEW CONTAINER 1 — 91,000 CARTONS                 ┃  │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│                                                             │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃  REVIEW CONTAINER 2 — 75,000 CARTONS                 ┃  │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
└─────────────────────────────────────────────────────────────┘
```

---

## Section 2: Product Charts - Order Now

**Shows 6 cards (sorted by stockout date)**

```
┌─────────────────────────────────────────────────────────────┐
│  WOOLWORTHS CAGE FREE 700G                       🔴 ORDER NOW│
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  120K├─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ TARGET              │   │
│  │      │                           ╱─────────         │   │
│  │   80K├●                         │                   │   │
│  │      │ ╲                        │ 85K arrives       │   │
│  │   40K├  ╲                       │ Nov 20            │   │
│  │      │   ╲                      │ (Order #1847)     │   │
│  │    0K├    ╲─────────────────────×                   │   │
│  │      └────┬─────┬─────┬─────┬─────┬─────           │   │
│  │         Now  Nov  Dec  Dec  Jan  Jan               │   │
│  │              13   27   11   25                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Current Stock: 80,000 ✏️                                   │
│  Expected Weekly Consumption: 12,000/week ✏️                │
│  Runs Out: Dec 18, 2025                                     │
│                                                             │
│  Approved Orders:                                           │
│  • Order #MP-2024-1847: 85,000 → Nov 20                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  FYFE FAMILY 800G FREE RANGE                     🔴 ORDER NOW│
│                                                             │
│  [Similar chart - runs out Dec 20]                         │
│                                                             │
│  Current Stock: 90,000 ✏️                                   │
│  Expected Weekly Consumption: 13,000/week ✏️                │
│  Runs Out: Dec 20, 2025                                     │
│                                                             │
│  Approved Orders:                                           │
│  • Order #MP-2024-1847: 35,000 → Nov 20                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  COLES FREE RANGE 800G                           🔴 ORDER NOW│
│                                                             │
│  [Similar chart - runs out Dec 23]                         │
│                                                             │
│  Current Stock: 70,000 ✏️                                   │
│  Expected Weekly Consumption: 11,000/week ✏️                │
│  Runs Out: Dec 23, 2025                                     │
│                                                             │
│  Approved Orders:                                           │
│  • Order #MP-2024-1847: 22,000 → Nov 20                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  FYFE FAMILY 900G FREE RANGE                     🔴 ORDER NOW│
│                                                             │
│  [Chart - runs out Jan 15]                                 │
│                                                             │
│  Current Stock: 120,000 ✏️                                  │
│  Expected Weekly Consumption: 10,000/week ✏️                │
│  Runs Out: Jan 15, 2025                                     │
│                                                             │
│  No approved orders yet                                     │
└─────────────────────────────────────────────────────────────┘

[+ 2 more products needing orders]
```

### Editing Product Data

**When user clicks ANY ✏️ icon (Current Stock OR Consumption):**

```
┌─────────────────────────────────────────────────────────────┐
│  WOOLWORTHS CAGE FREE 700G                       🔴 ORDER NOW│
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  120K├─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ TARGET              │   │
│  │      │                           ╱─────────         │   │
│  │   80K├●                         │                   │   │
│  │      │ ╲                        │ 85K arrives       │   │
│  │   40K├  ╲                       │ Nov 20            │   │
│  │      │   ╲                      │ (Order #1847)     │   │
│  │    0K├    ╲─────────────────────×                   │   │
│  │      └────┬─────┬─────┬─────┬─────┬─────           │   │
│  │         Now  Nov  Dec  Dec  Jan  Jan               │   │
│  │              13   27   11   25                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Current Stock: [   80,000   ]                              │
│  Expected Weekly Consumption: [   12,000   ] /week          │
│                                                             │
│  [Save]  [Cancel]                                           │
│                                                             │
│  Runs Out: Dec 18, 2025 (updates as you type)               │
│                                                             │
│  Approved Orders:                                           │
│  • Order #MP-2024-1847: 85,000 → Nov 20                    │
└─────────────────────────────────────────────────────────────┘
```

**After user types new value (e.g., 15,000):**

```
┌─────────────────────────────────────────────────────────────┐
│  WOOLWORTHS CAGE FREE 700G                       🔴 ORDER NOW│
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  120K├─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ TARGET              │   │
│  │      │                           ╱─────────         │   │
│  │   80K├●                         │                   │   │
│  │      │ ╲╲                       │ 85K arrives       │   │
│  │   40K├   ╲╲                     │ Nov 20            │   │
│  │      │    ╲╲                    │ (Order #1847)     │   │
│  │    0K├     ╲╲────────────────────×                  │   │
│  │      └────┬─────┬─────┬─────┬─────┬─────           │   │
│  │         Now  Nov  Dec  Dec  Jan  Jan               │   │
│  │              13   27   11   25                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                Chart updates as you type ↑                  │
│                                                             │
│  Current Stock: [   85,000   ] ← Changed                    │
│  Expected Weekly Consumption: [   15,000   ] /week ← Changed│
│                                                             │
│  [Save]  [Cancel]                                           │
│                                                             │
│  Runs Out: Dec 1, 2025 ← Updated! (was Dec 18)              │
│                                                             │
│  Approved Orders:                                           │
│  • Order #MP-2024-1847: 85,000 → Nov 20                    │
└─────────────────────────────────────────────────────────────┘
```

**After clicking Save:**

```
┌─────────────────────────────────────────────────────────────┐
│  ✓ Product data updated                                     │
│  Recommendations and charts recalculated                    │
└─────────────────────────────────────────────────────────────┘

(Card returns to normal state with new values)

┌─────────────────────────────────────────────────────────────┐
│  WOOLWORTHS CAGE FREE 700G                       🔴 ORDER NOW│
│                                                             │
│  [Chart now shows steeper decline line]                    │
│                                                             │
│  Current Stock: 85,000 ✏️                                   │
│  Expected Weekly Consumption: 15,000/week ✏️                │
│  Runs Out: Dec 1, 2025                                      │
│                                                             │
│  Approved Orders:                                           │
│  • Order #MP-2024-1847: 85,000 → Nov 20                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Section 3: Healthy Products

**Collapsed by default**

```
┌─────────────────────────────────────────────────────────────┐
│  ✓ 4 HEALTHY PRODUCTS (12+ weeks supply)                   │
│                                                             │
│  [ Show Healthy Products ▼ ]                                │
└─────────────────────────────────────────────────────────────┘
```

**Expanded:**

```
┌─────────────────────────────────────────────────────────────┐
│  ✓ 4 HEALTHY PRODUCTS (12+ weeks supply)                   │
│                                                             │
│  [ Hide Healthy Products ▲ ]                                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  FYFE FAMILY 600G FREE RANGE                      ✓ HEALTHY │
│                                                             │
│  [Chart - flat healthy line]                               │
│                                                             │
│  Current Stock: 150,000 ✏️                                  │
│  Expected Weekly Consumption: 8,000/week ✏️                 │
│  Safe for: 18+ weeks                                        │
└─────────────────────────────────────────────────────────────┘

[+ 3 more healthy products]
```

---

## Interactions

**Recommendation Card:**
- Click "REVIEW CONTAINER 1" → Navigates to Container Review screen (see 02-container-review.md)

**Edit Product Data:**
- Click ✏️ icon next to Current Stock OR Expected Weekly Consumption → Enters edit mode
  - Both fields become editable
  - Chart updates LIVE as you type (steeper/flatter decline line)
  - "Runs Out" date recalculates LIVE as you type
  - Shows [Save] and [Cancel] buttons
- Type new values → Chart and dates update instantly
- Click [Save] → Saves new values (PERSISTENT)
  - Success message appears: "✓ Product data updated"
  - Chart permanently updates to reflect new values
  - Recommendation card recalculates (may change urgency)
  - **These values persist and are used for ALL future calculations**
  - Returns to normal view with new values
- Click [Cancel] → Discards changes, returns to normal view
- Click outside → Same as cancel (discards changes)

**Product Card Hover:**
- Hover on replenishment spike → Shows order details tooltip
  - Order number, quantity, expected delivery date

**Healthy Section:**
- Click "Show Healthy Products" → Expands to show healthy product cards
- Click "Hide Healthy Products" → Collapses section

---

## Chart Behavior

**Shows:**
- Current stock (starting point ●)
- Declining line (burn rate projection)
- Target level (dashed line)
- Stockout point (× where hits zero)
- Replenishment spike (vertical jump on arrival date)

**Auto-updates:**
- Edit expected consumption → Chart recalculates instantly
- Approve order → Spike appears on chart with order number
- System detects order → Spike added automatically

**Important:**
- Charts show APPROVED ORDERS ONLY (reality)
- Recommended containers (not yet approved) do NOT appear on charts
- They only appear in the recommendation card at the top

---

## Sorting

**Products sorted by:**
1. Urgency (Order Now → Healthy)
2. Within group: Stockout date (soonest first)

---

## Product Data Management

**Current Stock & Expected Weekly Consumption:**
- User sets both values for each product
- Values persist and are used for ALL calculations
- Recommendations, charts, stockout dates all based on these values
- User can update anytime by clicking ✏️ icon

**What these values control:**
- **Current Stock:** Starting point for projections
- **Expected Weekly Consumption:** Rate of depletion
- Together they determine: When product runs out, when to order, how much to order

**Example scenarios:**
```
Scenario 1: Holiday surge
Current: 80,000 | Consumption: 12,000/week → Runs out Dec 18
User changes consumption to 15,000/week → Now runs out Dec 5
→ Container recommendation becomes more urgent

Scenario 2: Inventory correction
Current: 80,000 (system value) | Actual: 85,000 (physical count)
User updates to 85,000 → Chart adjusts, runs out later
→ Container recommendation may shift to next week

Scenario 3: New retail contract
Current: 90,000 | Consumption: 13,000/week
User expects 20% growth → Changes to 16,000/week
→ All future planning based on new rate
```

---

## Settings (Global)

User can set: **Target SOH weeks** (default: 10 weeks)
- System calculates target for each product: `burn_rate × target_weeks`
- Shows as dashed line on charts
- Accessible via gear icon in top right

**Other settings:**
- Email notifications (order reminders, delivery updates)
- Default shipping term (DDP, FOB, etc.)
- Business hours for notifications

---

*Status: Complete - ready for review*
