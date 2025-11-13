/**
 * Check migration state and indexes
 */
import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';

async function checkState() {
  try {
    // Check indexes
    console.log('=== Checking Indexes ===');
    const indexes = await db.execute(sql`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'recommendations'
      AND schemaname = 'public';
    `);

    if ((indexes as any).length > 0) {
      (indexes as any).forEach((idx: any) => {
        console.log(`✓ ${idx.indexname}`);
      });
    } else {
      console.log('⚠ No indexes found');
    }

    // Check drizzle migrations table
    console.log('\n=== Checking Migration Tracking ===');
    const migrations = await db.execute(sql`
      SELECT * FROM __drizzle_migrations
      ORDER BY created_at DESC
      LIMIT 5;
    `);

    console.log('\nRecent migrations:');
    (migrations as any).forEach((m: any) => {
      console.log(`  - ${m.hash.substring(0, 20)}... (${new Date(m.created_at).toISOString()})`);
    });

  } catch (error) {
    console.error('Error:', error);
  }

  process.exit(0);
}

checkState();
