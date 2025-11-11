# Connect VMI - Wireframes v3 (Radically Simplified)

*One Screen. One Button. Don't Run Out.*
*Last Updated: 2025-11-07*

---

## Philosophy

**The product has ONE job: Get the farmer to click the button before they run out.**

Everything else is supporting evidence.

---

## The One Screen (Valley Park Example)

### Top: The Emergency (Impossible to Miss)

```
═══════════════════════════════════════════════════════════
                VALLEY PARK — INVENTORY STATUS
═══════════════════════════════════════════════════════════

        🚨 3 PRODUCTS RUN OUT DEC 18-23, 2025

   Woolworths 700g  •  FYFE 800g  •  Coles 800g




┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                                                         ┃
┃                                                         ┃
┃      ORDER CONTAINER 1 — 91,000 CARTONS                ┃
┃                                                         ┃
┃      Order by: Nov 12  •  Arrives: Dec 27              ┃
┃                                                         ┃
┃                                                         ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

**Design specs:**
- Red gradient background fading from top
- Large white text, centered
- Products listed horizontally with bullets
- Button is HUGE (80px tall, full width)
- Green (#34c759), impossible to miss
- White space around everything

### Middle: The Proof (Visual Trust)

```
What this container does:

  Combined Stock (3 products)
    │
    │                     ╱──────────────── ALL SAFE ✓
 150K│                    ╱
    │                   ╱
    │        ●●●       ╱     Container arrives Dec 27
 100K│         ╲╲╲     ╱
    │          ╲╲╲   ╱
    │           ╲╲╲ ╱
  50K│            ╲╲×  ← ALL STOCKOUT Dec 18-23
    │             ××   (without order)
    │              ×
   0│──────────────────────────────────────────────
       Now    Nov    Dec    Jan    Feb    Mar

  Without order: All 3 products run out Dec 18-23
  With order: All 3 products restored to 10-week safety stock
```

**Design specs:**
- ONE chart showing combined stock
- Three overlapping red lines declining to stockout
- One green line showing safety after order arrives
- Annotated simply: "ALL SAFE" vs "ALL STOCKOUT"
- Clean, minimal, visual story

### Bottom: The Details (Simple List)

```
This container includes:

  • Woolworths Cage Free 700g        33,000 cartons
  • FYFE Family 800g Free Range      35,000 cartons
  • Coles Free Range 800g            23,000 cartons
  ─────────────────────────────────────────────────
  Total: 91,000 cartons (1 full container)


[ ▼ See individual product details ]  [ ✏️ Adjust burn rates ]
```

**Design specs:**
- Simple bulleted list
- Product names + quantities
- Total with visual separator
- Two text links (not buttons)
- Collapsed by default

### Footer: What's Next

```
───────────────────────────────────────────────────────────

🟡 NEXT UP

Container 2 needed by Dec 3 (not urgent yet)
  • FYFE 900g, FYFE 700g, Good Yolk 700g

[ ▼ See Container 2 details ]

───────────────────────────────────────────────────────────

✓ 4 OTHER PRODUCTS: All healthy (12+ weeks supply)

[ ▼ Show all products ]

═══════════════════════════════════════════════════════════
```

**Design specs:**
- Gray separator line
- Collapsed sections
- Just enough info to know what's coming
- Expandable for those who want details

---

## Progressive Disclosure: Individual Product Details

**When user clicks "▼ See individual product details":**

```
═══════════════════════════════════════════════════════════

▲ Hide details

CONTAINER 1 BREAKDOWN

───────────────────────────────────────────────────────────

WOOLWORTHS CAGE FREE 700G                          🔴 URGENT

Current stock: 80,000  •  Using: 12,000/week [edit]
Runs out: Dec 18 without order

  Stock Level
    │                     ╱────────── 120K (safe)
 120K│        ●           ╱
    │         ╲         ╱  33K arrives Dec 27
  80K│          ╲       ╱
    │           ╲     ╱
  40K│            ╲   ╱
    │             × Dec 18 (without order)
   0│─────────────────────────
       Now   Nov   Dec   Jan

───────────────────────────────────────────────────────────

FYFE FAMILY 800G FREE RANGE                        🔴 URGENT

Current stock: 90,000  •  Using: 13,000/week [edit]
Runs out: Dec 20 without order

  [Similar chart]

