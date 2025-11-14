# Better Auth + Railway Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace custom JWT auth with Better Auth, add passwordless authentication (Magic Link + OTP), enable admin impersonation, and deploy to Railway.

**Architecture:** Better Auth handles authentication with Drizzle adapter for PostgreSQL. Dual organization system links Better Auth's organization table to business organizations table via `better_auth_org_id`. All API routes resolve session → Better Auth org → business org_id for data isolation.

**Tech Stack:** Next.js 15, Better Auth, Drizzle ORM, PostgreSQL, Resend (email), Railway (hosting)

**Estimated Time:** 5-7 days

---

## Prerequisites

- [x] Node.js 20+ installed
- [x] PostgreSQL database (local or Railway)
- [ ] Resend account with API key
- [ ] Railway account (for deployment)

---

## Phase 1: Setup and Dependencies

### Task 1: Install Better Auth and Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install Better Auth packages**

Run:
```bash
npm install better-auth resend
```

Expected: Packages installed successfully

**Step 2: Verify installation**

Run:
```bash
npm list better-auth resend
```

Expected: Shows installed versions

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install better-auth and resend dependencies"
```

---

### Task 2: Create Environment Variables Template

**Files:**
- Create: `.env.example`
- Modify: `.env.local`

**Step 1: Create .env.example template**

Create `.env.example`:
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mypak

# Better Auth
BETTER_AUTH_SECRET=<generate with: openssl rand -base64 32>
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Resend Email
RESEND_API_KEY=re_...

# ERP API (existing)
MYPAK_ERP_API_URL=https://api.mypak.com
```

**Step 2: Generate BETTER_AUTH_SECRET**

Run:
```bash
openssl rand -base64 32
```

Expected: Random 32-character string (e.g., `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6=`)

**Step 3: Update .env.local with real values**

Add to `.env.local`:
```bash
BETTER_AUTH_SECRET=<paste-generated-secret>
RESEND_API_KEY=re_<your-resend-api-key>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Step 4: Commit**

```bash
git add .env.example
git commit -m "chore: add environment variables template for Better Auth"
```

---

## Phase 2: Database Schema

### Task 3: Add Better Auth Tables to Schema

**Files:**
- Modify: `src/lib/db/schema.ts`

**Step 1: Add Better Auth user table**

Add to `src/lib/db/schema.ts`:
```typescript
import { pgTable, text, timestamp, uuid, integer, index, primaryKey, decimal, jsonb, date, boolean } from "drizzle-orm/pg-core";

// ========================================
// Better Auth Tables (Auto-managed)
// ========================================

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  name: text("name").notNull(),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  impersonatedBy: text("impersonatedBy"), // Tracks admin impersonation
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});
```

**Step 2: Add Better Auth organization tables**

Add to `src/lib/db/schema.ts`:
```typescript
export const organization = pgTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  metadata: jsonb("metadata"),
});

export const member = pgTable("member", {
  id: text("id").primaryKey(),
  organizationId: text("organizationId")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // 'owner' | 'admin' | 'member'
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const invitation = pgTable("invitation", {
  id: text("id").primaryKey(),
  organizationId: text("organizationId")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role").notNull(),
  inviterId: text("inviterId")
    .notNull()
    .references(() => user.id),
  status: text("status").notNull().default("pending"),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});
```

**Step 3: Update organizations table to link with Better Auth**

Modify `organizations` table in `src/lib/db/schema.ts`:
```typescript
export const organizations = pgTable("organizations", {
  org_id: uuid("org_id").defaultRandom().primaryKey(),
  better_auth_org_id: text("better_auth_org_id")
    .unique()
    .references(() => organization.id, { onDelete: "cascade" }),
  org_name: text("org_name").notNull(),
  mypak_customer_name: text("mypak_customer_name").notNull().unique(),
  kavop_token: text("kavop_token").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
  last_inventory_update: timestamp("last_inventory_update"),
});
```

**Step 4: Remove old users table (mark as deprecated)**

Comment out or remove the old `users` table in `src/lib/db/schema.ts`:
```typescript
// DEPRECATED: Replaced by Better Auth user + member tables
// export const users = pgTable("users", { ... });
```

**Step 5: Commit**

```bash
git add src/lib/db/schema.ts
git commit -m "feat: add Better Auth database schema

- Add Better Auth tables (user, session, account, verification)
- Add organization tables (organization, member, invitation)
- Link business organizations to Better Auth via better_auth_org_id
- Deprecate old users table"
```

---

### Task 4: Generate and Run Database Migration

**Files:**
- Create: `drizzle/migrations/0001_better_auth_schema.sql` (auto-generated)

**Step 1: Generate migration**

Run:
```bash
npm run db:generate
```

Expected: New migration file created in `drizzle/migrations/`

**Step 2: Review generated migration**

Run:
```bash
ls -la drizzle/migrations/
```

Expected: New SQL file with timestamp (e.g., `0001_better_auth_schema.sql`)

**Step 3: Apply migration to database**

Run:
```bash
npm run db:migrate
```

Expected: "Migration successful" message

**Step 4: Verify tables exist**

Run (using psql or database client):
```bash
psql $DATABASE_URL -c "\dt"
```

Expected: Tables listed include `user`, `session`, `organization`, `member`, etc.

**Step 5: Commit migration files**

```bash
git add drizzle/migrations/
git commit -m "db: generate Better Auth schema migration"
```

---

## Phase 3: Better Auth Configuration

### Task 5: Create Better Auth Server Configuration

**Files:**
- Create: `src/lib/auth.ts`

**Step 1: Create auth.ts with base configuration**

Create `src/lib/auth.ts`:
```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),

  emailAndPassword: {
    enabled: false, // Passwordless only
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update every 24 hours
  },

  advanced: {
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    },
  },
});
```

**Step 2: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: No type errors

**Step 3: Commit**

```bash
git add src/lib/auth.ts
git commit -m "feat: create Better Auth server configuration

