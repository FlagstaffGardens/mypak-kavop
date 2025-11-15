import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { CreateOrgWizard } from "@/components/admin/CreateOrgWizard";

export default async function CreateOrganizationPage() {
  // Check authentication
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;
  if (!user || user?.role !== "admin") {
    redirect("/sign-in");
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Create Organization</h2>
      <CreateOrgWizard />
    </div>
  );
}
