# MyPak Connect VMI

**Vendor Managed Inventory System for Egg Carton Distribution**

A Next.js web application that helps egg farms monitor inventory levels and receive automated container order recommendations before stockouts occur.

---

## Project Status

**Phase: Foundation Complete ✅**

The project infrastructure is fully set up and ready for component development. The foundation includes:

- ✅ Next.js 15 with TypeScript
- ✅ Tailwind CSS v4
- ✅ shadcn/ui components with Vercel theme
- ✅ Type-safe data structures
- ✅ Calculation engine
- ✅ Realistic mock data (10 products, 5 containers)
- ✅ Project structure organized

---

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **UI Components:** shadcn/ui with Vercel theme
- **Charts:** Recharts (shadcn/ui charts)
- **Date Handling:** date-fns
- **Icons:** Lucide React
- **Notifications:** Sonner (toast notifications)

---

## Project Structure

```
mypak-kavop/
├── docs/                       # All documentation
│   ├── KNOWLEDGE.md            # Product knowledge base
│   ├── RESEARCH.md             # Industry research
│   ├── SPEC.md                 # Product specification
│   ├── PRODUCT-OVERVIEW.md     # UX flow and design
│   ├── high-fi-demo/           # Original HTML prototype
│   ├── wireframes/             # UI wireframes
│   └── meeting-notes/          # Product discussions
├── src/
│   ├── app/                    # Next.js pages
│   │   ├── page.tsx            # Dashboard (TODO)
│   │   ├── orders/             # Orders page (TODO)
│   │   ├── containers/[id]/    # Container flows (TODO)
│   │   └── layout.tsx          # Root layout
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components (✅ installed)
│   │   ├── dashboard/          # Dashboard components (TODO)
│   │   ├── orders/             # Orders components (TODO)
│   │   └── shared/             # Shared components (TODO)
│   └── lib/
│       ├── types.ts            # ✅ TypeScript types
│       ├── calculations.ts     # ✅ Calculation functions
│       ├── utils.ts            # ✅ Utility functions
│       └── data/
│           ├── mock-products.ts    # ✅ 10 realistic products
│           └── mock-containers.ts  # ✅ 5 containers + orders
├── package.json
└── tsconfig.json
```

---

## What's Been Built

### 1. Types (`src/lib/types.ts`)

Comprehensive TypeScript interfaces for:
- `Product` - Product with inventory data
- `ContainerRecommendation` - Container orders
- `Order` - Order tracking
- `ShippingDetails` - Shipping configuration
- `ChartDataPoint` - Chart visualization data
- `StockoutCalculation` - Calculation results

### 2. Calculations (`src/lib/calculations.ts`)

Core business logic functions:
- `calculateStockoutDate()` - When product runs out
- `calculateTargetStock()` - 10-week buffer calculation
- `calculateRecommendedQuantity()` - Order recommendations
- `calculateWeeksSupply()` - Weeks of inventory remaining
- `calculateBurnRate()` - Average weekly consumption
- `groupProductsIntoContainers()` - Container grouping logic

### 3. Mock Data