- Configure Drizzle adapter with PostgreSQL
- Disable password auth (passwordless only)
- Set session expiry to 7 days
- Configure secure cookies"
```

---

### Task 6: Add Email Configuration with Resend

**Files:**
- Modify: `src/lib/auth.ts`

**Step 1: Add email verification config**

Update `src/lib/auth.ts` to add `emailVerification`:
```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),

  emailAndPassword: {
    enabled: false,
  },

  // Email verification with Resend
  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }) => {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: "MyPak Connect <auth@yourdomain.com>", // Update with your domain
        to: user.email,
        subject: "Verify your email",
        html: `
          <h2>Welcome to MyPak Connect</h2>
          <p>Click to verify your email:</p>
          <a href="${url}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Verify Email</a>
          <p>Or enter this code: <strong style="font-size: 18px;">${token}</strong></p>
          <p>This link expires in 15 minutes.</p>
        `,
      });
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },

  advanced: {
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    },
  },
});
```

**Step 2: Test email config compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: No type errors

**Step 3: Commit**

```bash
git add src/lib/auth.ts
git commit -m "feat: add email verification with Resend"
```

---

### Task 7: Add Authentication Plugins (Magic Link, OTP, Organizations, Admin)

**Files:**
- Modify: `src/lib/auth.ts`

**Step 1: Import plugins**

Update imports in `src/lib/auth.ts`:
```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import { organization, admin, magicLink, otp } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { member } from "@/lib/db/schema";
```

**Step 2: Add plugins array to betterAuth config**

Update `src/lib/auth.ts` to add `plugins`:
```typescript
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),

  emailAndPassword: {
    enabled: false,
  },

  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }) => {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: "MyPak Connect <auth@yourdomain.com>",
        to: user.email,
        subject: "Verify your email",
        html: `
          <h2>Welcome to MyPak Connect</h2>
          <p>Click to verify: <a href="${url}">Verify Email</a></p>
          <p>Or enter code: <strong>${token}</strong></p>
          <p>Expires in 15 minutes.</p>
        `,
      });
    },
  },

  plugins: [
    // Magic Link authentication
    magicLink({
      sendMagicLink: async ({ email, url, token }) => {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);

        await resend.emails.send({
          from: "MyPak Connect <auth@yourdomain.com>",
          to: email,
          subject: "Sign in to MyPak Connect",
          html: `
            <h2>Sign in to MyPak Connect</h2>
            <p><a href="${url}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Sign In</a></p>
            <p>Or enter code: <strong style="font-size: 18px;">${token}</strong></p>
            <p>Expires in 15 minutes.</p>
          `,
        });
      },
      expiresIn: 60 * 15, // 15 minutes
    }),

    // Email OTP (6-digit code)
    otp({
      sendOTP: async ({ email, otp }) => {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);

        await resend.emails.send({
          from: "MyPak Connect <auth@yourdomain.com>",
          to: email,
          subject: "Your verification code",
          html: `
            <h2>Your verification code</h2>
            <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center;">
              ${otp}
            </p>
            <p>Expires in 10 minutes.</p>
          `,
        });
      },
      expiresIn: 60 * 10, // 10 minutes
      length: 6,
    }),

    // Multi-tenancy
    organization({
      async sendInvitationEmail(data) {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);

        await resend.emails.send({
          from: "MyPak Connect <invites@yourdomain.com>",
          to: data.email,
          subject: `Join ${data.organization.name} on MyPak Connect`,
          html: `
            <p>${data.inviter.name} invited you to join ${data.organization.name} on MyPak Connect.</p>
            <a href="${data.invitationLink}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Accept Invitation</a>
          `,
        });
      },

      roles: {
        owner: { authorize: () => true },
        admin: {
          authorize: (ctx) =>
            ["owner", "admin"].includes(ctx.session.user.role),
        },
        member: { authorize: () => true },
      },
    }),

    // Admin impersonation
    admin({
      impersonationSessionDuration: 60 * 60, // 1 hour

      async canImpersonate(impersonator) {
        // Only owners can impersonate
        const memberships = await db.query.member.findMany({
          where: eq(member.userId, impersonator.id),
        });

        return memberships.some((m) => m.role === "owner");
      },
    }),
  ],

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },

  advanced: {
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    },
  },
});
```

**Step 3: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: No type errors

**Step 4: Commit**

```bash
git add src/lib/auth.ts
git commit -m "feat: add Better Auth plugins

