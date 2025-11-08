# Healthy State Design

**Status:** ✅ Complete Proposal

**Definition:** All products have 16+ weeks of pallet coverage

---

## Philosophy

**"Plan Ahead, Not Put Out Fires"**

Healthy state is NOT "do nothing" state. It's the **ideal state** where we:
- Celebrate being on track ✓
- Encourage proactive planning (nudge to buy more)
- Build habits of consistent ordering
- Show value through visibility

**Goal:** Keep users in healthy state by making it easy to plan ahead.

---

## Components (Reusing Existing System)

**READ FIRST:** [Component Design System](../design/component-system.md)

We use the **same components** as other states, just with different props.

---

## 1. RecommendationCard (Healthy Variant)

**Component:** `src/components/shared/RecommendationCard.tsx`

**Props:**
```typescript
<RecommendationCard
  state="healthy"
  containers={healthyContainers}
  onAction={() => router.push('/orders/container/1')}
/>
```

**Renders:**

```
┌─────────────────────────────────────────────────────────┐ ← 4px green left border
│ ✓ All Products On Track                                 │ ← Green checkmark icon
│                                                          │
│ Your next recommended order:                            │
│                                                          │
│ 📦 Container 1 • 3 products • 88 pallets                │
│                  (88,000 cartons)                        │
│                                                          │
│ Order by: Dec 3, 2025 (25 days)                         │ ← Normal weight (not bold)
│ Delivery: Jan 17, 2026                                  │
│                                                          │
│ [ Plan This Order → ]    View All Upcoming Orders       │ ← Outline button (calm)
└─────────────────────────────────────────────────────────┘
```

**Styling:**
- Left border: `border-l-4 border-l-green-500`
- Icon: `<CheckCircle className="text-green-600" />`
- Headline: "All Products On Track"
- Date weight: Normal (not bold - no urgency)
- CTA: `variant="outline"` (not filled - less aggressive)
- CTA text: "Plan This Order" (not "Review" - proactive framing)

**Key Differences from Urgent:**
| Element | Healthy | Urgent |
|---------|---------|--------|
| Border | Green | Amber |
| Date | Normal weight | Bold |
| Button | Outline | Filled |
| Message | "Plan" | "Review" |

---

## 2. ProductCard (Healthy Variant)

**Component:** `src/components/shared/ProductCard.tsx`

**Props:**
```typescript
<ProductCard
  product={{
    ...product,
    status: 'HEALTHY',
    pallets: 28,
    cartons: 28000,
    weeklyPallets: 2.1,
    weeksRemaining: 26,
  }}
/>
```

**Renders:**

```
┌─────────────────────────────────────────────────────────┐
│ Better Eggs Free Range Size 7 6 Pack      ✓ HEALTHY    │ ← Green badge
│                                                          │
│ [Chart: Blue line showing gentle decline]               │ ← Blue (not red/orange)
│                                                          │
│ Current: 28 pallets                                     │
│          (28,000 cartons)                               │
│ Weekly: 2.1 pallets                                     │
│ Coverage: 26 weeks                                      │ ← Gray text (not red)
│                                                          │
│ In Container 1 (order by Dec 3)                         │ ← Link to container
└─────────────────────────────────────────────────────────┘
```

**Styling:**
- Badge: `variant="success"` → Green "HEALTHY"
- Chart line: `lineColor="#3b82f6"` (blue, calm)
- Border: `border-gray-200` (normal, not accent)
- Coverage text: `text-gray-700` (not warning color)

**Display Format (IMPORTANT):**
```typescript
// Always show pallets first, cartons secondary
<div>
  <span className="font-medium">{pallets} pallets</span>
  <span className="text-gray-500 ml-2">({cartons.toLocaleString()} cartons)</span>
</div>
```

**All Products Shown:**
- User wants to see full data, not hide it
- Shows all products in expanded view by default
- Can collapse if needed, but default is visible
- Charts help verify system recommendations

---

## 3. Dashboard Layout

**File:** `src/app/page.tsx`

