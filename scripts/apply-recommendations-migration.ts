/**
 * Apply recommendations table migration manually
 *
 * This script applies only the 0004 migration (recommendations table)
 * and sets up proper migration tracking for future migrations.
 */

import postgres from 'postgres';
import * as fs from 'fs';
import * as path from 'path';

async function applyMigration() {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const client = postgres(dbUrl);

  try {
    console.log('Starting migration application...\n');

    // Read the recommendations migration SQL
    const migrationSql = fs.readFileSync(
      path.join(__dirname, '../drizzle/0004_lucky_molecule_man.sql'),
      'utf-8'
    );

    console.log('Step 1: Creating recommendations table...');
    await client.unsafe(migrationSql);
    console.log('✅ Recommendations table created successfully\n');

    // Create migrations tracking table
    console.log('Step 2: Creating __drizzle_migrations tracking table...');
    await client`
      CREATE TABLE IF NOT EXISTS __drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      );
    `;
    console.log('✅ Tracking table created\n');

    // Insert records for all previously applied migrations
    console.log('Step 3: Recording migration history...');

    const migrations = [
      { idx: 0, hash: '0000_remarkable_blue_marvel', when: 1762848470445 },
      { idx: 1, hash: '0001_dashing_steel_serpent', when: 1762848500306 },
      { idx: 2, hash: '0002_broken_captain_midlands', when: 1762887747627 },
      { idx: 3, hash: '0003_wandering_rick_jones', when: 1762948508282 },
      { idx: 4, hash: '0004_lucky_molecule_man', when: 1763006539907 },
    ];

    for (const migration of migrations) {
      await client`
        INSERT INTO __drizzle_migrations (hash, created_at)
        VALUES (${migration.hash}, ${migration.when})
        ON CONFLICT DO NOTHING;
      `;
      console.log(`  - Recorded: ${migration.hash}`);
    }

    console.log('\n✅ All migrations recorded successfully\n');

    // Verify final state
    console.log('Step 4: Verifying database state...');
    const tables = await client`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;

    console.log('Tables in database:');
    tables.forEach((t: any) => console.log(`  - ${t.table_name}`));

    const migrationRecords = await client`
      SELECT hash FROM __drizzle_migrations ORDER BY id;
    `;

    console.log('\nRecorded migrations:');
    migrationRecords.forEach((m: any) => console.log(`  - ${m.hash}`));

    console.log('\n🎉 Migration complete! Future migrations will work with `npm run db:migrate`');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

applyMigration().catch((err) => {
  console.error(err);
  process.exit(1);
});
