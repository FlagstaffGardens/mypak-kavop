# Better Auth Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate to Better Auth as single source of truth, removing all legacy user management code

**Architecture:** Better Auth tables (`user`, `organization`, `member`, `invitation`) for all authentication and organization management. Business `organizations` table links to Better Auth via `better_auth_org_id` (NOT NULL) for ERP integration data only.

**Tech Stack:** Better Auth v1.3.34, Drizzle ORM, PostgreSQL, Next.js 15

---

## Task 1: Update Database Schema

Remove legacy `users` table and enforce Better Auth org linking.

**Files:**
- Modify: `src/lib/db/schema.ts:134-146`

**Step 1: Remove legacy users table from schema**

In `src/lib/db/schema.ts`, delete lines 134-146 (entire `users` table definition):

```typescript
// DELETE THESE LINES (134-146):
export const users = pgTable("users", {
  user_id: uuid("user_id").defaultRandom().primaryKey(),
  org_id: uuid("org_id").references(() => organizations.org_id, { onDelete: "cascade" }),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  password: text("password").notNull(),
  role: text("role").notNull().default("org_user"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
  last_login_at: timestamp("last_login_at"),
}, (table) => ({
  orgIdx: index('idx_users_org_id').on(table.org_id),
}));
```

**Step 2: Make better_auth_org_id NOT NULL**

In `src/lib/db/schema.ts:123`, change line to enforce NOT NULL:

```typescript
// BEFORE (line 123):
better_auth_org_id: text("better_auth_org_id")
  .unique()
  .references(() => organization.id, { onDelete: "cascade" }),

// AFTER:
better_auth_org_id: text("better_auth_org_id")
  .notNull()
  .unique()
  .references(() => organization.id, { onDelete: "cascade" }),
```

**Step 3: Create database migration**

Run: `npx drizzle-kit generate`
Expected: Migration file created in `drizzle/` directory

**Step 4: Apply migration to database**

Run: `npx drizzle-kit push`
Expected: "✓ Migration applied successfully"

**Note:** This will DROP the users table. Ensure no production data needs migration first.

**Step 5: Commit schema changes**

```bash
git add src/lib/db/schema.ts drizzle/
git commit -m "refactor: migrate to Better Auth only, remove legacy users table"
```

---

## Task 2: Fix Admin Creation Script

Update script to create admin in Better Auth `user` table with correct role.

**Files:**
- Modify: `scripts/create-admin.ts:1-36`

**Step 1: Update imports to use Better Auth table**

Replace entire file content at `scripts/create-admin.ts`:

```typescript
import { db } from "../src/lib/db";
import { user } from "../src/lib/db/schema";

async function createAdmin() {
  try {
    const [admin] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        email: "admin@mypak.com",
        name: "Platform Admin",
        emailVerified: true, // Skip email verification for admin
        role: "admin", // Platform admin role (matches Better Auth adminRoles)
        banned: false,
      })
      .returning()
      .onConflictDoNothing();

    if (admin) {
      console.log("✅ Platform admin created successfully!");
      console.log("Email: admin@mypak.com");
      console.log("Note: Sign in using Email OTP (6-digit code)");
    } else {
      console.log("ℹ️  Platform admin already exists");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin:", error);
    process.exit(1);
  }
}

createAdmin();
```

**Step 2: Test admin creation**

Run: `npm run tsx scripts/create-admin.ts`
Expected: "✅ Platform admin created successfully!"

**Step 3: Verify admin in database**

Run: `psql $DATABASE_URL -c "SELECT id, email, role FROM user WHERE role='admin';"`
Expected: One row with email "admin@mypak.com" and role "admin"

**Step 4: Commit admin script fix**

```bash
git add scripts/create-admin.ts
git commit -m "fix: create admin in Better Auth user table with correct role"
```

---

## Task 3: Update Organization Creation to Use Better Auth

Create Better Auth organization and assign platform admin as owner when creating business org.

**Files:**
- Modify: `src/app/api/admin/organizations/route.ts:14-51`

**Step 1: Update POST handler to create Better Auth org**

Replace the POST function in `src/app/api/admin/organizations/route.ts`:

