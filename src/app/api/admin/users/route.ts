import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user, member } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();

    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is owner of the ACTIVE organization
    const activeOrgId = (session as any)?.session?.activeOrganizationId;

    if (!activeOrgId) {
      return NextResponse.json({ error: "No active organization" }, { status: 400 });
    }

    const memberships = await db.query.member.findMany({
      where: and(
        eq(member.userId, session.user.id),
        eq(member.organizationId, activeOrgId),
      ),
    });

    const isOwner = memberships.some((m) => m.role === "owner");
    if (!isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all users
    const users = await db.select().from(user);

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
