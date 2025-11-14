# Better Auth + Railway Architecture Design

**Date:** 2025-11-14
**Status:** Design Phase
**Author:** Architecture Planning Session

---

## 1. Overview & Goals

### Project Context

MyPak Connect is a production VMI (Vendor-Managed Inventory) system currently in development. The system requires robust authentication with multi-tenant architecture supporting organizations and role-based access control.

### Current State

- **Framework:** Next.js 15 (App Router)
- **Database:** PostgreSQL with Drizzle ORM
- **Auth:** Custom JWT implementation (to be replaced)
- **Architecture:** Multi-tenant with organizations
- **Roles:** `platform_admin` and `org_user`

### Migration Goals

1. **Implement Better Auth** - Replace custom auth with battle-tested library
2. **Passwordless Authentication** - Magic Link + Email OTP for better UX and security
3. **Admin Impersonation** - Enable support team to debug customer issues
4. **Multi-tenancy** - Organizations remain first-class citizens
5. **Deploy to Railway** - Managed platform with auto SSL, backups, monitoring

### Success Criteria

- ✅ Users can authenticate via Magic Link or Email OTP
- ✅ Admins can impersonate any user with full audit trail
- ✅ Multi-tenant data isolation preserved
- ✅ Zero-config SSL and automated backups
- ✅ Total hosting cost: $10-15/month
- ✅ Implementation time: < 1 week

---

## 2. Technology Stack

### Core Technologies

| Component | Technology | Reasoning |
|-----------|-----------|-----------|
| **Framework** | Next.js 15 | App Router, Server Components, production-ready |
| **Database** | PostgreSQL | Relational data, ACID compliance, mature ecosystem |
| **ORM** | Drizzle | Type-safe, performant, good DX |
| **Authentication** | Better Auth | Open source, extensible, Next.js 15 compatible |
| **Email** | Resend | $0/month (3000 emails), reliable delivery |
| **Hosting** | Railway | Auto SSL, managed PG, $10-15/month |

### Why Better Auth?

**vs Clerk/PropelAuth:**
- 💰 **Cost:** Free vs $100-150/month (impersonation feature)
- 🔓 **No vendor lock-in:** Open source, self-hosted
- 🎯 **Full control:** Own your user data
- ⚡ **Performance:** No external API calls for auth checks

**vs Custom Implementation:**
- 🔒 **Security:** Battle-tested, community-audited
- ⏱️ **Time:** 2-3 hours vs 1-2 weeks
- 🛠️ **Maintenance:** Library updates vs DIY security patches
- 📚 **Features:** Magic Link, OTP, organizations, impersonation included

---

## 3. Database Schema Design

### Better Auth Tables (Auto-managed)

```typescript
// Core authentication
user {
  id: text (primary key)
  email: text (unique)
  emailVerified: boolean
  name: text
  image: text | null
  createdAt: timestamp
  updatedAt: timestamp
}

session {
  id: text (primary key)
  userId: text (foreign key → user.id)
  expiresAt: timestamp
  token: text (unique)
  ipAddress: text | null
  userAgent: text | null
  impersonatedBy: text | null  // 🔑 Tracks admin impersonation
}

verification {
  id: text (primary key)
  identifier: text  // email address
  value: text       // verification code/token
  expiresAt: timestamp
  createdAt: timestamp
}

// Multi-tenancy
organization {
  id: text (primary key)
  name: text
  slug: text (unique)
  logo: text | null
  createdAt: timestamp
  metadata: jsonb | null
}

member {
  id: text (primary key)
  organizationId: text (foreign key → organization.id)
  userId: text (foreign key → user.id)
  role: text  // 'owner' | 'admin' | 'member'
  createdAt: timestamp
}

invitation {
  id: text (primary key)
  organizationId: text (foreign key → organization.id)
  email: text
  role: text
  inviterId: text (foreign key → user.id)
  status: text  // 'pending' | 'accepted' | 'expired'
  expiresAt: timestamp
  createdAt: timestamp
}
```

### Business Tables (Your Schema)

