import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { member } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
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

  // Check if user is owner
  const activeOrgId = (session as any)?.session?.activeOrganizationId;

  if (activeOrgId) {
    const memberships = await db.query.member.findMany({
      where: eq(member.userId, session.user.id),
    });

    const isOwner = memberships.some((m) => m.role === "owner");
    if (!isOwner) {
      redirect("/");
    }
  } else {
    redirect("/");
  }

  return <div className="min-h-screen bg-gray-50">{children}</div>;
}
