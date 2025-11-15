import { db } from "@/lib/db";
import { session, member } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

async function checkSessions() {
  console.log("\n=== Checking sessions for ethan@mypak.com ===");

  const result: any = await db.execute(sql`
    SELECT s.*, u.email
    FROM session s
    JOIN "user" u ON s."userId" = u.id
    WHERE u.email = 'ethan@mypak.com'
    ORDER BY s."createdAt" DESC
    LIMIT 5
  `);

  const sessions = result.rows || result;
  console.log(`Found ${sessions.length} sessions:`);
  sessions.forEach((s: any) => {
    console.log(`\n  Session ID: ${s.id}`);
    console.log(`  User ID: ${s.userId}`);
    console.log(`  Email: ${s.email}`);
    console.log(`  Active Org ID: ${s.activeOrganizationId || 'NOT SET ❌'}`);
    console.log(`  Impersonated: ${s.impersonatedBy || 'No'}`);
    console.log(`  Created: ${s.createdAt}`);
  });

  // Check memberships
  console.log("\n=== Checking org memberships for ethan@mypak.com ===");
  const memberships: any = await db.execute(sql`
    SELECT m.*, u.email, o.name as org_name, o.id as org_id
    FROM member m
    JOIN "user" u ON m."userId" = u.id
    JOIN organization o ON m."organizationId" = o.id
    WHERE u.email = 'ethan@mypak.com'
  `);

  const memberRows = memberships.rows || memberships;
  console.log(`Found ${memberRows.length} memberships:`);
  memberRows.forEach((m: any) => {
    console.log(`  - ${m.role} in ${m.org_name} (org_id: ${m.org_id})`);
  });

  process.exit(0);
}

checkSessions();
