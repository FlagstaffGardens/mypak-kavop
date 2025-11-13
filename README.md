# MyPak Connect

**Vendor-Managed Inventory System for Egg Carton Distribution**

A Next.js application that helps egg farms monitor inventory levels and manage container orders through live integration with the MyPak ERP API.

---

## Project Status

**Phase: Production with Live ERP Integration** ✅

The application is deployed with:
- ✅ Live data fetching from MyPak ERP API
- ✅ JWT-based authentication system
- ✅ Server Components architecture (Next.js 15)
- ✅ Multi-tenant SaaS database model
- ✅ Real-time product and order data
- 🚧 Temporary mock data for inventory tracking & recommendations (planned for Phase 2)

**Current Version:** v1.0  
**Last Updated:** November 12, 2024

---

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- MyPak ERP API access (kavop_token)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL and BETTER_AUTH_SECRET
```

### Development

```bash
# Start dev server
npm run dev
# Open http://localhost:3000
```

### Build for Production

```bash
npm run build    # TypeScript check + production build
npm start        # Run production server
npm run lint     # Run ESLint
```

---

## Architecture Overview

### Data Flow

```
Browser → Next.js Server Components → ERP Client → MyPak ERP API
   ↑                                       ↓
   └─────────── Client Components ←────────┘
```

**Server Components** fetch data from ERP API and pass to **Client Components** for interactivity.

### Key Technologies

- **Framework:** Next.js 15 (App Router, Server Components)
- **Language:** TypeScript 5.x
- **Database:** PostgreSQL with Drizzle ORM
- **Styling:** Tailwind CSS v4 + shadcn/ui (Vercel theme)
- **Authentication:** Custom JWT (jose library)
- **ERP Integration:** REST API client with transforms

---

## Project Structure

```
mypak-kavop/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # Dashboard (Server Component)
│   │   ├── orders/page.tsx     # Orders (Server Component)
│   │   ├── sign-in/            # Authentication
│   │   └── api/auth/           # Auth API routes
│   │
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── shared/             # Sidebar, ProductCard, etc.
│   │   ├── dashboard/          # Dashboard components
│   │   └── orders/             # Orders components
│   │
│   ├── lib/
│   │   ├── auth/               # JWT authentication
│   │   ├── db/                 # Database (Drizzle ORM)
│   │   ├── erp/                # ERP API client
│   │   │   ├── client.ts       # Fetch functions
│   │   │   ├── types.ts        # ERP response types
│   │   │   └── transforms.ts   # ERP → App transforms
│   │   ├── services/           # Business logic
│   │   ├── types.ts            # TypeScript interfaces
│   │   └── calculations.ts     # Business calculations
│   │
│   └── hooks/
│       └── useAuth.ts          # Client auth hook
│
├── docs/                       # Complete documentation
│   ├── PROJECT-STATUS.md       # Implementation status
│   ├── guides/                 # Developer guides
│   ├── design/                 # Design system
│   └── backend-planning/       # Technical specs
│
├── CLAUDE.md                   # AI assistant guidance (most accurate)
└── README.md                   # This file
```

---

## Key Concepts

### 1. Server Components Pattern

Pages fetch data from ERP API on the server:

```typescript
// src/app/page.tsx (Server Component)
export default async function Dashboard() {
  const erpProducts = await fetchErpProducts();
  const erpOrders = await fetchErpCurrentOrders();
  
  // Transform and pass to client
  return <DashboardClient products={products} orders={orders} />;
}
```

### 2. Component Design System

**One component with adaptive styling** - not separate components per state:

```typescript
// ✅ DO
<RecommendationCard state="healthy" />
<RecommendationCard state="urgent" />

