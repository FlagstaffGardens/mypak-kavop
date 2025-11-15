import { db } from "@/lib/db";
import { user, member, organization } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function checkJax() {
  console.log("=== Checking jax31273@gmail.com ===\n");

  const jaxUser = await db
    .select()
    .from(user)
    .where(eq(user.email, "jax31273@gmail.com"));

  if (jaxUser.length === 0) {
    console.log("❌ jax31273@gmail.com does not exist");
    process.exit(0);
  }

  console.log("User:");
  console.log(`  Email: ${jaxUser[0].email}`);
  console.log(`  Name: ${jaxUser[0].name}`);
  console.log(`  Role: ${jaxUser[0].role}`);
  console.log(`  Platform Admin: ${jaxUser[0].role === 'admin' ? '✅ YES' : '❌ NO'}`);

  const memberships = await db
    .select({
      role: member.role,
      orgName: organization.name,
      orgId: organization.id,
    })
    .from(member)
    .innerJoin(organization, eq(organization.id, member.organizationId))
    .where(eq(member.userId, jaxUser[0].id));

  if (memberships.length === 0) {
    console.log("\nMemberships: NONE");
  } else {
    console.log(`\nMemberships: ${memberships.length}`);
    memberships.forEach((m) => {
      console.log(`  - ${m.orgName} (${m.role})`);
    });
  }

  process.exit(0);
}

checkJax();
