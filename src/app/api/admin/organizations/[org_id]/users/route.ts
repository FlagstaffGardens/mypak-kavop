import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { generatePassword } from "@/lib/utils/password";
import { generateNameFromEmail } from "@/lib/utils/name";
import { z } from "zod";
import { eq } from "drizzle-orm";

const createUsersSchema = z.object({
  emails: z.array(z.string().email("Invalid email format")).min(1),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ org_id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;
  if (!user || user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { org_id } = await params;
    const body = await request.json();
    const { emails } = createUsersSchema.parse(body);

    // Generate users data
    // NOTE: Password field is DEPRECATED - Better Auth handles all authentication
    // Passwords are generated here only for legacy schema compatibility
    const usersData = emails.map((email) => ({
      user_id: crypto.randomUUID(),
      org_id: org_id,
      email,
      name: generateNameFromEmail(email),
      password: generatePassword(16), // DEPRECATED: Not used for auth
      role: "org_user" as const,
    }));

    // Insert all users
    const createdUsers = await db
      .insert(users)
      .values(usersData)
      .returning();

    // SECURITY: Remove passwords from API response
    const safeUsers = createdUsers.map(({ password, ...user }) => user);

    return NextResponse.json({
      success: true,
      users: safeUsers,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create users" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ org_id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;
  if (!user || user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { org_id } = await params;
    const orgUsers = await db
      .select()
      .from(users)
      .where(eq(users.org_id, org_id));

    return NextResponse.json({
      success: true,
      users: orgUsers,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
