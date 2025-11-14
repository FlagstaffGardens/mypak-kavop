import "dotenv/config";
import { Pool } from "pg";

async function main() {
  console.log("🔧 Applying admin fields and performance indexes...\n");

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Add admin plugin fields to user table
    console.log("Adding admin plugin fields to user table...");
    await pool.query(`
      ALTER TABLE "user"
        ADD COLUMN IF NOT EXISTS "role" text,
        ADD COLUMN IF NOT EXISTS "banned" boolean DEFAULT false NOT NULL,
        ADD COLUMN IF NOT EXISTS "banReason" text,
        ADD COLUMN IF NOT EXISTS "banExpires" timestamp;
    `);

    // Add session indexes
    console.log("Adding indexes to session table...");
    await pool.query(`
      CREATE INDEX IF NOT EXISTS "idx_session_user" ON "session" ("userId");
      CREATE INDEX IF NOT EXISTS "idx_session_expires_at" ON "session" ("expiresAt");
    `);

    // Add account indexes
    console.log("Adding indexes to account table...");
    await pool.query(`
      CREATE INDEX IF NOT EXISTS "idx_account_user" ON "account" ("userId");
      CREATE INDEX IF NOT EXISTS "idx_account_provider" ON "account" ("providerId", "accountId");
    `);

    // Add verification indexes
    console.log("Adding indexes to verification table...");
    await pool.query(`
      CREATE INDEX IF NOT EXISTS "idx_verification_identifier" ON "verification" ("identifier");
      CREATE INDEX IF NOT EXISTS "idx_verification_expires_at" ON "verification" ("expiresAt");
    `);

    // Add member index (userId)
    console.log("Adding userId index to member table...");
    await pool.query(`
      CREATE INDEX IF NOT EXISTS "idx_member_user" ON "member" ("userId");
    `);

    // Add invitation indexes
    console.log("Adding indexes to invitation table...");
    await pool.query(`
      CREATE INDEX IF NOT EXISTS "idx_invitation_org" ON "invitation" ("organizationId");
      CREATE INDEX IF NOT EXISTS "idx_invitation_email" ON "invitation" ("email");
    `);

    console.log("\n✅ All admin fields and indexes applied successfully!\n");

    // Verify admin fields
    const userCols = await pool.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'user' AND column_name IN ('role', 'banned', 'banReason', 'banExpires')
      ORDER BY column_name
    `);

    // Verify indexes
    const indexes = await pool.query(`
      SELECT indexname FROM pg_indexes
      WHERE tablename IN ('session', 'account', 'verification', 'member', 'invitation')
        AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname
    `);

    console.log("Verification:");
    console.log(`  ✓ Admin fields on user: ${userCols.rows.length} of 4 added`);
    userCols.rows.forEach(row => console.log(`    - ${row.column_name}`));

    console.log(`\n  ✓ Performance indexes: ${indexes.rows.length} created`);
    indexes.rows.forEach(row => console.log(`    - ${row.indexname}`));

  } catch (error: any) {
    console.error("❌ Migration failed:", error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

main()
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
