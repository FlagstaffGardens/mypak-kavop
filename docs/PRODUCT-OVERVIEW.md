# MyPak Connect - Product Design

## What It Does
Prevents distributors from running out of cartons by showing them when to order and how much.

---

## The Core Flow

```
┌──────────────────┐
│ Distributor      │
│ Enters Data      │
│                  │
│ Stock: 13,195    │
│ Usage: 3,350/wk  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ System           │
│ Calculates       │
│                  │
│ "Runs out:       │
│  March 4, 2025"  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ System           │
│ Recommends       │
│                  │
│ "Order by:       │
│  Feb 18"         │
│                  │
│ Container 1:     │
│ 90,000 cartons   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Distributor      │
│ Reviews & Orders │
│                  │
│ Adjusts → Submit │
└──────────────────┘
```

---

## Screen Design

### 1. Dashboard - "What Needs My Attention?"

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 💡 RECOMMENDATIONS                    URGENT ┃
┃                                              ┃
┃ 3 containers recommended in next 60 days    ┃
┃                                              ┃
┃ ┌──────────────────────────────────────┐    ┃
┃ │ Container 1 — Feb 18      [Review →] │    ┃
┃ │ 90K cartons • 3 products             │    ┃
┃ └──────────────────────────────────────┘    ┃
┃                                              ┃
┃ ┌──────────────────────────────────────┐    ┃
┃ │ Container 2 — Apr 15      [Review →] │    ┃
┃ │ 92K cartons • 4 products             │    ┃
┃ └──────────────────────────────────────┘    ┃
┃                                              ┃
┃ ┌──────────────────────────────────────┐    ┃
┃ │ Container 3 — Jun 20      [Review →] │    ┃
┃ │ 88K cartons • 3 products             │    ┃
┃ └──────────────────────────────────────┘    ┃
┃                                              ┃
┃        → View all 5 recommended orders       ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┌─────────────────────────────────────────────┐
│ Better Eggs FR 7 6pk        🔴 ORDER NOW    │
│                                             │
│  Stock Level ↓                              │
│  ╱╲                                         │
│ ╱  ╲___                                     │
│╱      ╲___×  (Runs out Mar 4)              │
│                                             │
│ Current: 13,195  ✏️                         │
│ Usage: 3,350/wk  ✏️                         │
│ Runs Out: March 4, 2025                     │
└─────────────────────────────────────────────┘

[5 more product cards...]
```

**Design Decision:** Show top 3 urgent containers + individual product status. User sees both big picture (containers) and details (products).

---

### 2. Orders - "What Should I Order?"

```
RECOMMENDED CONTAINERS
┌─────────────────────────────────────────────┐
│ Container 1 — Feb 18, 2025          URGENT  │
│ 90,000 cartons • 3 products                 │
│                                             │
│ [Review Details ▼]                          │
│                                             │
│ ┌─────────────────────────────────────┐     │
│ │ Better Eggs FR 7 6pk                │     │
│ │ Current: 13,195 → Runs out Mar 4    │     │
│ │ Recommended: 25,000 cartons         │     │
│ │                                     │     │
│ │ Better Eggs FR 8 10pk               │     │
│ │ Current: 89,013 → Runs out Apr 18   │     │
│ │ Recommended: 35,000 cartons         │     │
│ │                                     │     │
│ │ Henergy Barn 7 18pk                 │     │
│ │ Current: 93,200 → Runs out Apr 15   │     │
│ │ Recommended: 30,000 cartons         │     │
│ │                                     │     │
│ │ [Proceed to Full Review & Order]    │     │
│ └─────────────────────────────────────┘     │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Container 2 — Apr 15, 2025          URGENT  │
│ 92,000 cartons • 4 products                 │
│ [Review Details ▼]                          │
└─────────────────────────────────────────────┘

[Container 3, 4, 5...]

ORDERS EN ROUTE
┌─────────────────────────────────────────────┐
│ Order #MP-2025-0145         ✈️ IN TRANSIT  │
│ Ordered: Feb 1 → Arriving: Feb 15           │
│ 135,000 cartons                             │
└─────────────────────────────────────────────┘
```

**Design Decision:** Collapsible containers. Summary view for scanning, expand to see details. Keeps urgent orders at top, historical below.

---

### 3. Review & Submit - "Finalize My Order"

```
CONTAINER 1 — ORDER BY FEB 18, 2025

┌─────────────────────────────────────────────┐
│ Order by: Feb 18, 2025                      │
│ Expected Delivery: April 1, 2025            │
│ Total: 90,000 cartons (1.0 containers)      │
└─────────────────────────────────────────────┘

PRODUCTS IN THIS CONTAINER (3)
┌─────────────────────────────────────────────┐
│ Better Eggs FR Size 7 6pk                   │
│ Current: 13,195 → Using 3,350/wk            │
│                                             │
│ Quantity: [25,000] cartons                  │
│                                             │
│ After delivery: 38,195 (11.4 weeks) ✓       │
└─────────────────────────────────────────────┘

[2 more products...]

SHIPPING DETAILS
┌─────────────────────────────────────────────┐
│ Arrival Time:                               │
│ ◉ Standard (6 weeks)                        │
│ ○ Urgent (extra charges)                    │
│ ○ Specific Date: [___________]              │
│                                             │
│ Shipping Term: [DDP - Delivered Duty Paid] │
│ PO Number: [PO-2025-FEB-EGGS]               │
│ Comments: [________________________]        │
└─────────────────────────────────────────────┘

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ APPROVE ORDER — 90,000 CARTONS             ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

**Design Decision:** Editable quantities with live "after delivery" calculation. Full transparency before submitting. One-click approval when ready.

---

## Key Design Principles

### 1. Progressive Disclosure
```
Dashboard (Overview)
    ↓ Click "Review"
Orders (List of containers)
    ↓ Click "Expand"
Container Details (Product breakdown)
    ↓ Click "Proceed"
Review & Submit (Full form)
```

User only sees detail when they need it. No overwhelming data dumps.

### 2. Smart Defaults, Full Control
- System pre-fills quantities (based on safety stock)
- User can adjust anything
- Live recalculation on every change

### 3. Navigation Flow
```
Dashboard → Orders → Review
    ↑         ↑         ↑
    └─────────┴─────────┘
  All roads lead to Orders tab
```

**Why:** Orders tab = single source of truth. Dashboard just highlights urgency.

---

## Why This Design Works

### For Distributors
1. **See the problem:** Charts show stockout dates
2. **Get the solution:** Recommendations tell them what to order
3. **Stay in control:** They approve everything

### For MyPak
1. **Stickier customers:** Value-add service
2. **Predictable demand:** See orders coming months ahead
3. **Less support load:** Customers solve their own problems

### CMI Philosophy
- **Recommend, don't command**
- Customer owns the data
- Customer makes decisions
- System prevents disasters

---

## Demo
**File:** `high-fi-demo/index.html`

**What works:**
- ✅ Full navigation flow (Dashboard → Orders → Review)
- ✅ Live editing (click ✏️ → update stock/consumption → see instant recalc)
- ✅ Smart highlighting (click Review → navigates to Orders → highlights container)
- ✅ Expandable containers
- ✅ Professional McKinsey-style UI
