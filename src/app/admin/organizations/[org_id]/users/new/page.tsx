"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import Link from "next/link";

export default function AddUsersPage({
  params,
}: {
  params: Promise<{ org_id: string }>;
}) {
  const router = useRouter();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emails, setEmails] = useState<string[]>([""]);
  const [createdUsers, setCreatedUsers] = useState<{ email: string; password: string }[]>([]);
  const [copiedPassword, setCopiedPassword] = useState<string | null>(null);

  // Unwrap params
  useState(() => {
    params.then((p) => setOrgId(p.org_id));
  });

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orgId) return;

    setLoading(true);
    setError(null);

    const validEmails = emails.filter((e) => e.trim() !== "");

    if (validEmails.length === 0) {
      setError("Please enter at least one email address");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/organizations/${orgId}/users`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emails: validEmails }),
        }
      );

      const data = await response.json();

      if (!data.success) {
        setError(data.error || "Failed to create users");
        setLoading(false);
        return;
      }

      setCreatedUsers(data.users);
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function copyPassword(password: string) {
    await navigator.clipboard.writeText(password);
    setCopiedPassword(password);
    setTimeout(() => setCopiedPassword(null), 2000);
  }

  if (!orgId) {
    return <div>Loading...</div>;
  }

  if (createdUsers.length > 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="p-6">
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded">
            <p className="text-green-800 font-medium">
              ✓ {createdUsers.length} users created successfully
            </p>
            <p className="text-sm text-green-700 mt-1">
              Copy these passwords and share them with your users.
            </p>
          </div>

          <div className="mb-6 border rounded">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Password
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {createdUsers.map((user) => (
                  <tr key={user.user_id} className="border-b last:border-0">
                    <td className="px-4 py-3 text-sm">{user.name}</td>
                    <td className="px-4 py-3 text-sm">{user.email}</td>
                    <td className="px-4 py-3 text-sm font-mono">
                      {user.password}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyPassword(user.password)}
                      >
                        {copiedPassword === user.password ? "Copied!" : "Copy"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Button
            onClick={() =>
              router.push(`/admin/organizations/${orgId}`)
            }
            className="w-full"
          >
            Back to Organization →
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href={`/admin/organizations/${orgId}`}
        className="text-sm text-blue-600 hover:underline mb-4 inline-block"
      >
        ← Back to Organization
      </Link>

      <h2 className="text-2xl font-semibold mb-6">Add Users</h2>

      <Card className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
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

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating..." : "Create Users →"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