**Products (`src/lib/data/mock-products.ts`):**
- 10 realistic egg carton products
- Mix of brands (Better Eggs, Josh's Eggs, Valley Park, Agenbrook)
- Varied statuses: 2 CRITICAL, 4 ORDER_NOW, 4 HEALTHY
- Realistic stock levels and consumption rates

**Containers & Orders (`src/lib/data/mock-containers.ts`):**
- 5 container recommendations with varied urgency
- 2 in-transit orders
- 2 delivered orders (history)
- Realistic dates, quantities, and shipping details

### 4. UI Components (shadcn/ui)

Installed and configured:
- `card`, `button`, `input`, `select`, `textarea`
- `badge`, `radio-group`, `tabs`, `collapsible`
- `form` (with react-hook-form)
- `chart` (built on Recharts)
- `sonner` (toast notifications)

---

## What Needs to Be Built

### Phase 1: Core Components (High Priority)

1. **Navigation Component** (`src/components/shared/Navigation.tsx`)
   - Top nav bar with MyPak logo
   - Tab navigation (Dashboard / Orders)
   - Matches high-fi demo aesthetic

2. **StatusBadge Component** (`src/components/shared/StatusBadge.tsx`)
   - Color-coded badges (CRITICAL = red, ORDER NOW = orange, HEALTHY = green)
   - Additional badges: URGENT, IN TRANSIT, DELIVERED

3. **InventoryChart Component** (`src/components/shared/InventoryChart.tsx`)
   - Line chart showing stock projection
   - Uses Recharts (shadcn/ui chart)
   - Shows: current stock, decline, target line, stockout point, deliveries
   - Should match the SVG charts from `docs/high-fi-demo/index.html`

### Phase 2: Dashboard Screen

4. **ProductCard Component** (`src/components/dashboard/ProductCard.tsx`)
   - Display product info + chart
   - Inline editing (stock, consumption)
   - Save/cancel actions
   - Real-time calculation updates

5. **RecommendationCard Component** (`src/components/dashboard/RecommendationCard.tsx`)
   - Shows 3 urgent containers
   - "Review →" button for each
   - Links to Orders page with highlight

6. **Dashboard Page** (`src/app/page.tsx`)
   - Fetch and display mock products
   - Group by status (CRITICAL, ORDER_NOW, HEALTHY)
   - Collapsible "Healthy Products" section
   - Recommendation card at top

### Phase 3: Orders Screen

7. **ContainerCard Component** (`src/components/orders/ContainerCard.tsx`)
   - Expandable container details
   - Shows: order-by date, delivery, total cartons, products
   - "Proceed to Full Review & Order" button

8. **OrderCard Component** (`src/components/orders/OrderCard.tsx`)
   - In-transit orders with status badges
   - Delivered orders (history)
   - "View Details" button

9. **Orders Page** (`src/app/orders/page.tsx`)
   - 3 sections: Recommended Containers, En Route, History
   - Filters and search for history
   - Highlight animation when navigated from Dashboard

### Phase 4: Container Flow

10. **Container Review Page** (`src/app/containers/[id]/review/page.tsx`)
    - Container summary
    - Editable product quantities
    - Live total calculation
    - Shipping details form
    - "Approve Order" button

11. **Confirmation Page** (`src/app/containers/[id]/confirm/page.tsx`)
    - Order summary
    - Product breakdown
    - Shipping details display
    - "Confirm & Submit" button

12. **Success Page** (`src/app/success/page.tsx`)
    - Order confirmation
    - Order number display
    - Navigation options (Back to Dashboard / View Orders)

### Phase 5: Polish & Features

13. **Interactive Features**
    - Inline editing with save/cancel
    - Real-time calculations
    - Container highlighting/scrolling
    - Toast notifications (using Sonner)
    - Collapsible sections

14. **Styling Refinement**
    - Match high-fi demo aesthetic (`docs/high-fi-demo/index.html`)
    - Professional/consulting style
    - Proper spacing, shadows, transitions
    - Responsive design (desktop-first)

---

## Quick Start

### Installation

Already complete! All dependencies are installed.

### Development

```bash
# Start the dev server
npm run dev

# Open http://localhost:3000
```

### Testing Different UI States

The app includes a **dev-only state switcher** in the sidebar to test different scenarios:

1. Look for the purple "Dev Mode" panel at the bottom of the sidebar
2. Click the dropdown to select a state:
   - 🔴 **Production** - Default mock data
   - ✅ **Healthy** - All inventory well-stocked
   - ⚠️ **Single Urgent** - One container needs ordering
   - 🚨 **Multiple Urgent** - Multiple containers critical
   - 🔶 **Mixed** - Some urgent, some healthy
3. Page reloads with the selected demo data
4. Test your UI changes in each state

**📖 Read the full guide:** [docs-dev/guides/state-management.md](docs-dev/guides/state-management.md)

### Build

```bash
# Type check
npm run build

# Run production build
npm start
```

---

## Development Guidelines

### 1. Use Mock Data

Import from `src/lib/data/`:
```typescript
import { mockProducts } from "@/lib/data/mock-products";
import { mockContainers, mockOrders } from "@/lib/data/mock-containers";
```

### 2. Use Calculations

Import from `src/lib/calculations.ts`:
```typescript
import { calculateStockoutDate, calculateWeeksSupply } from "@/lib/calculations";
```

### 3. Use shadcn/ui Components

Import from `@/components/ui/`:
```typescript
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
```

### 4. Match High-Fi Demo

Refer to `docs/high-fi-demo/index.html` for:
- Exact UI structure
- Color palette
- Typography
- Spacing
- Interactive behaviors

### 5. Component Structure

Follow this pattern:
```typescript
'use client'; // If using client features

import { ... } from '@/components/ui/...';
import type { Product } from '@/lib/types';

interface ProductCardProps {
  product: Product;
  onUpdate?: (product: Product) => void;
}

export function ProductCard({ product, onUpdate }: ProductCardProps) {
  // Component logic
  return (
    <Card>
      {/* Component UI */}
    </Card>
  );
}
```

---

## Design System (from Vercel Theme)

The Vercel theme provides a professional, minimal aesthetic matching the high-fi demo.

### Colors

Refer to `src/app/globals.css` for CSS variables.

Key colors:
- **Primary Blue:** For CTAs and brand
- **Status Colors:**
  - Red: CRITICAL
  - Orange/Pink: ORDER NOW
  - Green: HEALTHY
  - Cyan: IN TRANSIT
- **Neutrals:** Grays for text and borders

### Typography

- **Headings:** Sans-serif, various weights (400-700)
- **Body:** 0.85rem - 0.95rem
- **Small:** 0.7rem - 0.8rem

---

## Next Steps

1. **Start with Navigation** - Build the top nav bar first
2. **Build StatusBadge** - Simple, reusable component
3. **Build InventoryChart** - Critical for product visualization
4. **Build Dashboard** - Main screen with ProductCard
5. **Continue with Orders page**
6. **Implement container flow**
7. **Polish and refine**

---

## Documentation

### Development Docs (`docs-dev/`)
- **[Quick Start Guide](docs-dev/guides/walkthrough.md)** - Developer onboarding (15 min read)
- **[State Management](docs-dev/guides/state-management.md)** - How to test different UI states
- **[Repo Status](docs-dev/repo-status.md)** - What's built, what's not
- **[UI States](docs-dev/states/)** - Detailed design for each state
  - [Healthy State](docs-dev/states/healthy.md) - Complete design proposal
  - [Single Urgent](docs-dev/states/single-urgent.md) - To be documented
  - [Multiple Urgent](docs-dev/states/multiple-urgent.md) - To be documented
  - [Mixed](docs-dev/states/mixed.md) - To be documented
- **[Implementation Report](docs-dev/design/implementation-report.md)** - Original design decisions

### Product Docs (`docs/`)
- **Original Demo:** `docs/high-fi-demo/index.html`
- **Product Spec:** `docs/SPEC.md`
- **Product Knowledge:** `docs/KNOWLEDGE.md`
- **Wireframes:** `docs/wireframes/`

---

## Notes

- This is a **testing/demo version** with mock data
- Real ERP integration will come later
- Focus on matching the high-fi demo UX exactly
- User will provide real data structure for integration

---

**Built with Next.js, TypeScript, and shadcn/ui**