```typescript
export default function Dashboard() {
  const state = useDemoState(); // 'healthy'
  const containers = SCENARIOS[state].containers;
  const products = SCENARIOS[state].products;

  // Same layout structure as other states
  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        title="Inventory Dashboard"
        description="Monitor your egg carton inventory and receive order recommendations"
      />

      {/* Recommendation Card - same component, different props */}
      <RecommendationCard
        state="healthy"
        containers={containers}
        onAction={() => router.push(`/orders/container/${containers[0].id}`)}
      />

      {/* Products Section */}
      <section>
        <SectionHeader
          title="All Products"
          badge={{ text: '7 HEALTHY', variant: 'success' }}
        />

        <div className="grid gap-5 md:grid-cols-2">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
```

**Key Points:**
- Same layout as urgent/critical states
- Same components with different props
- Shows all products by default (user wants visibility)
- No separate "healthy products" section

---

## 4. Orders Page (Healthy Variant)

**Component:** `src/components/orders/RecommendedContainers.tsx`

**Renders:**

```
RECOMMENDED CONTAINERS
Based on current consumption and 10-week target stock levels

┌─────────────────────────────────────────────────────────┐
│ 📦 Container 1                               ON TRACK   │ ← Green badge
│                                                          │
│ 3 products • 88 pallets                                 │
│              (88,000 cartons)                            │
│                                                          │
│ Order by: Dec 3, 2025 (25 days)                         │ ← Normal weight
│ Delivery: Jan 17, 2026                                  │
│                                                          │
│                             [ Plan This Order → ]       │ ← Outline button
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 📦 Container 2                               ON TRACK   │
│                                                          │
│ 2 products • 72 pallets                                 │
│              (72,000 cartons)                            │
│                                                          │
│ Order by: Jan 15, 2026 (48 days)                        │
│ Delivery: Feb 28, 2026                                  │
│                                                          │
│                             [ Plan This Order → ]       │
└─────────────────────────────────────────────────────────┘

... (shows all future containers for next 6-12 months)
```

**Same Component as Urgent:**
```typescript
<ContainerCard
  container={container}
  urgency="on_track"  // Changes styling
/>
```

**Styling Differences:**
| Element | On Track | Urgent |
|---------|----------|--------|
| Border | No accent | 4px amber |
| Badge | "ON TRACK" green | "URGENT" amber |
| Button | Outline | Filled |

---

## Color Palette

Uses **standard color system** from [component-system.md](../design/component-system.md):

```css
/* Primary (Healthy) */
--green-500: #10b981;    /* Borders, icons */
--green-100: #d1fae5;    /* Badge backgrounds */
--green-800: #065f46;    /* Badge text */

/* Secondary (Actions) */
--blue-600: #2563eb;     /* Links, outline buttons */
--blue-700: #1d4ed8;     /* Hover states */

/* Neutral */
--gray-700: #374151;     /* Body text */
--gray-500: #6b7280;     /* Secondary text (carton counts) */
--gray-200: #e5e7eb;     /* Borders */
```

---

## Typography & Spacing

Uses **standard scales** from component system:

**Text:**
- Product names: `text-xl font-semibold` (20px)
- Pallet counts: `text-base font-medium` (16px)
- Carton counts: `text-sm text-gray-500` (14px)
- Badges: `text-xs uppercase tracking-wider` (12px)

**Spacing:**
- Card padding: `p-6` (24px)
- Section gaps: `space-y-8` (32px)
- Product grid gap: `gap-5` (20px)

---

## Messaging & Tone

### Headlines
- ✅ "All Products On Track"
- ✅ "Your next recommended order:"
- ❌ "No action required" (too passive)
- ❌ "Everything is fine" (dismissive)

### CTAs
- ✅ "Plan This Order"
- ✅ "View All Upcoming Orders"
- ❌ "Review Order" (too reactive)
- ❌ "Check back later" (passive)

### Badges
- ✅ "ON TRACK" (implies forward movement)
- ✅ "HEALTHY" (clear status)
- ❌ "WELL STOCKED" (too wordy)
- ❌ "GOOD" (vague)

**Tone:** Calm, confident, proactive (not silent or passive)

---

## User Journey

### Scenario: Sarah checks dashboard, all products healthy