- Add Magic Link authentication
- Add Email OTP (6-digit code)
- Add organization plugin for multi-tenancy
- Add admin plugin for impersonation
- Configure role-based permissions"
```

---

### Task 8: Create Better Auth Client Configuration

**Files:**
- Create: `src/lib/auth-client.ts`

**Step 1: Create auth-client.ts**

Create `src/lib/auth-client.ts`:
```typescript
import { createAuthClient } from "better-auth/react";
import { organizationClient, adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  plugins: [organizationClient(), adminClient()],
});

// Export hooks for easy use in components
export const {
  useSession,
  signIn,
  signOut,
  useActiveOrganization,
} = authClient;
```

**Step 2: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: No type errors

**Step 3: Commit**

```bash
git add src/lib/auth-client.ts
git commit -m "feat: create Better Auth client configuration

- Add organizationClient and adminClient plugins
- Export useSession, signIn, signOut hooks
- Configure baseURL from environment"
```

---

### Task 9: Create Better Auth API Route

**Files:**
- Create: `src/app/api/auth/[...all]/route.ts`

**Step 1: Create directory structure**

Run:
```bash
mkdir -p src/app/api/auth/\[...all\]
```

**Step 2: Create route handler**

Create `src/app/api/auth/[...all]/route.ts`:
```typescript
import { auth } from "@/lib/auth";

export const { GET, POST } = auth.handler;
```

**Step 3: Verify route works**

Run dev server:
```bash
npm run dev
```

Open browser: `http://localhost:3000/api/auth/session`

Expected: JSON response (likely `{"session": null}` if not logged in)

**Step 4: Stop dev server (Ctrl+C)**

**Step 5: Commit**

```bash
git add src/app/api/auth/
git commit -m "feat: create Better Auth API route handler"
```

---

## Phase 4: Authentication UI

### Task 10: Create Sign-In Page

**Files:**
- Create: `src/app/sign-in/page.tsx`

**Step 1: Create sign-in directory**

Run:
```bash
mkdir -p src/app/sign-in
```

**Step 2: Create sign-in page**

Create `src/app/sign-in/page.tsx`:
```typescript
"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState<"magic-link" | "otp">("magic-link");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleMagicLink() {
    if (!email) {
      setError("Please enter your email");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await authClient.magicLink.sendMagicLink({ email });
      alert("Check your email for the magic link!");
    } catch (err) {
      setError("Failed to send magic link. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOTPRequest() {
    if (!email) {
      setError("Please enter your email");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await authClient.otp.sendOTP({ email });
      setOtpSent(true);
    } catch (err) {
      setError("Failed to send code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOTPVerify() {
    if (!otp || otp.length !== 6) {
      setError("Please enter the 6-digit code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await authClient.otp.verifyOTP({ email, otp });
      if (result.data) {
        router.push("/");
      } else {
        setError("Invalid code. Please try again.");
      }
    } catch (err) {
      setError("Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow-md">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Sign in to MyPak Connect
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            We'll send you a code to sign in
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <Input
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading || otpSent}
            className="w-full"
          />

          <div className="flex gap-2 border-b">
            <button
              onClick={() => setMode("magic-link")}
              className={`flex-1 pb-2 text-sm font-medium ${
                mode === "magic-link"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500"
              }`}
              disabled={loading || otpSent}
            >
              Magic Link
            </button>
            <button
              onClick={() => setMode("otp")}
              className={`flex-1 pb-2 text-sm font-medium ${
                mode === "otp"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500"
              }`}
              disabled={loading || otpSent}
            >
              Email Code
            </button>
          </div>

          {mode === "magic-link" && !otpSent && (
            <Button
              onClick={handleMagicLink}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Sending..." : "Send Magic Link"}
            </Button>
          )}

          {mode === "otp" && !otpSent && (
            <Button onClick={handleOTPRequest} disabled={loading} className="w-full">
              {loading ? "Sending..." : "Send Verification Code"}
            </Button>
          )}

          {mode === "otp" && otpSent && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Enter 6-digit code
                </label>
                <Input
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  maxLength={6}
                  className="text-center text-2xl tracking-widest"
                  autoFocus
                />
              </div>
              <Button
                onClick={handleOTPVerify}
                disabled={loading}
                className="w-full"
              >
                {loading ? "Verifying..." : "Verify Code"}
              </Button>
              <button
                onClick={() => {
                  setOtpSent(false);
                  setOtp("");
                  setError("");
                }}
                className="w-full text-sm text-gray-600 hover:text-gray-900"
              >
                ← Back
              </button>
            </>
          )}
        </div>

        {mode === "magic-link" && (
          <p className="text-xs text-gray-500">
            We'll email you a link to sign in. No password needed!
          </p>
        )}
      </div>
    </div>
  );
}
```

**Step 3: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: No type errors (may have Button/Input component errors - fix in next task)

**Step 4: Commit**

