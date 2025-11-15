import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Public routes
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/sign-in")
  ) {
    return NextResponse.next();
  }

  // Check for Better Auth session cookie
  const sessionCookie = request.cookies.get("better-auth.session_token");

  if (!sessionCookie) {
    console.log("No session cookie found, redirecting to /sign-in");
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // Let route handlers do heavy auth checks
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
