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
