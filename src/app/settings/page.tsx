"use client";

import { useSession } from "@/lib/auth-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  const { data: session, isPending } = useSession();
  const user = session?.user;

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <div className="space-y-6">
        {/* User Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-gray-500">Name</Label>
              <p className="text-lg font-medium">{user.name}</p>
            </div>
            <div>
              <Label className="text-gray-500">Email</Label>
              <p className="text-lg font-medium">{user.email}</p>
            </div>
            <div>
              <Label className="text-gray-500">Role</Label>
              <p className="text-lg font-medium">
                {user?.role === "admin" ? "Platform Admin" : "Organization User"}
              </p>
            </div>
            <div>
              <Label className="text-gray-500">Authentication</Label>
              <p className="text-sm text-gray-600">
                Sign in with Magic Link (passwordless)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
