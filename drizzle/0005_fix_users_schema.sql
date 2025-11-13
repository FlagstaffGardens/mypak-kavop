-- Fix users table schema to match intended structure
-- Issue: Column is named 'id' (text) but should be 'user_id' (uuid)

-- Step 1: Rename id column to user_id
ALTER TABLE "users" RENAME COLUMN "id" TO "user_id";

-- Step 2: Change column type from text to uuid
ALTER TABLE "users" ALTER COLUMN "user_id" TYPE uuid USING "user_id"::uuid;

-- Step 3: Drop duplicate camelCase columns if they exist
ALTER TABLE "users" DROP COLUMN IF EXISTS "createdAt";
ALTER TABLE "users" DROP COLUMN IF EXISTS "updatedAt";

-- Step 4: Ensure updated_at column exists (was missing from original migration)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;
    END IF;
END $$;
