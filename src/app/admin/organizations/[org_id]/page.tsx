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

async function getOrganization(orgId: string) {
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.org_id, orgId));
  return org || null;
}

async function getOrgMembers(betterAuthOrgId: string, isPlatformAdmin: boolean) {
  // Platform admins query database directly to bypass membership checks
  if (isPlatformAdmin) {
    const { member, user, organization } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

    const members = await db
      .select({
        id: member.id,
        role: member.role,
        createdAt: member.createdAt,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      })
      .from(member)
      .innerJoin(user, eq(user.id, member.userId))
      .where(eq(member.organizationId, betterAuthOrgId));

    return members;
  }

  // Regular users use Better Auth API (enforces membership)
  try {
    const orgData = await auth.api.getFullOrganization({
      query: {
        organizationId: betterAuthOrgId,
      },
      headers: await headers(),
    });
    return orgData?.members || [];
  } catch (error) {
    console.error("Error fetching org members:", error);
    return [];
  }
}

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

  const isPlatformAdmin = user.role === "admin";
  const members = org.better_auth_org_id
    ? await getOrgMembers(org.better_auth_org_id, isPlatformAdmin)
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