```typescript
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;
  if (!user || user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = createOrgSchema.parse(body);

    // Step 1: Create Better Auth organization
    const betterAuthOrg = await auth.api.createOrganization({
      body: {
        name: data.org_name,
        slug: data.org_name.toLowerCase().replace(/\s+/g, "-"),
      },
      user: user, // Platform admin creates the org
    });

    // Step 2: Create business organization (ERP integration data)
    const [org] = await db
      .insert(organizations)
      .values({
        org_name: data.org_name,
        mypak_customer_name: data.mypak_customer_name,
        kavop_token: data.kavop_token,
        better_auth_org_id: betterAuthOrg.id, // Link to Better Auth org
      })
      .returning();

    return NextResponse.json({
      success: true,
      organization: org,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Create organization error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create organization" },
      { status: 500 }
    );
  }
}
```

**Step 2: Add Better Auth org import**

Add to imports at top of `src/app/api/admin/organizations/route.ts`:

```typescript
import { organization as betterAuthOrganization } from "@/lib/db/schema";
```

**Step 3: Test organization creation flow**

Manual test:
1. Sign in as admin (admin@mypak.com)
2. Navigate to `/admin/organizations/new`
3. Create org with valid customer name
4. Verify success

Expected: Business org created with `better_auth_org_id` populated

**Step 4: Verify Better Auth org created**

Run: `psql $DATABASE_URL -c "SELECT id, name, slug FROM organization ORDER BY \"createdAt\" DESC LIMIT 1;"`
Expected: New org with matching name

**Step 5: Commit organization creation update**

```bash
git add src/app/api/admin/organizations/route.ts
git commit -m "feat: create Better Auth org when creating business org"
```

---

## Task 4: Replace User Creation with Better Auth Invitations

Remove legacy user creation, use Better Auth invitation system instead.

**Files:**
- Modify: `src/app/api/admin/organizations/[org_id]/users/route.ts:1-98`
- Modify: `src/components/admin/CreateOrgWizard.tsx:1-315`

**Step 1: Update API to send Better Auth invitations**

Replace entire `src/app/api/admin/organizations/[org_id]/users/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import { eq } from "drizzle-orm";

const createUsersSchema = z.object({
  emails: z.array(z.string().email("Invalid email format")).min(1),
  role: z.enum(["owner", "admin", "member"]).default("member"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ org_id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;
  if (!user || user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { org_id } = await params;
    const body = await request.json();
    const { emails, role } = createUsersSchema.parse(body);

    // Get business org to find Better Auth org ID
    const [businessOrg] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.org_id, org_id));

    if (!businessOrg || !businessOrg.better_auth_org_id) {
      return NextResponse.json(
        { error: "Organization not found or not linked to Better Auth" },
        { status: 404 }
      );
    }

    // Send invitations via Better Auth
    const invitations = await Promise.all(
      emails.map(async (email) => {
        return await auth.api.inviteUser({
          body: {
            email,
            organizationId: businessOrg.better_auth_org_id!,
            role,
            inviterId: user.id,
          },
        });
      })
    );

    return NextResponse.json({
      success: true,
      invitations,
      message: `${emails.length} invitation(s) sent via email`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Invite users error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send invitations" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ org_id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;
  if (!user || user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { org_id } = await params;

    // Get business org to find Better Auth org ID
    const [businessOrg] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.org_id, org_id));

    if (!businessOrg || !businessOrg.better_auth_org_id) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Get organization members from Better Auth
    const members = await auth.api.listOrganizationMembers({
      query: {
        organizationId: businessOrg.better_auth_org_id,
      },
    });

    return NextResponse.json({
      success: true,
      members,
    });
  } catch (error) {
    console.error("Get org members error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}
```

**Step 2: Update wizard to show invitation success**

In `src/components/admin/CreateOrgWizard.tsx`, update Step 2 success display (lines 264-310):

