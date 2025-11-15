import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🔧 Applying Better Auth migration manually...\n");

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool);

  // Read the migration file
  const migrationPath = path.join(
    process.cwd(),
    "drizzle",
    "0007_even_eddie_brock.sql"
  );
  const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

  try {
    // Execute the migration
    await pool.query(migrationSQL);

    // Record this migration as applied
    await pool.query(
      `INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [7, Date.now()]
    );

    console.log("✅ Migration applied successfully!\n");

    // Verify tables were created
    const tables = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('user', 'session', 'organization', 'member', 'account', 'verification', 'invitation')
      ORDER BY table_name
    `);

    console.log("Better Auth tables created:");
    tables.rows.forEach((row) => console.log(`  - ${row.table_name}`));

    // Check if column was added
    const column = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'organizations'
        AND column_name = 'better_auth_org_id'
    `);

    if (column.rows.length > 0) {
      console.log("\n✅ better_auth_org_id column added to organizations table");
    }

  } catch (error: any) {
    if (error.code === '42P07') {
      console.log("ℹ️  Tables already exist - this is okay, they may have been created already.");
    } else {
      console.error("❌ Migration failed:", error);
      throw error;
    }
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
