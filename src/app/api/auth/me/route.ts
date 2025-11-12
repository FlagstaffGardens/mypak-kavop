import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/jwt";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Fetch organization name if user has orgId
    let orgName = null;
    if (user.orgId) {
      const [org] = await db
        .select({ org_name: organizations.org_name })
        .from(organizations)
        .where(eq(organizations.org_id, user.orgId));

      orgName = org?.org_name || null;
    }

    return NextResponse.json({
      user: {
        ...user,
        orgName
      }
    });
  } catch (error) {
    console.error("Get current user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
