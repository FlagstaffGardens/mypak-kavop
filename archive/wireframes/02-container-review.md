# Container Review

**Entry point:** User clicks "REVIEW CONTAINER 1" from Dashboard → Lands here

---

## Navigation

```
┌─────────────────────────────────────────────────────────────┐
│  ← Dashboard                                                │
│                                    Valley Park Farms • Ian   │
└─────────────────────────────────────────────────────────────┘
```

---

## Page Structure

```
CONTAINER 1 — ORDER BY NOV 12

[SECTION 1: CONTAINER SUMMARY]

[SECTION 2: ALL PRODUCTS (edit quantities)]

[SECTION 3: SHIPPING DETAILS]

[APPROVE ORDER BUTTON]
```

---

## Section 1: Container Summary

```
┌─────────────────────────────────────────────────────────────┐
│  CONTAINER 1                                                │
│                                                             │
│  Order by: Nov 12, 2025                                     │
│  Delivery: Dec 27, 2025 (est.)                              │
│                                                             │
│  Total: 91,000 cartons (1.0 containers)                     │
│  Container capacity: 90,000-95,000 cartons                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Section 2: Products

### Products in This Container (3)

```
┌─────────────────────────────────────────────────────────────┐
│  Woolworths Cage Free 700g                                  │
│                                                             │
│  Current: 80,000 → Using 12,000/week → Runs out Dec 18     │
│                                                             │
│  Quantity: [   33,000   ] cartons                          │
│                                                             │
│  After delivery: 113,000 (9.4 weeks supply)                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  FYFE Family 800g Free Range                                │
│                                                             │
│  Current: 90,000 → Using 13,000/week → Runs out Dec 20     │
│                                                             │
│  Quantity: [   35,000   ] cartons                          │
│                                                             │
│  After delivery: 125,000 (9.6 weeks supply)                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Coles Free Range 800g                                      │
│                                                             │
│  Current: 70,000 → Using 11,000/week → Runs out Dec 23     │
│                                                             │
│  Quantity: [   23,000   ] cartons                          │
│                                                             │
│  After delivery: 93,000 (8.5 weeks supply)                 │
└─────────────────────────────────────────────────────────────┘
```

### Add More Products (collapsed by default)

```
┌─────────────────────────────────────────────────────────────┐
│  [ + ADD MORE PRODUCTS TO THIS ORDER ]                      │
└─────────────────────────────────────────────────────────────┘
```

**Expanded:**

```
┌─────────────────────────────────────────────────────────────┐
│  [ - CLOSE ]                                                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  FYFE Family 900g Free Range                                │
│                                                             │
│  Current: 120,000 → Using 10,000/week → Runs out Jan 15    │
│                                                             │
│  Quantity: [        0   ] cartons                          │
│                                                             │
│  After delivery: 120,000 (12.0 weeks supply)               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  FYFE Family 600g Free Range                                │
│                                                             │
│  Current: 150,000 → Using 8,000/week                        │
│                                                             │
│  Quantity: [        0   ] cartons                          │
│                                                             │
│  After delivery: 150,000 (18.8 weeks supply)               │
└─────────────────────────────────────────────────────────────┘

[+ 5 more products with quantity fields]
```

---

## Section 3: Shipping Details

```
┌─────────────────────────────────────────────────────────────┐
│  SHIPPING DETAILS                                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Preferred Container Arrive Time:                           │
│                                                             │
│  ◉ Standard (approx. 8 weeks)                               │
│  ○ Urgent (extra charges apply)                             │
│  ○ Specific Date: [  Please choose date  ]                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Shipping Term (Required):                                  │
│                                                             │
│  [ DDP - Delivered Duty Paid                            ▼] │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Customer Order Number (optional):                          │
│                                                             │
│  [                                                        ] │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Comments (optional, max 230 characters):                   │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │                                                       │ │
│  │                                                       │ │
│  │                                                       │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Section 4: Action Button

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃                                                       ┃  │
│  ┃  APPROVE ORDER — 91,000 CARTONS                      ┃  │
│  ┃                                                       ┃  │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│                                                             │
│  [ Cancel ]                                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Interactions

**Products in container:**
- Shows 3 products recommended for this container with pre-filled quantities
- User can edit any quantity
- Click "[+ ADD MORE PRODUCTS]" → Expands to show remaining 7 products

**Add more products:**
- Shows all other products (not in container) with quantity = 0
- User can add any product to this order by entering quantity
- Click "[-  CLOSE]" → Collapses back

**Edit quantities:**
- Click on any quantity field → Edit inline
- Enter quantity (or 0 to remove from order)
- "After delivery" and "weeks supply" recalculate instantly
- Container Summary total updates
- Container capacity warning appears if > 95,000 cartons

**Note:** Burn rate cannot be edited here - only on Dashboard

**Shipping details:**
- Arrive time defaults to "Standard (approx. 8 weeks)"
- User can select "Urgent" (extra charges) or pick specific date
- Shipping term required (dropdown: DDP, FOB, etc.)
- Customer order number and comments are optional

**Approve order:**
- Click "APPROVE ORDER" → Validates shipping term is selected
- Navigates to Confirmation screen (see 04-confirmation.md)

**Cancel:**
- Click "Cancel" → Returns to Dashboard without saving changes

---

## Container Capacity Logic

**Warnings:**
- If total < 50,000: "⚠️ Small order (0.5 container) — Consider combining with other products"
- If total > 95,000: "⚠️ Exceeds container capacity — Remove products or create 2nd container"
- If 50,000-95,000: No warning (healthy range)

---

*Status: Draft - needs review*