```typescript
// Password Results Display → Invitation Success Display
if (step === 2 && createdUsers.length > 0) {
  return (
    <Card className="p-6">
      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded">
        <p className="text-green-800 font-medium">
          ✓ {createdUsers.length} invitation(s) sent for {orgName}
        </p>
        <p className="text-sm text-green-700 mt-1">
          Users will receive an email invitation to join the organization.
          They'll sign in using Email OTP (6-digit code).
        </p>
      </div>

      <div className="mb-6 border rounded">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">
                Email
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {emails.filter(e => e.trim() !== "").map((email, idx) => (
              <tr key={idx} className="border-b last:border-0">
                <td className="px-4 py-3 text-sm">{email}</td>
                <td className="px-4 py-3 text-sm text-green-600">
                  Invitation sent
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

**Step 3: Update wizard API call response handling**

In `src/components/admin/CreateOrgWizard.tsx`, update `handleStep2Submit` (line 125):

```typescript
// Update line 134 from:
setCreatedUsers(data.users);

// To:
setCreatedUsers(validEmails); // Just use the emails list for display
```

**Step 4: Test invitation flow**

Manual test:
1. Create new organization
2. Add user emails in Step 2
3. Submit
4. Check email inbox for invitation email

Expected: Invitation email received with "Accept Invitation" button

**Step 5: Commit invitation system**

```bash
git add src/app/api/admin/organizations/[org_id]/users/route.ts src/components/admin/CreateOrgWizard.tsx
git commit -m "feat: replace legacy user creation with Better Auth invitations"
```

---

## Task 5: Update Organization Detail Page to Show Better Auth Members

Replace legacy users table with Better Auth members.

**Files:**
- Modify: `src/app/admin/organizations/[org_id]/page.tsx:1-118`

**Step 1: Update imports**

Replace imports in `src/app/admin/organizations/[org_id]/page.tsx`:

```typescript
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
```

**Step 2: Remove legacy getOrgUsers, add getOrgMembers**

Replace the data fetching functions:

```typescript
async function getOrganization(orgId: string) {
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.org_id, orgId));
  return org || null;
}

