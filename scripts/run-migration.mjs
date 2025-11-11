import postgres from 'postgres';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// Read database URL from .env.local
const envContent = readFileSync(join(projectRoot, '.env.local'), 'utf-8');
const dbUrlMatch = envContent.match(/DATABASE_URL="([^"]+)"/);
if (!dbUrlMatch) {
  console.error('DATABASE_URL not found in .env.local');
  process.exit(1);
}

const connectionString = dbUrlMatch[1];
console.log('Connecting to database...');

const sql = postgres(connectionString, { prepare: false });

try {
  // Create organizations table
  console.log('Creating organizations table...');
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS "organizations" (
        "org_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "org_name" text NOT NULL,
        "mypak_customer_name" text NOT NULL,
        "kavop_token" text NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "organizations_mypak_customer_name_unique" UNIQUE("mypak_customer_name")
      )
    `;
    console.log('✓ Organizations table created');
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('⊙ Organizations table already exists');
    } else {
      throw error;
    }
  }

  // Create users table
  console.log('Creating users table...');
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS "users" (
        "user_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "org_id" uuid NOT NULL,
        "email" text NOT NULL,
        "name" text NOT NULL,
        "password" text NOT NULL,
        "role" text DEFAULT 'org_user' NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "last_login_at" timestamp,
        CONSTRAINT "users_email_unique" UNIQUE("email")
      )
    `;
    console.log('✓ Users table created');
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('⊙ Users table already exists');
    } else {
      throw error;
    }
  }

  // Add foreign key constraint
  console.log('Adding foreign key constraint...');
  try {
    await sql`
      ALTER TABLE "users" ADD CONSTRAINT "users_org_id_organizations_org_id_fk"
      FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("org_id")
      ON DELETE cascade ON UPDATE no action
    `;
    console.log('✓ Foreign key constraint added');
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('⊙ Foreign key constraint already exists');
    } else {
      throw error;
    }
  }

  console.log('\n✓ Migration completed successfully!');
} catch (error) {
  console.error('✗ Migration failed:', error.message);
  console.error('Full error:', error);
  process.exit(1);
} finally {
  await sql.end();
}
