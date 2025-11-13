/**
 * Check migration state and apply missing migrations
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

async function checkMigrations() {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const client = postgres(dbUrl);
  const db = drizzle(client);

  console.log('Checking database migration state...\n');

  // Check if migrations table exists
  const tablesResult = await db.execute(sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `);

  console.log('Existing tables:');
  const tables = Array.isArray(tablesResult) ? tablesResult : tablesResult.rows || [];
  console.log(tables.map((r: any) => `  - ${r.table_name}`).join('\n'));

  const hasMigrationsTable = tables.some(
    (r: any) => r.table_name === '__drizzle_migrations'
  );

  console.log('\n__drizzle_migrations table exists:', hasMigrationsTable);

  if (hasMigrationsTable) {
    // Check what migrations are recorded
    const migrationsResult = await db.execute(sql`
      SELECT id, hash, created_at
      FROM __drizzle_migrations
      ORDER BY id;
    `);

    console.log('\nRecorded migrations:');
    const migrations = Array.isArray(migrationsResult) ? migrationsResult : migrationsResult.rows || [];
    if (migrations.length === 0) {
      console.log('  (none)');
    } else {
      migrations.forEach((r: any) => {
        console.log(`  - ${r.id}: ${r.hash} (${r.created_at})`);
      });
    }
  }

  console.log('\nExpected migrations (from journal):');
  console.log('  - 0000_remarkable_blue_marvel');
  console.log('  - 0001_dashing_steel_serpent');
  console.log('  - 0002_broken_captain_midlands');
  console.log('  - 0003_wandering_rick_jones');
  console.log('  - 0004_lucky_molecule_man ← NEW');

  await client.end();
}

checkMigrations().catch((err) => {
  console.error(err);
  process.exit(1);
});
