# Customer & User Management Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build MyPak customer (organization) and user management with Kavop API integration, auto-generated passwords, and wizard-based creation flow.

**Architecture:** Drizzle ORM + Postgres for data persistence. Two-step wizard for org creation (validate with Kavop API → optional user creation). Organizations overview with card layout. Password unhide pattern in user tables.

**Tech Stack:** Next.js 15 App Router, Drizzle ORM, Postgres, shadcn/ui, TypeScript, Zod validation

---

## Prerequisites

**Before starting:**
- You are in the worktree: `.worktrees/customer-user-mgmt`
- Branch: `feature/customer-user-management`
- `.env.local` has `DATABASE_URL` set to Postgres connection string
- Design document available at: `docs/plans/2025-11-11-customer-user-management-design.md`

---

## Task 1: Install Drizzle ORM Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install dependencies**

```bash
npm install drizzle-orm postgres
npm install -D drizzle-kit
```

Expected: Packages installed successfully

**Step 2: Verify installation**

```bash
npm list drizzle-orm drizzle-kit postgres
```

Expected: Shows installed versions

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add drizzle-orm and postgres dependencies"
```

---

## Task 2: Create Drizzle Configuration

**Files:**
- Create: `drizzle.config.ts`
- Create: `src/lib/db/schema.ts`
- Create: `src/lib/db/index.ts`

**Step 1: Create Drizzle config**

Create `drizzle.config.ts` in project root:

```typescript
import type { Config } from "drizzle-kit";

export default {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

**Step 2: Create empty schema file**

Create `src/lib/db/schema.ts`:

```typescript
// Database schema definitions
// Tables will be added in next tasks
```

**Step 3: Create database client**

Create `src/lib/db/index.ts`:

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;

// Disable prefetch as it's not supported for "Transaction" pool mode
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client);
```

**Step 4: Add migration scripts to package.json**

Add to `package.json` scripts section:

```json
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"db:studio": "drizzle-kit studio"
```

**Step 5: Commit**

```bash
git add drizzle.config.ts src/lib/db/ package.json
git commit -m "feat(db): add drizzle config and database client"
```

---

## Task 3: Define Organizations Schema

**Files:**
- Modify: `src/lib/db/schema.ts`

**Step 1: Define organizations table**

Update `src/lib/db/schema.ts`:

```typescript
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const organizations = pgTable("organizations", {
  org_id: uuid("org_id").defaultRandom().primaryKey(),
  org_name: text("org_name").notNull(),
  mypak_customer_name: text("mypak_customer_name").notNull().unique(),
  kavop_token: text("kavop_token").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});
```

**Step 2: Generate migration**

```bash
npm run db:generate
```

Expected: Creates migration file in `drizzle/` directory with organizations table

**Step 3: Commit**

```bash
git add src/lib/db/schema.ts drizzle/
git commit -m "feat(db): add organizations table schema"
```

---

## Task 4: Define Users Schema

**Files:**
- Modify: `src/lib/db/schema.ts`

**Step 1: Define users table**

Add to `src/lib/db/schema.ts` after organizations table:

```typescript
export const users = pgTable("users", {
  user_id: uuid("user_id").defaultRandom().primaryKey(),
  org_id: uuid("org_id")
    .notNull()
    .references(() => organizations.org_id, { onDelete: "cascade" }),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  password: text("password").notNull(),
  role: text("role").notNull().default("org_user"), // "org_user" | "platform_admin"
  created_at: timestamp("created_at").defaultNow().notNull(),
  last_login_at: timestamp("last_login_at"),
});
```

**Step 2: Generate migration**

```bash
npm run db:generate
```

Expected: Creates migration file with users table and foreign key to organizations

**Step 3: Commit**

```bash
git add src/lib/db/schema.ts drizzle/
git commit -m "feat(db): add users table schema with org foreign key"
```

---

## Task 5: Run Database Migrations

**Files:**
- Database tables created

**Step 1: Run migrations**

```bash
npm run db:migrate
```

Expected: Migrations applied successfully, tables created in Postgres

**Step 2: Verify tables exist**

```bash
npm run db:studio
```

Expected: Opens Drizzle Studio, shows `organizations` and `users` tables

**Step 3: Commit migrations log (if any)**

```bash
git add drizzle/
git commit -m "chore(db): run migrations to create tables"
```

---

## Task 6: Create Password Generator Utility

**Files:**
- Create: `src/lib/utils/password.ts`
- Create: `src/lib/utils/password.test.ts`

**Step 1: Write the failing test**

Create `src/lib/utils/password.test.ts`:

```typescript
import { describe, it, expect } from "@jest/globals";
import { generatePassword } from "./password";