```typescript
// Links Better Auth org to your business data
organizations {
  org_id: uuid (primary key)
  better_auth_org_id: text (unique, foreign key → organization.id)
  mypak_customer_name: text (unique)
  kavop_token: text  // ERP API token
  created_at: timestamp
  updated_at: timestamp
  last_inventory_update: timestamp
}

// Business data (unchanged, still uses org_id)
product_data {
  org_id: uuid (foreign key → organizations.org_id)
  sku: text
  current_stock: integer
  weekly_consumption: integer
  target_soh: integer (default: 6)
  updated_at: timestamp
  PRIMARY KEY (org_id, sku)
}

recommendations {
  id: uuid (primary key)
  org_id: uuid (foreign key → organizations.org_id)
  container_number: integer
  order_by_date: date
  delivery_date: date
  total_cartons: integer
  total_volume: decimal(10, 2)
  urgency: text  // 'OVERDUE' | 'URGENT' | 'PLANNED'
  products: jsonb
  generated_at: timestamp
}
```

### Key Design Decisions

**1. Dual Organization System**
- **Better Auth `organization`:** Manages users, roles, invitations
- **Your `organizations`:** Stores ERP tokens, business configuration
- **Link:** `better_auth_org_id` foreign key

**Why?**
- Better Auth handles user membership elegantly
- Business logic stays clean (queries by `org_id`)
- Easy to extend with SAML SSO later

**2. Role Mapping**
```typescript
Better Auth Role → Application Permission
'owner'          → Platform admin (full access, can impersonate)
'admin'          → Organization admin (manage users, no impersonation)
'member'         → Regular user (view/edit org data)
```

**3. Data Isolation**
```typescript
// Every API call resolves: Better Auth org_id → Your org_id
session.user.activeOrganizationId → organizations.better_auth_org_id → org_id
```

---

## 4. Better Auth Configuration

### Installation

```bash
npm install better-auth
```

### Server Configuration

```typescript
// src/lib/auth.ts
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "@/lib/db"
import { organization, admin, magicLink, otp } from "better-auth/plugins"

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg"
  }),

  emailAndPassword: {
    enabled: false  // Passwordless only
  },

  // Email configuration with Resend
  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }) => {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)

      await resend.emails.send({
        from: 'MyPak Connect <auth@mypak.com>',
        to: user.email,
        subject: 'Verify your email',
        html: `
          <h2>Welcome to MyPak Connect</h2>
          <p>Click to verify: <a href="${url}">Verify Email</a></p>
          <p>Or enter code: <strong>${token}</strong></p>
          <p>Expires in 15 minutes.</p>
        `
      })
    }
  },

  plugins: [
    // Magic Link authentication
    magicLink({
      sendMagicLink: async ({ email, url, token }) => {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)

        await resend.emails.send({
          from: 'MyPak Connect <auth@mypak.com>',
          to: email,
          subject: 'Sign in to MyPak Connect',
          html: `
            <h2>Sign in to MyPak Connect</h2>
            <p><a href="${url}">Click here to sign in</a></p>
            <p>Or enter code: <strong>${token}</strong></p>
            <p>Expires in 15 minutes.</p>
          `
        })
      },
      expiresIn: 60 * 15, // 15 minutes
    }),

    // Email OTP (6-digit code)
    otp({
      sendOTP: async ({ email, otp }) => {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)

        await resend.emails.send({
          from: 'MyPak Connect <auth@mypak.com>',
          to: email,
          subject: 'Your verification code',
          html: `
            <h2>Your verification code</h2>
            <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px;">
              ${otp}
            </p>
            <p>Expires in 10 minutes.</p>
          `
        })
      },
      expiresIn: 60 * 10, // 10 minutes
      length: 6,
    }),

    // Multi-tenancy
    organization({
      async sendInvitationEmail(data) {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)

        await resend.emails.send({
          from: 'MyPak Connect <invites@mypak.com>',
          to: data.email,
          subject: `Join ${data.organization.name} on MyPak Connect`,
          html: `
            <p>${data.inviter.name} invited you to ${data.organization.name}</p>
            <a href="${data.invitationLink}">Accept Invitation</a>
          `
        })
      },

      roles: {
        owner: { authorize: () => true },
        admin: {
          authorize: (ctx) => ['owner', 'admin'].includes(ctx.session.user.role)
        },
        member: { authorize: () => true }
      }
    }),

    // Admin impersonation
    admin({
      impersonationSessionDuration: 60 * 60, // 1 hour

      async canImpersonate(impersonator) {
        // Only owners can impersonate
        const memberships = await db.query.member.findMany({
          where: eq(member.userId, impersonator.id)
        })

        return memberships.some(m => m.role === 'owner')
      }
    })
  ],

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update every 24 hours
  },

  advanced: {
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    }
  }
})
```

