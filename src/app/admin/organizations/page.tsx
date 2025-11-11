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
