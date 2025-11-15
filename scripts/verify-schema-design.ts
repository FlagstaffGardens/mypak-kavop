import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

async function verifySchemaDesign() {
  console.log("\n=== VERIFYING DATABASE SCHEMA DESIGN ===\n");

  // Check organization (Better Auth) table
  console.log("1. Better Auth 'organization' table:");
  const orgsResult: any = await db.execute(sql`
    SELECT id, name, slug, "createdAt"
    FROM organization
    ORDER BY "createdAt" DESC
  `);

  const orgs = orgsResult.rows || orgsResult;
  console.log(`   Found ${orgs.length} organizations:`);
  orgs.forEach((org: any) => {
    console.log(`   - ${org.name} (id: ${org.id}, slug: ${org.slug})`);
  });

  // Check organizations (Business) table
  console.log("\n2. Business 'organizations' table:");
  const bizOrgsResult: any = await db.execute(sql`
    SELECT org_id, org_name, better_auth_org_id, mypak_customer_name, kavop_token
    FROM organizations
    ORDER BY created_at DESC
  `);

  const bizOrgs = bizOrgsResult.rows || bizOrgsResult;
  console.log(`   Found ${bizOrgs.length} business organizations:`);
  bizOrgs.forEach((org: any) => {
    console.log(`   - ${org.org_name}`);
    console.log(`     Business ID: ${org.org_id}`);
    console.log(`     Linked to Better Auth: ${org.better_auth_org_id}`);
    console.log(`     MyPak Customer: ${org.mypak_customer_name}`);
    console.log(`     Has Token: ${org.kavop_token ? 'YES' : 'NO'}`);
  });

  // Verify the linking
  console.log("\n3. Verifying organization → organizations linking:");
  const linkedResult: any = await db.execute(sql`
    SELECT
      o.id as better_auth_id,
      o.name as better_auth_name,
      bo.org_id as business_id,
      bo.org_name as business_name,
      bo.mypak_customer_name
    FROM organization o
    INNER JOIN organizations bo ON o.id = bo.better_auth_org_id
    ORDER BY o."createdAt" DESC
  `);

  const linked = linkedResult.rows || linkedResult;
  console.log(`   ${linked.length} organizations properly linked:`);
  linked.forEach((link: any) => {
    console.log(`   ✅ "${link.better_auth_name}" → "${link.business_name}"`);
    console.log(`      Better Auth ID: ${link.better_auth_id}`);
    console.log(`      Business ID: ${link.business_id}`);
  });

  // Check for orphans
  console.log("\n4. Checking for orphaned records:");

  const orphanedBetterAuthResult: any = await db.execute(sql`
    SELECT o.id, o.name
    FROM organization o
    LEFT JOIN organizations bo ON o.id = bo.better_auth_org_id
    WHERE bo.org_id IS NULL
  `);

  const orphanedBetterAuth = orphanedBetterAuthResult.rows || orphanedBetterAuthResult;
  if (orphanedBetterAuth.length > 0) {
    console.log(`   ⚠️  Found ${orphanedBetterAuth.length} Better Auth orgs WITHOUT business records:`);
    orphanedBetterAuth.forEach((org: any) => {
      console.log(`      - ${org.name} (${org.id})`);
    });
  } else {
    console.log(`   ✅ No orphaned Better Auth organizations`);
  }

  const orphanedBusinessResult: any = await db.execute(sql`
    SELECT bo.org_id, bo.org_name, bo.better_auth_org_id
    FROM organizations bo
    LEFT JOIN organization o ON o.id = bo.better_auth_org_id
    WHERE o.id IS NULL
  `);

  const orphanedBusiness = orphanedBusinessResult.rows || orphanedBusinessResult;
  if (orphanedBusiness.length > 0) {
    console.log(`   ⚠️  Found ${orphanedBusiness.length} business orgs WITHOUT Better Auth records:`);
    orphanedBusiness.forEach((org: any) => {
      console.log(`      - ${org.org_name} (${org.org_id})`);
    });
  } else {
    console.log(`   ✅ No orphaned business organizations`);
  }

  // Summary
  console.log("\n=== SUMMARY ===\n");
  console.log("Why we have BOTH tables:");
  console.log("  • 'organization' = Better Auth table (permissions, memberships)");
  console.log("  • 'organizations' = Business table (ERP tokens, customer names)");
  console.log("  • Linked by: organizations.better_auth_org_id → organization.id");
  console.log("\nThis is INTENTIONAL and REQUIRED!");
  console.log("  ✅ Better Auth manages authentication & permissions");
  console.log("  ✅ Business table stores ERP integration data");
  console.log("  ✅ They work together - cannot delete either one");

  process.exit(0);
}

verifySchemaDesign();
