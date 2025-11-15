import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

async function setActiveOrg() {
  console.log("\n=== Setting active org for ethan@mypak.com session ===");

  // Update the session to set activeOrganizationId
  const result: any = await db.execute(sql`
    UPDATE session
    SET "activeOrganizationId" = 'org_821af073-16c1-4f4c-883b-0b626c9244b3'
    WHERE "userId" = 'usr_30273bad-e8ba-4734-8e0e-512a60f6e9a7'
    RETURNING id, "userId", "activeOrganizationId"
  `);

  const updated = result.rows || result;
  console.log(`Updated ${updated.length} session(s):`);
  updated.forEach((s: any) => {
    console.log(`  - Session ${s.id}`);
    console.log(`    Active Org: ${s.activeOrganizationId}`);
  });

  // Verify
  console.log("\n=== Verifying session ===");
  const verify: any = await db.execute(sql`
    SELECT s.*, u.email
    FROM session s
    JOIN "user" u ON s."userId" = u.id
    WHERE u.email = 'ethan@mypak.com'
  `);

  const sessions = verify.rows || verify;
  sessions.forEach((s: any) => {
    console.log(`  Email: ${s.email}`);
    console.log(`  Active Org ID: ${s.activeOrganizationId || 'NOT SET'}`);
  });

  process.exit(0);
}

setActiveOrg();
