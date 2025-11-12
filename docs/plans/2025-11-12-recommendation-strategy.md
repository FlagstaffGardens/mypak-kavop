# Container Recommendation Strategy

**Date:** November 12, 2025
**Purpose:** VMI system that nudges customers toward 6-month order commitments with 1-year planning horizon

---

## Business Objectives

1. **MyPak Goal:** Secure 6-month forward orders from customers
2. **Customer Value:** Price lock + guaranteed capacity + set-and-forget ordering
3. **VMI Promise:** Weekly dashboard updates with fresh recommendations based on current inventory

---

## Coverage Band System

Products are categorized into coverage bands based on weeks of supply (current stock + orders in transit):

| Band | Weeks | Status | Recommendation |
|------|-------|--------|----------------|
| 🔴 URGENT | 0-14 weeks | Below safety stock | Order immediately |
| 🟡 ORDER_NOW | 14-26 weeks | Building 6-month buffer | Order to reach 26 weeks |
| 🟢 HEALTHY | 26-52 weeks | Covered, plan ahead | Maintain or extend to 52 weeks |
| ✅ OVERSTOCKED | 52+ weeks | Fully stocked | No recommendations |

**Key Thresholds:**
- **14 weeks:** Minimum safety stock (6-week target + 8-week lead time)
- **26 weeks:** MyPak's 6-month goal
- **52 weeks:** 1-year planning cap (don't oversell)

---

## Recommendation Algorithm

### Step 1: Calculate Current Coverage

For each product:

```
current_supply = current_stock + orders_in_transit
weeks_of_coverage = current_supply / weekly_consumption
```

### Step 2: Determine Target Horizon

```
if weeks_of_coverage < 26:
  target_horizon = 26 weeks (6-month goal)
else if weeks_of_coverage < 52:
  target_horizon = 52 weeks (1-year goal)
else:
  target_horizon = null (no recommendation)
```

### Step 3: Calculate Volume Needed

```
target_quantity = target_horizon × weekly_consumption
current_supply = current_stock + orders_in_transit
volume_needed = (target_quantity - current_supply) × volume_per_carton

if volume_needed <= 0:
  skip (already covered)
```

### Step 4: Group by Milestone

Products are grouped into milestone buckets:

- **3-Month Milestone:** Products with <13 weeks coverage → bring to 13 weeks
- **6-Month Milestone:** Products with 13-26 weeks coverage → bring to 26 weeks
- **12-Month Milestone:** Products with 26-52 weeks coverage → bring to 52 weeks

### Step 5: Pack into Containers

Within each milestone:

1. **Calculate total volume needed** across all products in that milestone
2. **Determine number of containers** = ceil(total_volume / 76 m³)
3. **Distribute products round-robin** across containers for delay resilience
4. **Fill to 100%** (exactly 76 m³) by adding more of high-consumption products

### Step 6: Set Order Timing

For each container:

```
weeks_until_needed = min(product.weeks_remaining) - 8 weeks (lead time)
order_by_date = today + (weeks_until_needed × 7 days)
delivery_date = order_by_date + (8 weeks × 7 days)

urgency =
  if order_by_date <= today: "OVERDUE"
  else if days_until_order < 14: "URGENT"
  else: null
```

---

## Dashboard Display Logic

### Main Dashboard (Top 2-3 Containers)

Show containers from the **next incomplete milestone:**

```
current_overall_coverage = weighted_average(all products)

if current_overall_coverage < 13 weeks:
  show: "3-MONTH COVERAGE" containers (top 2-3)
else if current_overall_coverage < 26 weeks:
  show: "6-MONTH COVERAGE" containers (top 2-3)
else if current_overall_coverage < 52 weeks:
  show: "12-MONTH COVERAGE" containers (top 2-3)
else:
  show: "✅ Fully stocked through [date]"
```

Priority within milestone:
1. Containers with URGENT flag first
2. Earliest order-by date
3. Containers with most critical products

### Recommended Orders Page

Show all containers grouped by milestone:

```markdown
🎯 3-MONTH COVERAGE
Covers you through: February 2026
Order by: December 1, 2025
─────────────────────────────────
📦 Container #1 - Delivery: Jan 15
📦 Container #2 - Delivery: Jan 22
📦 Container #3 - Delivery: Feb 5

[Place These 3 Orders]

────────────────────────────────

🎯 6-MONTH COVERAGE
Covers you through: May 2026
Order by: January 15, 2026
─────────────────────────────────
📦 Container #4 - Delivery: Mar 1
...
```

---

## Recalculation Triggers

System recalculates recommendations when:

1. **User updates inventory** (most common)
2. **New order placed** (becomes "in transit")
3. **Order delivered** (moves from transit to current stock)

**Important:** Recommendations are DYNAMIC and will change as:
- Orders get placed (gap shrinks)
- Stock gets consumed (coverage drops)
- Demand patterns change (weekly consumption adjusted)

---

## Key Principles

1. **Always Fresh:** Calculate on every inventory update, never cache stale recommendations
2. **Progress-Oriented:** Show milestones (3mo → 6mo → 12mo) not abstract container lists
3. **Delay-Resilient:** Distribute products across multiple containers using round-robin
4. **Clear Finish Line:** "This gets you to 6 months" not "order these random containers"
5. **Respect the Cap:** Never recommend beyond 52 weeks (1 year)

---

## Example Scenario

**Better Eggs - November 12, 2025**

Current state:
- 14 products with varying coverage (19-52 weeks)
- 73 orders in transit
- Most products: 20-30 weeks coverage

Algorithm output:
- Products with <26 weeks: Need topping up to 6 months
- Products with 26-52 weeks: Can extend to 12 months
- Products with 52+ weeks: No recommendation

Result:
- 3-month milestone: Already covered ✓
- 6-month milestone: 3 containers needed
- 12-month milestone: 22 containers needed

Dashboard shows: 6-month milestone (next goal)
Full page shows: Both 6-month and 12-month milestones

---

## Success Metrics

1. **For MyPak:** % of customers with 6+ months forward orders
2. **For Customer:** Zero stockouts, predictable ordering rhythm
3. **For System:** Recommendations followed (not ignored)
