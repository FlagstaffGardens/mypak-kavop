import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/jwt";
import { CreateOrgWizard } from "@/components/admin/CreateOrgWizard";

export default async function CreateOrganizationPage() {
  // Check authentication
  const user = await getCurrentUser();
  if (!user || user.role !== "platform_admin") {
    redirect("/sign-in");
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Create Organization</h2>
      <CreateOrgWizard />
    </div>
  );
}
