# Connect VMI - Product Specification v1

*Last Updated: 2025-11-06*
*Status: DRAFT - Core approach validated*

---

## Product Vision (One Sentence)

**"The VMI spreadsheet, but live in MyPak Online - showing farmers when they'll run out and what to order to prevent it."**

---

## What We Know (Validated)

### The Existing Spreadsheet VMI WORKS
- **5 customers currently use it and LOVE it**
- Shows projected inventory week-by-week
- Customers can "eyeball it" and verify the math
- Trust comes from transparency, not automation

### Why Only 5 Customers Use It
1. **Not integrated with MyPak Online** (where they actually order)
2. **Two confusing tables** (departures + arrivals; customers don't care about departures)
3. **Email attachment hell** (hunting for latest version)

### The Real Customer Pain
- **Running out of cartons stops production completely** (catastrophic)
- Can't provide reliable week-by-week forecasts (orders change too fast)
- Need to know: "At my current burn rate, when do I run out?"
- Current system (email spreadsheet) works but hard to access

### The Trust Issue (CRITICAL)
- Full autopilot won't work (too risky - "like trusting someone with your car")
- Need transparency ("can eyeball it and see it makes sense")
- Need control (approve orders before placement)
- **Quote from meeting:** "It's like driving a car - painful to trust someone with it if it blows up"

---

## The Core Insight: Burn Rate, Not Forecasting

**Farmers can't forecast week 8. But they KNOW their current burn rate.**

### What They Know:
- "Right now we're using about 12,000 cartons/week"
- "We just got a new contract, so it jumped to 15,000/week"
- "Lost a contract last month, now it's more like 9,000/week"

### What They Don't Know:
- "Week of Dec 11 we'll use exactly 13,245 cartons"
- "Week of Jan 15 we'll use exactly 11,892 cartons"

### Therefore:
**The product should auto-detect current burn rate from actual usage, and let customers override ONLY when their business changes.**

**NOT asking for forecasts. Showing current trajectory based on burn rate.**

**Mental model = bank account:**
- Balance: 80,000 cartons
- Burn rate: -12,000/week
- Time until empty: 6.7 weeks
- Top-up needed: 40,000 cartons

---

## MVP Product Definition

### The Whole Product (Steve Jobs Version)

**ONE SCREEN per product showing:**

1. **Current burn rate** (auto-detected, click to override)
2. **When they'll run out** (the critical date)
3. **Week-by-week stock projection** (visual chart)
4. **What to order to fix it** (recommendation)
5. **Approve button** (places order)

That's it. No modals. No complex forms. No week-by-week editing.

---

## Core User Flow

### Step 1: Customer logs into MyPak Online
- Clicks "Inventory Management" tab
- Sees dashboard with all their products

### Step 2: Dashboard shows what needs attention
- **Red products:** Will run out in <2 weeks
- **Yellow products:** Will run out in 2-4 weeks
- **Green products:** Healthy (>4 weeks supply)

### Step 3: Click a product to see details
Shows ONE screen with:

```
┌─────────────────────────────────────────────────────────────┐
│ S12G9Q - 12-pack Green (Better Eggs)                        │
│                                                             │
│ Current stock: 80,000 cartons                               │
│ Using: [12,000] cartons/week  ← auto-detected, click to    │
│                                  override                   │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐  │
│ │  TIMELINE CHART (Next 8 weeks)                        │  │
│ │                                                        │  │
│ │  120K ┤─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ Target (8 weeks)    │  │
│ │   80K ┤●╲                                              │  │
│ │   60K ┤  ╲                                             │  │
│ │   40K ┤   ╲                                            │  │
│ │   20K ┤    ╲                                           │  │
│ │    0K ┤     × STOCKOUT Dec 18                          │  │
│ │       └──────────────────────────────────────────      │  │
│ │        Nov  Nov  Nov  Dec  Dec  Dec  Dec             │  │
│ │         6   13   20   27   4   11   18               │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ ⚠️  You'll run out on Dec 18 (6 weeks from now)             │
│                                                             │
│ 💡 Recommendation:                                          │
│    Order 40,000 cartons by Nov 12                          │
│    Arrives: Dec 27 (45-day lead time)                      │
│    This prevents stockout and restores 8-week buffer       │
│                                                             │
│    [ Approve This Order ]                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Step 4: Customer updates burn rate (when business changes)
- Click the "12,000" number
- Type new number (e.g., "15,000")
- Chart instantly recalculates
- New stockout date shows
- New recommendation appears

### Step 5: Customer approves order
- Click "Approve This Order"
- Order placed to MyPak
- Chart updates to show incoming delivery
- Email confirmation sent

---

## Key Features

### 1. Auto-Detected Burn Rate

**How it works:**
- System calculates average usage from last 4 weeks of actual consumption
- Shows: "Using ~12,000/week (based on recent usage)"
- Customer can click and override if they know something changed

**When customers update:**
- Got new contract → bump it up
- Lost contract → lower it
- Seasonal change coming → adjust accordingly

**NOT:**
- Week-by-week forecasting
- Complex scenario planning
- False precision they don't have

### 2. Visual Stock Projection

**Timeline chart shows:**
- Current stock declining week-by-week
- Target level line (e.g., 8 weeks = 96,000 cartons)
- Stockout date marked clearly (the critical info)
- Incoming orders shown as green spikes

**Design principle:**
- Horizontal timeline (weeks on X-axis)
- Stock level on Y-axis
- Simple declining line = trust (can verify with mental math)

### 3. Order Recommendations

**For each product that needs ordering:**

Shows:
- **What:** Product name + quantity
- **When to order by:** Deadline to avoid stockout
- **When it arrives:** Delivery date (based on lead time)
- **Why:** "Prevents Dec 18 stockout, restores 8-week buffer"
- **One button:** "Approve This Order"

**NOT showing:**
- Multiple order options
- Container optimization (keep it simple)
- Complex editing forms

### 4. Integration with MyPak Online

**Critical for adoption:**
- Lives INSIDE MyPak Online (not separate tool)
- Same login, same navigation
- New tab: "Inventory Management"
- Orders placed through Connect go into same system as manual orders

---

## What We're NOT Building (v1)

❌ Full autopilot (auto-place without approval)
❌ Week-by-week forecast editing
❌ Container mixing optimization
❌ Multi-product optimization
❌ Historical analytics/reporting
❌ Mobile app (responsive web only)
❌ Multi-vendor platform (MyPak only for now)
❌ Product dependencies (glue calculations)
❌ Advanced business rules engine

---

## Product Principles

### 1. "Bank Account" Mental Model
Show them their balance, burn rate, and when they'll hit zero.
Not: complex inventory forecasting

### 2. "One Number" Input
Current burn rate. That's it.
Not: 12 weeks of individual forecasts

### 3. "Eyeball It" Transparency
Simple declining line = can verify with mental math
Not: black box algorithms

### 4. "Approve, Don't Configure"
One button to approve recommendation
Not: forms and options and settings

### 5. "Same Tool as Spreadsheet, Better Experience"
Same math, same transparency, better UX
Not: fundamentally different approach

---

## Technical Architecture

### Data Flow

**Inputs:**
1. **Current stock** (from MyPak ERP - actual inventory)
2. **Recent usage** (from shipment history - last 4 weeks average)
3. **Burn rate override** (from customer, when they update)
4. **Lead time** (from MyPak production schedule - currently 45 days)
5. **Target weeks** (customer preference, default 8 weeks)

**Calculation:**
```javascript
For each week from now to +8 weeks:
  week_start_stock = previous_week_end_stock
  week_usage = burn_rate
  week_arrivals = sum(orders arriving this week)
  week_end_stock = week_start_stock - week_usage + week_arrivals

  if (week_end_stock < 0):
    STOCKOUT_DATE = this_week

  if (week_end_stock < target_stock):
    WARNING_DATE = this_week
```

**Recommendation:**
```javascript
weeks_until_stockout = stockout_date - today
order_by_date = today + (weeks_until_stockout - lead_time_weeks)

if (order_by_date <= today):
  URGENT - order immediately

order_quantity = (target_stock - projected_stock_at_arrival)
```

**Output:**
- Timeline chart (8 data points = 8 weeks)
- Stockout date
- Order recommendation (quantity + timing)

### Stack (Tentative)
- **Frontend**: React (integrate into MyPak Online)
- **Backend**: Node.js + Express
- **Database**: PostgreSQL (read from MyPak ERP replica)
- **Auth**: Inherit from MyPak Online

### Data Sources
- **Current stock**: M_Storage (warehouse inventory)
- **Shipments**: M_InOut, M_InOutLine (outbound to customers)
- **Orders**: C_Order, C_OrderLine (incoming production orders)
- **Products**: M_Product
- **Customers**: C_BPartner

---

## Pilot Strategy

### Pilot Customers (Start with 3)
1. **Valley Park** - likely current spreadsheet user
2. **Agenbrook** - likely current spreadsheet user
3. **Josh's Eggs** - likely current spreadsheet user

**Why these 3:**
- Already familiar with VMI concept
- Trust MyPak
- Order frequently
- Willing to give feedback

### Success Metrics (8 weeks)
- ✅ All 3 customers use it at least weekly
- ✅ At least 2 prefer it to spreadsheet
- ✅ At least 10 orders placed via Connect (not manual)
- ✅ Zero stockouts during pilot
- ✅ Customers report it's easier than spreadsheet

### Failure Criteria (Pivot Triggers)
- ❌ Customers don't use it after first week
- ❌ Still email/WhatsApp for orders
- ❌ Recommendations don't match their intuition (trust lost)
- ❌ "Too complicated" feedback

---

## Open Questions (Need Answers)

### Critical Path:
1. ✅ **Lead time:** 45 days (CONFIRMED from meeting)
2. ❓ **What does JJ's spreadsheet look like exactly?**
   - Need to see the current spreadsheet they love
   - Understand the two-table structure
3. ❓ **How do we calculate burn rate?**
   - Last 4 weeks average? Last 8 weeks? Rolling average?
   - What if usage is spiky?
4. ❓ **What's MyPak Online's tech stack?**
   - How do we integrate?
   - What auth system?
5. ❓ **How do we access inventory data?**
   - Direct DB read? API? CSV export?

### Nice to Know:
6. Order history for Valley Park, Agenbrook, Josh's Eggs
7. Default target weeks (is 8 weeks right for everyone?)
8. How often do customers' burn rates actually change?

---

## Next Steps

### Phase 1: Information Gathering (THIS WEEK)
- [ ] Get JJ's spreadsheet
- [ ] Understand MyPak Online architecture
- [ ] Validate burn rate calculation approach
- [ ] Confirm pilot customer list

### Phase 2: Wireframes (AFTER INFO)
- [ ] Finalize one-screen product detail design
- [ ] Dashboard with red/yellow/green products
- [ ] Burn rate editing interaction
- [ ] Order approval flow

### Phase 3: Prototype (AFTER WIREFRAMES)
- [ ] Build interactive HTML demo with real-looking data
- [ ] Show to pilot customers for feedback
- [ ] Iterate based on feedback

### Phase 4: Build (AFTER VALIDATION)
- [ ] Frontend integration into MyPak Online
- [ ] Backend calculation engine
- [ ] Connect to MyPak ERP data
- [ ] Test with pilot customers

---

## The Bet We're Making

**The spreadsheet already works. Customers love it.**

**We're betting that:**
1. Same concept + better UX = higher adoption
2. Integration into MyPak Online = convenience wins
3. Auto-detected burn rate = less work than manual forecasts
4. Visual timeline = trust through transparency

**We're NOT betting on:**
- Complex optimization algorithms
- Full automation
- New inventory management philosophy
- Changing how farmers think

**Risk = change management, not product-market fit (already validated)**

---

## Approval Section

**Sign-off required before wireframes:**

- [ ] **Ethan**: Core approach (burn rate, not forecasting) makes sense
- [ ] **Partner**: This solves the real problem and customers will use it

**Spec version:** v1 (Core approach defined)
**Last updated:** 2025-11-06
**Next review:** After info gathering complete

---

*End of Spec*