// ❌ DON'T
<HealthyCard />
<UrgentCard />
```

See: [docs/design/component-system.md](docs/design/component-system.md)

### 3. Status System

Product status based on weeks remaining vs. target SOH:

- 🔴 **CRITICAL**: Below target stock level
- 🟠 **ORDER_NOW**: At target, should plan ahead  
- 🟢 **HEALTHY**: Well stocked (16+ weeks)

See: [docs/design/status-system.md](docs/design/status-system.md)

### 4. ERP Integration

Live data from MyPak ERP API:
- `GET /product/list` - Product catalog
- `GET /order/current` - In-transit & approved orders
- `GET /order/complete` - Order history
- `POST /order/create` - Create orders (planned)

See: [docs/backend-planning/ERP-API-ENDPOINTS.md](docs/backend-planning/ERP-API-ENDPOINTS.md)

---

## Documentation

### For New Developers
1. **Start here:** [docs/guides/developer-onboarding.md](docs/guides/developer-onboarding.md)
2. **Architecture:** [CLAUDE.md](CLAUDE.md) ← Most accurate, always up-to-date
3. **ERP integration:** [docs/guides/erp-integration.md](docs/guides/erp-integration.md)

### For Product/Design
- [docs/design/component-system.md](docs/design/component-system.md) - Component architecture
- [docs/design/status-system.md](docs/design/status-system.md) - Status calculation logic
- [docs/states/](docs/states/) - UI state designs

### For Backend/API
- [docs/backend-planning/ERP-API-ENDPOINTS.md](docs/backend-planning/ERP-API-ENDPOINTS.md) - Complete API reference
- [docs/backend-planning/DATABASE-MODELS.md](docs/backend-planning/DATABASE-MODELS.md) - Database schema
- [docs/backend-planning/AUTHENTICATION.md](docs/backend-planning/AUTHENTICATION.md) - Auth system

### Documentation Index
**See:** [docs/README.md](docs/README.md) for complete documentation map

---

## Development Workflow

### Adding a Feature

1. Check design docs ([docs/design/](docs/design/))
2. Check if ERP data needed ([ERP-API-ENDPOINTS.md](docs/backend-planning/ERP-API-ENDPOINTS.md))
3. Follow Server Component pattern
4. Use adaptive component styling
5. Test with live ERP data

### Common Tasks

**Add ERP endpoint:**
- Add function to `src/lib/erp/client.ts`
- Add types to `src/lib/erp/types.ts`  
- Add transform to `src/lib/erp/transforms.ts`

**Modify component:**
- Read `docs/design/component-system.md`
- Follow adaptive styling pattern
- Test light + dark modes

---

## Design System

### Colors (Vercel Theme)

| Purpose | Color | Tailwind |
|---------|-------|----------|
| Healthy | Green | `text-green-500` |
| Order Now | Amber | `text-amber-500` |
| Critical | Red | `text-red-500` |
| Primary CTA | Blue | `bg-blue-600` |

### Typography

- Product names: `text-xl font-semibold`
- Pallet counts: `text-base font-medium`
- Carton counts: `text-sm text-gray-500`

### Component Heights

- Primary CTAs: `h-14` (56px)
- Standard buttons: `h-10` (40px)
- Small buttons: `h-8` (32px)

---

## Roadmap

### Phase 1: Foundation (✅ Complete)
- ✅ ERP integration (products, orders)
- ✅ Authentication system
- ✅ Dashboard with live data
- ✅ Orders page with live data

### Phase 2: Enhanced Features (🚧 In Progress)
- 🚧 Real inventory tracking (temp mock data)
- 🚧 Container recommendation algorithm (temp mock data)
- 📝 Order creation (POST to ERP)
- 📝 User settings
- 📝 Target SOH configuration

### Phase 3: Advanced (📝 Planned)
- 📝 Order submission workflow
- 📝 Email notifications
- 📝 Historical analytics
- 📝 Export functionality

See: [docs/PROJECT-STATUS.md](docs/PROJECT-STATUS.md)

---

## Important Notes

### Temporary Mock Data

ERP integration is live, but these still use mock data:
- Inventory levels (`currentStock`, `weeklyConsumption`)
- Container recommendations

Will be replaced with real algorithms in Phase 2.

### Pallet-First Display

Backend calculates in cartons. Frontend displays pallets first:

```typescript
<span className="font-medium">{pallets} pallets</span>
<span className="text-gray-500">({cartons.toLocaleString()} cartons)</span>
```

### Design Philosophy

**Ruthless simplicity** - Every element must earn its place.

---

## Contributing

### Code Standards

- TypeScript strict mode
- Server Components for data fetching
- Adaptive component styling (not separate components)
- JWT verification for protected resources

### Before Committing

```bash
npm run build  # Type check
npm run lint   # ESLint
# Manual test: Sign in, Dashboard, Orders, Dark mode
```

---

## Support

- **AI Assistant:** [CLAUDE.md](CLAUDE.md) - Most accurate reference
- **ERP API:** [docs/backend-planning/ERP-API-ENDPOINTS.md](docs/backend-planning/ERP-API-ENDPOINTS.md)
- **Auth Issues:** [docs/backend-planning/AUTHENTICATION.md](docs/backend-planning/AUTHENTICATION.md)
- **Onboarding:** [docs/guides/developer-onboarding.md](docs/guides/developer-onboarding.md)

---

**Built with Next.js 15, TypeScript, PostgreSQL, and shadcn/ui**

Last Updated: November 12, 2024