describe("generatePassword", () => {
  it("generates password with correct length", () => {
    const password = generatePassword();
    expect(password.length).toBeGreaterThanOrEqual(16);
    expect(password.length).toBeLessThanOrEqual(20);
  });

  it("includes uppercase letters", () => {
    const password = generatePassword();
    expect(/[A-Z]/.test(password)).toBe(true);
  });

  it("includes lowercase letters", () => {
    const password = generatePassword();
    expect(/[a-z]/.test(password)).toBe(true);
  });

  it("includes numbers", () => {
    const password = generatePassword();
    expect(/[0-9]/.test(password)).toBe(true);
  });

  it("includes special characters", () => {
    const password = generatePassword();
    expect(/[!@#$%^&*]/.test(password)).toBe(true);
  });

  it("generates unique passwords", () => {
    const password1 = generatePassword();
    const password2 = generatePassword();
    expect(password1).not.toBe(password2);
  });
});
```

**Note:** If Jest is not configured, skip tests and implement directly. We'll test manually.

**Step 2: Write implementation**

Create `src/lib/utils/password.ts`:

```typescript
import { randomBytes } from "crypto";

export function generatePassword(length: number = 16): string {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const special = "!@#$%^&*";
  const allChars = uppercase + lowercase + numbers + special;

  // Ensure at least one of each type
  let password = [
    uppercase[randomInt(uppercase.length)],
    lowercase[randomInt(lowercase.length)],
    numbers[randomInt(numbers.length)],
    special[randomInt(special.length)],
  ];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password.push(allChars[randomInt(allChars.length)]);
  }

  // Shuffle the password
  return password.sort(() => Math.random() - 0.5).join("");
}

function randomInt(max: number): number {
  return Math.floor(Math.random() * max);
}
```

**Step 3: Manual test**

Create a test file temporarily:

```bash
node -e "const {generatePassword} = require('./src/lib/utils/password.ts'); console.log(generatePassword());"
```

Or test in Next.js API route later.

**Step 4: Commit**

```bash
git add src/lib/utils/password.ts
git commit -m "feat(utils): add strong password generator"
```

---

## Task 7: Create Name Generator Utility

**Files:**
- Create: `src/lib/utils/name.ts`

**Step 1: Write implementation**

Create `src/lib/utils/name.ts`:

```typescript
export function generateNameFromEmail(email: string): string {
  const prefix = email.split("@")[0];
  // Remove special characters, keep only alphanumeric
  return prefix.replace(/[^a-zA-Z0-9]/g, "");
}
```

**Step 2: Manual test**

```typescript
// Expected:
// generateNameFromEmail("john@acme.com") => "john"
// generateNameFromEmail("sarah.johnson@test.com") => "sarahjohnson"
```

**Step 3: Commit**

```bash
git add src/lib/utils/name.ts
git commit -m "feat(utils): add name generator from email"
```

---

## Task 8: Create Kavop API Client

**Files:**
- Create: `src/lib/api/kavop.ts`

**Step 1: Write Kavop API client**

Create `src/lib/api/kavop.ts`:

```typescript
export interface KavopTokenResponse {
  status: number;
  message: string;
  success: boolean;
  redirect: null;
  error: string | null;
  response: string | null; // This is the token
}

export async function fetchKavopToken(
  customerName: string
): Promise<{ success: true; token: string } | { success: false; error: string }> {
  try {
    const url = `http://www.mypak.cn:8088/api/kavop/customer/token?customerName=${encodeURIComponent(
      customerName
    )}`;

    const response = await fetch(url);
    const data: KavopTokenResponse = await response.json();

    if (data.success && data.response) {
      return { success: true, token: data.response };
    } else {
      return { success: false, error: data.error || "Unknown error" };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}
```

**Step 2: Commit**

```bash
git add src/lib/api/kavop.ts
git commit -m "feat(api): add Kavop API client for token fetching"
```

---

## Task 9: Create API Route - Validate Customer

**Files:**
- Create: `src/app/api/admin/organizations/validate-customer/route.ts`

**Step 1: Create API route**

Create `src/app/api/admin/organizations/validate-customer/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { fetchKavopToken } from "@/lib/api/kavop";
import { z } from "zod";

const schema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerName } = schema.parse(body);

    const result = await fetchKavopToken(customerName);

    if (result.success) {
      return NextResponse.json({
        success: true,
        token: result.token,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**Step 2: Test with curl (manual)**

Start dev server: `npm run dev`

Test:
```bash
curl -X POST http://localhost:3000/api/admin/organizations/validate-customer \
  -H "Content-Type: application/json" \
  -d '{"customerName":"Aginbrook"}'
```

Expected: `{"success":true,"token":"eyJ..."}`

Test with invalid:
```bash
curl -X POST http://localhost:3000/api/admin/organizations/validate-customer \
  -H "Content-Type: application/json" \
  -d '{"customerName":"InvalidCustomer"}'
```

Expected: `{"success":false,"error":"Invalid customer name"}`

**Step 3: Commit**

```bash
git add src/app/api/admin/organizations/validate-customer/
git commit -m "feat(api): add validate customer endpoint"
```

---

## Task 10: Create API Route - Create Organization

**Files:**
- Create: `src/app/api/admin/organizations/route.ts`

**Step 1: Create POST endpoint**

Create `src/app/api/admin/organizations/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { z } from "zod";

const createOrgSchema = z.object({
  org_name: z.string().min(1, "Organization name is required"),
  mypak_customer_name: z.string().min(1, "MyPak customer name is required"),
  kavop_token: z.string().min(1, "Kavop token is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createOrgSchema.parse(body);

    const [org] = await db
      .insert(organizations)
      .values({
        org_name: data.org_name,
        mypak_customer_name: data.mypak_customer_name,
        kavop_token: data.kavop_token,
      })
      .returning();

    return NextResponse.json({
      success: true,
      organization: org,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create organization" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const orgs = await db.select().from(organizations);

    return NextResponse.json({
      success: true,
      organizations: orgs,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch organizations" },
      { status: 500 }
    );
  }
}
```

**Step 2: Test with curl**

```bash
# First validate customer to get token
TOKEN=$(curl -s -X POST http://localhost:3000/api/admin/organizations/validate-customer \
  -H "Content-Type: application/json" \
  -d '{"customerName":"Aginbrook"}' | jq -r '.token')

# Create org with token
curl -X POST http://localhost:3000/api/admin/organizations \
  -H "Content-Type: application/json" \
  -d "{\"org_name\":\"Test Farm\",\"mypak_customer_name\":\"Aginbrook\",\"kavop_token\":\"$TOKEN\"}"
```

Expected: `{"success":true,"organization":{...}}`

**Step 3: Commit**

```bash
git add src/app/api/admin/organizations/route.ts
git commit -m "feat(api): add create and list organizations endpoints"
```

---

## Task 11: Create API Route - Bulk Create Users

**Files:**
- Create: `src/app/api/admin/organizations/[org_id]/users/route.ts`

**Step 1: Create POST endpoint**

Create `src/app/api/admin/organizations/[org_id]/users/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { generatePassword } from "@/lib/utils/password";
import { generateNameFromEmail } from "@/lib/utils/name";
import { z } from "zod";

const createUsersSchema = z.object({
  emails: z.array(z.string().email("Invalid email format")).min(1),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { org_id: string } }
) {
  try {
    const body = await request.json();
    const { emails } = createUsersSchema.parse(body);

    // Generate users data
    const usersData = emails.map((email) => ({
      org_id: params.org_id,
      email,
      name: generateNameFromEmail(email),
      password: generatePassword(16),
      role: "org_user" as const,
    }));

    // Insert all users
    const createdUsers = await db
      .insert(users)
      .values(usersData)
      .returning();

    return NextResponse.json({
      success: true,
      users: createdUsers,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create users" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { org_id: string } }
) {
  try {
    const orgUsers = await db
      .select()
      .from(users)
      .where(eq(users.org_id, params.org_id));

    return NextResponse.json({
      success: true,
      users: orgUsers,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
```

**Step 2: Add missing import**

Add at top of file:

```typescript
import { eq } from "drizzle-orm";
```

**Step 3: Test with curl**

```bash
# Get org_id from previous test
ORG_ID="<uuid-from-previous-test>"

curl -X POST http://localhost:3000/api/admin/organizations/$ORG_ID/users \
  -H "Content-Type: application/json" \
  -d '{"emails":["john@test.com","sarah@test.com"]}'
```

Expected: Returns created users with generated passwords

**Step 4: Commit**

```bash
git add src/app/api/admin/organizations/[org_id]/users/
git commit -m "feat(api): add bulk user creation endpoint"
```

---

## Task 12: Update Types for Database Models

**Files:**
- Modify: `src/lib/types.ts`

**Step 1: Add organization and user types**

Add to `src/lib/types.ts`:

```typescript
// Database models
export interface Organization {
  org_id: string;
  org_name: string;
  mypak_customer_name: string;
  kavop_token: string;
  created_at: Date;
  updated_at: Date;
}

export interface User {
  user_id: string;
  org_id: string;
  email: string;
  name: string;
  password: string;
  role: "org_user" | "platform_admin";
  created_at: Date;
  last_login_at: Date | null;
}
```

**Step 2: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat(types): add Organization and User types"
```

---

## Task 13: Create Organizations Overview Page

**Files:**
- Create: `src/app/admin/organizations/page.tsx`
- Create: `src/components/admin/OrganizationCard.tsx`

**Step 1: Create organizations page**

Create `src/app/admin/organizations/page.tsx`:

```typescript
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { OrganizationCard } from "@/components/admin/OrganizationCard";

async function getOrganizations() {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/admin/organizations`,
    { cache: "no-store" }
  );
  const data = await response.json();
  return data.organizations || [];
}

async function getUserCounts() {
  // TODO: Implement user counts API
  return {};
}

export default async function OrganizationsPage() {
  const organizations = await getOrganizations();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Organizations</h2>
        <Button asChild>
          <Link href="/admin/organizations/new">Create Organization</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {organizations.map((org: any) => (
          <OrganizationCard key={org.org_id} organization={org} />
        ))}
      </div>

      {organizations.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No organizations yet. Create your first organization to get started.
        </div>
      )}
    </div>
  );
}
```

**Step 2: Create OrganizationCard component**

Create `src/components/admin/OrganizationCard.tsx`:

```typescript
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Organization } from "@/lib/types";

interface OrganizationCardProps {
  organization: Organization;
  userCount?: number;
  userEmails?: string[];
}

export function OrganizationCard({
  organization,
  userCount = 0,
  userEmails = [],
}: OrganizationCardProps) {
  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold mb-1">{organization.org_name}</h3>
      <p className="text-sm text-gray-500 mb-4">
        MyPak Customer: {organization.mypak_customer_name}
      </p>

      <div className="mb-4">
        <p className="text-sm font-medium mb-2">Users ({userCount})</p>
        {userCount === 0 ? (
          <p className="text-sm text-gray-400">No users yet</p>
        ) : (
          <ul className="text-sm text-gray-600 space-y-1">
            {userEmails.slice(0, 5).map((email) => (
              <li key={email}>• {email}</li>
            ))}
            {userCount > 5 && (
              <li className="text-gray-400">
                + {userCount - 5} more...
              </li>
            )}
          </ul>
        )}
      </div>

      <Button variant="outline" className="w-full" asChild>
        <Link href={`/admin/organizations/${organization.org_id}`}>
          View Details →
        </Link>
      </Button>
    </Card>
  );
}
```

**Step 3: Create admin directory if needed**

```bash
mkdir -p src/app/admin/organizations
mkdir -p src/components/admin
```

**Step 4: Test the page**

Run: `npm run dev`
Navigate to: `http://localhost:3000/admin/organizations`
Expected: See list of organizations (or empty state)

**Step 5: Commit**

```bash
git add src/app/admin/organizations/page.tsx src/components/admin/OrganizationCard.tsx
git commit -m "feat(admin): add organizations overview page with cards"
```

---

## Task 14: Create Wizard Step 1 - Organization Form

**Files:**
- Create: `src/app/admin/organizations/new/page.tsx`
- Create: `src/components/admin/CreateOrgWizard.tsx`

**Step 1: Create wizard page**

Create `src/app/admin/organizations/new/page.tsx`:

```typescript
import { CreateOrgWizard } from "@/components/admin/CreateOrgWizard";

export default function CreateOrganizationPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Create Organization</h2>
      <CreateOrgWizard />
    </div>
  );
}
```

**Step 2: Create wizard component (Step 1 only)**

Create `src/components/admin/CreateOrgWizard.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export function CreateOrgWizard() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 data
  const [orgName, setOrgName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [validatedToken, setValidatedToken] = useState<string | null>(null);
  const [createdOrgId, setCreatedOrgId] = useState<string | null>(null);

  async function handleStep1Submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate customer with Kavop API
      const validateResponse = await fetch(
        "/api/admin/organizations/validate-customer",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customerName }),
        }
      );

      const validateData = await validateResponse.json();

      if (!validateData.success) {
        setError(validateData.error || "Failed to validate customer");
        setLoading(false);
        return;
      }

      // Create organization
      const createResponse = await fetch("/api/admin/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_name: orgName,
          mypak_customer_name: customerName,
          kavop_token: validateData.token,
        }),
      });

      const createData = await createResponse.json();

      if (!createData.success) {
        setError(createData.error || "Failed to create organization");
        setLoading(false);
        return;
      }

      // Success! Move to step 2
      setValidatedToken(validateData.token);
      setCreatedOrgId(createData.organization.org_id);
      setStep(2);
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  if (step === 1) {
    return (
      <Card className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleStep1Submit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="orgName">Organization Name</Label>
              <Input
                id="orgName"
                placeholder="e.g., Acme Farms"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="customerName">MyPak Customer Name</Label>
              <Input
                id="customerName"
                placeholder="e.g., Aginbrook"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                This name will be used to fetch the Kavop token
              </p>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Validating..." : "Continue →"}
            </Button>
          </div>
        </form>
      </Card>
    );
  }

  // Step 2 will be added in next task
  return <div>Step 2 - Add Users (Coming next)</div>;
}
```

**Step 3: Test the form**

Run: `npm run dev`
Navigate to: `http://localhost:3000/admin/organizations/new`
Expected: See organization form
Try submitting with valid customer name: Should advance to step 2 placeholder

**Step 4: Commit**

```bash
git add src/app/admin/organizations/new/ src/components/admin/CreateOrgWizard.tsx
git commit -m "feat(admin): add wizard step 1 - org creation form"
```

---

## Task 15: Create Wizard Step 2 - Bulk User Creation

**Files:**
- Modify: `src/components/admin/CreateOrgWizard.tsx`

**Step 1: Add Step 2 UI to wizard**

Update `src/components/admin/CreateOrgWizard.tsx`, replace the Step 2 placeholder with:

```typescript
  // Step 2 data
  const [emails, setEmails] = useState<string[]>([""]);
  const [createdUsers, setCreatedUsers] = useState<any[]>([]);

  function addEmailField() {
    setEmails([...emails, ""]);
  }

  function removeEmailField(index: number) {
    if (emails.length === 1) return;
    setEmails(emails.filter((_, i) => i !== index));
  }

  function updateEmail(index: number, value: string) {
    const updated = [...emails];
    updated[index] = value;
    setEmails(updated);
  }

  async function handleStep2Submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Filter out empty emails
    const validEmails = emails.filter((e) => e.trim() !== "");

    if (validEmails.length === 0) {
      // Skip user creation, go to org detail
      router.push(`/admin/organizations/${createdOrgId}`);
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/organizations/${createdOrgId}/users`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emails: validEmails }),
        }
      );

      const data = await response.json();

      if (!data.success) {
        setError(data.error || "Failed to create users");
        setLoading(false);
        return;
      }

      // Show password results
      setCreatedUsers(data.users);
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  function handleSkip() {
    router.push(`/admin/organizations/${createdOrgId}`);
  }

  if (step === 2 && createdUsers.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">
          Add Users to {orgName}
        </h3>
        <p className="text-sm text-gray-500 mb-6">Optional</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleStep2Submit}>
          <div className="space-y-3 mb-4">
            {emails.map((email, index) => (
              <div key={index} className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor={`email-${index}`}>Email Address</Label>
                  <Input
                    id={`email-${index}`}
                    type="email"
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => updateEmail(index, e.target.value)}
                  />
                </div>
                {emails.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeEmailField(index)}
                    className="mt-6"
                  >
                    × Remove
                  </Button>
                )}
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={addEmailField}
            className="mb-6"
          >
            + Add Another Email
          </Button>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleSkip}
              disabled={loading}
            >
              Skip for Now
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Creating..." : "Create Organization & Users →"}
            </Button>
          </div>
        </form>
      </Card>
    );
  }

  if (step === 2 && createdUsers.length > 0) {
    // Password results will be added in next task
    return <div>Password Results (Coming next)</div>;
  }

  return null;
