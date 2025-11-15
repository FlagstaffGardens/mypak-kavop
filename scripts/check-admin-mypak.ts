import { db } from "@/lib/db";
import { user, member, organization } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function checkAdmin() {
  console.log("=== Checking admin@mypak.com ===\n");

  const adminUser = await db
    .select()
    .from(user)
    .where(eq(user.email, "admin@mypak.com"));

  if (adminUser.length === 0) {
    console.log("❌ admin@mypak.com does not exist");
    process.exit(0);
  }

  console.log("User:", adminUser[0]);

  const memberships = await db
    .select({
      memberId: member.id,
      role: member.role,
      orgId: member.organizationId,
      orgName: organization.name,
    })
    .from(member)
    .innerJoin(organization, eq(organization.id, member.organizationId))
    .where(eq(member.userId, adminUser[0].id));

  console.log("\nMemberships:", memberships);

  process.exit(0);
}

checkAdmin();