async function getOrgMembers(betterAuthOrgId: string) {
  try {
    const members = await auth.api.listOrganizationMembers({
      query: {
        organizationId: betterAuthOrgId,
      },
    });
    return members || [];
  } catch (error) {
    console.error("Error fetching org members:", error);
    return [];
  }
}
```

**Step 3: Update page component to use Better Auth members**

Replace the page component:

```typescript
export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ org_id: string }>;
}) {
  // Check authentication
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;
  if (!user || user?.role !== "admin") {
    redirect("/sign-in");
  }

  const { org_id } = await params;
  const org = await getOrganization(org_id);

  if (!org) {
    notFound();
  }

  const members = org.better_auth_org_id
    ? await getOrgMembers(org.better_auth_org_id)
    : [];

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
          <Button variant="outline" disabled title="Coming soon">
            Edit
          </Button>
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
            <dt className="text-gray-500">Better Auth Org ID</dt>
            <dd className="font-mono">{org.better_auth_org_id}</dd>
          </div>
          <div>
            <dt className="text-gray-500">MyPak Customer Name</dt>
            <dd className="font-mono">{org.mypak_customer_name}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Created</dt>
            <dd>{new Date(org.created_at).toLocaleString()}</dd>
          </div>
        </dl>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Members ({members.length})</h3>
          <Button asChild>
            <Link href={`/admin/organizations/${org.org_id}/users/new`}>
              + Invite Users
            </Link>
          </Button>
        </div>

        {members.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">
            No members yet. Invite users to get started.
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member: any) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.user.name}
                    </TableCell>
                    <TableCell>{member.user.email}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {member.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(member.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  );
}
```

**Step 4: Test organization detail page**

Manual test:
1. Navigate to `/admin/organizations`
2. Click on an organization
3. Verify members table shows Better Auth members

Expected: Members displayed with name, email, role, join date

**Step 5: Commit organization detail page update**

```bash
git add src/app/admin/organizations/[org_id]/page.tsx
git commit -m "refactor: show Better Auth members instead of legacy users"
```

---

## Task 6: Delete Legacy User API Route

Remove DELETE endpoint for legacy users table.

**Files:**
- Delete: `src/app/api/admin/users/[user_id]/route.ts`

**Step 1: Delete legacy user delete route**

Run: `rm src/app/api/admin/users/[user_id]/route.ts`

Expected: File deleted

**Step 2: Commit deletion**

```bash
git add src/app/api/admin/users/[user_id]/route.ts
git commit -m "refactor: remove legacy user delete API route"
```

---

## Task 7: Delete UsersTable Component

Remove password display component entirely.

**Files:**
- Delete: `src/components/admin/UsersTable.tsx`

**Step 1: Delete UsersTable component**

Run: `rm src/components/admin/UsersTable.tsx`

Expected: File deleted

**Step 2: Commit deletion**

```bash
git add src/components/admin/UsersTable.tsx
git commit -m "refactor: remove legacy UsersTable with password display"
```

---

## Task 8: Delete Password Utility Functions

Remove deprecated password generation utilities.

**Files:**
- Delete: `src/lib/utils/password.ts` (if exists)
- Delete: `src/lib/utils/name.ts` (if exists)

**Step 1: Check if password utilities exist**

Run: `ls -la src/lib/utils/password.ts src/lib/utils/name.ts`

Expected: Either files listed or "No such file"

**Step 2: Delete if they exist**

Run: `rm -f src/lib/utils/password.ts src/lib/utils/name.ts`

**Step 3: Commit deletion**

```bash
git add src/lib/utils/
git commit -m "refactor: remove deprecated password and name utilities"
```

---

## Task 9: Update Organization List Page to Show Member Count

Update organizations list to query Better Auth member counts.

**Files:**
- Modify: `src/app/admin/organizations/page.tsx`

**Step 1: Read current organizations page**

Read `src/app/admin/organizations/page.tsx` to understand current structure.

**Step 2: Update to fetch member counts from Better Auth**

Replace member count fetching logic to use Better Auth `member` table instead of legacy `users` table.

Query: Join `organizations` with Better Auth `member` table on `better_auth_org_id`.

**Step 3: Update OrganizationCard to show member emails**

Update card to query actual member emails from Better Auth `user` table via `member` relationship.

**Step 4: Test organizations list page**

Manual test:
1. Navigate to `/admin/organizations`
2. Verify member counts are correct
3. Verify member emails displayed

Expected: Accurate member counts and emails

**Step 5: Commit organizations list update**

```bash
git add src/app/admin/organizations/page.tsx
git commit -m "refactor: show Better Auth member counts on orgs list"
```

---

## Task 10: Update Invite Users Page

Update "Add Users" page to reflect invitation language.

**Files:**
- Modify: `src/app/admin/organizations/[org_id]/users/new/page.tsx`

**Step 1: Update page title and description**

Change "Add Users" to "Invite Users" throughout the page.

**Step 2: Update success messaging**

Change from "Users created" to "Invitations sent".

**Step 3: Test invite page**

Manual test:
1. Navigate to an org detail page
2. Click "+ Invite Users"
3. Send invitations
4. Verify success messaging

Expected: Clear invitation language, no password references

**Step 4: Commit invite page update**

```bash
git add src/app/admin/organizations/[org_id]/users/new/page.tsx
git commit -m "refactor: update invite users page messaging"
```

---

## Task 11: Update CLAUDE.md Documentation

Update project documentation to reflect Better Auth-only architecture.

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Update Authentication section**

Remove all references to legacy `users` table. Document that Better Auth `user` table is the only user source.

**Step 2: Update Database Tables section**

Remove `users` table from documentation. Update schema mapping to show Better Auth as source of truth.

**Step 3: Add migration notes**

Add section documenting the migration from dual tables to Better Auth only.

**Step 4: Commit documentation update**

```bash
git add CLAUDE.md
git commit -m "docs: update to reflect Better Auth-only architecture"
```

---

## Task 12: Comprehensive Testing

Test all admin functionality end-to-end.

**Test Cases:**

1. **Admin Creation:**
   - Run `npm run tsx scripts/create-admin.ts`
   - Sign in with admin@mypak.com using OTP
   - Verify access to `/admin/organizations`

2. **Organization Creation:**
   - Create new organization with valid customer name
   - Verify Better Auth org created
   - Verify business org linked via `better_auth_org_id`
   - Verify platform admin is owner of new org

3. **User Invitations:**
   - Invite users to organization
   - Verify invitation emails sent
   - Accept invitation via email link
   - Verify user added as member
   - Sign in with invited user
   - Verify dashboard access

4. **Organization Members:**
   - View organization detail page
   - Verify members table shows Better Auth members
   - Verify member roles displayed correctly
   - Verify member count accurate

5. **Impersonation:**
   - Navigate to `/admin/users`
   - Verify all Better Auth users listed
   - Impersonate org member
   - Verify dashboard access as impersonated user
   - Stop impersonation
   - Verify return to admin account

**Manual Testing Steps:**

```bash
# 1. Create admin
npm run tsx scripts/create-admin.ts