### Client Configuration

```typescript
// src/lib/auth-client.ts
import { createAuthClient } from "better-auth/react"
import { organizationClient, adminClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  plugins: [
    organizationClient(),
    adminClient()
  ]
})

export const {
  useSession,
  signIn,
  signOut,
  useActiveOrganization,
  impersonateUser
} = authClient
```

### Environment Variables

```bash
# Railway auto-injects
DATABASE_URL=postgresql://...

# You must add:
BETTER_AUTH_SECRET=<generate with: openssl rand -base64 32>
RESEND_API_KEY=re_...
NEXT_PUBLIC_APP_URL=https://your-app.railway.app

# Existing
MYPAK_ERP_API_URL=...
```

---

## 5. Application Architecture

### Directory Structure

```
src/
├── lib/
│   ├── auth.ts                    # Better Auth server config
│   ├── auth-client.ts             # Client hooks
│   ├── db/
│   │   ├── index.ts               # Drizzle client
│   │   └── schema.ts              # All tables
│   └── utils/
│       ├── get-org.ts             # Map session → org_id
│       └── is-admin.ts            # Check admin permissions
│
├── app/
│   ├── api/
│   │   ├── auth/[...all]/route.ts # Better Auth handlers
│   │   ├── products/route.ts      # Org-scoped API
│   │   └── orders/route.ts        # Org-scoped API
│   │
│   ├── (auth)/
│   │   └── sign-in/page.tsx       # Magic Link + OTP
│   │
│   ├── (app)/
│   │   ├── layout.tsx             # Auth required
│   │   ├── page.tsx               # Dashboard
│   │   └── orders/page.tsx
│   │
│   └── admin/
│       ├── layout.tsx             # Owner role required
│       ├── page.tsx               # Admin dashboard
│       └── users/page.tsx         # Impersonation UI
│
└── middleware.ts                  # Route protection
```

### Helper Functions

```typescript
// src/lib/utils/get-org.ts
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { organizations } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

/**
 * Get business org_id from Better Auth session
 */
export async function getCurrentOrgId(request: Request): Promise<string | null> {
  const session = await auth.api.getSession({
    headers: request.headers
  })

  if (!session?.user?.activeOrganizationId) {
    return null
  }

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.better_auth_org_id, session.user.activeOrganizationId)
  })

  return org?.org_id || null
}

/**
 * Check if user is platform admin
 */
export async function isPlatformAdmin(request: Request): Promise<boolean> {
  const session = await auth.api.getSession({
    headers: request.headers
  })

  if (!session?.user) return false

  const membership = await db.query.member.findFirst({
    where: (member, { and, eq }) => and(
      eq(member.userId, session.user.id),
      eq(member.organizationId, session.user.activeOrganizationId)
    )
  })

  return membership?.role === 'owner'
}
```

### API Route Pattern

```typescript
// src/app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getCurrentOrgId } from "@/lib/utils/get-org"
import { db } from "@/lib/db"
import { productData } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function GET(request: NextRequest) {
  // Resolve org from session
  const orgId = await getCurrentOrgId(request)

  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Query org-scoped data
  const products = await db.query.productData.findMany({
    where: eq(productData.org_id, orgId)
  })

  return NextResponse.json({ products })
}
```

### Middleware

