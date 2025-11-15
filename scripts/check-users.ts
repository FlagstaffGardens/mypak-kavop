import { db } from "@/lib/db";
import { user, member, organization } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

async function checkUsers() {
  console.log("\n=== Checking Better Auth 'user' table ===");
  try {
    const users = await db.select().from(user);
    console.log(`Found ${users.length} users in 'user' table:`);
    users.forEach(u => {
      console.log(`  - ${u.email} (role: ${u.role || 'none'}, id: ${u.id})`);
    });
  } catch (error) {
    console.log("Error querying 'user' table:", error);
  }

  console.log("\n=== Checking legacy 'users' table ===");
  try {
    const legacyUsers = await db.execute(sql`SELECT * FROM users`);
    console.log(`Found ${legacyUsers.rows.length} users in 'users' table:`);
    legacyUsers.rows.forEach((u: any) => {
      console.log(`  - ${u.email} (id: ${u.id})`);
    });
  } catch (error) {
    console.log("No 'users' table found or error:", (error as Error).message);
  }

  console.log("\n=== Checking organization memberships ===");
  try {
    const memberships = await db
      .select({
        userId: member.userId,
        userEmail: user.email,
        orgId: organization.id,
        orgName: organization.name,
        role: member.role,
      })
      .from(member)
      .innerJoin(user, sql`${user.id} = ${member.userId}`)
      .innerJoin(organization, sql`${organization.id} = ${member.organizationId}`);

    console.log(`Found ${memberships.length} memberships:`);
    memberships.forEach(m => {
      console.log(`  - ${m.userEmail} is ${m.role} in ${m.orgName}`);
    });
  } catch (error) {
    console.log("Error querying memberships:", error);
  }

  process.exit(0);
}

checkUsers();
