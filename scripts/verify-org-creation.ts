/**
 * Verification script for Task 3: Organization creation with Better Auth
 *
 * This script verifies that:
 * 1. Creating a business org also creates a Better Auth org
 * 2. The business org is linked via better_auth_org_id
 * 3. The platform admin becomes the owner of the org
 */

import { db } from "../src/lib/db";
import { organizations, organization, member, user } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

async function verifyOrgCreation() {
  try {
    console.log("🔍 Verifying organization creation implementation...\n");

    // Step 1: Check if any organizations exist with better_auth_org_id
    const businessOrgs = await db
      .select()
      .from(organizations)
      .limit(5);

    console.log(`📊 Found ${businessOrgs.length} business organization(s)`);

    if (businessOrgs.length === 0) {
      console.log("⚠️  No organizations found. Create one via the UI to test.");
      process.exit(0);
    }

    // Step 2: For each business org, verify Better Auth org exists
    for (const businessOrg of businessOrgs) {
      console.log(`\n📦 Business Org: ${businessOrg.org_name}`);
      console.log(`   - org_id: ${businessOrg.org_id}`);
      console.log(`   - better_auth_org_id: ${businessOrg.better_auth_org_id}`);

      if (!businessOrg.better_auth_org_id) {
        console.log("   ❌ Missing better_auth_org_id (created before Task 3)");
        continue;
      }

      // Check if Better Auth org exists
      const [betterAuthOrg] = await db
        .select()
        .from(organization)
        .where(eq(organization.id, businessOrg.better_auth_org_id));

      if (betterAuthOrg) {
        console.log(`   ✅ Better Auth org exists: ${betterAuthOrg.name}`);
        console.log(`      - slug: ${betterAuthOrg.slug}`);
        console.log(`      - created: ${betterAuthOrg.createdAt}`);

        // Check members
        const members = await db
          .select({
            memberId: member.id,
            role: member.role,
            userId: member.userId,
            userName: user.name,
            userEmail: user.email,
          })
          .from(member)
          .innerJoin(user, eq(member.userId, user.id))
          .where(eq(member.organizationId, businessOrg.better_auth_org_id));

        console.log(`\n   👥 Members (${members.length}):`);
        for (const m of members) {
          console.log(`      - ${m.userName} (${m.userEmail}) - ${m.role}`);
        }

        // Check if there's an owner
        const owner = members.find(m => m.role === "owner");
        if (owner) {
          console.log(`   ✅ Owner found: ${owner.userName}`);
        } else {
          console.log(`   ⚠️  No owner found for this org`);
        }
      } else {
        console.log(`   ❌ Better Auth org NOT FOUND (data inconsistency!)`);
      }
    }

    console.log("\n✅ Verification complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Verification error:", error);
    process.exit(1);
  }
}

verifyOrgCreation();
