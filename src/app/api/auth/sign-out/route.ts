import { NextResponse } from "next/server";
import { deleteAuthCookie } from "@/lib/auth/jwt";

export async function POST() {
  try {
    await deleteAuthCookie();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Sign-out error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
