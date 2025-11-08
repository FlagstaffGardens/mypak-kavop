# Connect VMI - Product Specification v2

*Last Updated: 2025-11-07*
*Status: REVISED - Radically simplified approach*

---

## Product Vision

**"One screen. One button. Don't run out."**

---

## The Problem

### What Exists Today

**JJ manually creates VMI spreadsheets for 5 customers:**
- Excel file showing week-by-week inventory projections
- Emailed to customers
- Customers download, review, email back orders
- **These 5 customers LOVE it** - concept is validated

### Why Only 5 Use It

1. **Email attachment hunting** - "Which version is latest?"
2. **Manual process** - JJ has to create each one individually
3. **Not integrated** - Separate from MyPak Online ordering system
4. **Two confusing tables** - Departures + arrivals (customers only care about arrivals)
5. **Static** - Doesn't update when customer places orders

**The problem isn't the concept. The problem is execution.**

### The Customer Pain

**If farmers run out of cartons, they can't sell eggs. Production stops. Revenue lost. Catastrophic.**

- Can't forecast week-by-week accurately (orders change daily)
- But they KNOW their current burn rate
- Need to know: "When will I run out? What should I order?"
- Need it to be OBVIOUS and TRUSTWORTHY

### The Trust Issue (Critical)

- Full autopilot won't work (45-day lead time = too risky to get wrong)
- Need transparency (can verify the math)
- Need control (approve before order)
- Quote: "It's like driving a car - painful to trust someone with it if it blows up"

---

## The Solution

### One Screen. One Button.

**When customer logs into MyPak Online:**

They see ONE screen that shows:

1. **THE EMERGENCY** - "3 products run out Dec 18"
2. **THE SOLUTION** - "ORDER CONTAINER 1" (big button)
3. **THE PROOF** - Chart showing danger vs safe
4. **THE DETAILS** - What's in the container (collapsed by default)

**That's it.**

Not 14 product cards. Not scrolling through projections. Not hunting for what to do.

**The screen tells you:**
- What's wrong (stockout coming)
- What to do (order this container)
- Why it works (visual proof)
- When to do it (deadline)

**One decision. One click. Done.**

---

## The Product (Detailed)

### The One Screen

```
═══════════════════════════════════════════════════════════
                    INVENTORY STATUS
═══════════════════════════════════════════════════════════

        🚨 3 PRODUCTS RUN OUT DEC 18, 2025

        Woolworths 700g  •  FYFE 800g  •  Better Eggs


┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                                                         ┃
┃      ORDER CONTAINER 1 — 90,000 CARTONS                ┃
┃                                                         ┃
┃      Order by: Nov 12  •  Arrives: Dec 27              ┃
┃                                                         ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛


What this container does:

  Stock Level
    │                     ╱─────────────── SAFE ✓
    │                    ╱
    │        ●          ╱    Container arrives Dec 27
    │         ╲        ╱
    │          ╲      ╱
    │           ╲    ╱
    │            ╲  ╱
    │             ×  ← STOCKOUT Dec 18 (without order)
    └──────────────────────────────────
         Now    Nov    Dec    Jan    Feb


This container includes:

  • Woolworths Cage Free 700g      30,000 cartons
  • FYFE Free Range 800g            35,000 cartons
  • Better Eggs 12-pack             25,000 cartons


[ ▼ See individual products ]    [ ✏️ Adjust burn rates ]


───────────────────────────────────────────────────────────

📅 Next order: Container 2 needed Dec 3
✓ 11 other products: All healthy

═══════════════════════════════════════════════════════════
```

### The Hierarchy

**Level 1: THE EMERGENCY (top, impossible to miss)**
- Large text, centered
- Shows WHEN (actual date, not "6 weeks")
- Shows WHAT (which products)
- Red/urgent visual treatment

**Level 2: THE SOLUTION (big green button)**
- One giant clickable button
- "ORDER CONTAINER 1" (active voice, not "approve")
- Critical dates right there (order by, arrives)
- Green, prominent, unmissable

**Level 3: THE PROOF (visual chart)**
- ONE chart showing ALL products in this container
- Two lines: DANGER (red, goes to stockout) vs SAFE (green, stays healthy)
- Simple, visual, can verify at a glance
- Annotated clearly: "STOCKOUT Dec 18" vs "SAFE"

