import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UsersTable } from "@/components/admin/UsersTable";
import { getCurrentUser } from "@/lib/auth/jwt";
import { db } from "@/lib/db";
import { organizations, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function getOrganization(orgId: string) {
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.org_id, orgId));
  return org || null;
}

async function getOrgUsers(orgId: string) {
  const orgUsers = await db
    .select()
    .from(users)
    .where(eq(users.orgId, orgId));
  return orgUsers;
}

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ org_id: string }>;
}) {
  // Check authentication
  const user = await getCurrentUser();
  if (!user || user.role !== "platform_admin") {
    redirect("/sign-in");
  }

  const { org_id } = await params;
  const org = await getOrganization(org_id);
  const users = await getOrgUsers(org_id);

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
          <UsersTable users={users} orgId={org.org_id} />
        )}
      </div>
    </div>
  );
}
