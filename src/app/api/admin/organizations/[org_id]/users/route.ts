import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import { eq } from "drizzle-orm";

const createUsersSchema = z.object({
  emails: z.array(z.string().email("Invalid email format")).min(1),
  role: z.enum(["owner", "admin", "member"]).default("member"),
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
    const { emails, role } = createUsersSchema.parse(body);

    // Get business org to find Better Auth org ID
    const [businessOrg] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.org_id, org_id));

    if (!businessOrg || !businessOrg.better_auth_org_id) {
      return NextResponse.json(
        { error: "Organization not found or not linked to Better Auth" },
        { status: 404 }
      );
    }

    // Send invitations via Better Auth
    const invitations = await Promise.all(
      emails.map(async (email) => {
        return await auth.api.inviteUser({
          body: {
            email,
            organizationId: businessOrg.better_auth_org_id!,
            role,
            inviterId: user.id,
          },
        });
      })
    );

    return NextResponse.json({
      success: true,
      invitations,
      message: `${emails.length} invitation(s) sent via email`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Invite users error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send invitations" },
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

    // Get business org to find Better Auth org ID
    const [businessOrg] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.org_id, org_id));

    if (!businessOrg || !businessOrg.better_auth_org_id) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Get organization members from Better Auth
    const members = await auth.api.listOrganizationMembers({
      query: {
        organizationId: businessOrg.better_auth_org_id,
      },
    });

    return NextResponse.json({
      success: true,
      members,
    });
  } catch (error) {
    console.error("Get org members error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}