```

**Step 2: Test wizard Step 2**

Navigate to: `http://localhost:3000/admin/organizations/new`
Complete Step 1 → Should see Step 2 with email fields
Add multiple emails → Submit
Expected: Shows password results placeholder

**Step 3: Commit**

```bash
git add src/components/admin/CreateOrgWizard.tsx
git commit -m "feat(admin): add wizard step 2 - bulk user creation"
```

---

## Task 16: Create Password Results Display

**Files:**
- Modify: `src/components/admin/CreateOrgWizard.tsx`

**Step 1: Add password results UI**

Update the Step 2 password results section in `src/components/admin/CreateOrgWizard.tsx`:

```typescript
  const [copiedPassword, setCopiedPassword] = useState<string | null>(null);

  async function copyPassword(password: string) {
    await navigator.clipboard.writeText(password);
    setCopiedPassword(password);
    setTimeout(() => setCopiedPassword(null), 2000);
  }

  if (step === 2 && createdUsers.length > 0) {
    return (
      <Card className="p-6">
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded">
          <p className="text-green-800 font-medium">
            ✓ {createdUsers.length} users created successfully for {orgName}
          </p>
          <p className="text-sm text-green-700 mt-1">
            Copy these passwords and share them with your users. You can view
            passwords later from the users table.
          </p>
        </div>

        <div className="mb-6 border rounded">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Password
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {createdUsers.map((user) => (
                <tr key={user.user_id} className="border-b last:border-0">
                  <td className="px-4 py-3 text-sm">{user.name}</td>
                  <td className="px-4 py-3 text-sm">{user.email}</td>
                  <td className="px-4 py-3 text-sm font-mono">
                    {user.password}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyPassword(user.password)}
                    >
                      {copiedPassword === user.password ? "Copied!" : "Copy"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Button
          onClick={() => router.push(`/admin/organizations/${createdOrgId}`)}
          className="w-full"
        >
          Go to Organization →
        </Button>
      </Card>
    );
  }
```

