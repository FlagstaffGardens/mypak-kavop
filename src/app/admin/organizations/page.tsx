import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { OrganizationCard } from "@/components/admin/OrganizationCard";
import { getCurrentUser } from "@/lib/auth/jwt";
import { db } from "@/lib/db";
import { organizations, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function getOrganizationsWithUsers() {
  // Fetch directly from database with optimized query
  const orgs = await db.select().from(organizations);

  if (orgs.length === 0) {
    return [];
  }

  // Fetch all users for all orgs in one query
  const allUsers = await db
    .select()
    .from(users)
    .where(
      eq(users.role, "org_user") // Only fetch org users, not admins
    );

  // Group users by org_id
  const usersByOrg = allUsers.reduce((acc, user) => {
    if (!user.orgId) return acc;
    if (!acc[user.orgId]) {
      acc[user.orgId] = [];
    }
    acc[user.orgId].push(user);
    return acc;
  }, {} as Record<string, typeof allUsers>);

  // Combine orgs with their users
  return orgs.map((org) => ({
    ...org,
    users: usersByOrg[org.org_id] || [],
  }));
}

export default async function OrganizationsPage() {
  // Check authentication
  const user = await getCurrentUser();
  if (!user || user.role !== "platform_admin") {
    redirect("/sign-in");
  }

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
