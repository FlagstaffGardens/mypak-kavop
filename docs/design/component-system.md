# Component Design System

**Principle: One UI, Adaptive Styling**

We use **one set of components** that adapt to different states through props, not separate components for each state.

---

## Core Components

### 1. RecommendationCard (Shared Across All States)

**File:** `src/components/shared/RecommendationCard.tsx`

**One component, adapts via props:**

```typescript
interface RecommendationCardProps {
  state: 'healthy' | 'urgent' | 'multiple';
  containers: Container[];
  onAction: () => void;
}
```

**Layout (CONSISTENT across all states):**

```
┌─────────────────────────────────────────────────────────┐
│ [Status Badge/Icon]  [Headline]                         │
│                                                          │
│ [Container Summary]                                      │
│                                                          │
│ [Key Dates]                                              │
│                                                          │
│ [Primary CTA]  [Secondary Link]                         │
└─────────────────────────────────────────────────────────┘
```

**What Changes By State:**

| Element | Healthy | Single Urgent | Multiple Urgent |
|---------|---------|---------------|-----------------|
| Left Border | 4px green | 4px amber | 4px red |
| Status Icon | ✓ checkmark | ⚠ warning | 🚨 alert |
| Headline | "All Products On Track" | "Container 1 Needs Ordering" | "3 Containers Need Ordering" |
| Date Weight | Normal | Bold | Bold |
| CTA Style | Outline | Filled | Filled |
| CTA Color | Blue | Amber | Red |
| CTA Text | "Plan This Order" | "Review Container 1" | "View All Orders" |

**Implementation:**

```typescript
export function RecommendationCard({ state, containers, onAction }: Props) {
  const config = {
    healthy: {
      borderColor: 'border-l-green-500',
      icon: <CheckCircle />,
      headline: 'All Products On Track',
      ctaVariant: 'outline',
      ctaText: 'Plan This Order',
    },
    urgent: {
      borderColor: 'border-l-amber-500',
      icon: <AlertCircle />,
      headline: `Container ${containers[0].number} Needs Ordering`,
      ctaVariant: 'default',
      ctaText: 'Review Container',
    },
    multiple: {
      borderColor: 'border-l-red-500',
      icon: <AlertTriangle />,
      headline: `${containers.length} Containers Need Ordering`,
      ctaVariant: 'destructive',
      ctaText: 'View All Orders',
    },
  }[state];

  return (
    <Card className={`border-l-4 ${config.borderColor}`}>
      <CardHeader>
        <div className="flex items-center gap-2">
          {config.icon}
          <CardTitle>{config.headline}</CardTitle>
        </div>
      </CardHeader>

      <CardContent>
        {/* Same structure, different data */}
        <ContainerSummary container={containers[0]} state={state} />
        <DateDisplay orderBy={containers[0].orderByDate} state={state} />
      </CardContent>

      <CardFooter>
        <Button variant={config.ctaVariant} onClick={onAction}>
          {config.ctaText}
        </Button>
      </CardFooter>
    </Card>
  );
}
```

---

### 2. ProductCard (Shared Across All States)

**File:** `src/components/shared/ProductCard.tsx`

**Layout (CONSISTENT):**

```
┌─────────────────────────────────────────────────────────┐
│ [Product Name]                           [Status Badge] │
│                                                          │
│ [Chart showing pallets over time]                       │
│                                                          │
│ Current: [X] pallets ([Y] cartons)                      │
│ Weekly: [Z] pallets                                     │
│ Coverage: [W] weeks                                     │
│                                                          │
│ In Container [N] (order by [date])                      │
└─────────────────────────────────────────────────────────┘
```

**What Changes By State:**

| Element | Healthy | Order Now | Critical |
|---------|---------|-----------|----------|
| Badge Color | Green | Orange | Red |
| Badge Text | "HEALTHY" | "ORDER NOW" | "CRITICAL" |
| Chart Line | Blue | Orange | Red |
| Border | 1px gray | 1px orange | 1px red |
| Coverage Text Color | Gray | Orange-700 | Red-700 |

**Implementation:**

