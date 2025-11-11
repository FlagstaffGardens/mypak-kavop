# Connect VMI - Wireframes v2 (Timeline-Based Design)

*Y-axis = Stock Quantity, X-axis = Time*
*Last Updated: 2025-11-06*

---

## Product Overview

**Connect VMI v1** is a timeline-based inventory monitoring system that shows farmers when they'll run out of stock and recommends optimized container orders.

**Core Innovation:** Visual stock projections with before/after comparison, optimized for container-based ordering.

---

## Screen 1: Dashboard (Entry Point)

### Purpose
Quick overview of inventory health. Shows what needs attention immediately.

### Layout

```
┌────────────────────────────────────────────────────────────┐
│  MyPak Online                    Valley Park    👤 Ian     │
│  [New Order] [Tracking] [VMI] ← new tab                   │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  ⚠️  3 products need orders soon                           │
│  💡 We recommend 2 containers to keep everything healthy   │
│                                                            │
│  [ View Timeline & Recommendations ]                       │
└────────────────────────────────────────────────────────────┘

🔴 URGENT (Order within 2 weeks)

┌────────────────────────────────────────────────────────────┐
│  Woolworths Cage Free 700g                                 │
│  Runs out: Dec 18 (6 weeks)                               │
│  Current: 80,000 cartons → Using 12,000/week              │
│                                                            │
│  ████████▓▓▓▓▒▒▒▒░░░░░░                                  │
│                                                            │
│  [ View Details ]                                          │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  FYFE Free Range 800g                                      │
│  Runs out: Dec 25 (7 weeks)                               │
│  Current: 90,000 cartons → Using 13,000/week              │
│                                                            │
│  ██████████▓▓▓▓▒▒▒▒░░░                                   │
│                                                            │
│  [ View Details ]                                          │
└────────────────────────────────────────────────────────────┘

🟡 WATCH (Order within 4 weeks)

┌────────────────────────────────────────────────────────────┐
│  Better Eggs 12-pack                                       │
│  Runs out: Jan 8 (9 weeks)                                │
│  Current: 110,000 cartons → Using 12,000/week             │
│                                                            │
│  ████████████▓▓▓▓▒▒▒░░                                   │
│                                                            │
│  [ View Details ]                                          │
└────────────────────────────────────────────────────────────┘

🟢 HEALTHY (11 products - all good)

▶ Store Brands (3 products)
▶ Henergy (4 products)
▶ White Label (2 products)
▶ Rise n Shine (2 products)
```

### Interaction
- Big button at top: "View Timeline & Recommendations" → Goes to Screen 2
- Each product card clickable → Goes to Screen 2, focused on that product
- Green section collapses/expands on click
- Simple, scannable, prioritized by urgency

---

## Screen 2: Timeline View (The Core Product)

### Purpose
Show ALL products' stock projections on one screen. Visualize the impact of recommended container orders.

### Layout (Full Screen)