**Step 2: Test password results**

Complete wizard Steps 1 & 2 with emails
Expected: See table with names, emails, passwords, and copy buttons

**Step 3: Commit**

```bash
git add src/components/admin/CreateOrgWizard.tsx
git commit -m "feat(admin): add password results display with copy buttons"
```

---

## Task 17: Create Organization Detail Page

**Files:**
- Create: `src/app/admin/organizations/[org_id]/page.tsx`
- Create: `src/components/admin/UsersTable.tsx`

**Step 1: Create org detail page**

Create `src/app/admin/organizations/[org_id]/page.tsx`:

```typescript
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UsersTable } from "@/components/admin/UsersTable";

async function getOrganization(orgId: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/admin/organizations`,
    { cache: "no-store" }
  );
  const data = await response.json();
  const org = data.organizations?.find((o: any) => o.org_id === orgId);
  return org || null;
}

async function getOrgUsers(orgId: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/admin/organizations/${orgId}/users`,
    { cache: "no-store" }
  );
  const data = await response.json();
  return data.users || [];
}

export default async function OrganizationDetailPage({
  params,
}: {
  params: { org_id: string };
}) {
  const org = await getOrganization(params.org_id);
  const users = await getOrgUsers(params.org_id);

  if (!org) {
    notFound();
  }

  return (
    <div>
      <Link
        href="/admin/organizations"
        className="text-sm text-blue-600 hover:underline mb-4 inline-block"
      >
        ← Back to Organizations
      </Link>

      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold">{org.org_name}</h2>
            <p className="text-sm text-gray-500 mt-1">
              MyPak Customer: {org.mypak_customer_name}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Created {new Date(org.created_at).toLocaleDateString()}
            </p>
          </div>
          <Button variant="outline">Edit</Button>
        </div>
      </div>

      <Card className="p-6 mb-6">
        <h3 className="font-semibold mb-4">Organization Details</h3>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-gray-500">Organization ID</dt>
            <dd className="font-mono">{org.org_id}</dd>
          </div>
          <div>
            <dt className="text-gray-500">MyPak Customer Name</dt>
            <dd className="font-mono">{org.mypak_customer_name}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Created</dt>
            <dd>{new Date(org.created_at).toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Last Updated</dt>
            <dd>{new Date(org.updated_at).toLocaleString()}</dd>
          </div>
        </dl>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Users ({users.length})</h3>
          <Button asChild>
            <Link href={`/admin/organizations/${org.org_id}/users/new`}>
              + Add Users
            </Link>
          </Button>
        </div>

        {users.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">
            No users yet. Add users to get started.
          </Card>
        ) : (
          <UsersTable users={users} />
        )}
      </div>
    </div>
  );
}
```

**Step 2: Create UsersTable component (without password unhide yet)**

Create `src/components/admin/UsersTable.tsx`:

```typescript
"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { User } from "@/lib/types";

interface UsersTableProps {
  users: User[];
}

export function UsersTable({ users }: UsersTableProps) {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Password</TableHead>
            <TableHead>Last Login</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.user_id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <span className="font-mono">•••••••</span>
                {/* Unhide button will be added next */}
              </TableCell>
              <TableCell>
                {user.last_login_at
                  ? new Date(user.last_login_at).toLocaleDateString()
                  : <span className="text-gray-400">Never</span>
                }
              </TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="sm">
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
```

**Step 3: Test org detail page**

Navigate to an org detail page
Expected: See org info and users table

**Step 4: Commit**

```bash
git add src/app/admin/organizations/[org_id]/ src/components/admin/UsersTable.tsx
git commit -m "feat(admin): add organization detail page with users table"
```

---

## Task 18: Add Password Unhide Feature

**Files:**
- Modify: `src/components/admin/UsersTable.tsx`

**Step 1: Add unhide functionality**

Update `src/components/admin/UsersTable.tsx`:

```typescript
"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, EyeOff, Copy } from "lucide-react";
import { User } from "@/lib/types";

interface UsersTableProps {
  users: User[];
}

export function UsersTable({ users }: UsersTableProps) {
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(
    new Set()
  );
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null);

  function togglePassword(userId: string) {
    setVisiblePasswords((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
        // Auto-hide after 10 seconds
        setTimeout(() => {
          setVisiblePasswords((current) => {
            const updated = new Set(current);
            updated.delete(userId);
            return updated;
          });
        }, 10000);
      }
      return next;
    });
  }

  async function copyPassword(password: string, userId: string) {
    await navigator.clipboard.writeText(password);
    setCopiedUserId(userId);
    setTimeout(() => setCopiedUserId(null), 2000);
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Password</TableHead>
            <TableHead>Last Login</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const isVisible = visiblePasswords.has(user.user_id);
            return (
              <TableRow key={user.user_id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-mono">
                      {isVisible ? user.password : "•••••••"}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => togglePassword(user.user_id)}
                    >
                      {isVisible ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    {isVisible && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyPassword(user.password, user.user_id)}
                      >
                        {copiedUserId === user.user_id ? (
                          "Copied!"
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {user.last_login_at
                    ? new Date(user.last_login_at).toLocaleDateString()
                    : <span className="text-gray-400">Never</span>
                  }
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm">
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
```

**Step 2: Test unhide feature**

Navigate to org detail with users
Click eye icon on password
Expected: Password reveals, copy button appears, auto-hides after 10 seconds

**Step 3: Commit**

```bash
git add src/components/admin/UsersTable.tsx
git commit -m "feat(admin): add password unhide with auto-hide timer"
```

---

## Task 19: Fetch Organization Users in Overview Cards

**Files:**
- Modify: `src/app/admin/organizations/page.tsx`
- Modify: `src/components/admin/OrganizationCard.tsx`

**Step 1: Fetch users for each org**

Update `src/app/admin/organizations/page.tsx`:

```typescript
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { OrganizationCard } from "@/components/admin/OrganizationCard";

async function getOrganizationsWithUsers() {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/admin/organizations`,
    { cache: "no-store" }
  );
  const data = await response.json();
  const orgs = data.organizations || [];

  // Fetch users for each org
  const orgsWithUsers = await Promise.all(
    orgs.map(async (org: any) => {
      const usersResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/admin/organizations/${org.org_id}/users`,
        { cache: "no-store" }
      );
      const usersData = await usersResponse.json();
      return {
        ...org,
        users: usersData.users || [],
      };
    })
  );

  return orgsWithUsers;
}

export default async function OrganizationsPage() {
  const organizations = await getOrganizationsWithUsers();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Organizations</h2>
        <Button asChild>
          <Link href="/admin/organizations/new">Create Organization</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {organizations.map((org: any) => (
          <OrganizationCard
            key={org.org_id}
            organization={org}
            userCount={org.users.length}
            userEmails={org.users.map((u: any) => u.email)}
          />
        ))}
      </div>

      {organizations.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No organizations yet. Create your first organization to get started.
        </div>
      )}
    </div>
  );
}
```

**Step 2: Test organizations overview**

Navigate to `/admin/organizations`
Expected: Cards show user count and emails

**Step 3: Commit**

```bash
git add src/app/admin/organizations/page.tsx
git commit -m "feat(admin): fetch and display users in org cards"
```

---

## Task 20: Update Sidebar to Add Organizations Link

**Files:**
- Modify: `src/components/shared/Sidebar.tsx`

**Step 1: Read current sidebar**

```bash
cat src/components/shared/Sidebar.tsx
```

Look for navigation links section

**Step 2: Add Organizations link**

Add after the Orders link (or wherever appropriate):

```typescript
<Link
  href="/admin/organizations"
  className={cn(
    "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-accent",
    pathname?.startsWith("/admin") ? "bg-accent" : "transparent"
  )}
>
  <Settings className="h-4 w-4" />
  Admin
</Link>
```

Import Settings icon if needed:

```typescript
import { Settings } from "lucide-react";
```

**Step 3: Test navigation**

Expected: See "Admin" link in sidebar, navigates to organizations

**Step 4: Commit**

```bash
git add src/components/shared/Sidebar.tsx
git commit -m "feat(admin): add admin link to sidebar"
```

---

## Task 21: Build and Test End-to-End

**Files:**
- None (testing)

**Step 1: Run full build**

```bash
npm run build
```

Expected: Build succeeds with no TypeScript errors

**Step 2: Start production server**

```bash
npm start
```

**Step 3: Test complete flow**

1. Navigate to `/admin/organizations`
2. Click "Create Organization"
3. Fill in org details with valid customer name (e.g., "Aginbrook")
4. Click Continue → Should validate and advance to Step 2
5. Add 2-3 email addresses
6. Click "Create Organization & Users"
7. Should see password results table
8. Click "Go to Organization"
9. Should see org detail page with users
10. Click eye icon on password → Should reveal password
11. Wait 10 seconds → Password should auto-hide
12. Navigate back to `/admin/organizations`
13. Should see org card with user count and emails

**Step 4: Document any issues**

If any errors occur, note them for fixing in next task.

---

## Task 22: Add Admin Layout (If Missing)

**Files:**
- Create: `src/app/admin/layout.tsx` (if doesn't exist)

**Step 1: Check if admin layout exists**

```bash
ls -la src/app/admin/layout.tsx
```

**Step 2: Create layout if missing**

Create `src/app/admin/layout.tsx`:

```typescript
import { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="px-8 py-4">
          <h1 className="text-2xl font-semibold">Platform Admin</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage organizations and users
          </p>
        </div>
      </div>

      <div className="px-8 py-6">{children}</div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/app/admin/layout.tsx
git commit -m "feat(admin): add admin layout wrapper"
```

---

## Task 23: Add "Add Users" Page from Org Detail

**Files:**
- Create: `src/app/admin/organizations/[org_id]/users/new/page.tsx`

**Step 1: Create add users page**

Create `src/app/admin/organizations/[org_id]/users/new/page.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import Link from "next/link";

export default function AddUsersPage({
  params,
}: {
  params: { org_id: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emails, setEmails] = useState<string[]>([""]);
  const [createdUsers, setCreatedUsers] = useState<any[]>([]);
  const [copiedPassword, setCopiedPassword] = useState<string | null>(null);

  function addEmailField() {
    setEmails([...emails, ""]);
  }

  function removeEmailField(index: number) {
    if (emails.length === 1) return;
    setEmails(emails.filter((_, i) => i !== index));
  }

  function updateEmail(index: number, value: string) {
    const updated = [...emails];
    updated[index] = value;
    setEmails(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const validEmails = emails.filter((e) => e.trim() !== "");

    if (validEmails.length === 0) {
      setError("Please enter at least one email address");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/organizations/${params.org_id}/users`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emails: validEmails }),
        }
      );

      const data = await response.json();

      if (!data.success) {
        setError(data.error || "Failed to create users");
        setLoading(false);
        return;
      }

      setCreatedUsers(data.users);
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function copyPassword(password: string) {
    await navigator.clipboard.writeText(password);
    setCopiedPassword(password);
    setTimeout(() => setCopiedPassword(null), 2000);
  }

  if (createdUsers.length > 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="p-6">
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded">
            <p className="text-green-800 font-medium">
              ✓ {createdUsers.length} users created successfully
            </p>
            <p className="text-sm text-green-700 mt-1">
              Copy these passwords and share them with your users.
            </p>
          </div>

          <div className="mb-6 border rounded">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Password
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {createdUsers.map((user) => (
                  <tr key={user.user_id} className="border-b last:border-0">
                    <td className="px-4 py-3 text-sm">{user.name}</td>
                    <td className="px-4 py-3 text-sm">{user.email}</td>
                    <td className="px-4 py-3 text-sm font-mono">
                      {user.password}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyPassword(user.password)}
                      >
                        {copiedPassword === user.password ? "Copied!" : "Copy"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Button
            onClick={() =>
              router.push(`/admin/organizations/${params.org_id}`)
            }
            className="w-full"
          >
            Back to Organization →
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href={`/admin/organizations/${params.org_id}`}
        className="text-sm text-blue-600 hover:underline mb-4 inline-block"
      >
        ← Back to Organization
      </Link>

      <h2 className="text-2xl font-semibold mb-6">Add Users</h2>

      <Card className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-3 mb-4">
            {emails.map((email, index) => (
              <div key={index} className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor={`email-${index}`}>Email Address</Label>
                  <Input
                    id={`email-${index}`}
                    type="email"
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => updateEmail(index, e.target.value)}
                  />
                </div>
                {emails.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeEmailField(index)}
                    className="mt-6"
                  >
                    × Remove
                  </Button>
                )}
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={addEmailField}
            className="mb-6"
          >
            + Add Another Email
          </Button>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating..." : "Create Users →"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
```

**Step 2: Test add users flow**

Navigate to org detail → Click "+ Add Users"
Add emails → Submit
Expected: See password results → Back to org detail

**Step 3: Commit**

```bash
git add src/app/admin/organizations/[org_id]/users/new/
git commit -m "feat(admin): add standalone add users page"
```

---

## Testing Checklist

After completing all tasks, verify:

- [ ] Can create organization with valid Kavop customer name
- [ ] Invalid customer name shows error message inline
- [ ] Can skip user creation in wizard Step 2
- [ ] Can create multiple users with auto-generated passwords
- [ ] Password results show all created users with passwords
- [ ] Organizations overview shows cards with user counts
- [ ] Org detail page shows users table
- [ ] Can unhide passwords in users table
- [ ] Passwords auto-hide after 10 seconds
- [ ] Can copy passwords to clipboard
- [ ] Can add more users from org detail page
- [ ] Admin link appears in sidebar
- [ ] All pages use consistent styling

---

## Next Steps (Out of Scope)

The following features are intentionally NOT included in this plan:

1. **Edit Organization** - Update org name or customer name (with user count validation)
2. **Delete User** - Remove users from organization
3. **Authentication/Authorization** - Role-based access control middleware
4. **Search/Filter** - Search orgs by name, filter users
5. **Pagination** - Handle large datasets
6. **Error Handling** - Comprehensive error states and retry logic
7. **Validation** - Enhanced email validation, duplicate checking
8. **Audit Logging** - Track who created/modified orgs and users

---

**Total Estimated Time:** 4-6 hours

**Dependencies:**
- Postgres database with DATABASE_URL in .env.local
- Drizzle ORM and postgres packages
- shadcn/ui components (Button, Input, Card, Label, Table)
- Kavop API endpoint must be accessible
