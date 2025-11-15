import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { OrganizationCard } from "@/components/admin/OrganizationCard";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { organizations, member, user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function getOrganizationsWithMembers() {
  // Fetch all business organizations
  const orgs = await db.select().from(organizations);

  if (orgs.length === 0) {
    return [];
  }

  // Fetch all members with their user data for all Better Auth orgs in one query
  const allMembers = await db
    .select({
      organizationId: member.organizationId,
      userId: member.userId,
      role: member.role,
      email: user.email,
      name: user.name,
      createdAt: member.createdAt,
    })
    .from(member)
    .innerJoin(user, eq(member.userId, user.id));

  // Group members by Better Auth org ID
  const membersByOrgId = allMembers.reduce((acc, mbr) => {
    if (!acc[mbr.organizationId]) {
      acc[mbr.organizationId] = [];
    }
    acc[mbr.organizationId].push(mbr);
    return acc;
  }, {} as Record<string, typeof allMembers>);

  // Combine business orgs with their Better Auth members
  return orgs.map((org) => ({
    ...org,
    members: org.better_auth_org_id ? (membersByOrgId[org.better_auth_org_id] || []) : [],
  }));
}

export default async function OrganizationsPage() {
  // Check authentication
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;
  if (!user || user?.role !== "admin") {
    redirect("/sign-in");
  }

  const organizations = await getOrganizationsWithMembers();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Organizations</h2>
        <Button asChild>
          <Link href="/admin/organizations/new">Create Organization</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {organizations.map((org) => (
          <OrganizationCard
            key={org.org_id}
            organization={org}
            userCount={org.members.length}
            userEmails={org.members.map((m) => m.email)}
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
