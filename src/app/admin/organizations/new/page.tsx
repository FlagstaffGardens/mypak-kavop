import { CreateOrgWizard } from "@/components/admin/CreateOrgWizard";

export default function CreateOrganizationPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Create Organization</h2>
      <CreateOrgWizard />
    </div>
  );
}
