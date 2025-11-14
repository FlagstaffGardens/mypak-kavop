import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
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

    // ONLY platform admins can list all users for impersonation
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden - Platform admin only" }, { status: 403 });
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
