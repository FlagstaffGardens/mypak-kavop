import { NextRequest, NextResponse } from "next/server";
import { fetchKavopToken } from "@/lib/api/kavop";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";

const schema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
});

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "platform_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { customerName } = schema.parse(body);

    const result = await fetchKavopToken(customerName);

    if (result.success) {
      return NextResponse.json({
        success: true,
        token: result.token,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
