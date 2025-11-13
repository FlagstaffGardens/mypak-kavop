/**
 * Quick script to check if recommendations table exists
 */
import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';

async function checkTable() {
  try {
    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'recommendations'
      );
    `);

    const exists = (result as any)[0]?.exists ?? false;
    console.log('Recommendations table exists:', exists);

    if (exists) {
      // Check structure
      const columns = await db.execute(sql`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'recommendations'
        ORDER BY ordinal_position;
      `);

      console.log('\nColumns:');
      (columns as any).forEach((row: any) => {
        console.log(`  - ${row.column_name}: ${row.data_type}`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  }

  process.exit(0);
}

checkTable();
