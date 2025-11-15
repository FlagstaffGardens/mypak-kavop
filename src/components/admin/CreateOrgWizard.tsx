"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export function CreateOrgWizard() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 data
  const [orgName, setOrgName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [createdOrgId, setCreatedOrgId] = useState<string | null>(null);

  // Step 2 data
  const [emails, setEmails] = useState<string[]>([""]);
  const [createdUsers, setCreatedUsers] = useState<string[]>([]);

  async function handleStep1Submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate customer with Kavop API
      const validateResponse = await fetch(
        "/api/admin/organizations/validate-customer",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customerName }),
        }
      );

      const validateData = await validateResponse.json();

      if (!validateData.success) {
        setError(validateData.error || "Failed to validate customer");
        setLoading(false);
        return;
      }

      // Create organization
      const createResponse = await fetch("/api/admin/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_name: orgName,
          mypak_customer_name: customerName,
          kavop_token: validateData.token,
        }),
      });

      const createData = await createResponse.json();

      if (!createData.success) {
        setError(createData.error || "Failed to create organization");
        setLoading(false);
        return;
      }

      // Success! Move to step 2
      setCreatedOrgId(createData.organization.org_id);
      setStep(2);
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  function addEmailField() {
    setEmails([...emails, ""]);
  }

  function removeEmailField(index: number) {
    if (emails.length === 1) return;
    setEmails(emails.filter((_, i) => i !== index));
  }

  function updateEmail(index: number, value: string) {
    const updated = [...emails];
    updated[index] = value;
    setEmails(updated);
  }

  async function handleStep2Submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Filter out empty emails
    const validEmails = emails.filter((e) => e.trim() !== "");

    if (validEmails.length === 0) {
      // Skip user creation, go to org detail
      router.push(`/admin/organizations/${createdOrgId}`);
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/organizations/${createdOrgId}/users`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emails: validEmails }),
        }
      );

      const data = await response.json();

      if (!data.success) {
        setError(data.error || "Failed to send invitations");
        setLoading(false);
        return;
      }

      // Show invitation results
      setCreatedUsers(validEmails);
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  function handleSkip() {
    router.push(`/admin/organizations/${createdOrgId}`);
  }

  // Step 1: Organization Details
  if (step === 1) {
    return (
      <Card className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleStep1Submit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="orgName">Organization Name</Label>
              <Input
                id="orgName"
                placeholder="e.g., Acme Farms"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="customerName">MyPak Customer Name</Label>
              <Input
                id="customerName"
                placeholder="e.g., Aginbrook"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                This name will be used to fetch the Kavop token
              </p>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Validating..." : "Continue →"}
            </Button>
          </div>
        </form>
      </Card>
    );
  }

  // Step 2: Add Users Form
  if (step === 2 && createdUsers.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">
          Add Users to {orgName}
        </h3>
        <p className="text-sm text-gray-500 mb-6">Optional</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleStep2Submit}>
          <div className="space-y-3 mb-4">
            {emails.map((email, index) => (
              <div key={index} className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor={`email-${index}`}>Email Address</Label>
                  <Input
                    id={`email-${index}`}
                    type="email"
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => updateEmail(index, e.target.value)}
                  />
                </div>
                {emails.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeEmailField(index)}
                    className="mt-6"
                  >
                    × Remove
                  </Button>
                )}
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={addEmailField}
            className="mb-6"
          >
            + Add Another Email
          </Button>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleSkip}
              disabled={loading}
            >
              Skip for Now
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Creating..." : "Create Organization & Users →"}
            </Button>
          </div>
        </form>
      </Card>
    );
  }

  // Invitation Success Display
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

  return null;
}
