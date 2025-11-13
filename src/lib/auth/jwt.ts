import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

// JWT payload structure
export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  role: "platform_admin" | "org_user";
  orgId: string | null;
  [key: string]: unknown;
}

// Get secret as Uint8Array for jose
const getSecret = () => {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
};

// Cookie name
const COOKIE_NAME = "auth_token";

/**
 * Sign a JWT with user data
 * @param payload User data to encode in JWT
 * @param rememberMe If true, token expires in 1 year. Otherwise 7 days.
 */
export async function signJWT(
  payload: JWTPayload,
  rememberMe: boolean = false
): Promise<string> {
  const expiresIn = rememberMe ? "365d" : "7d";

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecret());

  return token;
}

/**
 * Verify and decode a JWT
 * @param token JWT string to verify
 * @returns Decoded payload if valid, null if invalid/expired
 */
export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as JWTPayload;
  } catch (error) {
    // Token invalid or expired
    return null;
  }
}

/**
 * Set auth cookie with JWT
 * @param token JWT string
 * @param rememberMe If true, cookie expires in 1 year. Otherwise 7 days.
 */
export async function setAuthCookie(
  token: string,
  rememberMe: boolean = false
) {
  const cookieStore = await cookies();
  const maxAge = rememberMe ? 365 * 24 * 60 * 60 : 7 * 24 * 60 * 60; // seconds

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true, // Cannot be accessed by JavaScript
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    sameSite: "lax", // CSRF protection
    maxAge,
    path: "/",
  });
}

/**
 * Get auth token from cookie
 * @returns JWT string if exists, null otherwise
 */
export async function getAuthCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  return cookie?.value || null;
}

/**
 * Delete auth cookie (logout)
 */
export async function deleteAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Get current user from cookie
 * @returns User payload if authenticated, null otherwise
 */
export async function getCurrentUser(): Promise<JWTPayload | null> {
  const token = await getAuthCookie();
  if (!token) return null;

  return verifyJWT(token);
}
