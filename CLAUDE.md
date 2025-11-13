# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MyPak Connect is a vendor-managed inventory (VMI) system for egg carton distribution. Built with Next.js 15, it helps egg farms monitor inventory levels and receive automated container order recommendations before stockouts occur.

**Current Phase:** Production-ready with live ERP integration. Data fetched from MyPak ERP API.

## Commands

```bash
# Development
npm run dev          # Start dev server (localhost:3000)
npm run build        # TypeScript check + production build
npm start            # Run production build
npm run lint         # Run ESLint
```

## Architecture

### Data Flow

**Live Data (Production):**
- Dashboard fetches products from MyPak ERP `/product/list`
- Orders page fetches from `/order/current` and `/order/complete`
- Server Components pattern: data fetched on server, passed to client islands
- Authentication: Uses stored `kavop_token` from organizations table

**ERP Client:**
- `src/lib/erp/client.ts` - Fetch functions for ERP API
- `src/lib/erp/types.ts` - ERP API response types
- `src/lib/erp/transforms.ts` - Transform ERP data to app types

**Temporary Mock Data:**
- Inventory levels (currentStock, weeklyConsumption) - using `src/lib/services/inventory.ts`
- Container recommendations - using `src/lib/data/mock-containers.ts`
- TODO: Replace with real inventory tracking and recommendation algorithm

**Documentation:** `docs/guides/erp-integration.md`

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

**Documentation:** `docs/design/status-system.md`

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

**Documentation:** `docs/design/component-system.md`

### Data Layer

**Units:** Backend uses cartons for calculations, frontend displays **pallets first** with cartons secondary:

```typescript
// Display format
<span className="font-medium">{pallets} pallets</span>
<span className="text-gray-500">({cartons.toLocaleString()} cartons)</span>
```

**Data Sources:**
- **Live from ERP:**
  - `src/lib/erp/client.ts` - Product and order data from MyPak ERP API
- **Temporary Mock:**
  - `src/lib/services/inventory.ts` - Mock inventory levels (TODO: replace with real tracking)
  - `src/lib/data/mock-containers.ts` - Mock container recommendations (TODO: replace with algorithm)
- **Static Reference:**
  - `src/lib/data/mock-scenarios.ts` - Deprecated demo scenarios (kept for reference only)

**Business Logic:**
- `src/lib/calculations.ts` - All calculation functions (stockout dates, target stock, etc.)
- `src/lib/types.ts` - TypeScript interfaces

### Page Structure

```
src/app/
├── layout.tsx              # Root layout with Sidebar
├── page.tsx                # Dashboard (Server Component - fetches from ERP)
├── loading.tsx             # Dashboard loading state
├── error.tsx               # Dashboard error boundary
└── orders/
    ├── page.tsx            # Orders page (Server Component - fetches from ERP)
    ├── loading.tsx         # Orders loading state
    └── error.tsx           # Orders error boundary
```

Pages are async Server Components that fetch from ERP API and pass data to Client Components for interactivity.

## Key Patterns

### Server Component Data Fetching

Pages fetch data from ERP and pass to client components:

```typescript
// src/app/page.tsx (Server Component)
export default async function Dashboard() {
  const erpProducts = await fetchErpProducts();
  const erpOrders = await fetchErpCurrentOrders();

  // Transform and pass to client
  return <DashboardClient products={products} orders={orders} />;
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

- **Quick Start:** `docs/guides/walkthrough.md`
- **ERP Integration:** `docs/guides/erp-integration.md`
- **Component System:** `docs/design/component-system.md`
- **Status System:** `docs/design/status-system.md`
- **Backend Planning:** `docs/backend-planning/` (API specs, database models, algorithms)
- **Historical Context:** `archive/` (original wireframes, specs, prototypes)

## Important Context

1. **Pallet-First Display:** Always show pallets prominently, cartons secondary (in parentheses)
2. **Component Reuse:** Never create state-specific components; use props for variations
3. **Server Components:** Pages fetch from ERP API, pass data to client components
4. **Layout Consistency:** All states use identical layout structure, only styling differs
5. **Design Philosophy:** Ruthless simplicity - every element must earn its place

## Development Workflow

1. Start dev server: `npm run dev`
2. Data loads from live ERP API (requires valid `kavop_token` in database)
3. Verify UI adapts correctly based on real data
4. Test error states (error boundaries) and loading states
5. Check TypeScript compilation: `npm run build`
