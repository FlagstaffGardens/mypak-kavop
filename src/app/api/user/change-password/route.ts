import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/jwt";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { currentPassword, newPassword, confirmPassword } = body;

  if (newPassword !== confirmPassword) {
    return NextResponse.json({ error: "New passwords do not match" }, { status: 400 });
  }

  // Get user from database
  const [user] = await db.select().from(users).where(eq(users.id, currentUser.userId));

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Verify current password (plain-text comparison)
  if (user.password !== currentPassword) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
  }

  // Update password (plain-text)
  await db.update(users).set({ password: newPassword }).where(eq(users.id, currentUser.userId));

  return NextResponse.json({ success: true });
}