```
1. Dashboard loads with healthy state
   └─> RecommendationCard: "✓ All Products On Track"
   └─> Shows Container 1 (order by Dec 3, 25 days)
   └─> CTA: "Plan This Order"

2. Sarah scrolls down
   └─> Sees all 7 products with charts
   └─> All show blue lines (calm, healthy)
   └─> Coverage: 18-35 weeks

3. Sarah feels informed and in control
   └─> Not stressed, but knows what's next
   └─> Can plan ahead, not react to emergencies

4. Option A: Sarah clicks "Plan This Order"
   └─> Goes to Container 1 review page
   └─> Can adjust quantities, see details
   └─> Can approve or schedule

5. Option B: Sarah clicks "View All Upcoming Orders"
   └─> Goes to /orders page
   └─> Sees timeline: Container 1 (Dec 3), Container 2 (Jan 15), etc.
   └─> Plans multiple orders, stays ahead

6. Outcome: Sarah maintains healthy state
   └─> Regular ordering habit
   └─> Never scrambles for urgent orders
   └─> System adds value even when things are good
```

---

## Nudging Strategy

### The Goal: Encourage Buying More

When healthy, good opportunity to:
- Lock in current prices
- Reduce order frequency
- Build safety buffer
- Simplify future planning

### Implementation (Future)

**Container Card could show:**
```
Standard order: 88 pallets
Consider: +7 pallets → extends coverage by 4 weeks

Benefits:
• Locks in current pricing
• Reduces order frequency
• Builds safety buffer
```

**Or in RecommendationCard:**
```
Container 1: 88 pallets recommended
💡 Consider +10 pallets to extend coverage to 16 weeks
```

**Tone:** Suggestive, not pushy
- Show benefits clearly
- User still controls quantity
- Defaults to recommended (system calculated)
- Upsell is subtle

---

## Implementation Checklist

### Phase 1: RecommendationCard
- [ ] Update `RecommendationCard.tsx` to handle `state="healthy"`
- [ ] Add green border (`border-l-green-500`)
- [ ] Add CheckCircle icon
- [ ] Set headline: "All Products On Track"
- [ ] Normal weight dates (no bold)
- [ ] Outline button: "Plan This Order"
- [ ] Add secondary link: "View All Upcoming Orders"

### Phase 2: ProductCard
- [ ] Ensure `ProductCard.tsx` works with `status="HEALTHY"`
- [ ] Green badge variant
- [ ] Blue chart line (not red/orange)
- [ ] Display pallets first, cartons secondary
- [ ] Show "In Container X" link
- [ ] Gray text for coverage (not warning color)

### Phase 3: Dashboard
- [ ] Load healthy scenario from `SCENARIOS['healthy']`
- [ ] Pass `state="healthy"` to RecommendationCard
- [ ] Show all products (not collapsed)
- [ ] Same layout as other states

### Phase 4: Orders Page
- [ ] Pass `urgency="on_track"` to ContainerCard
- [ ] Green "ON TRACK" badges
- [ ] No left border accent
- [ ] Outline buttons: "Plan This Order"
- [ ] Show all future containers (6-12 months)

### Phase 5: Testing
- [ ] Switch to healthy state via dev tools
- [ ] Verify colors match spec (green, blue, gray)
- [ ] Verify messaging (calm, proactive)
- [ ] Verify all products visible with charts
- [ ] Verify pallet display format
- [ ] Compare to other states (should look similar, just different colors)

---

## Design Checklist

Before marking as done:

- [ ] Uses existing components (`RecommendationCard`, `ProductCard`, `ContainerCard`)
- [ ] Layout structure matches other states
- [ ] Colors from standard palette (green-500, blue-600, gray-*)
- [ ] Typography from standard scale
- [ ] Spacing from standard scale
- [ ] Only differences: colors, weights, button variants, messaging
- [ ] No new components created
- [ ] Pallet-first display format throughout
- [ ] All products visible with charts
- [ ] Calm, confident, proactive tone

---

## Open Questions

1. **Should we show a "buy more" nudge immediately?**
   - Pro: Encourages better habits
   - Con: Might feel pushy
   - **Proposal:** Start without, add based on user feedback

2. **How many future containers to show on /orders?**
   - **Proposal:** 6 months by default, "View More" for 12 months

3. **Should charts show projected deliveries?**
   - Pro: Shows impact of planned orders
   - Con: More complex visualization
   - **Proposal:** Add in Phase 2

4. **Collapsed vs expanded product view?**
   - User wants to see all products
   - **Decision:** Show all by default, add collapse option if needed

---

## Next Steps

1. Implement `RecommendationCard` healthy variant
2. Verify `ProductCard` works with healthy status
3. Test with healthy scenario data
4. Iterate based on feel
5. Document single-urgent state next

---

**Remember:** Same components, different props. Keep it consistent.
