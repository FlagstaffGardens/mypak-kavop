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
  if (!session || session.user.role !== "platform_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = createOrgSchema.parse(body);

    const [org] = await db
      .insert(organizations)
      .values({
        org_name: data.org_name,
        mypak_customer_name: data.mypak_customer_name,
        kavop_token: data.kavop_token,
      })
      .returning();

    return NextResponse.json({
      success: true,
      organization: org,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create organization" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "platform_admin") {
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