# 2. Start dev server
npm run dev

# 3. Sign in as admin (localhost:3000/sign-in)
# Email: admin@mypak.com
# Enter 6-digit OTP from email

# 4. Create organization
# Navigate to /admin/organizations/new
# Fill form with valid customer name

# 5. Invite users
# On org detail page, click "+ Invite Users"
# Add email addresses
# Submit and verify invitation emails sent

# 6. Accept invitation (in separate browser/incognito)
# Click "Accept Invitation" in email
# Sign in with OTP
# Verify dashboard access

# 7. Test impersonation
# As admin, go to /admin/users
# Click "Impersonate" on a user
# Verify you're viewing as that user
# Click "Stop Impersonation"

# 8. Verify no legacy code running
# Search codebase for "users." database queries
# Ensure all are Better Auth tables
```

**Expected Results:**

- ✓ Admin creation works
- ✓ Organization creation creates Better Auth org + business org
- ✓ Invitations send emails via Better Auth
- ✓ Users can accept invitations and sign in
- ✓ Members displayed correctly on org detail
- ✓ Impersonation works with Better Auth users
- ✓ No legacy users table queries anywhere

**Step: Commit test results**

```bash
git add .
git commit -m "test: verify Better Auth migration end-to-end"
```

---

## Task 13: Database Cleanup (Production Only)

**DANGER:** This step is DESTRUCTIVE. Only run in production after thorough testing.

**Step 1: Backup production database**

Run: `pg_dump $DATABASE_URL > backup-pre-migration-$(date +%Y%m%d).sql`

Expected: Backup file created

**Step 2: Migrate existing legacy users to Better Auth (if needed)**

If production has legacy users, create migration script to:
1. For each legacy user, create Better Auth user
2. Link to organization via Better Auth member
3. Send invitation email for passwordless sign-in
4. Mark legacy user as migrated

**Step 3: Drop legacy users table**

Run: `psql $DATABASE_URL -c "DROP TABLE IF EXISTS users CASCADE;"`

Expected: "DROP TABLE"

**Step 4: Verify application still works**

Test all flows in production after cleanup.

---

## Success Criteria

- ✓ Legacy `users` table removed from schema
- ✓ Better Auth `user` table is single source of truth
- ✓ Admin creation script works with Better Auth
- ✓ Organization creation creates Better Auth org + assigns owner
- ✓ User invitations use Better Auth invitation system
- ✓ All admin pages query Better Auth tables only
- ✓ No password-related UI anywhere
- ✓ Documentation updated
- ✓ All tests pass
- ✓ Production-ready

---

## Rollback Plan

If migration fails:

1. **Restore database from backup:**
   ```bash
   psql $DATABASE_URL < backup-pre-migration-YYYYMMDD.sql
   ```

2. **Revert git commits:**
   ```bash
   git revert HEAD~13..HEAD
   git push
   ```

3. **Redeploy previous version:**
   ```bash
   git checkout <previous-commit>
   npm run build
   npm run deploy
   ```

---

## Notes

- **DRY:** Reuse Better Auth APIs for all user/org operations
- **YAGNI:** Remove all unused password utilities, legacy user code
- **TDD:** Test each API endpoint after modification
- **Frequent commits:** One commit per task for easy rollback
- **Better Auth as SSoT:** All user data lives in Better Auth tables only
- **Business tables minimal:** Only ERP integration data in `organizations` table
