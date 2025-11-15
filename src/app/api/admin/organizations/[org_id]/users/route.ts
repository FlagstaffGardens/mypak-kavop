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

    // Platform admins can invite to any org - bypass Better Auth API and use database directly
    const { invitation } = await import("@/lib/db/schema");
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    const invitations = await Promise.all(
      emails.map(async (email) => {
        // Generate invitation ID (used as token)
        const invitationId = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        // Create invitation in database
        const [inv] = await db
          .insert(invitation)
          .values({
            id: invitationId,
            organizationId: businessOrg.better_auth_org_id!,
            email,
            role,
            status: "pending",
            expiresAt,
            inviterId: user.id,
          })
          .returning();

        // Send invitation email (Better Auth client-side acceptance)
        const inviteUrl = `${process.env.BETTER_AUTH_URL}/accept-invitation?id=${invitationId}`;

        try {
          await resend.emails.send({
            from: "MyPak - Kavop <noreply@mypak.kavop.com>",
            to: email,
            subject: `You've been invited to join ${businessOrg.org_name}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                  <h1 style="color: white; margin: 0;">MyPak - Kavop</h1>
                </div>
                <div style="padding: 30px; background: #f9fafb;">
                  <h2 style="color: #1f2937; margin-top: 0;">Organization Invitation</h2>
                  <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">
                    You've been invited to join <strong>${businessOrg.org_name}</strong> on MyPak - Kavop.
                  </p>
                  <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">
                    Role: <strong>${role}</strong>
                  </p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${inviteUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
                      Accept Invitation
                    </a>
                  </div>
                  <p style="color: #6b7280; font-size: 14px;">
                    This invitation will expire in 7 days.
                  </p>
                </div>
                <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
                  <p>© 2025 MyPak - Kavop. All rights reserved.</p>
                </div>
              </div>
            `,
          });
        } catch (emailError) {
          console.error("Failed to send invitation email:", emailError);
          throw new Error(`Failed to send email to ${email}`);
        }

        return inv;
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
    const { members, total } = await auth.api.listMembers({
      query: {
        organizationId: businessOrg.better_auth_org_id,
      },
      headers: await headers(),
    });

    return NextResponse.json({
      success: true,
      members,
      total,
    });
  } catch (error) {
    console.error("Get org members error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}
