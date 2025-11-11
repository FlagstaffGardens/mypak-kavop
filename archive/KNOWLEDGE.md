# Connect VMI - Product Knowledge Base

*What is this product? Who is it for? What problem does it solve?*
*Last Updated: 2025-11-06*

---

## What is MyPak?

**MyPak** is an Australian packaging manufacturer that makes egg cartons for large egg farms (customers like Valley Park, Agenbrook, Josh's Eggs).

**Business model:**
- Farms order cartons → MyPak manufactures → ships to farm
- 45-day lead time (order today, arrives 45 days later)
- Customers are $B market cap businesses (big operations)
- Products: various egg carton types (12-pack, 18-pack, different brands)

**Critical customer constraint:**
If farms run out of cartons, they **can't sell eggs**. Production stops. Revenue lost. Catastrophic.

---

## What is VMI (Vendor Managed Inventory)?

**Simple explanation:**
Instead of customer constantly monitoring inventory and placing orders, **the vendor (MyPak) monitors it for them and recommends when to order**.

**Traditional ordering:**
- Customer: "Oh shit, running low on cartons. Better order some."
- Customer emails/calls MyPak: "Can I get 40,000 cartons?"
- MyPak: "Sure, ships in 45 days"
- Customer hopes they estimated right

**VMI ordering:**
- MyPak monitors customer's inventory automatically
- MyPak: "Hey, you'll run out Dec 18. Order 40K by Nov 12."
- Customer verifies and approves
- Less stress, fewer stockouts

**It's like:**
- Traditional = manually checking your bank account, hoping you don't overdraft
- VMI = getting alerts when balance is low, with suggested transfer amounts

---

## The Problem We're Solving

### Current State: Email Spreadsheet VMI

**What exists today:**
- JJ (MyPak employee) manually creates Excel spreadsheets
- Shows projected inventory week-by-week
- Emails to 5 customers
- Customers download, review, email back with orders

**5 customers use it and LOVE it.**

**But only 5 use it** because:
1. ❌ Email attachment hunting ("which version is latest?")
2. ❌ Two confusing tables (departures + arrivals)
3. ❌ Manual process (JJ has to create each one)
4. ❌ Not integrated (customer emails back, JJ manually processes)
5. ❌ Static (doesn't update when customer places orders)

**The problem isn't the concept** (already validated).

**The problem is execution** (hard to use, doesn't scale).

---

## What is Connect VMI?

**One sentence:**
The VMI spreadsheet, but live in MyPak Online - automated, visual, integrated, self-service.

**Core functionality:**
1. **Auto-monitors** customer inventory (from MyPak ERP)
2. **Auto-detects** burn rate (how fast they're using cartons)
3. **Shows projection** (when they'll run out)
4. **Recommends orders** (what to order, when to order by)
5. **Customer approves** (one click to place order)

**It's the same math as the spreadsheet.**
**Just 10x easier to use.**

---

## What Approach Are We Taking?

### Research Findings: Modern VMI Spectrum

**Three types of VMI:**

1. **Full Autopilot VMI**
   - Vendor automatically ships without customer approval
   - Used by: Walmart + P&G, mature relationships (10+ years)
   - Requires: high trust, predictable demand, low risk
   - **Only 20-30% of VMI relationships**

2. **Hybrid CMI (Co-Managed Inventory)** ← THIS IS US
   - Vendor recommends, customer approves
   - Used by: Packaging suppliers, long lead times, high-risk stockouts
   - **Industry standard for 2025**
   - **70-80% of VMI relationships start here**

3. **Recommendation-Only**
   - Vendor shows data, customer decides everything
   - Used by: New relationships, very early stage
   - Lowest adoption (too manual)

### Why Hybrid CMI is Right for MyPak:

**MyPak's context:**
- ✅ Long lead time (45 days - can't fix mistakes quickly)
- ✅ Catastrophic stockout risk (no cartons = can't sell eggs)
- ✅ Volatile demand (customers can't forecast accurately)
- ✅ Known burn rate (customers know current usage)
- ✅ Early stage trust (only 5 using VMI currently)

**Matches perfectly with CMI best practices:**
- Long lead time products (>30 days) → Use CMI
- Catastrophic stockout risk → Use approval gates
- Volatile demand → Use consumption-based (not forecast-based)
- Early stage → Build trust with transparency first

**Path to full VMI:**
- Start: Hybrid CMI (customer approves every order)
- After 12-18 months: Offer selective autopilot
- After 2-3 years: Full autopilot for trusted customers

---

## The Core Insight: Burn Rate, Not Forecasting

**Traditional VMI approach (doesn't work for us):**
- Customer provides 12-week forecast: "Week 1: 12,500, Week 2: 13,000, Week 3: 12,800..."
- System uses forecast to project inventory
- **Problem:** Customers can't forecast (orders change too fast)

**Our approach (consumption-based VMI):**
- System detects current burn rate: "Using ~12,000/week based on last 4 weeks"
- Projects forward at current rate
- Customer overrides only when their business changes
- **Advantage:** Based on actual usage, not guesses

**This is standard in modern VMI** (research confirms it).

**Formula:**
```
Current Stock: 80,000 cartons
Burn Rate: -12,000/week (auto-detected)
Stockout Date: 80,000 ÷ 12,000 = 6.7 weeks (Dec 18)
Order Needed: To restore 10-week buffer = 40,000 cartons
Order By: Dec 18 - 45 days lead time = Nov 12
```

**Customer can verify this math.** That's the trust.

---

## Mental Model: Bank Account

**Checking account:**
- Balance: $80,000
- Spending rate: -$12,000/week
- When you'll hit zero: 6.7 weeks
- Alert: "Transfer $40,000 by next Tuesday"

**Connect VMI:**
- Stock: 80,000 cartons
- Burn rate: -12,000/week
- Stockout: 6.7 weeks (Dec 18)
- Recommendation: "Order 40,000 by Nov 12"

**Simple. Intuitive. Trustworthy.**

---

## How It Works (User's Perspective)

### Step 1: Customer logs into MyPak Online
- Same portal they already use
- New tab: "Inventory Management"

### Step 2: Dashboard shows status
```
⚠️  2 products need orders by Nov 12

🚨 URGENT
S12G9Q - 12-pack Green        🔴 6 weeks left
Runs out Dec 18
Order 40K by Nov 12 →
```

### Step 3: Click product to see detail
```
Current stock: 80,000 cartons
Using: [12,000] cartons/week (auto-detected, click to edit)

[Chart showing stock declining to zero on Dec 18]

💡 Recommendation:
Order 40,000 cartons by Nov 12
• Arrives Dec 27 (45-day lead time)
• Prevents Dec 18 stockout
• Restores 10-week buffer

[ Approve This Order ]
```

### Step 4: Verify and approve
- Customer checks: "12,000/week? Yeah that's right."
- Looks at chart: "Runs out Dec 18? Makes sense."
- Clicks "Approve This Order"
- Done.

**5 clicks total. 2 minutes.**

---

## Why Customers Will Use This

### 1. It's where they already are
MyPak Online = where they order anyway.
Not a separate login.

### 2. It's less work than spreadsheet
- Spreadsheet: Download → Open → Update → Calculate → Email back
- Connect: Click → Verify → Approve

### 3. Same trust, better execution
- Same VMI concept they love
- Same transparent math
- Same ability to "eyeball it"
- Just easier to use

### 4. Prevents catastrophe
Running out = can't sell eggs = lost revenue.
Red alert on Dec 18 stockout = hard to ignore.

### 5. It's obvious
- One number to verify (burn rate)
- One button to click (approve)
- One screen per product (everything visible)

---

## Why This Will Scale

### Current: 5 customers use spreadsheet VMI
**Bottlenecks:**
- Manual (JJ creates each one)
- Email-based (hunting for attachments)
- Not integrated (separate from ordering system)

### Future: 50+ customers use Connect VMI
**Removes bottlenecks:**
- Automated (system generates recommendations)
- Web-based (always accessible)
- Integrated (one-click ordering)
- Self-service (no waiting for JJ)

**Adoption path:**
- Phase 1 (Months 1-3): Migrate 5 existing spreadsheet users → 80%+ approval rate
- Phase 2 (Months 4-12): Expand to 20+ customers → 90%+ approval rate
- Phase 3 (Year 2+): Scale to 50+ customers → Offer selective autopilot

---

## Key Product Principles

### 1. Transparency First, Automation Later
- Show all math (build trust)
- Customer approves every order (control)
- After 12-18 months: offer autopilot option

### 2. Consumption-Based, Not Forecast-Based
- Auto-detect burn rate from actual usage
- Customer overrides only when business changes
- No complex week-by-week forecasting

### 3. Bank Account Mental Model
- Show balance, burn rate, time until zero
- Not "inventory management software"
- Simple, intuitive, trustworthy

### 4. One Screen Per Product
- Everything visible at once
- No clicking around
- Can "eyeball it" like spreadsheet

### 5. Integration is Adoption
- Lives in MyPak Online (not separate tool)
- Same login, same system
- Orders flow into same ERP
- No behavior change required

---

## What Makes This Different from Other VMI?

### Traditional VMI (Walmart + P&G):
- Full autopilot (no approval needed)
- Requires decades of trust
- Predictable demand (toilet paper)
- Low stockout risk

### Connect VMI (MyPak + Farms):
- Hybrid CMI (customer approves)
- Building trust (only 5 use VMI now)
- Volatile demand (orders change daily)
- Catastrophic stockout risk (can't sell eggs)

**We're not doing full autopilot because:**
1. 45-day lead time = can't fix mistakes quickly
2. Catastrophic if wrong = too risky
3. Early stage trust = need transparency
4. Volatile demand = can't set fixed parameters

**This matches industry best practice** (research confirms it).

---

## Success Metrics

### Phase 1 (MVP - First 3 months):
- ✅ All 5 spreadsheet customers migrate to Connect
- ✅ 80%+ recommendation approval rate
- ✅ Zero stockouts for pilot customers
- ✅ Customers report it's easier than spreadsheet
- ✅ At least 10 orders placed via Connect

### Phase 2 (Growth - Months 4-12):
- ✅ 20+ total customers using Connect
- ✅ 90%+ recommendation approval rate
- ✅ 50+ orders placed via Connect
- ✅ Customers report time savings

### Phase 3 (Scale - Year 2+):
- ✅ 50+ total customers using Connect
- ✅ 25%+ customers opt into selective autopilot
- ✅ 200+ orders/year via Connect
- ✅ Becomes default ordering method

---

## Technical Foundation

### What System Does:

**Every night (automated):**
1. Read current stock from MyPak ERP
2. Calculate last 4 weeks burn rate (from shipment history)
3. Project stock week-by-week (simple math)
4. Identify products approaching stockout
5. Calculate recommended order (restore 10-week buffer)
6. Email customer if urgent (red zone)

**When customer logs in:**
1. Show updated projections
2. Highlight what needs attention (red/yellow/green)
3. Ready for approval

**When customer updates burn rate:**
1. Recalculate everything client-side (instant)
2. Update stockout date
3. Update recommendation
4. Save override to database

**When customer approves order:**
1. Create order in MyPak ERP
2. Update chart to show incoming delivery
3. Recalculate projections with new arrival
4. Send email confirmation

---

## Why This is the Right Approach

**Research findings support every decision:**

1. ✅ **Hybrid CMI is modern standard** (70-80% of VMI starts here)
2. ✅ **Consumption-based works without forecasts** (proven in volatile demand)
3. ✅ **Packaging industry uses VMI successfully** (multiple case studies)
4. ✅ **Transparency builds trust** (#1 adoption factor)
5. ✅ **10-12 week safety stock for 45-day lead time** (industry formula)
6. ✅ **Approval gates for high-risk stockouts** (prevents catastrophic errors)
7. ✅ **Path to autopilot after trust established** (12-18 months typical)

**This isn't experimental. It's proven.**

**We're implementing industry best practice for our exact context.**

---

## For New Team Members

**If you're reading this for the first time:**

1. **MyPak** = egg carton manufacturer in Australia
2. **Problem** = customers run out of cartons (catastrophic) but can't forecast accurately
3. **Solution** = monitor inventory for them, recommend orders, they approve
4. **Approach** = Hybrid CMI (Co-Managed Inventory) - vendor recommends, customer approves
5. **Core innovation** = Auto-detect burn rate (no forecasting needed)
6. **Mental model** = Bank account (balance, burn rate, time until zero)
7. **One sentence** = The VMI spreadsheet that 5 customers love, but automated and in MyPak Online

**This document explains the why. The SPEC explains the what. The WIREFRAMES explain the how.**

---

*End of Knowledge Base*