```typescript
export function ProductCard({ product }: Props) {
  const statusConfig = {
    HEALTHY: {
      badgeVariant: 'success',
      chartColor: '#3b82f6',
      borderColor: 'border-gray-200',
    },
    ORDER_NOW: {
      badgeVariant: 'warning',
      chartColor: '#f97316',
      borderColor: 'border-orange-200',
    },
    CRITICAL: {
      badgeVariant: 'destructive',
      chartColor: '#ef4444',
      borderColor: 'border-red-200',
    },
  }[product.status];

  return (
    <Card className={`${statusConfig.borderColor}`}>
      {/* Same layout, different styling */}
      <CardHeader>
        <div className="flex justify-between">
          <CardTitle>{product.name}</CardTitle>
          <Badge variant={statusConfig.badgeVariant}>
            {product.status.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <InventoryChart
          data={product.chartData}
          lineColor={statusConfig.chartColor}
        />

        <div className="mt-4 space-y-2">
          <StockDisplay pallets={product.pallets} cartons={product.cartons} />
          <WeeklyUsage pallets={product.weeklyPallets} />
          <Coverage weeks={product.weeksRemaining} status={product.status} />
        </div>
      </CardContent>
    </Card>
  );
}
```

---

### 3. ContainerCard (Orders Page - Shared)

**File:** `src/components/orders/ContainerCard.tsx`

**Layout (CONSISTENT):**

```
┌─────────────────────────────────────────────────────────┐
│ 📦 Container [N]                         [Urgency Badge]│
│                                                          │
│ [X] products • [Y] pallets ([Z] cartons)                │
│                                                          │
│ Order by: [date] ([days] days)                          │
│ Delivery: [date]                                        │
│                                                          │
│                                  [Action Button →]      │
└─────────────────────────────────────────────────────────┘
```

**What Changes By Urgency:**

| Element | On Track | Urgent | Critical |
|---------|----------|--------|----------|
| Left Border | None | 4px amber | 4px red |
| Badge | "ON TRACK" green | "URGENT" amber | "CRITICAL" red |
| Date Weight | Normal | Semi-bold | Bold |
| Button Style | Outline | Filled amber | Filled red |

---

## Reusable Subcomponents

### StockDisplay (Used in ProductCard)

```typescript
function StockDisplay({ pallets, cartons }: Props) {
  return (
    <div className="text-sm">
      <span className="font-medium">{pallets} pallets</span>
      <span className="text-gray-500 ml-2">({cartons.toLocaleString()} cartons)</span>
    </div>
  );
}
```

### DateDisplay (Used in RecommendationCard, ContainerCard)

```typescript
function DateDisplay({ date, daysRemaining, urgency }: Props) {
  const isUrgent = daysRemaining < 7;

  return (
    <div>
      <span className={isUrgent ? 'font-bold text-lg' : 'font-normal'}>
        {format(date, 'MMM dd, yyyy')}
      </span>
      <span className="text-gray-500 ml-2">
        ({daysRemaining} days)
      </span>
    </div>
  );
}
```

### Badge (shadcn/ui with variants)

```typescript
// Already exists in src/components/ui/badge.tsx
// Use variants: "default" | "success" | "warning" | "destructive"
```

---

## Color System (Consistent Across States)

### Status Colors

```css
/* Healthy/Success */
--green-500: #10b981;
--green-100: #d1fae5;
--green-800: #065f46;

/* Order Now/Warning */
--amber-500: #f59e0b;
--amber-100: #fef3c7;
--amber-800: #92400e;

/* Critical/Urgent */
--red-500: #ef4444;
--red-100: #fee2e2;
--red-800: #991b1b;

/* Primary Actions */
--blue-600: #2563eb;
--blue-700: #1d4ed8;
```

### Border Widths

```css
--border-default: 1px;
--border-accent: 4px;  /* Only for left borders on urgent items */
```

### Button Heights

```css
--button-sm: 2rem (32px);
--button-md: 2.5rem (40px);
--button-lg: 3.5rem (56px);  /* Primary CTAs only */
```

---

## Typography Scale (Consistent)

```css
/* Headings */
--text-3xl: 1.875rem (30px) - Page titles
--text-2xl: 1.5rem (24px) - Section titles
--text-xl: 1.25rem (20px) - Card titles
--text-lg: 1.125rem (18px) - Emphasized text

/* Body */
--text-base: 1rem (16px) - Default body
--text-sm: 0.875rem (14px) - Secondary info
--text-xs: 0.75rem (12px) - Labels, badges
```

---

## Spacing Scale (Consistent)

```css
/* Card Padding */
--padding-card: 1.5rem (24px) - Standard card padding
--padding-card-lg: 2rem (32px) - Important cards only

/* Gaps */
--gap-xs: 0.5rem (8px)
--gap-sm: 1rem (16px)
--gap-md: 1.5rem (24px)
--gap-lg: 2rem (32px)
```

---

## State Adaptation Matrix

### RecommendationCard

