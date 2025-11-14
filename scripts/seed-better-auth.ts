import "dotenv/config";
import { db } from "../src/lib/db/index";
import { user, organization, member, organizations } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("🌱 Seeding Better Auth data...");

  // Create Better Auth organization
  const [betterAuthOrg] = await db
    .insert(organization)
    .values({
      id: `org_${crypto.randomUUID()}`,
      name: "MyPak Platform",
      slug: "mypak-platform",
      createdAt: new Date(),
    })
    .onConflictDoNothing()
    .returning();

  let orgToUse = betterAuthOrg;

  if (!betterAuthOrg) {
    console.log("✓ Organization already exists");
    const [existing] = await db
      .select()
      .from(organization)
      .where(eq(organization.slug, "mypak-platform"))
      .limit(1);
    if (!existing) throw new Error("Failed to find organization");
    orgToUse = existing;
  } else {
    console.log(`✓ Created organization: ${betterAuthOrg.name}`);
  }

  // Create business organization linked to Better Auth org
  const [businessOrg] = await db
    .insert(organizations)
    .values({
      org_name: "MyPak Platform",
      mypak_customer_name: "mypak_platform",
      kavop_token: "dev-token-123",
      better_auth_org_id: orgToUse.id,
    })
    .onConflictDoNothing()
    .returning();

  if (businessOrg) {
    console.log(`✓ Created business organization`);
  } else {
    console.log("✓ Business organization already exists");
  }

  // Create admin user
  const adminEmail = process.env.ADMIN_EMAIL || "ethan@mypak.com";
  const [adminUser] = await db
    .insert(user)
    .values({
      id: `usr_${crypto.randomUUID()}`,
      email: adminEmail,
      name: "Platform Admin",
      emailVerified: true,
      role: "admin", // Required for Better Auth admin plugin
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoNothing()
    .returning();

  let userToUse = adminUser;

  if (!adminUser) {
    console.log(`✓ Admin user already exists: ${adminEmail}`);
    // Get existing user
    const [existing] = await db
      .select()
      .from(user)
      .where(eq(user.email, adminEmail))
      .limit(1);
    if (!existing) throw new Error("Failed to find admin user");
    userToUse = existing;
  } else {
    console.log(`✓ Created admin user: ${adminEmail}`);
  }

  // Create owner membership (idempotent)
  await db
    .insert(member)
    .values({
      id: `mem_${crypto.randomUUID()}`,
      userId: userToUse.id,
      organizationId: orgToUse.id,
      role: "owner",
      createdAt: new Date(),
    })
    .onConflictDoNothing();

  console.log(`✓ Ensured owner membership for ${adminEmail}`);

  console.log("\n✨ Seeding complete!");
  console.log(`\nYou can now sign in with: ${adminEmail}`);
  console.log("Use Magic Link to authenticate.\n");
}

main()
  .catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
