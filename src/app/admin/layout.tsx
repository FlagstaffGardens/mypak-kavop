import { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="px-8 py-4">
          <h1 className="text-2xl font-semibold">Platform Admin</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage organizations and users
          </p>
        </div>
      </div>

      <div className="px-8 py-6">{children}</div>
    </div>
  );
}
