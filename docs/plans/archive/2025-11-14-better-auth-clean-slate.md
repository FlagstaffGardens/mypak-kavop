# Better Auth Implementation Plan (Clean Slate)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement Better Auth with Magic Link, Email OTP, multi-tenancy, and admin impersonation from scratch on clean dev/staging environment.

**Architecture:** Better Auth handles all authentication with Drizzle adapter. Magic Link and OTP for passwordless login. Organizations managed via Better Auth's organization plugin. Business organizations table links to Better Auth via `better_auth_org_id`. Light Edge middleware for route protection, heavy auth in route handlers.

**Tech Stack:** Next.js 15, Better Auth, Drizzle ORM, PostgreSQL, Resend (email), Railway (hosting)

**Context:** This is a CLEAN SLATE implementation. No migration from existing JWT system needed. We can start fresh.

---

## Phase 1: Dependencies & Configuration

### Task 1: Install Better Auth and Dependencies

**Files:**
- Modify: `package.json`
- Create: `.env.example`
- Modify: `.env.local`

**Step 1: Install packages**

Run:
```bash
npm install better-auth resend
```

Expected: Packages installed successfully

**Step 2: Generate Better Auth secret**

Run:
```bash
openssl rand -base64 32
```

Expected: Random 32-character string (save this)

**Step 3: Create .env.example template**

Create `.env.example`:
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mypak

# Better Auth
BETTER_AUTH_SECRET=<generate with: openssl rand -base64 32>
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Resend Email
RESEND_API_KEY=re_...

