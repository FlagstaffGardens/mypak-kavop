# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MyPak Connect is a vendor-managed inventory (VMI) system for egg carton distribution. Built with Next.js 15, it helps egg farms monitor inventory levels and receive automated container order recommendations before stockouts occur.

**Current Phase:** UI development with mock data. Real ERP integration will come later.

## Commands

```bash
# Development
npm run dev          # Start dev server (localhost:3000)
npm run build        # TypeScript check + production build
npm start            # Run production build
npm run lint         # Run ESLint
```

## Architecture

### State Management Pattern

The app uses a **dev-only state switcher** for testing different UI scenarios without a backend:

- **Location:** Purple "Dev Mode" panel in sidebar (only shows in `NODE_ENV=development`)
- **States:** `production`, `healthy`, `single_urgent`, `multiple_urgent`, `mixed`
- **Mechanism:** localStorage + page reload to swap data sources
- **Implementation:**
  ```typescript
  // Sidebar sets state in localStorage → page reloads
  // Pages check localStorage on mount:
  const state = localStorage.getItem('demoState') || 'production';
  const data = state !== 'production' ? SCENARIOS[state] : mockData;
  ```

**Key Files:**
- `src/components/shared/Sidebar.tsx` - Dev tools panel (lines 160-217)
- `src/lib/data/mock-scenarios.ts` - All demo state data
- `src/app/page.tsx` & `src/app/orders/page.tsx` - Load state on mount

**Documentation:** `docs-dev/guides/state-management.md`

### Status System

**Critical:** Product status is determined by a **user-configurable target SOH** (Stock On Hand in weeks).

**Status Levels:**
- 🔴 **CRITICAL**: `weeksRemaining < targetSOH` → Below desired stock level
- 🟠 **ORDER_NOW**: `targetSOH ≤ weeksRemaining < 16` → At target but should plan ahead
- 🟢 **HEALTHY**: `weeksRemaining ≥ 16` → All orders in system, well stocked

**Default Target SOH:** 6 weeks (user-adjustable in production)

**Why 16 weeks?** Target (6) + Lead time (8) + Buffer (2) = 16 weeks. At 16+ weeks, all near-term orders are already placed.

**Implementation:**
```typescript
import { calculateProductStatus } from '@/lib/calculations';

const status = calculateProductStatus(weeksRemaining, targetSOH);
```

**Documentation:** `docs-dev/design/status-system.md`

### Component Design System

**Critical Principle:** One UI, adaptive styling. We use **one component with props for state variations**, not separate components per state.

**DO:**
```typescript
<RecommendationCard state="healthy" />   // ✅ Same component, different prop
<RecommendationCard state="urgent" />
```

**DON'T:**
```typescript
<HealthyRecommendationCard />            // ❌ Separate components
<UrgentRecommendationCard />
```

**Core Components:**
- `RecommendationCard` - Top recommendation (adapts via `state` prop: `'healthy' | 'urgent' | 'multiple'`)
- `ProductCard` - Product inventory cards (adapts via `status` prop: `'HEALTHY' | 'ORDER_NOW' | 'CRITICAL'`)
- `ContainerCard` - Container cards on /orders (adapts via `urgency` prop)

**What Changes Between States:**
- Colors (green → amber → red)
- Border width (4px accent for urgent only)
- Button variants (outline vs filled)
- Text weight (normal vs bold)
- Messaging tone

**What Stays Consistent:**
- Layout structure
- Component hierarchy
- Spacing system
- Typography scale

**Documentation:** `docs-dev/design/component-system.md`

### Data Layer

**Units:** Backend uses cartons for calculations, frontend displays **pallets first** with cartons secondary:

```typescript
// Display format
<span className="font-medium">{pallets} pallets</span>
<span className="text-gray-500">({cartons.toLocaleString()} cartons)</span>
```

**Mock Data Sources:**
- `src/lib/data/mock-products.ts` - Default product data
- `src/lib/data/mock-containers.ts` - Default container/order data
- `src/lib/data/mock-scenarios.ts` - State-specific scenarios (export: `SCENARIOS`)

**Business Logic:**
- `src/lib/calculations.ts` - All calculation functions (stockout dates, target stock, etc.)
- `src/lib/types.ts` - TypeScript interfaces

### Page Structure

```
src/app/
├── layout.tsx              # Root layout with Sidebar
├── page.tsx                # Dashboard (loads state from localStorage)
└── orders/
    └── page.tsx            # Orders page (loads state from localStorage)
```

Pages check `localStorage.getItem('demoState')` on mount to determine data source.

## Key Patterns

### Adding a New Demo State

1. Create scenario in `src/lib/data/mock-scenarios.ts`:
   ```typescript
   export const newScenario: ContainerRecommendation[] = [...]
   ```

2. Add to `SCENARIOS` export:
   ```typescript
   export const SCENARIOS = {
     // ...existing
     new_state: { containers: newScenario, products: [] },
   }
   ```

3. Update `Sidebar.tsx`:
   ```typescript
   type DemoState = 'production' | ... | 'new_state';
   const STATE_CONFIG = {
     new_state: { label: '...', emoji: '...', color: '...' },
   }
   ```

### Component Variants

Use config objects for state-dependent styling:

```typescript
const config = {
  healthy: { borderColor: 'border-l-green-500', ... },
  urgent: { borderColor: 'border-l-amber-500', ... },
}[state];

return <Card className={`border-l-4 ${config.borderColor}`}>...</Card>
```

### When Real API is Ready

Replace state-based data loading with API calls in `production` mode:

```typescript
useEffect(() => {
  const state = localStorage.getItem('demoState');

  if (state !== 'production') {
    setData(SCENARIOS[state]);  // Dev mode
  } else {
    fetchFromAPI().then(setData);  // Production
  }
}, []);
```

## Design System

**shadcn/ui with Vercel theme**

**Status Colors:**
- Green (`green-500`): Healthy/on-track
- Amber (`amber-500`): Single urgent
- Red (`red-500`): Critical/multiple urgent
- Blue (`blue-600`): Primary CTAs

**Button Heights:**
- Primary CTAs: `h-14` (56px)
- Standard: `h-10` (40px)
- Small: `h-8` (32px)

**Border Accents:**
- Default: `border` (1px)
- Urgent accent: `border-l-4` (4px left border only)

**Typography:**
- Product names: `text-xl font-semibold`
- Pallet counts: `text-base font-medium`
- Carton counts: `text-sm text-gray-500`
- Badges: `text-xs uppercase tracking-wider`

## Documentation Structure

- **Quick Start:** `docs-dev/guides/walkthrough.md`
- **State System:** `docs-dev/guides/state-management.md`
- **Component System:** `docs-dev/design/component-system.md`
- **State Designs:** `docs-dev/states/` (healthy.md is complete, others TBD)
- **Product Specs:** `docs/` (original wireframes, specs, prototype)

## Important Context

1. **Pallet-First Display:** Always show pallets prominently, cartons secondary (in parentheses)
2. **Component Reuse:** Never create state-specific components; use props for variations
3. **State Switcher:** Lives in Sidebar, only visible in development, uses localStorage
4. **Layout Consistency:** All states use identical layout structure, only styling differs
5. **Design Philosophy:** Ruthless simplicity - every element must earn its place

## Testing Workflow

1. Start dev server: `npm run dev`
2. Open sidebar → "Dev Mode" panel at bottom
3. Select state from dropdown
4. Page reloads with demo data
5. Verify UI adapts correctly (colors, messaging, CTAs)
6. Test in all 5 states before committing
