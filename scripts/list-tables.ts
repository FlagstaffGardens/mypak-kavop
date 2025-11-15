import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

async function listTables() {
  console.log("\n=== All tables in database ===");
  try {
    const result: any = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    const tables = result.rows || result;
    console.log(`Found ${tables.length} tables:`);
    tables.forEach((t: any) => {
      console.log(`  - ${t.table_name}`);
    });
  } catch (error) {
    console.log("Error listing tables:", error);
  }

  process.exit(0);
}

listTables();