| Prop | Healthy | Single Urgent | Multiple Urgent |
|------|---------|---------------|-----------------|
| `borderColor` | green-500 | amber-500 | red-500 |
| `icon` | CheckCircle | AlertCircle | AlertTriangle |
| `headline` | "All Products On Track" | "Container N Needs Ordering" | "X Containers Need Ordering" |
| `showDetails` | true | true | false (shows count) |
| `ctaVariant` | outline | default | destructive |
| `ctaSize` | default | lg | lg |
| `ctaText` | "Plan This Order" | "Review Container" | "View All Orders" |

### ProductCard

| Prop | Healthy | Order Now | Critical |
|------|---------|-----------|----------|
| `badgeVariant` | success | warning | destructive |
| `chartLineColor` | blue-500 | orange-500 | red-500 |
| `borderColor` | gray-200 | orange-200 | red-200 |
| `showInlineEdit` | false | true | true |

### ContainerCard

| Prop | On Track | Urgent | Critical |
|------|----------|--------|----------|
| `borderAccent` | none | 4px amber | 4px red |
| `badgeVariant` | success | warning | destructive |
| `dateWeight` | normal | semibold | bold |
| `ctaVariant` | outline | default | destructive |

---

## Implementation Rules

### DO ✅

1. **Use one component with props for variations**
   ```typescript
   <RecommendationCard state="healthy" />
   <RecommendationCard state="urgent" />
   ```

2. **Use config objects for state-specific styling**
   ```typescript
   const config = { healthy: {...}, urgent: {...} }[state];
   ```

3. **Keep layout structure identical**
   - Same order of elements
   - Same spacing system
   - Same component hierarchy

4. **Use consistent color tokens**
   - green-500 for all healthy states
   - amber-500 for all urgent states
   - red-500 for all critical states

5. **Reuse subcomponents**
   - StockDisplay, DateDisplay, Badge, etc.
   - Don't duplicate JSX

### DON'T ❌

1. **Don't create separate components per state**
   ```typescript
   // ❌ Bad
   <HealthyRecommendationCard />
   <UrgentRecommendationCard />

   // ✅ Good
   <RecommendationCard state="healthy" />
   <RecommendationCard state="urgent" />
   ```

2. **Don't use different layouts**
   ```typescript
   // ❌ Bad - different structure per state
   if (state === 'healthy') return <div>A</div>
   if (state === 'urgent') return <section>B</section>

   // ✅ Good - same structure, different styling
   return <Card className={config[state].className}>...</Card>
   ```

3. **Don't hardcode colors**
   ```typescript
   // ❌ Bad
   className="border-l-4 border-l-[#10b981]"

   // ✅ Good
   className="border-l-4 border-l-green-500"
   ```

4. **Don't duplicate logic**
   ```typescript
   // ❌ Bad - copy/paste same component with tweaks

   // ✅ Good - shared component with props
   ```

---

## Example: Healthy State Using This System

### Dashboard (Healthy State)

```typescript
export default function Dashboard() {
  const state = 'healthy'; // from demo state switcher
  const containers = SCENARIOS[state].containers;
  const products = SCENARIOS[state].products;

  return (
    <div className="space-y-8">
      {/* Same component, different state */}
      <RecommendationCard
        state="healthy"
        containers={containers}
        onAction={() => router.push(`/orders/container/${containers[0].id}`)}
      />

      {/* Same component, filtered by status */}
      <ProductList>
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </ProductList>
    </div>
  );
}
```

### Orders Page (Healthy State)

```typescript
export default function OrdersPage() {
  const containers = SCENARIOS['healthy'].containers;

  return (
    <div className="space-y-10">
      <section>
        <h2>Recommended Containers</h2>
        {containers.map(container => (
          <ContainerCard
            key={container.id}
            container={container}
            urgency={container.urgency || 'on_track'}
          />
        ))}
      </section>

      {/* These are the same across all states */}
      <OrdersEnRoute />
      <OrderHistory />
    </div>
  );
}
```

---

## Visual Consistency Checklist

Before implementing any state:

- [ ] Uses existing components from `src/components/shared/`
- [ ] Layout structure matches other states
- [ ] Colors from defined palette only
- [ ] Spacing from spacing scale
- [ ] Typography from type scale
- [ ] Only changes: colors, weights, border width, button variant
- [ ] No new components unless absolutely necessary

---

## Benefits of This System

1. **Maintainability** - Change once, applies to all states
2. **Consistency** - Users see familiar patterns
3. **Performance** - Less code, smaller bundle
4. **Testability** - Test one component with different props
5. **Scalability** - Add new states easily

---

**Next:** Apply this system to healthy state documentation
