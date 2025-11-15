import { db } from "@/lib/db";
import { user, session, verification } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function deleteAdminMypak() {
  console.log("=== Deleting admin@mypak.com ===\n");

  // Find the user
  const adminUser = await db
    .select()
    .from(user)
    .where(eq(user.email, "admin@mypak.com"));

  if (adminUser.length === 0) {
    console.log("❌ admin@mypak.com does not exist - nothing to delete");
    process.exit(0);
  }

  const userId = adminUser[0].id;
  console.log(`Found user: ${adminUser[0].email} (${userId})`);

  // Delete related sessions (CASCADE should handle this, but being explicit)
  const deletedSessions = await db
    .delete(session)
    .where(eq(session.userId, userId))
    .returning();
  console.log(`✓ Deleted ${deletedSessions.length} sessions`);

  // Delete related verifications (OTP codes, etc.)
  const deletedVerifications = await db
    .delete(verification)
    .where(eq(verification.identifier, "admin@mypak.com"))
    .returning();
  console.log(`✓ Deleted ${deletedVerifications.length} verification records`);

  // Delete the user (this should CASCADE delete sessions via foreign key)
  await db.delete(user).where(eq(user.id, userId));
  console.log(`✓ Deleted user admin@mypak.com`);

  // Verify deletion
  const check = await db
    .select()
    .from(user)
    .where(eq(user.email, "admin@mypak.com"));

  if (check.length === 0) {
    console.log("\n✅ admin@mypak.com successfully deleted!");
  } else {
    console.log("\n❌ Deletion failed - user still exists");
  }

  process.exit(0);
}

deleteAdminMypak();