```
┌────────────────────────────────────────────────────────────┐
│  ← Back to Dashboard          Your Inventory Timeline      │
└────────────────────────────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WOOLWORTHS CAGE FREE 700G                          🔴 URGENT

   │
150K├
    │
120K├─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ TARGET (10 wks)
    │                           ╱───────────────
 90K├                          ╱ WITH ORDER
    │                         ╱  (30K arrives Dec 27)
 60K├        ●               ╱
    │         ╲             ╱
 30K├          ╲           ╱
    │           ╲         ╱
  0K├            ╲───────× WITHOUT ORDER
    │                      (Dec 18)
    └────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────
       Now   Nov   Nov   Dec   Dec   Jan   Jan   Feb
             13    27    11    25    8     22    5

Stock now: 80,000 | Using: [12,000]/week ← click | Target: 120,000

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FYFE FREE RANGE 800G                               🔴 URGENT

   │
150K├
    │
130K├─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ TARGET (10 wks)
    │                            ╱──────────────
100K├                           ╱ WITH ORDER
    │                          ╱  (35K arrives Dec 27)
 70K├        ●                ╱
    │         ╲              ╱
 40K├          ╲            ╱
    │           ╲          ╱
 10K├            ╲────────× WITHOUT ORDER
    │                       (Dec 25)
    └────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────
       Now   Nov   Nov   Dec   Dec   Jan   Jan   Feb
             13    27    11    25    8     22    5

Stock now: 90,000 | Using: [13,000]/week ← click | Target: 130,000

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BETTER EGGS 12-PACK                                🟡 WATCH

   │
150K├
    │
120K├─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ TARGET (10 wks)
    │                                    ╱─────────
100K├        ●                          ╱ WITH ORDER
    │         ╲                        ╱  (25K arrives Dec 27)
 70K├          ╲                      ╱
    │           ╲                    ╱
 40K├            ╲                  ╱
    │             ╲                ╱
 10K├              ╲──────────────× WITHOUT ORDER
    │                               (Jan 8)
    └────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────
       Now   Nov   Nov   Dec   Dec   Jan   Jan   Feb
             13    27    11    25    8     22    5

Stock now: 110,000 | Using: [12,000]/week ← click | Target: 120,000

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STORE BRAND 18-PACK                                🟢 HEALTHY

   │
180K├
    │
140K├─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ TARGET (10 wks)
    │        ●────────────────────────────────────
150K├                  STAYS HEALTHY
    │                  (No order needed yet)
120K├
    │
 90K├
    │
    └────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────
       Now   Nov   Nov   Dec   Dec   Jan   Jan   Feb
             13    27    11    25    8     22    5

Stock now: 150,000 | Using: [14,000]/week ← click | Target: 140,000

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 RECOMMENDED CONTAINER PLAN (Optimized for efficiency)

┌────────────────────────────────────────────────────────────┐
│  CONTAINER 1 - Order by Nov 12 → Arrives Dec 27           │
│                                                            │
│  ✓ Woolworths 700g      →  30,000 cartons                 │
│  ✓ FYFE 800g            →  35,000 cartons                 │
│  ✓ Better Eggs 12pk     →  25,000 cartons                 │
│                                                            │
│  Total: 90,000 cartons (1 full container)                 │
│                                                            │
│  Why this grouping?                                        │
│  • All three products run out around same time (Dec-Jan)  │
│  • Ordering together fills container efficiently          │
│  • Prevents all Dec stockouts with one shipment           │
│                                                            │
│  [ ✓ Approve Container 1 ] [ Edit Mix ]                   │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  CONTAINER 2 - Order by Dec 3 → Arrives Jan 17            │
│                                                            │
│  ⏱ Better Eggs 12pk     →  30,000 cartons                 │
│  ⏱ Store Brand 18pk     →  40,000 cartons                 │
│  ⏱ Henergy 6pk          →  20,000 cartons                 │
│                                                            │
│  Total: 90,000 cartons (1 full container)                 │
│                                                            │
│  Why wait?                                                 │
│  • These products don't run out until Jan-Feb              │
│  • Ordering now would create excess inventory              │
│  • We'll remind you on Dec 3                               │
│                                                            │
│  [ Schedule Reminder ]                                     │
└────────────────────────────────────────────────────────────┘

[ 🔄 Refresh All Projections ] [ ✏️ Edit All Burn Rates ]
```

### Key Elements

**Individual Product Charts:**
- **Y-axis:** Stock quantity (0 to max)
- **X-axis:** Time (weeks, actual dates)
- **Horizontal dashed line:** Target stock level (10 weeks buffer)
- **Solid declining line (RED):** Current projection without orders
- **Dashed rising line (GREEN):** Projection with recommended order
- **X mark:** Where stockout happens (without order)
- **Jump point:** Where order arrives and stock spikes up

**Info Bar Below Each Chart:**
- Current stock number
- Burn rate (clickable, editable inline)
- Target level
- Status indicator (red/yellow/green)

**Container Recommendations:**
- Grouped products that should be ordered together
- Total quantity per container
- Arrival date with lead time
- Explanation of WHY this grouping
- Action buttons (Approve or Schedule)

### Interactions

**Edit Burn Rate:**
1. Click `[12,000]` number
2. Input field appears: `[___15000___]`
3. Type new number
4. Hit Enter or click away
5. **Chart updates instantly:**
   - Line becomes steeper (more usage)
   - Stockout date moves earlier
   - Target level adjusts
   - With-order projection recalculates