# ERP API
MYPAK_ERP_API_URL=https://api.mypak.com
```

**Step 4: Add secrets to .env.local**

Add to `.env.local`:
```bash
BETTER_AUTH_SECRET=<paste-generated-secret>
RESEND_API_KEY=<user-will-provide>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Step 5: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors (yet, some imports won't exist)

**Step 6: Commit**

```bash
git add package.json package-lock.json .env.example
git commit -m "chore: install Better Auth and Resend dependencies"
```

---

## Phase 2: Database Schema

### Task 2: Add Better Auth Schema to Drizzle

**Files:**
- Modify: `src/lib/db/schema.ts`

**Step 1: Add Better Auth core tables**

Add to TOP of `src/lib/db/schema.ts` (before existing tables):

```typescript
import { pgTable, text, timestamp, uuid, integer, index, primaryKey, decimal, jsonb, date, boolean } from "drizzle-orm/pg-core";

// ========================================
// Better Auth Tables
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
  impersonatedBy: text("impersonatedBy"), // Admin user ID
  createdAt: timestamp("createdAt").notNull().defaultNow(),
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

// ========================================
// Business Tables
// ========================================
```

**Step 2: Update organizations table**

Modify existing `organizations` table to add link:

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

**Step 3: Generate migration**

Run:
```bash
npm run db:generate
```

Expected: New migration file created in `drizzle/migrations/`

**Step 4: Apply migration**

Run:
```bash
npm run db:migrate
```

Expected: "Migration successful"

**Step 5: Verify tables**

Run:
```bash
psql $DATABASE_URL -c "\dt"
```

Expected: See `user`, `session`, `organization`, `member`, etc.

**Step 6: Commit**

```bash
git add src/lib/db/schema.ts drizzle/
git commit -m "feat: add Better Auth database schema

- Add Better Auth tables (user, session, account, verification)
- Add organization tables (organization, member, invitation)
- Link business orgs to Better Auth via better_auth_org_id"
```

---

## Phase 3: Better Auth Configuration

### Task 3: Create Better Auth Server Config

**Files:**
- Create: `src/lib/auth.ts`

**Step 1: Create base Better Auth config**

Create `src/lib/auth.ts`:

```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import {
  organization as organizationPlugin,
  admin as adminPlugin
} from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { member } from "@/lib/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),

  // Disable password auth - passwordless only
  emailAndPassword: {
    enabled: false,
  },

  // Email config with Resend (we'll add plugins next)
  plugins: [],

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

Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/auth.ts
git commit -m "feat: create Better Auth base configuration"
```

---

### Task 4: Add Better Auth Plugins (Magic Link, OTP, Organizations, Admin)

**Files:**
- Modify: `src/lib/auth.ts`

**Step 1: Import Resend in plugins**

Update `src/lib/auth.ts` to add plugins array with all features:

```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import {
  organization as organizationPlugin,
  admin as adminPlugin,
  magicLink as magicLinkPlugin,
  otp as otpPlugin
} from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { member } from "@/lib/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),

  emailAndPassword: {
    enabled: false,
  },

  plugins: [
    // Magic Link authentication
    magicLinkPlugin({
      sendMagicLink: async ({ email, url, token }) => {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);

        await resend.emails.send({
          from: "MyPak Connect <noreply@mypak.com>",
          to: email,
          subject: "Sign in to MyPak Connect",
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1a1a1a;">Sign in to MyPak Connect</h2>
              <p style="color: #666; line-height: 1.5;">Click the button below to sign in:</p>
              <a href="${url}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Sign In</a>
              <p style="color: #999; font-size: 14px;">Or copy this link: ${url}</p>
              <p style="color: #999; font-size: 14px;">This link expires in 15 minutes.</p>
            </div>
          `,
        });
      },
      expiresIn: 60 * 15, // 15 minutes
    }),

    // Email OTP (6-digit code)
    otpPlugin({
      sendOTP: async ({ email, otp }) => {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);

        await resend.emails.send({
          from: "MyPak Connect <noreply@mypak.com>",
          to: email,
          subject: "Your MyPak Connect verification code",
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; text-align: center;">
              <h2 style="color: #1a1a1a;">Your verification code</h2>
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #3b82f6; margin: 0;">
                  ${otp}
                </p>
              </div>
              <p style="color: #999; font-size: 14px;">This code expires in 10 minutes.</p>
            </div>
          `,
        });
      },
      expiresIn: 60 * 10, // 10 minutes
      length: 6,
    }),

    // Multi-tenancy with organizations
    organizationPlugin({
      async sendInvitationEmail(data) {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);

        await resend.emails.send({
          from: "MyPak Connect <noreply@mypak.com>",
          to: data.email,
          subject: `Join ${data.organization.name} on MyPak Connect`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1a1a1a;">You've been invited!</h2>
              <p style="color: #666; line-height: 1.5;">
                ${data.inviter.name} invited you to join <strong>${data.organization.name}</strong> on MyPak Connect.
              </p>
              <a href="${data.invitationLink}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
                Accept Invitation
              </a>
            </div>
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
    adminPlugin({
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

**Step 2: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/auth.ts
git commit -m "feat: add Better Auth plugins

- Magic Link authentication
- Email OTP (6-digit code)
- Organization plugin for multi-tenancy
- Admin plugin for impersonation"
```

---

### Task 5: Create Better Auth Client Config

**Files:**
- Create: `src/lib/auth-client.ts`

**Step 1: Create client configuration**

Create `src/lib/auth-client.ts`:

```typescript
"use client";

import { createAuthClient } from "better-auth/react";
import { organizationClient, adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : "",
  plugins: [organizationClient(), adminClient()],
});

// Export hooks for easy use
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

Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/auth-client.ts
git commit -m "feat: create Better Auth client configuration"
```

---

### Task 6: Create Better Auth API Route Handler

**Files:**
- Create: `src/app/api/auth/[...all]/route.ts`

**Step 1: Create API route directory**

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

**Step 3: Start dev server and test**

Run:
```bash
npm run dev
```

Open: `http://localhost:3000/api/auth/session`

Expected: `{"session":null,"user":null}` (JSON response)

**Step 4: Stop dev server (Ctrl+C)**

**Step 5: Commit**

```bash
git add src/app/api/auth/
git commit -m "feat: create Better Auth API route handler"
```

---

## Phase 4: Seed Scripts & Bootstrap

### Task 7: Create Seed Script for Initial Admin + Test Org

**Files:**
- Create: `scripts/seed-better-auth.ts`

**Step 1: Create seed script**

Create `scripts/seed-better-auth.ts`:

```typescript
import "dotenv/config";
import { db } from "../src/lib/db/index";
import { user, organization, member, organizations } from "../src/lib/db/schema";

async function main() {
  console.log("🌱 Seeding Better Auth data...");

  // Create Better Auth organization
  const [betterAuthOrg] = await db
    .insert(organization)
    .values({
      id: `org_${crypto.randomUUID()}`,
      name: "MyPak Platform",
      slug: "mypak-platform",
      createdAt: new Date(),
    })
    .onConflictDoNothing()
    .returning();

  if (!betterAuthOrg) {
    console.log("✓ Organization already exists");
    const [existing] = await db
      .select()
      .from(organization)
      .where(eq(organization.slug, "mypak-platform"))
      .limit(1);
    if (!existing) throw new Error("Failed to find organization");
    betterAuthOrg = existing;
  } else {
    console.log(`✓ Created organization: ${betterAuthOrg.name}`);
  }

  // Create business organization linked to Better Auth org
  const [businessOrg] = await db
    .insert(organizations)
    .values({
      org_name: "MyPak Platform",
      mypak_customer_name: "mypak_platform",
      kavop_token: "dev-token-123",
      better_auth_org_id: betterAuthOrg.id,
    })
    .onConflictDoNothing()
    .returning();

  if (businessOrg) {
    console.log(`✓ Created business organization`);
  } else {
    console.log("✓ Business organization already exists");
  }

  // Create admin user
  const adminEmail = process.env.ADMIN_EMAIL || "admin@mypak.com";
  const [adminUser] = await db
    .insert(user)
    .values({
      id: `usr_${crypto.randomUUID()}`,
      email: adminEmail,
      name: "Platform Admin",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoNothing()
    .returning();

  if (!adminUser) {
    console.log(`✓ Admin user already exists: ${adminEmail}`);
  } else {
    console.log(`✓ Created admin user: ${adminEmail}`);

    // Create owner membership
    await db.insert(member).values({
      id: `mem_${crypto.randomUUID()}`,
      userId: adminUser.id,
      organizationId: betterAuthOrg.id,
      role: "owner",
      createdAt: new Date(),
    });
    console.log(`✓ Created owner membership for ${adminEmail}`);
  }

  console.log("\n✨ Seeding complete!");
  console.log(`\nYou can now sign in with: ${adminEmail}`);
  console.log("Use Magic Link or OTP to authenticate.\n");
}

main()
  .catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
```

**Step 2: Add seed script to package.json**

Add to `scripts` in `package.json`:

```json
{
  "scripts": {
    "db:seed": "tsx scripts/seed-better-auth.ts"
  }
}
```

**Step 3: Install tsx if needed**

Run:
```bash
npm install -D tsx
```

**Step 4: Run seed script**

Run:
```bash
npm run db:seed
```

Expected: Output showing admin user created

**Step 5: Verify in database**

Run:
```bash
psql $DATABASE_URL -c "SELECT email, name FROM \"user\";"
```

Expected: See admin user

**Step 6: Commit**

```bash
git add scripts/seed-better-auth.ts package.json
git commit -m "feat: create seed script for initial admin and test org"
```

---

## Phase 5: Authentication UI

### Task 8: Create Sign-In Page

**Files:**
- Create: `src/app/(auth)/sign-in/page.tsx`
- Create: `src/app/(auth)/layout.tsx`

**Step 1: Create auth route group**

Run:
```bash
mkdir -p src/app/\(auth\)/sign-in
```

**Step 2: Create auth layout (unauthenticated only)**

Create `src/app/(auth)/layout.tsx`:

```typescript
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      {children}
    </div>
  );
}
```

**Step 3: Create sign-in page**

Create `src/app/(auth)/sign-in/page.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState<"magic-link" | "otp">("magic-link");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  async function handleMagicLink() {
    if (!email) {
      setError("Please enter your email");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/auth/magic-link/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) throw new Error("Failed to send magic link");

      setSuccess("Check your email! We sent you a magic link.");
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
    setSuccess("");

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) throw new Error("Failed to send code");

      setOtpSent(true);
      setSuccess("Check your email! We sent you a 6-digit code.");
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
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      if (!res.ok) throw new Error("Invalid code");

      router.push("/");
    } catch (err) {
      setError("Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow-lg">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Sign in to MyPak Connect
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          {mode === "magic-link"
            ? "We'll send you a link to sign in"
            : "We'll send you a code to sign in"}
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-600">
          {success}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email address
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading || otpSent}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex border-b border-gray-200">
          <button
            onClick={() => {
              setMode("magic-link");
              setOtpSent(false);
              setOtp("");
              setError("");
              setSuccess("");
            }}
            disabled={loading || otpSent}
            className={`flex-1 pb-2 text-sm font-medium ${
              mode === "magic-link"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Magic Link
          </button>
          <button
            onClick={() => {
              setMode("otp");
              setOtpSent(false);
              setOtp("");
              setError("");
              setSuccess("");
            }}
            disabled={loading || otpSent}
            className={`flex-1 pb-2 text-sm font-medium ${
              mode === "otp"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Email Code
          </button>
        </div>

        {mode === "magic-link" && !otpSent && (
          <button
            onClick={handleMagicLink}
            disabled={loading}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Sending..." : "Send Magic Link"}
          </button>
        )}

        {mode === "otp" && !otpSent && (
          <button
            onClick={handleOTPRequest}
            disabled={loading}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Sending..." : "Send Code"}
          </button>
        )}

        {mode === "otp" && otpSent && (
          <>
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                Enter 6-digit code
              </label>
              <input
                id="otp"
                type="text"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                maxLength={6}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-center text-2xl tracking-widest focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
            </div>
            <button
              onClick={handleOTPVerify}
              disabled={loading}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? "Verifying..." : "Verify Code"}
            </button>
            <button
              onClick={() => {
                setOtpSent(false);
                setOtp("");
                setError("");
                setSuccess("");
              }}
              className="w-full text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}
```

**Step 4: Test sign-in page**

Run:
```bash
npm run dev
```

Visit: `http://localhost:3000/sign-in`

Expected: See sign-in form

**Step 5: Stop dev server (Ctrl+C)**

**Step 6: Commit**

```bash
git add src/app/\(auth\)/
git commit -m "feat: create sign-in page with Magic Link and OTP"
```

---

## Phase 6: Helper Functions & Middleware

### Task 9: Create Helper Functions for Org Resolution

**Files:**
- Create: `src/lib/utils/get-org.ts`

**Step 1: Create utils directory**

Run:
```bash
mkdir -p src/lib/utils
```

**Step 2: Create helper functions**

Create `src/lib/utils/get-org.ts`:

```typescript
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

/**
 * Get business org_id from Better Auth session
 * Maps: session.user.activeOrganizationId → better_auth_org_id → org_id
 */
export async function getCurrentOrgId(): Promise<string | null> {
  const headersList = await headers();

  const session = await auth.api.getSession({
    headers: headersList,
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
 * Get Better Auth session
 */
export async function getCurrentSession() {
  const headersList = await headers();

  return await auth.api.getSession({
    headers: headersList,
  });
}
```

**Step 3: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors

**Step 4: Commit**

```bash
git add src/lib/utils/
git commit -m "feat: add helper functions for org resolution"
```

---

### Task 10: Update Middleware for Better Auth

**Files:**
- Modify: `src/middleware.ts`

**Step 1: Replace middleware with light Edge-compatible version**

Replace content of `src/middleware.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Public routes
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/sign-in")
  ) {
    return NextResponse.next();
  }

  // Check for Better Auth session cookie
  const sessionCookie = request.cookies.get("better-auth.session_token");

  if (!sessionCookie) {
    console.log("No session cookie found, redirecting to /sign-in");
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // Let route handlers do heavy auth checks
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
```

**Step 2: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: update middleware for Better Auth

- Light Edge-compatible middleware
- Only checks for session cookie existence
- Heavy auth in route handlers"
```

---

## Phase 7: Admin Impersonation

### Task 11: Create Admin Impersonation API Endpoint

**Files:**
- Create: `src/app/api/admin/impersonate/route.ts`

**Step 1: Create admin API directory**

Run:
```bash
mkdir -p src/app/api/admin/impersonate
```

**Step 2: Create impersonation endpoint**

Create `src/app/api/admin/impersonate/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user, member } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();

    // Get current user
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is owner
    const memberships = await db.query.member.findMany({
      where: eq(member.userId, session.user.id),
    });

    const isOwner = memberships.some((m) => m.role === "owner");
    if (!isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get target user
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const [targetUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Use Better Auth's admin.impersonateUser
    // This is handled client-side, but we validate here
    return NextResponse.json({
      success: true,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
      }
    });
  } catch (error) {
    console.error("Impersonate error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**Step 3: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors

**Step 4: Commit**

```bash
git add src/app/api/admin/
git commit -m "feat: create admin impersonation API endpoint"
```

---

### Task 12: Create Admin Users Page with Impersonation UI

**Files:**
- Create: `src/app/admin/users/page.tsx`
- Create: `src/app/admin/layout.tsx`

**Step 1: Create admin directory**

Run:
```bash
mkdir -p src/app/admin/users
```

**Step 2: Create admin layout**

Create `src/app/admin/layout.tsx`:

```typescript
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { member } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
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
    const memberships = await db.query.member.findMany({
      where: eq(member.userId, session.user.id),
    });

    const isOwner = memberships.some((m) => m.role === "owner");
    if (!isOwner) {
      redirect("/");
    }
  } else {
    redirect("/");
  }

  return <div className="min-h-screen bg-gray-50">{children}</div>;
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
  emailVerified: boolean;
}

export default function AdminUsersPage() {
  const { data: session } = authClient.useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch users (you'll need to create this API route)
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
      // Validate on server first
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) throw new Error("Failed to impersonate");

      // Use Better Auth client to impersonate
      await authClient.admin.impersonateUser({ userId });

      // Redirect to dashboard
      window.location.href = "/";
    } catch (err) {
      alert("Failed to impersonate user");
    }
  }

  async function handleStopImpersonation() {
    await authClient.admin.stopImpersonation();
    window.location.href = "/admin/users";
  }

  return (
    <div className="mx-auto max-w-7xl p-8">
      {/* Impersonation banner */}
      {session?.session?.impersonatedBy && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 p-3 text-center font-bold text-white shadow-lg">
          ⚠️ You are viewing as {session.user.name} ({session.user.email})
          <button
            onClick={handleStopImpersonation}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {user.name}
                      </td>
                      <td className="px-6 py-4">
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
                      <td className="px-6 py-4 text-sm">
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

**Step 4: Create API route to list users**

Create `src/app/api/admin/users/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user, member } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();

    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is owner
    const memberships = await db.query.member.findMany({
      where: eq(member.userId, session.user.id),
    });

    const isOwner = memberships.some((m) => m.role === "owner");
    if (!isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all users
    const users = await db.select().from(user);

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**Step 5: Commit**

```bash
git add src/app/admin/
git commit -m "feat: create admin users page with impersonation UI"
```

---

## Phase 8: Testing & Verification

### Task 13: Manual Testing

**Files:**
- None (manual testing)

**Step 1: Start dev server**

Run:
```bash
npm run dev
```

**Step 2: Test sign-in flow**

1. Visit `http://localhost:3000`
2. Should redirect to `/sign-in`
3. Enter email from seed script (e.g., `admin@mypak.com`)
4. Try Magic Link:
   - Click "Send Magic Link"
   - Check terminal/Resend logs for email
   - (In dev, check Resend dashboard)
5. Try OTP:
   - Switch to "Email Code" tab
   - Click "Send Code"
   - Check email for 6-digit code
   - Enter code and verify

**Step 3: Test admin access**

1. After signing in, visit `/admin/users`
2. Should see user list
3. Try impersonating another user (if available)
4. Verify banner shows "You are viewing as..."
5. Click "Stop Impersonation"

**Step 4: Test middleware protection**

1. Sign out
2. Try to visit `/` - should redirect to `/sign-in`
3. Try to visit `/admin` - should redirect to `/sign-in`

**Step 5: Stop dev server (Ctrl+C)**

**Step 6: Document any issues**

Note: If any tests fail, create GitHub issues before proceeding to deployment.

---

## Phase 9: Railway Deployment

### Task 14: Deploy to Railway

**Files:**
- None (Railway console)

**Step 1: Push code to GitHub**

Run:
```bash
git push origin feat/better-auth-implementation
```

**Step 2: Set up Railway project**

1. Go to railway.app
2. Create new project
3. Connect GitHub repo
4. Select branch: `feat/better-auth-implementation`

**Step 3: Add PostgreSQL**

1. Click "+ New"
2. Select "Database → PostgreSQL"
3. Railway auto-injects `DATABASE_URL`

**Step 4: Configure environment variables**

Add in Railway project settings:

```
BETTER_AUTH_SECRET=<paste-from-.env.local>
RESEND_API_KEY=<user-provides>
NEXT_PUBLIC_APP_URL=https://<your-app>.railway.app
MYPAK_ERP_API_URL=<user-provides>
```

**Step 5: Deploy**

Railway automatically deploys. Wait for build to complete.

**Step 6: Run migrations on Railway**

Run from Railway console:
```bash
npm run db:migrate
```

**Step 7: Seed production data**

Run from Railway console:
```bash
ADMIN_EMAIL=<your-email> npm run db:seed
```

**Step 8: Verify deployment**

1. Visit Railway app URL
2. Test sign-in with Magic Link or OTP
3. Verify email delivery via Resend dashboard
4. Test admin impersonation

**Step 9: Configure custom domain (optional)**

1. In Railway, add custom domain
2. Update DNS CNAME record
3. Update `NEXT_PUBLIC_APP_URL` to custom domain

---

## Completion

**Summary:**
- ✅ Better Auth installed and configured
- ✅ Magic Link and Email OTP working
- ✅ Admin impersonation implemented
- ✅ Multi-tenancy with organizations
- ✅ Deployed to Railway

**Next Steps:**
1. Test thoroughly in staging
2. Create additional test users via seed script
3. Monitor Resend email delivery
4. Set up Railway backup schedule
5. Document for team

---

**Plan complete!**

Use `superpowers:executing-plans` or `superpowers:subagent-driven-development` to execute this plan task-by-task.