───────────────────────────────────────────────────────────

COLES FREE RANGE 800G                              🔴 URGENT

Current stock: 70,000  •  Using: 11,000/week [edit]
Runs out: Dec 23 without order

  [Similar chart]

───────────────────────────────────────────────────────────

▲ Hide details

═══════════════════════════════════════════════════════════
```

**Purpose:**
- For the 5% who want to verify
- Individual charts show the math
- Burn rates are editable
- Can collapse when done

---

## Progressive Disclosure: Container 2

**When user clicks "▼ See Container 2 details":**

```
═══════════════════════════════════════════════════════════

🟡 CONTAINER 2 (Not urgent — order by Dec 3)

  Combined Stock (3 products)
    │
    │                              ╱────── ALL SAFE ✓
 150K│                             ╱
    │                            ╱
    │        ●●●                ╱  Container arrives Jan 17
 100K│         ╲╲╲              ╱
    │          ╲╲╲            ╱
  50K│           ╲╲╲          ╱
    │            ╲╲╲        ╱
    │             ╲╲×      ╱  ← ALL STOCKOUT Jan 15-22
   0│──────────────────────────────────────
       Now   Nov   Dec   Jan   Feb   Mar

This container includes:

  • FYFE Family 900g Free Range      28,000 cartons
  • FYFE Family 700g Free Range      25,000 cartons
  • Good Yolk Cage Free 700g         22,000 cartons
  ─────────────────────────────────────────────────
  Total: 75,000 cartons (83% full container)

  💡 Consider waiting to fill container more efficiently
     System will remind you on Dec 3

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                                                         ┃
┃      ORDER CONTAINER 2 — 75,000 CARTONS                ┃
┃                                                         ┃
┃      Order by: Dec 3  •  Arrives: Jan 17               ┃
┃                                                         ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

[ ▼ See individual products ]  [ Schedule reminder ]

▲ Hide Container 2

═══════════════════════════════════════════════════════════
```

**Purpose:**
- Shows what's coming next
- Same format as Container 1
- Can order early if they want
- Or schedule reminder

---

## Progressive Disclosure: All Products

**When user clicks "▼ Show all products":**

```
═══════════════════════════════════════════════════════════

ALL PRODUCTS (10 total)

🔴 URGENT (3 products)

  ✓ In Container 1 (order by Nov 12)
  • Woolworths Cage Free 700g        Runs out Dec 18
  • FYFE Family 800g Free Range      Runs out Dec 20
  • Coles Free Range 800g            Runs out Dec 23

🟡 WATCH (3 products)

  ✓ In Container 2 (order by Dec 3)
  • FYFE Family 900g Free Range      Runs out Jan 15
  • FYFE Family 700g Free Range      Runs out Jan 18
  • Good Yolk Cage Free 700g         Runs out Jan 22

🟢 HEALTHY (4 products - 12+ weeks supply)

  • FYFE Family 600g Free Range      15+ weeks (150K stock)
  • Good Yolk Cage Free 600g         16+ weeks (140K stock)
  • Good Yolk Cage Free 500g         17+ weeks (130K stock)
  • Valley Park FYFE Display Unit    20+ weeks (200K stock)

[ Click any product to see detailed projection ]

▲ Hide all products