**Level 4: THE DETAILS (list)**
- Shows what's in the container
- Quantities listed
- Not individual charts (that's behind disclosure)

**Level 5: ADVANCED OPTIONS (collapsed)**
- "See individual products" → Shows three mini-charts
- "Adjust burn rates" → Edit modal
- "Other products" → Expand list
- Most users never click these

### Why This Works

**95% of the time:**
1. Customer sees "3 products run out Dec 18"
2. Customer sees big button "ORDER CONTAINER 1"
3. Customer glances at chart (line goes safe)
4. Customer clicks button
5. Done

**Time: 10 seconds**

**5% of the time (wants to verify):**
1. Customer clicks "See individual products"
2. Reviews Woolworths: 80K stock, 12K/week burn rate
3. Reviews FYFE: 90K stock, 13K/week burn rate
4. Reviews Better Eggs: 110K stock, 12K/week burn rate
5. Collapses details
6. Clicks button
7. Done

**Time: 45 seconds**

**1% of the time (business changed):**
1. Customer clicks "Adjust burn rates"
2. Changes Woolworths from 12K to 8K (lost contract)
3. Chart recalculates instantly
4. Stockout date updates
5. Container recommendation updates
6. Customer clicks button
7. Done

**Time: 90 seconds**

---

## How It Works (Under the Hood)

### Auto-Detect Burn Rate

**Every night, system calculates:**
- Last 4 weeks of actual shipments to customer
- Average weekly consumption per product
- Current stock level from MyPak ERP

**Formula:**
```
Burn Rate = Sum(last 4 weeks shipments) / 4
```

**Example:**
- Woolworths 700g: shipped 48,000 in last 4 weeks
- Burn rate: 48,000 / 4 = 12,000/week
- Current stock: 80,000
- Weeks until empty: 80,000 / 12,000 = 6.7 weeks
- Stockout date: Today + 6.7 weeks = Dec 18

### Group Products Into Containers

**System identifies products that:**
1. Run out within 2 weeks of each other
2. Need ordering around the same time
3. Can fill a container efficiently (90K cartons)

**Container 1 logic:**
- Woolworths runs out Dec 18
- FYFE runs out Dec 25
- Better Eggs runs out Jan 8
- All need orders by Nov 12 (45-day lead time)
- Total: 90K cartons (one full container)

**Why group them:**
- Ordering together fills container efficiently
- One shipment, one arrival date
- Prevents all three stockouts with one decision

### Calculate Order Quantities

**For each product in container:**
```
Target stock = Burn rate × 10 weeks (safety buffer)
Current projection at arrival = Current stock - (Burn rate × weeks until arrival)
Order quantity = Target stock - Current projection at arrival
```

**Example (Woolworths):**
- Current stock: 80,000
- Burn rate: 12,000/week
- Weeks until arrival: 7 weeks (Nov 12 + 45 days = Dec 27)
- Stock at arrival: 80,000 - (12,000 × 7) = -4,000 (STOCKOUT)
- Target stock: 12,000 × 10 = 120,000
- Order quantity: 120,000 - (-4,000) = 124,000
- **Round to container-friendly amount: 30,000** (fits with other products)

### Update Projections When Customer Edits

**If customer changes burn rate:**
1. Recalculate stockout date instantly (client-side)
2. Recalculate order quantity
3. Update chart visually
4. Update container recommendations
5. Save override to database

**No "recalculate" button. No page refresh. Instant.**

### When Customer Approves Order

**System:**
1. Creates order in MyPak ERP
2. Sends email confirmation
3. Updates screen to show "Order Placed"
4. Chart changes from "danger vs safe" to "incoming order"
5. Removes from urgent list
6. Recalculates next container needed

---

## What We're NOT Building (v1)

This is CRITICAL. We're building the minimum viable solution.

### NOT in v1:

❌ **Dashboard with 14 product cards**
- Show ONLY what needs action
- Everything else is "11 products healthy ✓"

❌ **Individual product screens**
- No separate page per product
- Details are progressive disclosure on main screen

❌ **Week-by-week forecast editing**
- One burn rate per product
- Not per-week customization

❌ **Container optimization UI**
- System calculates optimal container mix
- Customer can see it, but can't tweak it (v1)

❌ **Multi-scenario planning**
- No "conservative vs aggressive" projections
- One projection based on current burn rate

❌ **Historical analytics**
- No trend charts
- No "burn rate over time"
- Just current state + future projection

❌ **Cost optimization**
- No carrying cost calculations
- No "optimal order timing" based on cash flow

❌ **Mobile app**
- Responsive web only
- Must work on phone, but not native app

❌ **Autopilot mode**
- Every order requires approval
- No automatic ordering (yet)

❌ **Multi-user collaboration**
- One login per customer
- No "manager approves, assistant edits"

❌ **Email/SMS alerts**
- Customer logs in to see status
- No push notifications (v1)

❌ **Integration with farm sales data**
- Uses MyPak shipment history only
- Not farm's egg sales data

### What IS in v1:

✅ **One screen showing urgent containers**
✅ **Auto-detected burn rate**
✅ **Visual proof (chart)**
✅ **One-click order approval**
✅ **Burn rate editing (when business changes)**
✅ **Container grouping recommendations**
✅ **Progressive disclosure for details**
✅ **Email confirmation after order**

**That's it. Nothing else.**

---

## Product Principles

### 1. Emergency First, Details Second
Don't show me 14 products. Show me the 3 that need action.

### 2. Solution Over Analysis
Big button to fix the problem. Not dashboards to study the problem.

### 3. Visual Beats Text
One chart showing danger vs safe beats a thousand words.

### 4. Progressive Disclosure
95% see: Emergency → Button → Click
5% see: Emergency → Details → Button → Click

### 5. No Configuration
We calculate the right answer. Customer approves or adjusts.
No settings. No preferences. No setup.

### 6. Bank Account Mental Model
Balance, burn rate, time until empty.
Not: inventory management, safety stock, reorder points.

### 7. Container-First Thinking
Don't show "order 30K Woolworths."
Show "Container 1 has 3 products that all run out Dec 18."

### 8. Trust Through Transparency
Show the math. Show the danger. Show the fix.
Customer can verify. That's trust.

---

## Success Metrics

### Pilot Phase (8 weeks, 3 customers)

**Adoption:**
- ✅ All 3 customers log in at least weekly
- ✅ At least 10 orders placed via Connect (not email/WhatsApp)

**Trust:**
- ✅ 80%+ recommendation approval rate
- ✅ Customer feedback: "Easier than spreadsheet"
- ✅ Customer feedback: "Can verify the math"

**Effectiveness:**
- ✅ Zero stockouts during pilot
- ✅ All orders placed before deadline
- ✅ No emergency orders needed

**Simplicity:**
- ✅ Average time to approve order: <2 minutes
- ✅ 80%+ of approvals done without clicking "See details"
- ✅ No "too complicated" feedback

### Failure Criteria (Pivot Triggers)

**If any of these happen, we stop and redesign:**

❌ Customers don't use it (still ordering via email)
❌ Recommendations don't match their intuition (trust broken)
❌ Customer says "I don't understand what this wants me to do"
❌ Takes >5 minutes to make a decision
❌ Customer runs out of stock (system failed)

### Expansion Phase (Months 3-6)

**After pilot succeeds:**
- Migrate remaining 2 spreadsheet customers
- Expand to 10 new customers
- Target: 50+ orders via Connect
- Target: 90%+ approval rate

---

## Technical Requirements

### Data Sources

**Must have access to:**

1. **Current inventory** (M_Storage table)
   - Per product, per customer
   - Updated nightly

2. **Shipment history** (M_InOut, M_InOutLine)
   - Last 4 weeks minimum
   - Per product, per customer
   - To calculate burn rate

3. **Pending orders** (C_Order, C_OrderLine)
   - To show incoming inventory
   - To update projections

4. **Product catalog** (M_Product)
   - Product names, codes
   - Container capacity (90K)

5. **Customer data** (C_BPartner)
   - Customer name, contact info
   - For email confirmations

### Calculations (Backend)

**Nightly batch job:**
1. For each customer, for each product:
   - Calculate 4-week average burn rate
   - Calculate current stock level
   - Calculate stockout date
   - Calculate order quantity needed
2. Group products into optimal containers:
   - Same stockout timeframe (within 2 weeks)
   - Fill container efficiently (target 80-100%)
   - One arrival date per container
3. Identify urgent containers (order deadline <2 weeks)
4. Store in database for frontend

**Real-time (Frontend):**
1. When customer edits burn rate:
   - Recalculate stockout date (client-side JS)
   - Recalculate order quantity
   - Update chart visually
   - Update container groupings
2. When customer approves order:
   - Create order in ERP
   - Update UI to "Order Placed"
   - Send email confirmation

### Frontend Requirements

**Must work on:**
- Desktop browsers (Chrome, Safari, Edge)
- Tablet (iPad, Android tablets)
- Mobile (iPhone, Android phones in landscape)

**Performance:**
- Chart updates instantly when burn rate changes (<100ms)
- Page load <2 seconds
- No page refreshes for edits

**Integration:**
- Lives inside MyPak Online
- Same header, same navigation
- Same login/auth
- New tab: "Inventory Management"

### Backend API Endpoints

**GET /api/inventory/status**
- Returns urgent containers
- Returns all products summary
- Returns burn rates (auto + overrides)

**POST /api/inventory/burn-rate**
- Save customer burn rate override
- Recalculate projections
- Return updated recommendations

**POST /api/orders/approve**
- Create order in MyPak ERP
- Send confirmation email
- Return order number

**GET /api/inventory/details/{product_id}**
- Return individual product projection
- Return historical shipments
- For "See details" disclosure

---

## Pilot Plan

### Phase 1: Information Gathering (Week 1)

**Must collect:**
- [ ] JJ's actual spreadsheet (see current VMI design)
- [ ] MyPak Online tech stack (how to integrate)
- [ ] ERP database schema (data access)
- [ ] Pilot customer list (Valley Park, Agenbrook, Josh's Eggs)
- [ ] Sample data (last 4 weeks shipments for pilot customers)

### Phase 2: Design Validation (Week 2)

**Build HTML prototype:**
- [ ] One screen with realistic data
- [ ] Interactive chart (can edit burn rate)
- [ ] Big button to approve
- [ ] Progressive disclosure working
- [ ] Mobile responsive

**Show to pilot customers:**
- [ ] Valley Park walkthrough
- [ ] Agenbrook walkthrough
- [ ] Josh's Eggs walkthrough
- [ ] Get feedback: "Would you use this?"
- [ ] Iterate if needed

### Phase 3: Build MVP (Weeks 3-6)

**Backend:**
- [ ] Nightly calculation job
- [ ] Container grouping algorithm
- [ ] API endpoints
- [ ] Database schema

**Frontend:**
- [ ] Integrate into MyPak Online
- [ ] Main screen (emergency + button + chart)
- [ ] Progressive disclosure
- [ ] Burn rate editing
- [ ] Order approval flow
- [ ] Confirmation screen

**Testing:**
- [ ] Unit tests for calculations
- [ ] Integration tests with ERP
- [ ] User testing with pilot customers

### Phase 4: Pilot Launch (Weeks 7-14)

**Week 7: Soft launch**
- [ ] Valley Park only
- [ ] Daily check-ins
- [ ] Fix any bugs immediately

**Week 8: Add customer 2**
- [ ] Agenbrook
- [ ] Monitor both customers

**Week 9: Add customer 3**
- [ ] Josh's Eggs
- [ ] All 3 pilot customers live

**Weeks 10-14: Monitor**
- [ ] Weekly usage reports
- [ ] Track approval rates
- [ ] Collect feedback
- [ ] Fix issues
- [ ] Measure success metrics

### Phase 5: Decision Point (Week 15)

**If success criteria met:**
- [ ] Plan expansion to remaining spreadsheet customers
- [ ] Plan expansion to 10 new customers
- [ ] Build v1.1 roadmap

**If failure criteria hit:**
- [ ] Analyze what went wrong
- [ ] Redesign or pivot
- [ ] Don't scale until fixed

---

## The Bet We're Making

### What We Know (Validated)

✅ **Concept works** - 5 customers love the spreadsheet VMI
✅ **Burn rate approach works** - Farmers know current usage
✅ **Trust through transparency works** - Can verify the math
✅ **Problem is real** - Stockouts are catastrophic

### What We're Betting

**Bet 1: Simplicity wins**
- One screen beats dashboard with 14 products
- One button beats complex forms
- One chart beats multiple projections

**Bet 2: Integration drives adoption**
- Inside MyPak Online = convenience
- Separate tool = friction
- Same login, same system = more usage

**Bet 3: Container grouping is valuable**
- Showing "Container 1 fixes 3 products" is clearer than 3 separate recommendations
- One decision beats three decisions
- Efficiency story resonates

**Bet 4: Progressive disclosure builds trust**
- Default simple view = approachable
- Details available = trustworthy
- Forced details = overwhelming

### Risks

**Risk 1: Too simple**
- Customer wants more control/customization
- Mitigation: Progressive disclosure has advanced options

**Risk 2: Container grouping is wrong**
- System groups products incorrectly
- Customer wants to order separately
- Mitigation: Can edit container mix (v1.1)

**Risk 3: Burn rate is inaccurate**
- 4-week average doesn't reflect reality
- Seasonal spikes break the model
- Mitigation: Easy to override, system learns

**Risk 4: Integration is hard**
- MyPak Online is legacy system
- Can't integrate cleanly
- Mitigation: Start with data access, embed iframe if needed

---

## What Makes This Different

### vs Current Spreadsheet VMI

**Spreadsheet:**
- Email attachment (hunting for latest)
- Two tables (departures + arrivals)
- Static (doesn't update)
- Manual (JJ creates each one)
- Not integrated (separate from ordering)

**Connect VMI:**
- Always in MyPak Online (one login)
- One table (arrivals only, the stockout risk)
- Dynamic (updates when orders placed)
- Automated (system generates recommendations)
- Integrated (one-click ordering)

**Same:** Burn rate approach, transparent math, customer approval

### vs Traditional VMI Software

**Traditional VMI:**
- Complex dashboards with 20+ metrics
- Week-by-week forecast editing
- Configuration hell (safety stock, reorder points, lead times)
- Reports and analytics
- Expensive, multi-month implementations

**Connect VMI:**
- One screen with one decision
- One burn rate per product
- Zero configuration (we calculate it)
- No reports (just next action)
- Ship in 6 weeks

**Same:** Vendor monitors inventory, recommends orders

### vs Full Autopilot VMI

**Autopilot:**
- System orders automatically
- No customer approval
- Requires years of trust
- Used by Walmart+P&G after decade

**Connect VMI:**
- Customer approves every order
- Full transparency
- Builds trust first
- Path to autopilot later (v2+)

**Same:** Vendor manages inventory monitoring

---

## v1 → v2 Roadmap (Future)

**After v1 succeeds, we can add:**

### v1.1 (Quick Wins)
- Edit container mix manually
- Email alerts for urgent containers
- Historical burn rate chart

### v1.5 (Advanced)
- Selective autopilot (customer sets rules)
- Mobile app (native)
- Multi-user accounts (manager + assistant)

### v2.0 (Transform)
- Integrate with farm sales data (not just shipments)
- AI-powered seasonality detection
- Full autopilot mode
- Multi-vendor platform

**But v1 must succeed first. No v2 until v1 works.**

---

## Approval & Sign-Off

**Before proceeding to design:**

- [ ] **Ethan**: This is the right level of simplicity
- [ ] **Ethan**: One screen approach is correct
- [ ] **Ethan**: Container grouping makes sense
- [ ] **Ethan**: Progressive disclosure is appropriate

**Before proceeding to build:**

- [ ] **Pilot customers**: Saw HTML prototype, would use it
- [ ] **MyPak technical**: Integration is feasible
- [ ] **MyPak operations**: Can support pilot customers

---

**Spec version:** v2 (Radically simplified)
**Last updated:** 2025-11-07
**Author:** Ethan + Claude
**Status:** DRAFT - Pending approval

---

*End of Spec*
