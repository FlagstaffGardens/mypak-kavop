import { NextRequest, NextResponse } from "next/server";
import { auth } from "./lib/auth";
import { headers } from "next/headers";

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const pathname = request.nextUrl.pathname;

  // Public route - allow access
  if (pathname.startsWith("/sign-in")) {
    return NextResponse.next();
  }

  // Require authentication for all other routes
  if (!session) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // Admin routes require platform_admin role
  if (pathname.startsWith("/admin")) {
    if (session.user.role !== "platform_admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  runtime: "nodejs",
  matcher: ["/", "/orders/:path*", "/admin/:path*", "/settings/:path*"],
};