═══════════════════════════════════════════════════════════
```

**Purpose:**
- Complete visibility
- Organized by urgency
- Shows which containers products are in
- Can drill into any product

---

## Interaction Flows

### Flow 1: Quick Approval (95% case)

**Ian logs in on Nov 5:**

```
1. Sees screen
2. Reads: "3 PRODUCTS RUN OUT DEC 18-23"
3. Sees: Giant green button "ORDER CONTAINER 1"
4. Glances at chart: Lines go to danger → Order fixes it
5. Sees list: Woolworths, FYFE, Coles (his big movers)
6. Clicks button
7. Confirmation modal appears
8. Done
```

**Time: 15 seconds**

**Screen states:**
```
State 1: Initial view (emergency + button + proof)
State 2: Button shows loading spinner
State 3: Confirmation modal slides up
State 4: Dashboard shows "Container 1 ordered ✓"
```

### Flow 2: Wants to Verify (5% case)

**Ian is cautious:**

```
1. Sees screen
2. Reads: "3 PRODUCTS RUN OUT DEC 18-23"
3. Clicks: "▼ See individual product details"
4. Section expands showing 3 charts
5. Looks at Woolworths: 80K stock, 12K/week burn
6. Thinks: "Yeah that's about right"
7. Looks at FYFE: 90K stock, 13K/week burn
8. Thinks: "Yep, correct"
9. Looks at Coles: 70K stock, 11K/week burn
10. Thinks: "Makes sense"
11. Clicks: "▲ Hide details"
12. Clicks: Big green button
13. Done
```

**Time: 45 seconds**

**Screen states:**
```
State 1: Initial view
State 2: Details section expanded (animated slide down)
State 3: Details section collapsed (animated slide up)
State 4: Button loading
State 5: Confirmation modal
```

### Flow 3: Business Changed (1% case)

**Ian lost Woolworths contract last week:**

```
1. Sees screen
2. Reads: "3 PRODUCTS RUN OUT DEC 18-23"
3. Thinks: "Wait, we're not using 12K/week Woolworths anymore"
4. Clicks: "✏️ Adjust burn rates"
5. Modal appears with 3 products + burn rate inputs
6. Changes Woolworths from 12,000 → 7,000
7. System recalculates instantly:
   - Woolworths now runs out Jan 10 (not Dec 18)
   - Container 1 updates: Only FYFE + Coles (58K cartons)
   - System suggests: "Add FYFE 900g to fill container?"
8. Ian reviews new recommendation
9. Clicks "Update Container"
10. Modal closes
11. Main screen updates with new container
12. Ian clicks big green button
13. Done
```

**Time: 90 seconds**

**Screen states:**
```
State 1: Initial view
State 2: Burn rate modal opens
State 3: Values changed, system recalculating (spinner)
State 4: New recommendation shown in modal
State 5: Modal closes, main screen updates
State 6: Button loading
State 7: Confirmation modal
```

---

## Modal: Burn Rate Adjustment

```
┌───────────────────────────────────────────────────────┐
│  ✏️ Adjust Burn Rates                            [ × ] │
├───────────────────────────────────────────────────────┤
│                                                       │
│  CONTAINER 1 PRODUCTS                                 │
│                                                       │
│  Woolworths Cage Free 700g                            │
│  Current stock: 80,000                                │
│  Using: [    12,000    ] cartons/week                 │
│  ─────────────────────────────────────────────        │
│                                                       │
│  FYFE Family 800g Free Range                          │
│  Current stock: 90,000                                │
│  Using: [    13,000    ] cartons/week                 │
│  ─────────────────────────────────────────────        │
│                                                       │
│  Coles Free Range 800g                                │
│  Current stock: 70,000                                │
│  Using: [    11,000    ] cartons/week                 │
│  ─────────────────────────────────────────────        │
│                                                       │
│  [ Recalculate Container ]  [ Cancel ]                │
│                                                       │
└───────────────────────────────────────────────────────┘
```

**Interactions:**
- Input fields are editable
- Change any value → "Recalculate" button highlights
- Click Recalculate → System shows new container recommendation
- If container changes significantly → Show before/after comparison
- User approves changes → Modal closes → Main screen updates

---

## Modal: Order Confirmation

```
┌───────────────────────────────────────────────────────┐
│  ✅ Container Order Confirmed                         │
└───────────────────────────────────────────────────────┘

              ✓
        (Big checkmark
         animated)

    Your container order has been placed!
    Email confirmation sent to ian@valleypark.com


┌───────────────────────────────────────────────────────┐
│  Order #MPK-2025-11-00234                             │
│                                                       │
│  Container 1: 91,000 cartons                          │
│  • Woolworths 700g      - 33,000                      │
│  • FYFE 800g            - 35,000                      │
│  • Coles 800g           - 23,000                      │
│                                                       │
│  Expected arrival: Dec 27, 2025                       │
└───────────────────────────────────────────────────────┘


What Happens Next:

✓ Order sent to MyPak production (Just now)
⏳ Production begins (Nov 13, 2025)
📦 Container ships from facility (Dec 20, 2025)
🚚 Arrives at Valley Park Farms (Dec 27, 2025)


Updated Status:

🟢 Woolworths 700g    Healthy (order incoming Dec 27)
🟢 FYFE 800g          Healthy (order incoming Dec 27)
🟢 Coles 800g         Healthy (order incoming Dec 27)


┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                                                     ┃
┃              BACK TO DASHBOARD                      ┃
┃                                                     ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

**Design specs:**
- Full screen modal with blur background
- Animated checkmark (SVG animation)
- Order summary in card
- Timeline with icons
- Updated status preview
- Big button to return

---

## Responsive Behavior

### Desktop (1200px+)
- Emergency section: Full width, centered
- Button: Max 800px wide, centered
- Chart: 600px wide, centered
- Details: Expand in place

### Tablet (768px - 1199px)
- Same layout, narrower
- Chart: Full width
- Button: Full width
- Font sizes slightly smaller

### Mobile (< 768px)
- Stack everything vertically
- Emergency text: Smaller font, still bold
- Products: Listed vertically (not horizontal bullets)
- Button: Full width, 60px tall
- Chart: Full width, 300px tall
- Details: Full screen overlay when expanded

---

## Animation & Polish

### Button States
```
Normal:    Green background, white text
Hover:     Slightly darker green, subtle lift shadow
Active:    Pressed down effect
Loading:   Spinner replaces text
Success:   Checkmark animation, fades to confirmation
```

### Section Expansion
```
Collapsed: Single line with ▼ icon
Expanding: Smooth slide down (300ms ease-out)
Expanded:  Full content visible, ▲ icon
Collapsing: Smooth slide up (300ms ease-in)
```

### Chart Updates
```
Initial:   Chart draws from left to right (animated)
Edit:      Line morphs to new projection (animated)
Update:    Smooth transition between states
```

### Modal Transitions
```
Open:  Fade in background (200ms) → Slide up content (300ms)
Close: Slide down content (300ms) → Fade out background (200ms)
```

---

## Valley Park Real Data (10 Products)

### Urgent (Container 1)
1. **Woolworths Cage Free 700g**
   - Stock: 80,000 | Burn: 12,000/wk | Runs out: Dec 18
   - Order: 33,000 cartons

2. **FYFE Family 800g Free Range**
   - Stock: 90,000 | Burn: 13,000/wk | Runs out: Dec 20
   - Order: 35,000 cartons

3. **Coles Free Range 800g**
   - Stock: 70,000 | Burn: 11,000/wk | Runs out: Dec 23
   - Order: 23,000 cartons

**Container 1 Total: 91,000 cartons**

### Watch (Container 2)
4. **FYFE Family 900g Free Range (18-egg)**
   - Stock: 120,000 | Burn: 10,000/wk | Runs out: Jan 15
   - Order: 28,000 cartons

5. **FYFE Family 700g Free Range**
   - Stock: 100,000 | Burn: 9,000/wk | Runs out: Jan 18
   - Order: 25,000 cartons

6. **Good Yolk Cage Free 700g**
   - Stock: 95,000 | Burn: 8,000/wk | Runs out: Jan 22
   - Order: 22,000 cartons

**Container 2 Total: 75,000 cartons**

### Healthy (No order needed)
7. **FYFE Family 600g Free Range**
   - Stock: 150,000 | Burn: 8,000/wk | Runs out: Feb 15

8. **Good Yolk Cage Free 600g**
   - Stock: 140,000 | Burn: 7,000/wk | Runs out: Feb 20

9. **Good Yolk Cage Free 500g**
   - Stock: 130,000 | Burn: 6,000/wk | Runs out: Feb 28

10. **Valley Park FYFE Display Unit**
    - Stock: 200,000 | Burn: 2,000/wk | Runs out: Apr 15+

---

## Success Criteria

**This wireframe succeeds if:**

1. ✅ Ian sees the emergency in <3 seconds
2. ✅ Ian finds the button in <5 seconds
3. ✅ Ian understands what the button does (no confusion)
4. ✅ Ian can verify the recommendation (if he wants)
5. ✅ Ian can complete the order in <60 seconds
6. ✅ Ian trusts the system (transparent math)

**This wireframe fails if:**

1. ❌ Ian doesn't know what to do
2. ❌ Ian has to hunt for the action
3. ❌ Ian doesn't understand the chart
4. ❌ Ian feels forced to review details
5. ❌ Ian thinks it's too complicated

---

*End of Wireframes v3*