```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "./lib/auth"
import { db } from "./lib/db"
import { member } from "./lib/db/schema"
import { eq, and } from "drizzle-orm"

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Public routes
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/sign-in")
  ) {
    return NextResponse.next()
  }

  // Require authentication
  const session = await auth.api.getSession({
    headers: request.headers
  })

  if (!session?.user) {
    return NextResponse.redirect(new URL("/sign-in", request.url))
  }

  // Admin routes require owner role
  if (pathname.startsWith("/admin")) {
    const membership = await db.query.member.findFirst({
      where: and(
        eq(member.userId, session.user.id),
        eq(member.organizationId, session.user.activeOrganizationId)
      )
    })

    if (membership?.role !== 'owner') {
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"]
}
```

---

## 6. Key Features Implementation

### Sign-In Page

```typescript
// src/app/sign-in/page.tsx
"use client"

import { useState } from "react"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [mode, setMode] = useState<"magic-link" | "otp">("magic-link")
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState("")
  const router = useRouter()

  async function handleMagicLink() {
    await authClient.magicLink.sendMagicLink({ email })
    alert("Check your email for the magic link!")
  }

  async function handleOTPRequest() {
    await authClient.otp.sendOTP({ email })
    setOtpSent(true)
  }

  async function handleOTPVerify() {
    const result = await authClient.otp.verifyOTP({ email, otp })
    if (result.data) {
      router.push("/")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-4 p-8">
        <h1 className="text-2xl font-bold">Sign in to MyPak Connect</h1>

        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded border p-2"
        />

        <div className="flex gap-2">
          <button
            onClick={() => setMode("magic-link")}
            className={mode === "magic-link" ? "font-bold" : ""}
          >
            Magic Link
          </button>
          <button
            onClick={() => setMode("otp")}
            className={mode === "otp" ? "font-bold" : ""}
          >
            Email Code
          </button>
        </div>

        {mode === "magic-link" && (
          <button
            onClick={handleMagicLink}
            className="w-full rounded bg-blue-600 p-2 text-white"
          >
            Send Magic Link
          </button>
        )}

        {mode === "otp" && !otpSent && (
          <button
            onClick={handleOTPRequest}
            className="w-full rounded bg-blue-600 p-2 text-white"
          >
            Send Code
          </button>
        )}

        {mode === "otp" && otpSent && (
          <>
            <input
              type="text"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              className="w-full rounded border p-2 text-center text-2xl tracking-widest"
            />
            <button
              onClick={handleOTPVerify}
              className="w-full rounded bg-blue-600 p-2 text-white"
            >
              Verify Code
            </button>
          </>
        )}
      </div>
    </div>
  )
}
```

### Admin Impersonation

```typescript
// src/app/admin/users/page.tsx
"use client"

import { useState, useEffect } from "react"
import { authClient } from "@/lib/auth-client"

export default function AdminUsersPage() {
  const { data: session } = authClient.useSession()
  const [users, setUsers] = useState([])

  useEffect(() => {
    fetch("/api/admin/users")
      .then(r => r.json())
      .then(setUsers)
  }, [])

  async function handleImpersonate(userId: string) {
    const result = await authClient.admin.impersonateUser({ userId })
    if (result.data) {
      window.location.href = "/"
    }
  }

  return (
    <div className="p-8">
      {/* Impersonation banner */}
      {session?.session?.impersonatedBy && (
        <div className="fixed top-0 left-0 right-0 bg-amber-500 p-3 text-center font-bold text-white">
          ⚠️ Viewing as {session.user.name}
          <button
            onClick={() => authClient.admin.stopImpersonation()}
            className="ml-4 underline"
          >
            Stop Impersonation
          </button>
        </div>
      )}

      <h1 className="text-2xl font-bold mb-4">User Management</h1>

      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Email</th>
            <th className="text-left p-2">Name</th>
            <th className="text-left p-2">Organization</th>
            <th className="text-left p-2">Role</th>
            <th className="text-left p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user: any) => (
            <tr key={user.id} className="border-b">
              <td className="p-2">{user.email}</td>
              <td className="p-2">{user.name}</td>
              <td className="p-2">{user.organization?.name}</td>
              <td className="p-2">{user.role}</td>
              <td className="p-2">
                <button
                  onClick={() => handleImpersonate(user.id)}
                  className="text-blue-600 hover:underline"
                >
                  Impersonate
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

---

## 7. Railway Deployment

### Setup Steps

1. **Connect Repository**
   - Go to railway.app
   - New Project → Deploy from GitHub
   - Select `mypak-kavop` repository

2. **Add PostgreSQL**
   - Click "+ New"
   - Select "Database → PostgreSQL"
   - Railway auto-injects `DATABASE_URL`

3. **Configure Environment Variables**
   ```
   BETTER_AUTH_SECRET=<generate-random-string>
   RESEND_API_KEY=re_...
   NEXT_PUBLIC_APP_URL=https://<your-app>.railway.app
   MYPAK_ERP_API_URL=...
   ```

4. **Build Configuration**
   Railway auto-detects Next.js:
   - Build: `npm run build`
   - Start: `npm run start`
   - Port: Auto-detected (3000)

5. **SSL Configuration**
   - ✅ Automatic (Let's Encrypt)
   - ✅ Custom domain support
   - ✅ Auto-renewal

### Database Migrations

```bash
# Generate migrations locally
npm run db:generate

