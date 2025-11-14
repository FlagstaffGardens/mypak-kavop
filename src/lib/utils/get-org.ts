import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

/**
 * Get business org_id from Better Auth session
 * Maps: session activeOrganizationId → better_auth_org_id → org_id
 */
export async function getCurrentOrgId(): Promise<string | null> {
  const headersList = await headers();

  const session = await auth.api.getSession({
    headers: headersList,
  });

  // Access activeOrganizationId from session object (not user)
  const activeOrgId = (session as any)?.session?.activeOrganizationId;

  if (!activeOrgId) {
    return null;
  }

  const org = await db.query.organizations.findFirst({
    where: eq(
      organizations.better_auth_org_id,
      activeOrgId
    ),
  });

  return org?.org_id ? org.org_id.toString() : null;
}

/**
 * Get Better Auth session
 */
export async function getCurrentSession() {
  const headersList = await headers();

  return await auth.api.getSession({
    headers: headersList,
  });
}
