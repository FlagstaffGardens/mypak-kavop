import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { member } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    // Get current session
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get user's organizations
    const memberships = await db
      .select()
      .from(member)
      .where(eq(member.userId, session.user.id));

    if (memberships.length === 0) {
      return NextResponse.json(
        { error: "No organizations found" },
        { status: 404 }
      );
    }

    // If user has only one org, set it as active
    if (memberships.length === 1) {
      const orgId = memberships[0].organizationId;

      // Use Better Auth API to set active org
      await auth.api.setActiveOrganization({
        headers: await headers(),
        body: { organizationId: orgId },
      });

      return NextResponse.json({
        success: true,
        organizationId: orgId
      });
    }

    // Multiple orgs - return them for user to choose
    return NextResponse.json({
      success: false,
      message: "Multiple organizations found",
      organizations: memberships.map(m => m.organizationId),
    });
  } catch (error) {
    console.error("Set active org error:", error);
    return NextResponse.json(
      { error: "Failed to set active organization" },
      { status: 500 }
    );
  }
}
