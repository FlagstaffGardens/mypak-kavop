# Developer Onboarding Guide

**Welcome to MyPak - Kavop!**

This guide will get you from zero to productive in ~30 minutes. By the end, you'll understand the architecture, know where everything lives, and be ready to ship features.

**Last Updated:** January 15, 2025

---

## Table of Contents

1. [What is MyPak Connect?](#what-is-mypak-connect)
2. [Architecture Overview](#architecture-overview)
3. [Getting Started](#getting-started)
4. [Project Structure Deep Dive](#project-structure-deep-dive)
5. [Key Concepts](#key-concepts)
6. [Common Development Tasks](#common-development-tasks)
7. [Testing Your Changes](#testing-your-changes)
8. [Where to Find Things](#where-to-find-things)
9. [Troubleshooting](#troubleshooting)

---

## What is MyPak - Kavop?

MyPak - Kavop is a **vendor-managed inventory (VMI) system** for egg farms that order cartons from MyPak.

### The Problem It Solves

Egg farms need to order container loads of cartons regularly. If they order too late, they run out. If they order too early, they tie up cash and warehouse space.

### The Solution

MyPak - Kavop monitors inventory levels and **proactively recommends** when to order containers, helping farms:
- ✅ Never run out of cartons (no production delays)
- ✅ Optimize cash flow (order just-in-time)
- ✅ Reduce manual tracking (automated monitoring)

### Current Status

**Production with Live ERP Integration:**
- ✅ Dashboard shows real products from MyPak ERP
- ✅ Orders page shows real orders from MyPak ERP
- ✅ Better Auth passwordless authentication (Email OTP)
- ✅ Multi-tenant organizations with role-based access
- ✅ Admin impersonation for customer support
- 🚧 Inventory tracking (temporary mock data)
- 🚧 Recommendations (temporary mock data)

---

## Architecture Overview

### The Big Picture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
│  - Client Components (interactive UI)                       │
│  - Better Auth session cookie (httpOnly, secure)            │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTPS
                        ↓
┌─────────────────────────────────────────────────────────────┐
│                  Next.js 15 Server                           │
│  ┌─────────────────────────────────────────────┐            │
│  │   Better Auth (src/lib/auth.ts)             │            │
│  │   - Email OTP authentication                │            │
│  │   - Session management (60 days)            │            │
│  │   - Multi-tenant organizations              │            │
│  │   - Admin impersonation                     │            │
│  └──────────────┬──────────────────────────────┘            │
│                 │                                            │
│  ┌──────────────▼──────────────────────────────┐            │
│  │   Server Components (Data Fetching)         │            │
│  │   - Dashboard: fetchErpProducts()           │            │
│  │   - Orders: fetchErpOrders()                │            │
│  └──────────────┬──────────────────────────────┘            │
│                 │                                            │
│  ┌──────────────▼──────────────────────────────┐            │
│  │   ERP Client (src/lib/erp/client.ts)        │            │
│  │   1. Get organization's kavop_token         │            │
│  │   2. Call MyPak ERP API with token          │            │
│  │   3. Transform ERP data to app types        │            │
│  └──────────────┬──────────────────────────────┘            │
│                 │                                            │
│  ┌──────────────▼──────────────────────────────┐            │
│  │   Database (PostgreSQL)                     │            │
│  │   - Better Auth tables (user, session, etc) │            │
│  │   - Business tables (organizations, etc)    │            │
│  │   - organizations (kavop_token stored here) │            │
│  └─────────────────────────────────────────────┘            │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP
                        ↓
┌─────────────────────────────────────────────────────────────┐
│              MyPak ERP API                                   │
│  http://www.mypak.cn:8088/api/kavop                         │
│  - GET /product/list                                         │
│  - GET /order/current                                        │
│  - GET /order/complete                                       │
│  - POST /order/create (ready, not yet used)                  │
└─────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

**1. Server Components for Data Fetching**
- Pages are async Server Components that fetch from ERP
- Data fetching happens on server (secure, fast)
- Results passed to Client Components for interactivity

**2. Direct Database Access**
- No custom API layer between app and database
- Drizzle ORM for type-safe queries
- Faster development, fewer layers

**3. ERP as Source of Truth**
- Products and orders come from MyPak ERP
- We don't duplicate ERP data in our database
- Only store: users, organizations, configuration

**4. Better Auth Passwordless Authentication**
- Email OTP (6-digit codes, 5-minute expiry)
- 60-day sessions with 7-day auto-renewal
- httpOnly cookies for security
- Multi-tenant organizations with roles
- Platform admin + org owner authorization model

---

## Getting Started

### Prerequisites

- **Node.js** 18+ with npm
- **PostgreSQL** database (local or remote)
- **MyPak ERP Access** - Get `kavop_token` from MyPak team

### Step 1: Clone and Install

```bash
# Clone repository
git clone <repository-url>
cd mypak-kavop

# Install dependencies
npm install
```

### Step 2: Set Up Environment

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local
nano .env.local
```

Add these values:

```bash
# Database connection
DATABASE_URL="postgresql://user:password@localhost:5432/mypak_kavop"

# Better Auth secret (generate with: openssl rand -base64 32)
BETTER_AUTH_SECRET="your-random-secret-key-here"

# Better Auth base URL (for email links)
BETTER_AUTH_URL="http://localhost:3000"

# Resend API key for email delivery
RESEND_API_KEY="re_..."
```

### Step 3: Set Up Database

```bash
# Run migrations (if setup)
npm run db:push

# Or manually create tables using schema in:
# docs/backend-planning/DATABASE-MODELS.md
```

### Step 4: Seed Test Data

**Option 1: Use seed script (recommended):**

```bash
# Run the seed script
npm run seed

# This creates:
# - Platform admin user with role='admin'
# - Test organization with Better Auth link
# - Sample product_data
```

**Option 2: Manual SQL setup:**

```sql
-- 1. Insert test organization (business table)
INSERT INTO organizations (org_id, org_name, mypak_customer_name, kavop_token, better_auth_org_id)
VALUES (
  gen_random_uuid(),
  'Test Egg Farm',
  'Aginbrook',  -- Must match MyPak ERP customer name
  'eyJhbGci...',  -- Get real token from MyPak team
  NULL  -- Will be linked to Better Auth org when user signs in
);

-- 2. Better Auth user and org will be created automatically
-- when user signs in with Email OTP for the first time.
-- Just visit /sign-in and enter your email!
```

**Note:** No passwords needed! Users authenticate via 6-digit email codes.

### Step 5: Start Development Server

```bash
npm run dev
# Open http://localhost:3000
```

### Step 6: Sign In

1. Go to http://localhost:3000
2. Enter your email: `test@example.com`
3. Check your email for a 6-digit code
4. Enter the code to sign in
5. You should see the Dashboard with real ERP data!

**Note:** First-time users will have their Better Auth account created automatically.

---

## Project Structure Deep Dive

### `/src/app` - Next.js App Router

This is where pages live. **Key pattern:** Pages are Server Components that fetch data.

```
src/app/
├── layout.tsx              # Root layout (Sidebar, theme provider)
├── page.tsx                # Dashboard (fetches ERP products)
├── loading.tsx             # Dashboard loading state
├── error.tsx               # Dashboard error boundary
│
├── orders/
│   ├── page.tsx            # Orders page (fetches ERP orders)
│   ├── loading.tsx         # Loading state
│   └── error.tsx           # Error boundary
│
├── (auth)/
│   └── sign-in/
│       └── page.tsx        # Email OTP sign-in page
│
├── admin/                  # Admin pages (platform admins + org owners)
│   ├── organizations/
│   │   ├── page.tsx        # Org list (platform_admin only)
│   │   └── [org_id]/
│   │       ├── page.tsx    # Org details
│   │       ├── impersonate/
│   │       │   └── page.tsx  # Admin impersonation
│   │       └── users/
│   │           ├── page.tsx  # User list
│   │           └── new/
│   │               └── page.tsx  # Add users
│   └── page.tsx            # Admin dashboard
│
└── api/
    ├── auth/[...all]/route.ts  # Better Auth API routes (auto-handled)
    └── admin/              # Admin API endpoints
        ├── users/route.ts
        └── organizations/
            └── [org_id]/
                └── users/route.ts
```

**Example: Dashboard Page**

```typescript
// src/app/page.tsx
export default async function Dashboard() {
  // 1. Fetch from ERP (server-side)
  const erpProducts = await fetchErpProducts();
  
  // 2. Transform to app types
  const products = erpProducts.map(transformErpProduct);
  
  // 3. Pass to Client Component
  return <DashboardClient products={products} />;
}
```

### `/src/components` - React Components

```
src/components/
├── ui/                     # shadcn/ui base components
│   ├── button.tsx
│   ├── card.tsx
│   ├── badge.tsx
│   └── [30+ components]
│
├── shared/                 # Shared across pages
│   ├── Sidebar.tsx         # Navigation sidebar
│   ├── ProductCard.tsx     # Product inventory cards
│   └── RecommendationCard.tsx  # Top recommendation
│
├── dashboard/
│   └── DashboardClient.tsx # Client wrapper for Dashboard
│
└── orders/
    └── OrdersClient.tsx    # Client wrapper for Orders
```

**Component Philosophy:** One component with adaptive styling (props), not separate components per state.

### `/src/lib` - Business Logic & Utilities

```
src/lib/
├── auth.ts                 # ⭐ Better Auth server config (important!)
├── auth-client.ts          # Better Auth client config
│
├── db/
│   ├── index.ts            # Drizzle client export
│   └── schema.ts           # Database schema (Better Auth + Business tables)
│
├── erp/                    # ⭐ ERP Integration (important!)
│   ├── client.ts           # ERP API fetch functions
│   ├── types.ts            # ERP response types
│   └── transforms.ts       # ERP data → App data
│
├── services/
│   └── inventory.ts        # Inventory logic (temp mock)
│
├── data/
│   └── mock-containers.ts  # Mock recommendations (temp)
│
├── types.ts                # App TypeScript interfaces
├── calculations.ts         # Business calculations
└── utils.ts                # Utility functions
```

**Most Important: `/src/lib/erp/`**

This is the bridge between our app and MyPak ERP. Read this first!

---

## Key Concepts

### 1. Server Components vs Client Components

**Server Components** (default in Next.js 15):
- Can be `async` and fetch data
- Run only on server
- Can access database directly
- Cannot use React hooks
- No `'use client'` directive

**Client Components:**
- Have `'use client'` at top
- Can use React hooks (useState, useEffect, etc.)
- Cannot be async
- Cannot access database directly

**Rule of thumb:** Fetch data in Server Component, pass to Client Component.

### 2. ERP Integration

All product and order data comes from MyPak ERP API.

**Key Files:**
- `src/lib/erp/client.ts` - Fetch functions
- `src/lib/erp/types.ts` - ERP response shapes
- `src/lib/erp/transforms.ts` - Transform ERP → App types

**How it works:**

```typescript
// 1. Get organization's token from database
const kavop_token = await getOrgToken();

// 2. Call ERP API
const response = await fetch('http://www.mypak.cn:8088/api/kavop/product/list', {
  headers: { 'Authorization': kavop_token }
});

// 3. Transform to app types
const products = erpData.map(transformErpProduct);
```

**See:** [docs/backend-planning/ERP-API-ENDPOINTS.md](../backend-planning/ERP-API-ENDPOINTS.md) for complete API reference.

### 3. Status System

Products have statuses based on **weeks remaining** vs. **target SOH**:

```typescript
// Calculate weeks remaining
const weeksRemaining = currentStock / weeklyConsumption;

// Determine status
if (weeksRemaining < targetSOH) {
  status = 'CRITICAL';  // 🔴 Below target!
} else if (weeksRemaining < 16) {
  status = 'ORDER_NOW';  // 🟠 Plan ahead
} else {
  status = 'HEALTHY';  // 🟢 All good
}
```

**Why 16 weeks?** Target (6) + Lead time (8) + Buffer (2) = 16 weeks

**See:** [docs/design/status-system.md](../design/status-system.md) for detailed logic.

### 4. Component Design Pattern

**One component, adaptive styling:**

```typescript
// RecommendationCard.tsx
export function RecommendationCard({ state }: { state: 'healthy' | 'urgent' | 'multiple' }) {
  const config = {
    healthy: {
      borderColor: 'border-l-green-500',
      title: 'All Systems On Track',
      icon: CheckCircle
    },
    urgent: {
      borderColor: 'border-l-amber-500',
      title: 'Container Needs Ordering',
      icon: AlertTriangle
    },
    multiple: {
      borderColor: 'border-l-red-500',
      title: 'Multiple Containers Urgent',
      icon: AlertCircle
    }
  }[state];

  return (
    <Card className={`border-l-4 ${config.borderColor}`}>
      <config.icon />
      <h3>{config.title}</h3>
    </Card>
  );
}
```

**See:** [docs/design/component-system.md](../design/component-system.md) for complete guidelines.

### 5. Authentication Flow (Email OTP)

```typescript
// 1. User enters email on sign-in page
await authClient.emailOtp.sendVerificationOtp({
  email: "user@example.com",
  type: "sign-in"
});
// → Better Auth generates 6-digit code
// → Resend sends email with code (5-minute expiry)

// 2. User enters 6-digit code
await authClient.signIn.emailOtp({
  email: "user@example.com",
  otp: "123456"
});
// → Better Auth verifies code
// → Creates session (60 days, auto-renews every 7 days)
// → Sets httpOnly cookie: better-auth.session_token

// 3. Subsequent requests
const session = await auth.api.getSession({ headers });
// → Better Auth validates session token
// → Returns user + activeOrganizationId

// 4. Middleware protection
// All routes except /sign-in and /api/auth/* require valid session
```

**Key Features:**
- No passwords - more secure
- OTP expires in 5 minutes
- Sessions last 60 days with weekly renewal
- Multi-tenant via activeOrganizationId

**See:** [CLAUDE.md](../../CLAUDE.md#authentication) for complete system.

---

## Common Development Tasks

### Task 1: Adding a New ERP Endpoint

**Example:** Adding `POST /order/create`

**Step 1: Add fetch function** (`src/lib/erp/client.ts`):

```typescript
export async function createErpOrder(orderData: CreateOrderRequest): Promise<void> {
  const token = await getOrgToken();

  const response = await fetch(`${ERP_BASE_URL}/order/create`, {
    method: 'POST',
    headers: {
      'Authorization': token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify([orderData])  // ERP expects array
  });

  if (!response.ok) {
    throw new Error(`ERP API error: ${response.status}`);
  }

  const data: ErpApiResponse<string> = await response.json();

  if (!data.success) {
    throw new Error(`ERP API error: ${data.error}`);
  }
}
```

**Step 2: Add types** (`src/lib/erp/types.ts`):

```typescript
export interface CreateOrderRequest {
  signer: string;
  requiredEta: string;  // "YYYY-MM-DD"
  shippingTerm: 'DDU' | 'CIF' | 'DDP' | 'EXW' | 'FOB';
  customerOrderNumber?: string;
  comments?: string;
  lines: {
    qty: number;
    sku: string;
    productId: number;
  }[];
}
```

**Step 3: Use in Server Component:**

```typescript
// src/app/orders/submit/route.ts
export async function POST(request: Request) {
  const orderData = await request.json();
  await createErpOrder(orderData);
  return NextResponse.json({ success: true });
}
```

### Task 2: Modifying a Component

**Example:** Adding a "View Details" button to ProductCard

**Step 1: Read component system docs:**
- [docs/design/component-system.md](../design/component-system.md)

**Step 2: Edit component** (`src/components/shared/ProductCard.tsx`):

```typescript
<Card>
  {/* existing content */}
  
  {/* New button */}
  <Button 
    variant="outline" 
    size="sm"
    onClick={() => router.push(`/products/${product.id}`)}
  >
    View Details
  </Button>
</Card>
```

**Step 3: Test in both light and dark modes**

### Task 3: Adding a New Page

**Example:** Adding a Settings page

**Step 1: Create page file** (`src/app/settings/page.tsx`):

```typescript
import { getCurrentUser } from '@/lib/auth/jwt';
import { SettingsClient } from '@/components/settings/SettingsClient';

export default async function SettingsPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/sign-in');
  }

  return <SettingsClient user={user} />;
}
```

**Step 2: Create client component** (`src/components/settings/SettingsClient.tsx`):

```typescript
'use client';

export function SettingsClient({ user }) {
  const [targetSOH, setTargetSOH] = useState(6);
  
  // ... rest of component
}
```

**Step 3: Add to navigation** (`src/components/shared/Sidebar.tsx`):

```typescript
const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Orders', href: '/orders', icon: Package },
  { name: 'Settings', href: '/settings', icon: Settings },  // ← Add this
];
```

---

## Testing Your Changes

### Manual Testing Checklist

Before committing code:

```bash
# 1. Type check
npm run build

# 2. Lint
npm run lint

# 3. Manual tests
✓ Sign in works
✓ Dashboard loads with real ERP data
✓ Orders page loads with real ERP data
✓ Dark mode toggle works
✓ Sidebar collapse/expand works
✓ No console errors
✓ Test in Chrome + Safari (if possible)
```

### Testing with Live ERP Data

1. Make sure your test organization has a valid `kavop_token`
2. Sign in as test user
3. Verify Dashboard shows real products from ERP
4. Verify Orders page shows real orders from ERP

### Testing Error States

```typescript
// Temporarily break ERP token to test error handling
UPDATE organizations SET kavop_token = '' WHERE org_name = 'Test Org';

// You should see helpful error message, not crash
```

---

## Where to Find Things

### "Where is...?"

| What | Where |
|------|-------|
| **Dashboard page** | `src/app/page.tsx` |
| **Orders page** | `src/app/orders/page.tsx` |
| **Sign in page** | `src/app/(auth)/sign-in/page.tsx` |
| **Better Auth server config** | `src/lib/auth.ts` |
| **Better Auth client** | `src/lib/auth-client.ts` |
| **Better Auth API routes** | `src/app/api/auth/[...all]/route.ts` |
| **ERP API calls** | `src/lib/erp/client.ts` |
| **Database schema** | `src/lib/db/schema.ts` |
| **Product card component** | `src/components/shared/ProductCard.tsx` |
| **Sidebar** | `src/components/shared/Sidebar.tsx` |
| **Calculation functions** | `src/lib/calculations.ts` |
| **TypeScript types** | `src/lib/types.ts` (app) + `src/lib/erp/types.ts` (ERP) |

### "How do I...?"

| Task | Reference |
|------|-----------|
| **Add an ERP endpoint** | [ERP-API-ENDPOINTS.md](../backend-planning/ERP-API-ENDPOINTS.md) |
| **Modify a component** | [component-system.md](../design/component-system.md) |
| **Understand status logic** | [status-system.md](../design/status-system.md) |
| **Work with authentication** | [CLAUDE.md - Authentication](../../CLAUDE.md#authentication) |
| **Update database schema** | [DATABASE-MODELS.md](../backend-planning/DATABASE-MODELS.md) |

### "What is...?"

| Concept | Reference |
|---------|-----------|
| **Target SOH** | [status-system.md](../design/status-system.md) |
| **ERP Integration** | [erp-integration.md](erp-integration.md) |
| **Component patterns** | [component-system.md](../design/component-system.md) |
| **Recommendation algorithm** | [RECOMMENDATION-ALGORITHM.md](../backend-planning/RECOMMENDATION-ALGORITHM.md) |

---

## Troubleshooting

### Issue: Dashboard shows "ERP API error: For input string: ''"

**Cause:** Organization's `kavop_token` is empty in database.

**Fix:**
```sql
UPDATE organizations 
SET kavop_token = 'eyJhbGci...'  -- Get real token from MyPak team
WHERE org_name = 'Your Org';
```

### Issue: "User not authenticated" when accessing Dashboard

**Cause:** Better Auth session expired or invalid.

**Fix:**
1. Sign out (or clear cookies)
2. Sign in again with Email OTP
3. Check environment variables:
   - `BETTER_AUTH_SECRET` is set in `.env.local`
   - `RESEND_API_KEY` is set (for email delivery)
   - `BETTER_AUTH_URL` matches your dev URL

### Issue: TypeScript errors after `npm install`

**Cause:** Types out of sync.

**Fix:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Issue: Dashboard/Orders page shows empty state

**Cause:** ERP API returned no data.

**Debug:**
1. Check console for 🔍 diagnostic logs
2. Verify `kavop_token` is correct for the customer
3. Test ERP API directly with token
4. Check [ERP-API-ENDPOINTS.md](../backend-planning/ERP-API-ENDPOINTS.md) for endpoint details

### Issue: Dark mode not working

**Cause:** Theme provider not wrapping app.

**Fix:** Check `src/app/layout.tsx` has `<ThemeProvider>` wrapper.

---

## Next Steps

Now that you're set up:

1. **Read the architecture docs:**
   - [CLAUDE.md](../../CLAUDE.md) - Most accurate reference
   - [component-system.md](../design/component-system.md)
   - [status-system.md](../design/status-system.md)

2. **Explore the codebase:**
   - Read `src/app/page.tsx` (Dashboard)
   - Read `src/lib/erp/client.ts` (ERP integration)
   - Read `src/components/shared/ProductCard.tsx` (component example)

3. **Make your first change:**
   - Pick a small task
   - Follow the patterns you see
   - Test thoroughly
   - Ask questions!

---

## Getting Help

- **Code Questions:** Check [CLAUDE.md](../../CLAUDE.md) first
- **ERP API Issues:** See [ERP-API-ENDPOINTS.md](../backend-planning/ERP-API-ENDPOINTS.md)
- **Design Questions:** See [component-system.md](../design/component-system.md)
- **Stuck?:** Ask the team or check docs in [docs/](../)

---

**Welcome to the team! Let's build something great.** 🚀

Last Updated: January 15, 2025