6. Container recommendations update automatically

**Approve Container:**
1. Click "Approve Container 1"
2. Charts update immediately:
   - Red "WITHOUT ORDER" line disappears
   - Green "WITH ORDER" line becomes the main line
   - X mark (stockout) disappears
   - Status changes to 🟢 "Order Placed"
3. Goes to confirmation screen

**Edit Container Mix:**
1. Click "Edit Mix" button
2. Modal appears showing:
   ```
   Container 1 Contents (90,000 capacity)

   Woolworths 700g     [30,000] ← editable
   FYFE 800g           [35,000] ← editable
   Better Eggs 12pk    [25,000] ← editable

   Total: 90,000 / 90,000 (100% full) ✓

   [ Update Container ] [ Cancel ]
   ```
3. User adjusts quantities
4. System shows: "82,000 / 90,000 (91% full) - Add 8K more?"
5. User clicks "Update Container"
6. Charts recalculate with new quantities

---

## Screen 3: Order Confirmation

### Purpose
Confirm the order was placed. Show what happens next.

### Layout

```
┌────────────────────────────────────────────────────────────┐
│  ✅ Container Order Confirmed                              │
└────────────────────────────────────────────────────────────┘

              ✓
        (Big checkmark)

    Your container order has been placed
    Email confirmation sent to ian@valleypark.com

┌────────────────────────────────────────────────────────────┐
│  Order #MPK-2025-11-00234                                  │
│                                                            │
│  Container 1 (90,000 cartons):                            │
│  • Woolworths 700g      - 30,000                          │
│  • FYFE 800g            - 35,000                          │
│  • Better Eggs 12pk     - 25,000                          │
│                                                            │
│  Expected arrival: Dec 27, 2025                           │
└────────────────────────────────────────────────────────────┘

What Happens Next:

✓ Order sent to MyPak production (Just now)
⏳ Production begins (Nov 13, 2025)
📦 Container ships from facility (Dec 20, 2025)
🚚 Arrives at Valley Park Farms (Dec 27, 2025)

We'll send email updates at each stage.

┌────────────────────────────────────────────────────────────┐
│  Updated Timeline Preview                                  │
│                                                            │
│  Woolworths 700g     🟢 Healthy (order incoming Dec 27)   │
│  FYFE 800g           🟢 Healthy (order incoming Dec 27)   │
│  Better Eggs 12pk    🟢 Healthy (order incoming Dec 27)   │
│                                                            │
│  Next recommended order: Container 2 on Dec 3              │
└────────────────────────────────────────────────────────────┘

[ View Updated Timeline ] [ Back to Dashboard ]
```

### Interaction
- Shows order summary with all products in the container
- Timeline of what happens next (production → shipping → arrival)
- Preview of updated status (products now show "order incoming")
- Two buttons: view full timeline or go back to dashboard

---

## Design Principles

### 1. Visual First, Numbers Second
Charts show the story instantly. Numbers support the visual.

### 2. Before/After Comparison
Always show BOTH:
- What happens if you do nothing (red line to zero)
- What happens if you approve (green line stays healthy)

### 3. Container Context
Don't just show "order 30K of Woolworths". Show "Container 1 has Woolworths + FYFE + Better Eggs because they all need it around the same time".

### 4. Instant Recalculation
Edit any number → everything updates immediately. No "recalculate" button.

### 5. Explain the Why
Every recommendation includes:
- Why this quantity?
- Why this timing?
- Why group these products?

### 6. Progressive Disclosure
- Dashboard: Simple overview
- Timeline: Full detail with all products
- Individual product: Click to focus (optional, can scroll)

---

## Visual Design Specs

### Color Coding
- **Red line:** Current projection heading to stockout
- **Green line:** With-order projection staying healthy
- **Dashed horizontal line:** Target level (neutral blue)
- **X marks:** Danger (red)
- **Status badges:**
  - 🔴 Red: <4 weeks until stockout
  - 🟡 Yellow: 4-8 weeks until stockout
  - 🟢 Green: >8 weeks, above target

