import { db } from "@/lib/db";
import { user, member, organization } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

async function verifyEthanAdmin() {
  console.log("\n=== Verifying ethan@mypak.com admin status ===\n");

  // Check user role
  const ethanUser = await db
    .select()
    .from(user)
    .where(eq(user.email, "ethan@mypak.com"))
    .limit(1);

  if (ethanUser.length === 0) {
    console.log("❌ ERROR: ethan@mypak.com not found in user table!");
    process.exit(1);
  }

  console.log("USER TABLE:");
  console.log(`  Email: ${ethanUser[0].email}`);
  console.log(`  Name: ${ethanUser[0].name}`);
  console.log(`  Role: ${ethanUser[0].role || 'NONE'}`);
  console.log(`  Platform Admin: ${ethanUser[0].role === 'admin' ? '✅ YES' : '❌ NO'}`);
  console.log(`  User ID: ${ethanUser[0].id}`);

  // Check organization memberships
  const memberships = await db
    .select({
      memberRole: member.role,
      orgId: organization.id,
      orgName: organization.name,
      orgSlug: organization.slug,
    })
    .from(member)
    .innerJoin(organization, eq(organization.id, member.organizationId))
    .where(eq(member.userId, ethanUser[0].id));

  console.log(`\nORGANIZATION MEMBERSHIPS:`);
  if (memberships.length === 0) {
    console.log("  ❌ NO ORGANIZATIONS FOUND!");
  } else {
    memberships.forEach((m, i) => {
      console.log(`\n  Organization ${i + 1}:`);
      console.log(`    Name: ${m.orgName}`);
      console.log(`    Slug: ${m.orgSlug}`);
      console.log(`    Role: ${m.memberRole}`);
      console.log(`    Is Owner: ${m.memberRole === 'owner' ? '✅ YES' : '❌ NO'}`);
      console.log(`    Org ID: ${m.orgId}`);
    });
  }

  // Summary
  console.log("\n=== SUMMARY ===\n");
  const isPlatformAdmin = ethanUser[0].role === 'admin';
  const isOrgOwner = memberships.some(m => m.memberRole === 'owner');
  const hasOrgAccess = memberships.length > 0;

  console.log(`Platform Admin (user.role = "admin"): ${isPlatformAdmin ? '✅ YES' : '❌ NO'}`);
  console.log(`Organization Owner (member.role = "owner"): ${isOrgOwner ? '✅ YES' : '❌ NO'}`);
  console.log(`Has Organization Access: ${hasOrgAccess ? '✅ YES' : '❌ NO'}`);
  console.log(`Can Access Dashboard: ${hasOrgAccess ? '✅ YES' : '❌ NO'}`);
  console.log(`Can Access Admin Panel: ${isPlatformAdmin ? '✅ YES' : '❌ NO'}`);

  if (isPlatformAdmin && isOrgOwner && hasOrgAccess) {
    console.log("\n✅ ALL CHECKS PASSED - ethan@mypak.com has full access!");
  } else {
    console.log("\n⚠️  MISSING PERMISSIONS!");
    if (!isPlatformAdmin) console.log("  - NOT a platform admin");
    if (!isOrgOwner) console.log("  - NOT an organization owner");
    if (!hasOrgAccess) console.log("  - NO organization access");
  }

  process.exit(0);
}

verifyEthanAdmin();
