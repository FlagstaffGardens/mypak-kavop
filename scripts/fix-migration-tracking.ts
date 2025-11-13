/**
 * Update drizzle migration tracking to match current state
 */
import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';

async function fixTracking() {
  try {
    // Check what's tracked
    console.log('Current migration tracking:');
    const current = await db.execute(sql`
      SELECT hash FROM __drizzle_migrations;
    `);

    console.log(`Found ${(current as any).length} tracked migrations`);
    (current as any).forEach((m: any, i: number) => {
      console.log(`  ${i + 1}. ${m.hash}`);
    });

    // Check if 0004 is tracked
    const migration0004Hash = await db.execute(sql`
      SELECT hash FROM __drizzle_migrations
      WHERE hash LIKE '0004_%';
    `);

    if ((migration0004Hash as any).length === 0) {
      console.log('\n⚠ Migration 0004 is NOT tracked. Inserting...');

      await db.execute(sql`
        INSERT INTO __drizzle_migrations (hash, created_at)
        VALUES ('0004_lucky_molecule_man', CURRENT_TIMESTAMP);
      `);

      console.log('✓ Migration 0004 now tracked!');
    } else {
      console.log('\n✓ Migration 0004 is already tracked');
    }

  } catch (error) {
    console.error('Error:', error);
  }

  process.exit(0);
}

fixTracking();
