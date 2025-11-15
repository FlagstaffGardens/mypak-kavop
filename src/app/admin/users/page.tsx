"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";

interface User {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
}

export default function AdminUsersPage() {
  const { data: session } = authClient.useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => {
        setUsers(data.users || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleImpersonate(userId: string) {
    try {
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) throw new Error("Failed to impersonate");

      await authClient.admin.impersonateUser({ userId });
      window.location.href = "/";
    } catch (err) {
      alert("Failed to impersonate user");
    }
  }

  async function handleStopImpersonation() {
    await authClient.admin.stopImpersonating();
    window.location.href = "/admin/users";
  }

  const isImpersonating = (session?.session as { impersonatedBy?: string })?.impersonatedBy;

  return (
    <div className="mx-auto max-w-7xl p-8">
      {isImpersonating && session && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 p-3 text-center font-bold text-white shadow-lg">
          � Viewing as {session.user.name} ({session.user.email})
          <button
            onClick={handleStopImpersonation}
            className="ml-4 rounded bg-white px-3 py-1 text-sm text-amber-900 hover:bg-gray-100"
          >
            Stop Impersonation
          </button>
        </div>
      )}

      <div className={isImpersonating ? "mt-16" : ""}>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          User Management
        </h1>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading users...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{user.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{user.name}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.emailVerified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {user.emailVerified ? "Verified" : "Pending"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => handleImpersonate(user.id)}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          Impersonate
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
