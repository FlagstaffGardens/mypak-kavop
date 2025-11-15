import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function fixAdmin() {
  console.log("\n=== Fixing admin configuration ===");

  // Make ethan@mypak.com the platform admin
  const result = await db
    .update(user)
    .set({ role: "admin" })
    .where(eq(user.email, "ethan@mypak.com"))
    .returning();

  if (result.length === 0) {
    console.log("ERROR: ethan@mypak.com not found!");
    process.exit(1);
  }

  console.log("✓ Updated ethan@mypak.com to platform admin");
  console.log(`  - ID: ${result[0].id}`);
  console.log(`  - Email: ${result[0].email}`);
  console.log(`  - Role: ${result[0].role}`);

  // Verify final state
  console.log("\n=== Final admin users ===");
  const admins = await db.select().from(user).where(eq(user.role, "admin"));
  admins.forEach(a => {
    console.log(`  - ${a.email} (id: ${a.id})`);
  });

  process.exit(0);
}

fixAdmin();