```bash
git add src/app/sign-in/
git commit -m "feat: create sign-in page with Magic Link and OTP

- Add email input and mode switcher
- Implement Magic Link flow
- Implement OTP flow with 6-digit input
- Add loading states and error handling"
```

---

## Phase 5: Helper Functions & Middleware

### Task 11: Create Helper Function to Get Current Org ID

**Files:**
- Create: `src/lib/utils/get-org.ts`

**Step 1: Create utils directory**

Run:
```bash
mkdir -p src/lib/utils
```

**Step 2: Create get-org.ts**

Create `src/lib/utils/get-org.ts`:
```typescript
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Get business org_id from Better Auth session
 * Maps: session.user.activeOrganizationId → better_auth_org_id → org_id
 */
export async function getCurrentOrgId(
  request: Request
): Promise<string | null> {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user?.activeOrganizationId) {
    return null;
  }

  const org = await db.query.organizations.findFirst({
    where: eq(
      organizations.better_auth_org_id,
      session.user.activeOrganizationId
    ),
  });

  return org?.org_id || null;
}

/**
 * Get Better Auth session from request
 * Useful for checking authentication status
 */
export async function getCurrentSession(request: Request) {
  return await auth.api.getSession({
    headers: request.headers,
  });
}
```

**Step 3: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: No type errors

**Step 4: Commit**

```bash
git add src/lib/utils/get-org.ts
git commit -m "feat: add helper to get current org from session"
```

---

### Task 12: Create Helper Function to Check Admin Permissions

**Files:**
- Create: `src/lib/utils/is-admin.ts`

**Step 1: Create is-admin.ts**

Create `src/lib/utils/is-admin.ts`:
```typescript
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { member } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Check if user is platform admin (owner role)
 */
export async function isPlatformAdmin(
  request: Request
): Promise<boolean> {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user?.activeOrganizationId) {
    return false;
  }

  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.userId, session.user.id),
      eq(member.organizationId, session.user.activeOrganizationId)
    ),
  });

  return membership?.role === "owner";
}

/**
 * Check if user has specific role in their active organization
 */
export async function hasRole(
  request: Request,
  role: "owner" | "admin" | "member"
): Promise<boolean> {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user?.activeOrganizationId) {
    return false;
  }

  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.userId, session.user.id),
      eq(member.organizationId, session.user.activeOrganizationId)
    ),
  });

  if (!membership) return false;

  // Owner has all permissions
  if (membership.role === "owner") return true;

  // Admin has admin and member permissions
  if (role === "admin" && membership.role === "admin") return true;

  // Member only has member permissions
  if (role === "member" && membership.role === "member") return true;

  return false;
}
```

**Step 2: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: No type errors

**Step 3: Commit**

```bash
git add src/lib/utils/is-admin.ts
git commit -m "feat: add helper functions for role-based permissions"
```

---

### Task 13: Update Middleware for Better Auth

**Files:**
- Modify: `src/middleware.ts`

**Step 1: Back up existing middleware**

Run:
```bash
cp src/middleware.ts src/middleware.ts.backup
```

**Step 2: Replace middleware with Better Auth version**

Replace content of `src/middleware.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "./lib/auth";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Public routes - allow without authentication
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/sign-in")
  ) {
    return NextResponse.next();
  }

  // Get Better Auth session
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  // Require authentication for all other routes
  if (!session?.user) {
    console.log("No session found, redirecting to /sign-in");
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // Admin routes require owner role
  if (pathname.startsWith("/admin")) {
    // Check if user is owner in their active organization
    // Note: We can't use db queries in Edge middleware, so we'll check in the page/route itself
    // This middleware just ensures user is authenticated
    console.log("Admin route accessed by:", session.user.email);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
```

**Step 3: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: No type errors

**Step 4: Test middleware redirects**

Run:
```bash
npm run dev
```

Visit `http://localhost:3000` (should redirect to `/sign-in`)

**Step 5: Stop dev server (Ctrl+C)**

**Step 6: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: update middleware to use Better Auth

- Check session via Better Auth API
- Redirect unauthenticated users to /sign-in
- Allow public routes (/api/auth, /sign-in, static files)"
```

---

## Phase 6: Admin Impersonation

### Task 14: Create Admin API Route to List Users

**Files:**
- Create: `src/app/api/admin/users/route.ts`

**Step 1: Create admin API directory**

Run:
```bash
mkdir -p src/app/api/admin/users
```

**Step 2: Create users API route**

Create `src/app/api/admin/users/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { isPlatformAdmin } from "@/lib/utils/is-admin";
import { db } from "@/lib/db";
import { user, member, organization } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  // Check if user is platform admin
  const isAdmin = await isPlatformAdmin(request);

  if (!isAdmin) {
    return NextResponse.json(
      { error: "Forbidden: Admin access required" },
      { status: 403 }
    );
  }

  // Get all users with their organization memberships
  const users = await db
    .select({
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      role: member.role,
      organizationId: organization.id,
      organizationName: organization.name,
    })
    .from(user)
    .leftJoin(member, eq(user.id, member.userId))
    .leftJoin(organization, eq(member.organizationId, organization.id));

  return NextResponse.json({ users });
}
```

**Step 3: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: No type errors

**Step 4: Commit**

```bash
git add src/app/api/admin/
git commit -m "feat: create admin API route to list users"
```

---

### Task 15: Create Admin Users Page with Impersonation UI

**Files:**
- Create: `src/app/admin/users/page.tsx`
- Create: `src/app/admin/layout.tsx`

**Step 1: Create admin directory structure**

Run:
```bash
mkdir -p src/app/admin/users
```

**Step 2: Create admin layout (checks owner role)**

Create `src/app/admin/layout.tsx`:
```typescript
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { member } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session?.user) {
    redirect("/sign-in");
  }

  // Check if user is owner
  if (session.user.activeOrganizationId) {
    const membership = await db.query.member.findFirst({
      where: and(
        eq(member.userId, session.user.id),
        eq(member.organizationId, session.user.activeOrganizationId)
      ),
    });

    if (membership?.role !== "owner") {
      redirect("/");
    }
  } else {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8">{children}</div>
    </div>
  );
}
```

**Step 3: Create admin users page**

Create `src/app/admin/users/page.tsx`:
```typescript
"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationName: string;
  emailVerified: boolean;
}