### Typography
- Product names: 16px, semi-bold
- Chart labels: 11px, regular
- Stock numbers: 14px, mono font (for alignment)
- Burn rate: 14px, blue (indicates editable)
- Explanations: 13px, gray

### Spacing
- Each product chart: 300px height
- Spacing between charts: 40px
- Chart margins: 60px left (Y-axis labels), 20px right
- Container cards: 24px padding, 12px gap between

### Interactivity
- Hover on chart: Show exact values at that week
- Click burn rate: Inline edit (blue highlight)
- Click chart: Zoom to focus view (optional)
- Hover on "WITH ORDER" line: Highlight which container it's from

---

## Mobile Responsive

### Dashboard (Mobile)
Same layout, stack vertically. Cards full width.

### Timeline (Mobile)
```
┌──────────────────────────┐
│  Woolworths 700g   🔴    │
│                          │
│  [CHART - taller, 400px] │
│                          │
│  Stock: 80,000           │
│  Using: [12,000]/wk      │
│  Target: 120,000         │
└──────────────────────────┘

┌──────────────────────────┐
│  FYFE 800g         🔴    │
│                          │
│  [CHART - taller, 400px] │
│                          │
│  Stock: 90,000           │
│  Using: [13,000]/wk      │
│  Target: 130,000         │
└──────────────────────────┘

[Container recommendations below]
```

Stack everything vertically. Make charts taller (more vertical space). Same data, optimized for touch.

---

## Edge Cases

### Case 1: User Orders Before Deadline
Timeline shows:
```
Woolworths 700g                            🟢 ORDER PLACED

   │                    ╱────────────
120K├─ ─ ─ ─ ─ ─ ─ ─ ╱ ─ TARGET
    │                ╱
 80K├ ●             ╱  30K arriving Dec 27
    │  ╲           ╱   (Order #234)
 40K├   ╲         ╱
    │    ╲       ╱
  0K├     ╲─────╱ (stockout prevented)
```

Stockout line fades to gray (no longer relevant).
Incoming order is the main line now.

### Case 2: User Changes Mind After Approving
Show "Cancel Order" button for 24 hours:
```
✅ Order placed Dec 27 arrival

This order can be cancelled until Nov 13.

[ Cancel This Order ]
```

After Nov 13 (production starts), button disappears.

### Case 3: Multiple Stockouts Same Week
Container recommendation combines all urgent products:
```
CONTAINER 1 - URGENT (Order immediately)

5 products running out Dec 18-25:
• Woolworths 700g      - 30,000
• FYFE 800g            - 35,000
• Better Eggs          - 25,000

Total: 90,000 (1 container)

⚠️ This order is CRITICAL - all 3 products stockout within 1 week
```

### Case 4: Can't Fill Full Container
```
CONTAINER 1 - Order by Nov 12

• Woolworths 700g      - 30,000

Total: 30,000 cartons (33% of container)

💡 Consider adding:
• FYFE 800g (runs out in 7 weeks) + 35,000 → 72% full
• Better Eggs (runs out in 9 weeks) + 25,000 → 100% full

[ Order As-Is ] [ Optimize Container ]
```

Give option to order partial container or optimize.

---

## What's NOT Included (v1)

❌ Historical analytics (trends over time)
❌ Multi-scenario planning ("conservative" vs "aggressive")
❌ Demand forecasting AI
❌ Cost optimization (carrying cost vs stockout risk)
❌ Integration with farm's sales data
❌ Automated ordering (autopilot mode)
❌ SMS/WhatsApp alerts
❌ Multi-user collaboration
❌ Custom reporting

These are future versions. V1 focuses on:
✅ Visual stock projections
✅ Container-optimized recommendations
✅ Manual approval with transparency
✅ Simple, trustworthy math

---

## Success Criteria

**A successful wireframe implementation means:**

1. **Farmer can glance and know:** "I need to order Container 1 by Nov 12 or I'll run out Dec 18"
2. **Farmer can verify:** Click burn rate, see chart update, confirm math makes sense
3. **Farmer can approve:** One click to place container order
4. **Farmer trusts it:** Can see exactly what happens with/without the order

**If it takes more than 2 minutes to understand and approve, we failed.**

---

*End of Wireframes*
