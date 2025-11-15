import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";

const createOrgSchema = z.object({
  org_name: z.string().min(1, "Organization name is required"),
  mypak_customer_name: z.string().min(1, "MyPak customer name is required"),
  kavop_token: z.string().min(1, "Kavop token is required"),
});

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;
  if (!user || user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = createOrgSchema.parse(body);

    // Step 1: Create Better Auth organization
    let betterAuthOrg;
    try {
      betterAuthOrg = await auth.api.createOrganization({
        body: {
          name: data.org_name,
          slug: data.org_name.toLowerCase().replace(/\s+/g, "-"),
        },
        headers: await headers(), // Pass session context
      });
    } catch (authError: any) {
      // Check for specific Better Auth errors
      // Better Auth throws: message: "Organization already exists", code: "BAD_REQUEST"
      if (authError?.message === "Organization already exists" ||
          authError?.message?.includes("Organization already exists")) {
        return NextResponse.json(
          {
            success: false,
            error: "An organization with this name already exists. Please choose a different name."
          },
          { status: 409 }
        );
      }
      throw authError; // Re-throw if it's a different error
    }

    if (!betterAuthOrg) {
      return NextResponse.json(
        { success: false, error: "Failed to create Better Auth organization" },
        { status: 500 }
      );
    }

    // Step 2: Create business organization (ERP integration data)
    // Note: This is not a true transaction with Better Auth.
    // If this fails, the Better Auth org will be orphaned and require manual cleanup.
    try {
      const [org] = await db
        .insert(organizations)
        .values({
          org_name: data.org_name,
          mypak_customer_name: data.mypak_customer_name,
          kavop_token: data.kavop_token,
          better_auth_org_id: betterAuthOrg.id, // Link to Better Auth org
        })
        .returning();

      return NextResponse.json({
        success: true,
        organization: org,
      });
    } catch (dbError) {
      // Database insert failed - Better Auth org is now orphaned
      console.error(
        `[CRITICAL] DB insert failed. Orphaned Better Auth org ID: ${betterAuthOrg.id}`,
        dbError
      );
      // TODO: Add manual cleanup process for orphaned Better Auth organizations
      throw dbError;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Create organization error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create organization" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;
  if (!user || user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const orgs = await db.select().from(organizations);

    return NextResponse.json({
      success: true,
      organizations: orgs,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch organizations" },
      { status: 500 }
    );
  }
}