export default function AdminUsersPage() {
  const { data: session } = authClient.useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => {
        setUsers(data.users || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleImpersonate(userId: string) {
    try {
      const result = await authClient.admin.impersonateUser({ userId });
      if (result.data) {
        // Redirect to main dashboard as impersonated user
        window.location.href = "/";
      }
    } catch (err) {
      alert("Failed to impersonate user");
    }
  }

  return (
    <div>
      {/* Impersonation banner */}
      {session?.session?.impersonatedBy && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 p-3 text-center font-bold text-white shadow-lg">
          ⚠️ You are viewing as {session.user.name} ({session.user.email})
          <button
            onClick={async () => {
              await authClient.admin.stopImpersonation();
              window.location.href = "/admin/users";
            }}
            className="ml-4 rounded bg-white px-3 py-1 text-sm text-amber-900 hover:bg-gray-100"
          >
            Stop Impersonation
          </button>
        </div>
      )}

      <div className={session?.session?.impersonatedBy ? "mt-16" : ""}>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          User Management
        </h1>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading users...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Organization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.organizationName || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === "owner"
                              ? "bg-purple-100 text-purple-800"
                              : user.role === "admin"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {user.role || "member"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.emailVerified
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {user.emailVerified ? "Verified" : "Pending"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleImpersonate(user.id)}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          Impersonate
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 4: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: No type errors

**Step 5: Commit**

```bash
git add src/app/admin/
git commit -m "feat: create admin users page with impersonation

- Add admin layout that checks owner role
- List all users with organizations and roles
- Add impersonate button for each user
- Show impersonation banner when active
- Add stop impersonation button"
```

---

## Phase 7: Migrate Existing API Routes

### Task 16: Update Example API Route to Use Better Auth

**Files:**
- Create: `src/app/api/products/route.ts` (example)

**Step 1: Create example products API route**

Run:
```bash
mkdir -p src/app/api/products
```

Create `src/app/api/products/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getCurrentOrgId } from "@/lib/utils/get-org";
import { db } from "@/lib/db";
import { productData } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  // Get org_id from Better Auth session
  const orgId = await getCurrentOrgId(request);

  if (!orgId) {
    return NextResponse.json(
      { error: "Unauthorized: No organization context" },
      { status: 401 }
    );
  }

  // Query org-scoped data
  const products = await db.query.productData.findMany({
    where: eq(productData.org_id, orgId),
  });

  return NextResponse.json({ products });
}
```

**Step 2: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: No type errors

**Step 3: Commit**

```bash
git add src/app/api/products/
git commit -m "feat: add example products API route using Better Auth

- Use getCurrentOrgId to resolve organization
- Enforce org-scoped data queries
- Return 401 if no org context"
```

---

### Task 17: Document Migration Pattern for Remaining Routes

**Files:**
- Create: `docs/guides/better-auth-migration.md`

**Step 1: Create migration guide**

Create `docs/guides/better-auth-migration.md`:
```markdown
# Migrating API Routes to Better Auth

## Pattern

All API routes should follow this pattern:

### Before (Old JWT Auth)
\`\`\`typescript
import { getCurrentUser } from "@/lib/auth/jwt"

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const orgId = user.orgId
  // ... query with orgId
}
\`\`\`

### After (Better Auth)
\`\`\`typescript
import { getCurrentOrgId } from "@/lib/utils/get-org"

export async function GET(request: NextRequest) {
  const orgId = await getCurrentOrgId(request)
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // ... query with orgId
}
\`\`\`

## Steps to Migrate Each Route

1. **Replace import:**
   - Old: `import { getCurrentUser } from "@/lib/auth/jwt"`
   - New: `import { getCurrentOrgId } from "@/lib/utils/get-org"`

2. **Update auth check:**
   - Old: `const user = await getCurrentUser()`
   - New: `const orgId = await getCurrentOrgId(request)`

3. **Update null check:**
   - Old: `if (!user) return ...`
   - New: `if (!orgId) return ...`

4. **Remove user.orgId references:**
   - Old: `const orgId = user.orgId`
   - New: Already have `orgId` from step 2

5. **Test the route:**
   - Start dev server
   - Sign in via Magic Link/OTP
   - Call the API route
   - Verify it returns org-scoped data

## Routes to Migrate

- [ ] `src/app/api/products/route.ts` ✅ (example done)
- [ ] `src/app/api/orders/route.ts`
- [ ] Other API routes that use auth

## Verification

After migrating all routes:
1. Sign in as different users from different orgs
2. Call each API endpoint
3. Verify each user only sees their org's data
4. Verify impersonation works (admin can see user's data)
```

**Step 2: Commit**

```bash
git add docs/guides/better-auth-migration.md
git commit -m "docs: add Better Auth migration guide for API routes"
```

---

## Phase 8: Testing & Verification

### Task 18: Manual Testing Checklist

**Files:**
- Create: `docs/testing/better-auth-manual-tests.md`

**Step 1: Create manual testing checklist**

Create `docs/testing/better-auth-manual-tests.md`:
```markdown
# Better Auth Manual Testing Checklist

## Authentication Flow

### Magic Link
- [ ] Enter email on sign-in page
- [ ] Click "Send Magic Link"
- [ ] Check email inbox
- [ ] Click magic link in email
- [ ] Verify redirected to dashboard
- [ ] Verify session cookie set
- [ ] Close browser and reopen (session persists)

### Email OTP
- [ ] Enter email on sign-in page
- [ ] Switch to "Email Code" tab
- [ ] Click "Send Code"
- [ ] Check email inbox
- [ ] Copy 6-digit code
- [ ] Enter code on sign-in page
- [ ] Verify redirected to dashboard

### Session Management
- [ ] Sign in successfully
- [ ] Refresh page (session persists)
- [ ] Wait 8 days (session expires)
- [ ] Verify redirected to sign-in

## Multi-Tenancy

### Organization Context
- [ ] Sign in as user with org
- [ ] Check active organization displayed
- [ ] Call API route (returns org-scoped data)
- [ ] Sign in as user from different org
- [ ] Call same API route (returns different data)

## Admin Impersonation

### Impersonation Flow
- [ ] Sign in as owner/admin
- [ ] Navigate to `/admin/users`
- [ ] Click "Impersonate" on a user
- [ ] Verify amber banner shows
- [ ] Verify viewing as that user
- [ ] Call API route (returns impersonated user's org data)
- [ ] Click "Stop Impersonation"
- [ ] Verify returned to admin account

### Impersonation Security
- [ ] Sign in as non-owner user
- [ ] Try to access `/admin/users` (redirected to /)
- [ ] Verify cannot impersonate

### Audit Trail
- [ ] Impersonate a user
- [ ] Check database `session` table
- [ ] Verify `impersonatedBy` field set to admin's user ID
- [ ] Stop impersonation
- [ ] Verify `impersonatedBy` cleared

## Error Handling

### Invalid Email
- [ ] Enter invalid email format
- [ ] Click "Send Magic Link"
- [ ] Verify error message shown

### Expired Code
- [ ] Request OTP code
- [ ] Wait 11 minutes (code expires after 10)
- [ ] Try to verify code
- [ ] Verify error message

### Network Errors
- [ ] Disconnect internet
- [ ] Try to sign in
- [ ] Verify graceful error message

## Security

### Cookie Security
- [ ] Sign in
- [ ] Open browser DevTools → Application → Cookies
- [ ] Verify `auth_token` cookie has:
  - `HttpOnly: true`
  - `Secure: true` (production only)
  - `SameSite: Lax`

### Session Isolation
- [ ] Sign in as User A in Chrome
- [ ] Sign in as User B in Firefox
- [ ] Verify each sees only their org data
- [ ] Verify no data leakage between sessions

## Email Delivery

### Resend Integration
- [ ] Check Resend dashboard after sending emails
- [ ] Verify emails delivered (not bounced)
- [ ] Verify email styling renders correctly
- [ ] Test with different email providers (Gmail, Outlook, etc.)

## Performance

### Auth Latency
- [ ] Sign in via Magic Link
- [ ] Measure time from click → redirect (should be < 2 seconds)
- [ ] Call authenticated API route
- [ ] Measure response time (should be < 200ms)

## Pass Criteria

All checkboxes must be checked before deploying to production.
```

**Step 2: Commit**

```bash
git add docs/testing/
git commit -m "docs: add manual testing checklist for Better Auth"
```

---

### Task 19: Run Manual Tests

**Files:**
- None (manual testing)

**Step 1: Start development server**

Run:
```bash
npm run dev
```

**Step 2: Go through manual testing checklist**

Open `docs/testing/better-auth-manual-tests.md` and test each item.

**Step 3: Document any issues**

Create issues for any failing tests:
```bash
# Example if Magic Link fails:
git checkout -b fix/magic-link-email
# Fix the issue
# Commit fix
# Re-test
```

**Step 4: Once all tests pass, proceed to deployment**

---

## Phase 9: Railway Deployment

### Task 20: Set Up Railway Project

**Files:**
- None (Railway console)

**Step 1: Create Railway account**

Go to https://railway.app and sign up

**Step 2: Create new project**

- Click "New Project"
- Select "Deploy from GitHub repo"
- Choose `mypak-kavop` repository
- Railway auto-detects Next.js

**Step 3: Add PostgreSQL database**

- Click "+ New"
- Select "Database" → "PostgreSQL"
- Railway creates DB and injects `DATABASE_URL`

**Step 4: Configure environment variables**

In Railway project settings, add:
```
BETTER_AUTH_SECRET=<paste-from-.env.local>
RESEND_API_KEY=<your-resend-key>
NEXT_PUBLIC_APP_URL=https://<your-app>.railway.app
MYPAK_ERP_API_URL=<your-erp-url>
```

**Step 5: Deploy**

Railway automatically deploys on git push to main

**Step 6: Verify deployment**

- Check Railway logs for build success
- Visit `https://<your-app>.railway.app`
- Verify SSL works (HTTPS, green padlock)

**Step 7: Test production authentication**

- Sign in via Magic Link
- Check Resend dashboard (email sent from Railway)
- Verify authentication works

---

### Task 21: Configure Custom Domain (Optional)

**Files:**
- None (Railway console)

**Step 1: Add custom domain in Railway**

- Go to project settings
- Click "Custom Domain"
- Enter your domain (e.g., `connect.mypak.com`)

**Step 2: Add DNS records**

Add CNAME record to your DNS:
```
Type: CNAME
Name: connect
Value: <railway-app>.railway.app
```

**Step 3: Wait for SSL provisioning**

Railway auto-provisions Let's Encrypt SSL (5-10 minutes)

**Step 4: Update environment variable**

Update `NEXT_PUBLIC_APP_URL` to your custom domain:
```
NEXT_PUBLIC_APP_URL=https://connect.mypak.com
```

**Step 5: Redeploy**

Railway auto-redeploys on env var change

**Step 6: Verify custom domain works**

Visit `https://connect.mypak.com`

---

### Task 22: Set Up Database Backups

**Files:**
- None (Railway console)

**Step 1: Enable automatic backups**

- Go to PostgreSQL database in Railway
- Click "Settings"
- Enable "Automatic Backups"
- Set retention to 7 days

**Step 2: Test manual backup**

- Click "Create Backup"
- Verify backup created successfully

**Step 3: Document restore procedure**

Add to `docs/deployment/railway-backup.md`:
```markdown
# Railway Database Backup & Restore

## Automatic Backups
Railway automatically backs up the database daily at 3 AM UTC.

## Manual Backup
1. Go to Railway project
2. Click PostgreSQL database
3. Click "Create Backup"

## Restore from Backup
1. Go to Railway project
2. Click PostgreSQL database
3. Click "Backups"
4. Select backup to restore
5. Click "Restore"
6. Confirm restoration (⚠️ This will overwrite current data)

## Backup Schedule
- Daily at 3 AM UTC
- Retention: 7 days
- Manual backups retained for 30 days
```

**Step 4: Commit documentation**

```bash
git add docs/deployment/
git commit -m "docs: add Railway backup and restore guide"
```

---

## Phase 10: Cleanup & Documentation

### Task 23: Remove Old Auth Files

**Files:**
- Delete: `src/lib/auth/jwt.ts`
- Delete: `src/lib/auth/password.ts`
- Delete: `src/app/api/auth/sign-in/route.ts` (old)
- Delete: `src/app/api/auth/sign-out/route.ts` (old)
- Delete: `src/app/api/auth/me/route.ts` (old)
- Delete: `src/middleware.ts.backup`

**Step 1: Delete old auth files**

Run:
```bash
rm -rf src/lib/auth/jwt.ts
rm -rf src/lib/auth/password.ts
rm -rf src/app/api/auth/sign-in/
rm -rf src/app/api/auth/sign-out/
rm -rf src/app/api/auth/me/
rm -rf src/middleware.ts.backup
```

**Step 2: Remove old dependencies (if any)**

Check `package.json` for unused deps:
- Old JWT libraries (if not used elsewhere)
- Old password hashing libraries

**Step 3: Commit cleanup**

```bash
git add -A
git commit -m "chore: remove old JWT auth implementation

- Delete old auth helper files
- Delete old auth API routes
- Clean up backup files"
```

---

### Task 24: Update Project Documentation

**Files:**
- Modify: `README.md`
- Modify: `docs/guides/walkthrough.md`

**Step 1: Update README.md**

Update authentication section in `README.md`:
```markdown
## Authentication

MyPak Connect uses [Better Auth](https://better-auth.com) for passwordless authentication.

**Features:**
- Magic Link sign-in (email link)
- Email OTP sign-in (6-digit code)
- Multi-tenancy with organizations
- Admin impersonation
- Session management (7-day expiry)

**Environment Variables:**
\`\`\`bash
BETTER_AUTH_SECRET=<random-32-char-string>
RESEND_API_KEY=re_<your-key>
NEXT_PUBLIC_APP_URL=https://your-domain.com
\`\`\`

**Testing Authentication:**
\`\`\`bash
# Start dev server
npm run dev

# Go to http://localhost:3000
# You'll be redirected to /sign-in
# Enter your email and receive a magic link or OTP code
\`\`\`

**Admin Access:**
- Sign in as a user with `owner` role
- Navigate to `/admin/users`
- Impersonate any user to debug issues
```

**Step 2: Update walkthrough guide**

Update `docs/guides/walkthrough.md` to replace JWT auth sections with Better Auth.

**Step 3: Commit documentation updates**

```bash
git add README.md docs/guides/
git commit -m "docs: update authentication documentation for Better Auth"
```

---

### Task 25: Create Deployment Checklist

**Files:**
- Create: `docs/deployment/production-checklist.md`

**Step 1: Create production deployment checklist**

Create `docs/deployment/production-checklist.md`:
```markdown
# Production Deployment Checklist

## Pre-Deployment

### Environment Variables
- [ ] `BETTER_AUTH_SECRET` is randomly generated (32+ characters)
- [ ] `RESEND_API_KEY` is from production Resend account
- [ ] `NEXT_PUBLIC_APP_URL` points to production domain
- [ ] `DATABASE_URL` points to production PostgreSQL
- [ ] All other env vars set correctly

### Database
- [ ] Better Auth tables created (run migrations)
- [ ] At least one owner user exists
- [ ] Test data cleared (if using staging DB)
- [ ] Backups enabled (daily, 7-day retention)

### Security
- [ ] HTTPS enabled (Railway auto-provisions)
- [ ] Cookies set with `secure: true`
- [ ] `sameSite: lax` configured
- [ ] No secrets in client-side code
- [ ] Rate limiting enabled (Better Auth default)

### Email
- [ ] Resend domain verified
- [ ] "From" email addresses set correctly
- [ ] Email templates tested and render correctly
- [ ] Spam score checked (use mail-tester.com)

### Testing
- [ ] All manual tests passed (see `docs/testing/better-auth-manual-tests.md`)
- [ ] Magic Link works in production
- [ ] Email OTP works in production
- [ ] Admin impersonation tested
- [ ] Session persistence verified

## Deployment

### Railway
- [ ] Project deployed successfully
- [ ] Build logs show no errors
- [ ] App logs show no errors
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active

### Verification
- [ ] Visit production URL
- [ ] Sign in successfully
- [ ] Check Resend dashboard (email delivered)
- [ ] Test API routes return org-scoped data
- [ ] Test admin impersonation

## Post-Deployment

### Monitoring
- [ ] Set up Railway alerts (CPU, memory)
- [ ] Monitor Resend email delivery rate
- [ ] Check database query performance
- [ ] Monitor error logs

### Documentation
- [ ] Update team with new auth system
- [ ] Share admin credentials securely
- [ ] Document any production-specific config

## Rollback Plan

If issues occur:
1. Revert deployment: Railway → Deployments → Select previous version → Redeploy
2. Database: Railway → PostgreSQL → Backups → Restore
3. Notify team of rollback

## Success Criteria

- [ ] Users can sign in via Magic Link/OTP
- [ ] Admin can impersonate users
- [ ] No authentication errors in logs
- [ ] Email delivery rate > 95%
- [ ] Response time < 200ms for API routes
```

**Step 2: Commit checklist**

```bash
git add docs/deployment/
git commit -m "docs: add production deployment checklist"
```

---

### Task 26: Final Commit and Tag

**Files:**
- All files

**Step 1: Review all changes**

Run:
```bash
git log --oneline --since="1 week ago"
```

Expected: See all commits from Better Auth implementation

**Step 2: Run final build test**

Run:
```bash
npm run build
```

Expected: Build succeeds with no errors

**Step 3: Create final commit**

```bash
git add -A
git commit -m "feat: complete Better Auth implementation

- Replace JWT auth with Better Auth
- Add Magic Link and Email OTP authentication
- Implement multi-tenancy with organizations
- Add admin impersonation with audit trail
- Update all API routes for Better Auth
- Configure Railway deployment
- Add comprehensive documentation

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Step 4: Tag release**

```bash
git tag -a v1.0.0-better-auth -m "Better Auth implementation complete"
```

**Step 5: Push to repository**

```bash
git push origin main --tags
```

---

## Completion

**Estimated Time:** 5-7 days
**Actual Time:** ___ days

### Summary

✅ **Completed:**
- Better Auth installed and configured
- Database schema updated
- Magic Link and Email OTP working
- Admin impersonation implemented
- All API routes migrated
- Railway deployment successful
- Documentation complete

### Next Steps

1. **User Onboarding:**
   - Invite first users via email
   - Guide through sign-in flow
   - Collect feedback

2. **Monitoring:**
   - Watch Railway metrics (CPU, memory)
   - Monitor Resend delivery rate
   - Review error logs daily

3. **Future Enhancements:**
   - [ ] SAML SSO for enterprise customers
   - [ ] Two-factor authentication (TOTP)
   - [ ] Session device management
   - [ ] Audit log dashboard

---

**Plan Status:** Complete
**Implementation:** Use superpowers:executing-plans or superpowers:subagent-driven-development