# Push to Railway
git push origin main

# Railway auto-runs migrations
```

### Monitoring

Railway provides:
- ✅ Real-time logs
- ✅ Metrics (CPU, Memory, Network)
- ✅ Deployment history
- ✅ One-click rollbacks

### Cost Estimate

| Resource | Usage | Cost |
|----------|-------|------|
| Next.js App | 512MB RAM | ~$5-8/month |
| PostgreSQL | 1GB storage | ~$5/month |
| **Total** | | **$10-13/month** |

---

## 8. Security Considerations

### Authentication Security

✅ **httpOnly Cookies** - No JavaScript access (XSS protection)
✅ **CSRF Protection** - sameSite: lax
✅ **Rate Limiting** - Built into Better Auth
✅ **Email Verification** - Required for new users
✅ **Session Expiry** - 7 days, auto-refresh

### Impersonation Security

✅ **Role-based** - Only owners can impersonate
✅ **Time-limited** - 1 hour sessions
✅ **Audit Trail** - `session.impersonatedBy` tracks who
✅ **Visual Indicator** - Amber banner during impersonation

### Data Isolation

✅ **Query-level** - All queries filtered by `org_id`
✅ **Middleware** - Session validates org membership
✅ **API Routes** - `getCurrentOrgId()` enforces scope

### Production Checklist

- [ ] `BETTER_AUTH_SECRET` is randomly generated (32+ chars)
- [ ] `secure: true` in production (HTTPS only)
- [ ] Database connection uses SSL
- [ ] Resend API key from production environment
- [ ] Rate limiting enabled
- [ ] Backup strategy configured

---

## 9. Testing Strategy

### Unit Tests

```typescript
// Test org resolution
describe('getCurrentOrgId', () => {
  it('returns org_id for authenticated user', async () => {
    // Mock session with activeOrganizationId
    // Assert correct org_id returned
  })

  it('returns null for unauthenticated request', async () => {
    // Mock request without session
    // Assert null returned
  })
})
```

### Integration Tests

```typescript
// Test impersonation flow
describe('Admin Impersonation', () => {
  it('allows owner to impersonate member', async () => {
    // Login as owner
    // Call impersonate API
    // Verify session.impersonatedBy set
    // Verify can access member data
  })

  it('prevents member from impersonating', async () => {
    // Login as member
    // Attempt impersonation
    // Assert 403 Forbidden
  })
})
```

### Manual Testing Checklist

- [ ] Magic Link email received and works
- [ ] OTP email received and 6-digit code works
- [ ] User can switch between organizations
- [ ] Owner can impersonate any user
- [ ] Impersonation banner shows
- [ ] Stop impersonation returns to admin account
- [ ] API routes enforce org isolation
- [ ] Middleware redirects unauthenticated users

---

## 10. Implementation Plan

### Phase 1: Setup (Day 1)

- [ ] Install Better Auth and dependencies
- [ ] Configure Resend account and API key
- [ ] Update database schema with Better Auth tables
- [ ] Run migrations
- [ ] Set up Railway project (staging)

### Phase 2: Core Auth (Day 2-3)

- [ ] Implement `src/lib/auth.ts` server config
- [ ] Implement `src/lib/auth-client.ts`
- [ ] Create API route `api/auth/[...all]/route.ts`
- [ ] Build sign-in page with Magic Link + OTP
- [ ] Update middleware for Better Auth
- [ ] Test authentication flows

### Phase 3: Multi-tenancy (Day 3-4)

- [ ] Create helper functions (`get-org.ts`, `is-admin.ts`)
- [ ] Update existing API routes to use `getCurrentOrgId()`
- [ ] Update dashboard to show active organization
- [ ] Test org data isolation
- [ ] Implement organization switcher UI

### Phase 4: Impersonation (Day 4-5)

- [ ] Build admin users page
- [ ] Implement impersonation UI
- [ ] Add impersonation banner
- [ ] Test impersonation flows
- [ ] Verify audit trail

### Phase 5: Deployment (Day 5-6)

- [ ] Deploy to Railway staging
- [ ] Configure environment variables
- [ ] Test SSL and custom domain
- [ ] Run full QA on staging
- [ ] Deploy to Railway production

### Phase 6: Polish (Day 6-7)

- [ ] Add loading states
- [ ] Improve error messages
- [ ] Add email templates styling
- [ ] Documentation for users
- [ ] Handoff to team

---

## 11. Success Metrics

### Technical Metrics

- ✅ Auth latency < 200ms (Better Auth local checks)
- ✅ Zero failed auth attempts due to bugs
- ✅ 100% uptime (Railway SLA)
- ✅ Database query time < 50ms (org-scoped queries)

### Business Metrics

- ✅ Users successfully authenticate on first attempt
- ✅ Support team can debug customer issues via impersonation
- ✅ Zero security incidents
- ✅ Hosting cost within budget ($10-15/month)

---

## 12. Risks & Mitigations

### Risk: Email Delivery Issues

**Impact:** Users can't sign in
**Likelihood:** Low (Resend 99.9% delivery)
**Mitigation:**
- Monitor Resend dashboard
- Set up email delivery webhooks
- Fallback: Temporary password reset link

### Risk: Session Token Leakage

**Impact:** Unauthorized access
**Likelihood:** Very Low (httpOnly cookies)
**Mitigation:**
- httpOnly cookies prevent XSS
- sameSite: lax prevents CSRF
- Short session duration (7 days)
- Rotate BETTER_AUTH_SECRET if compromised

### Risk: Impersonation Abuse

**Impact:** Admin accesses sensitive data
**Likelihood:** Low (trusted team)
**Mitigation:**
- Audit trail (`impersonatedBy` field)
- 1-hour session limit
- Visible banner during impersonation
- Monitor impersonation logs

### Risk: Railway Downtime

**Impact:** Application unavailable
**Likelihood:** Very Low (99.9% SLA)
**Mitigation:**
- Railway status page monitoring
- Database backups (daily)
- Fallback: Can migrate to Render/Fly in 1 hour

---

## 13. Future Enhancements

### Short-term (1-3 months)

- [ ] SAML SSO for enterprise customers
- [ ] Two-factor authentication (TOTP)
- [ ] Session device management (view/revoke)
- [ ] Email notification for impersonation events

### Long-term (3-6 months)

- [ ] Audit log dashboard
- [ ] Custom role permissions (beyond owner/admin/member)
- [ ] API key authentication for programmatic access
- [ ] Self-service organization management

---

## 14. Conclusion

This architecture provides a production-ready, secure, and cost-effective authentication system for MyPak Connect. By leveraging Better Auth, we gain enterprise-grade features (passwordless auth, multi-tenancy, impersonation) without vendor lock-in or high costs.

**Total Investment:**
- **Time:** 5-7 days implementation
- **Cost:** $10-15/month hosting
- **Maintenance:** Minimal (library handles updates)

**Key Benefits:**
- ✅ Better UX (passwordless)
- ✅ Better security (battle-tested library)
- ✅ Better support (impersonation)
- ✅ Better scalability (Railway managed platform)

**Next Steps:**
1. Review and approve this design
2. Create implementation plan (detailed tasks)
3. Set up Railway staging environment
4. Begin Phase 1 implementation

---

**Document Status:** Ready for Review
**Approver:** Product/Engineering Lead
**Implementation Start:** TBD
