import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { member } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();

  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session?.user) {
    redirect("/sign-in");
  }

  // Platform admins have full access
  const isPlatformAdmin = session.user.role === "admin";

  if (!isPlatformAdmin) {
    // For non-platform-admins, check if they're an owner of the active organization
    const activeOrgId = (session as { session?: { activeOrganizationId?: string } })?.session?.activeOrganizationId;

    if (!activeOrgId) {
      redirect("/");
    }

    const memberships = await db.query.member.findMany({
      where: and(
        eq(member.userId, session.user.id),
        eq(member.organizationId, activeOrgId),
      ),
    });

    const isOwner = memberships.some((m) => m.role === "owner");
    if (!isOwner) {
      redirect("/");
    }
  }

  return <div className="min-h-screen bg-gray-50">{children}</div>;
}
