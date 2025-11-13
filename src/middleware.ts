import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "./lib/auth/jwt";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip middleware for:
  // - API routes (they handle their own auth)
  // - Static files
  // - Next.js internals
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // Public route - allow access without auth check
  if (pathname.startsWith("/sign-in")) {
    return NextResponse.next();
  }

  // Get current user from JWT
  const user = await getCurrentUser();

  // Require authentication for all other routes
  if (!user) {
    console.log("No user found for", pathname, "- redirecting to /sign-in");
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // Admin routes require platform_admin role
  if (pathname.startsWith("/admin")) {
    if (user.role !== "platform_admin") {
      console.log("Non-admin trying to access", pathname, "- redirecting to /");
      return NextResponse.redirect(new URL("/", request.url));
    }
    console.log("Admin accessing", pathname, "- allowing");
    return NextResponse.next();
  }

  // Platform admins should only access /admin routes
  if (user.role === "platform_admin") {
    console.log("Admin trying to access non-admin route", pathname, "- redirecting to /admin");
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Match all routes except static files and internals
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes - handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
