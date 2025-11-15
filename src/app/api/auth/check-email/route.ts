import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user, member } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { exists: false, error: "Email is required" },
        { status: 400 }
      );
    }

    // Check if user exists in Better Auth user table
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json({ exists: false });
    }

    // User exists - now check if they're a member of any organization
    const userMemberships = await db
      .select()
      .from(member)
      .where(eq(member.userId, existingUser[0].id))
      .limit(1);

    // Only allow sign-in if user is a member of at least one organization
    return NextResponse.json({
      exists: userMemberships.length > 0,
    });
  } catch (error) {
    console.error("Check email error:", error);
    return NextResponse.json(
      { exists: false, error: "Failed to check email" },
      { status: 500 }
    );
  }
}
