import "dotenv/config";
import { Pool } from "pg";

async function main() {
  console.log("🔧 Applying Better Auth schema fixes...\n");

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Add updatedAt to session
    console.log("Adding updatedAt to session table...");
    await pool.query(`
      ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp DEFAULT now() NOT NULL;
    `);

    // Add missing fields to account
    console.log("Adding missing fields to account table...");
    await pool.query(`
      ALTER TABLE "account"
        ADD COLUMN IF NOT EXISTS "idToken" text,
        ADD COLUMN IF NOT EXISTS "accessTokenExpiresAt" timestamp,
        ADD COLUMN IF NOT EXISTS "refreshTokenExpiresAt" timestamp,
        ADD COLUMN IF NOT EXISTS "scope" text,
        ADD COLUMN IF NOT EXISTS "password" text,
        ADD COLUMN IF NOT EXISTS "updatedAt" timestamp DEFAULT now() NOT NULL;
    `);

    // Add updatedAt to verification
    console.log("Adding updatedAt to verification table...");
    await pool.query(`
      ALTER TABLE "verification" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp DEFAULT now() NOT NULL;
    `);

    // Add unique constraint to member table
    console.log("Adding unique constraint to member table...");
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'member_organizationId_userId_unique'
        ) THEN
          ALTER TABLE "member" ADD CONSTRAINT "member_organizationId_userId_unique" UNIQUE ("organizationId", "userId");
        END IF;
      END $$;
    `);

    // Add index on member.organizationId
    console.log("Adding index on member.organizationId...");
    await pool.query(`
      CREATE INDEX IF NOT EXISTS "idx_member_org" ON "member" ("organizationId");
    `);

    console.log("\n✅ All schema fixes applied successfully!\n");

    // Verify changes
    const sessionCols = await pool.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'session' AND column_name = 'updatedAt'
    `);

    const accountCols = await pool.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'account' AND column_name IN ('updatedAt', 'idToken', 'accessTokenExpiresAt', 'refreshTokenExpiresAt', 'scope', 'password')
      ORDER BY column_name
    `);

    const verificationCols = await pool.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'verification' AND column_name = 'updatedAt'
    `);

    const memberConstraint = await pool.query(`
      SELECT conname FROM pg_constraint
      WHERE conname = 'member_organizationId_userId_unique'
    `);

    console.log("Verification:");
    console.log(`  ✓ session.updatedAt: ${sessionCols.rows.length > 0 ? 'EXISTS' : 'MISSING'}`);
    console.log(`  ✓ account fields: ${accountCols.rows.length} of 6 added`);
    accountCols.rows.forEach(row => console.log(`    - ${row.column_name}`));
    console.log(`  ✓ verification.updatedAt: ${verificationCols.rows.length > 0 ? 'EXISTS' : 'MISSING'}`);
    console.log(`  ✓ member unique constraint: ${memberConstraint.rows.length > 0 ? 'EXISTS' : 'MISSING'}`);

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
