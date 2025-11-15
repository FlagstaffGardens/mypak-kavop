-- Custom SQL migration file, put your code below! --

-- Step 1: Drop the legacy users table (CASCADE will remove dependent objects)
DROP TABLE IF EXISTS "users" CASCADE;

-- Step 2: Make better_auth_org_id NOT NULL in organizations table
-- First, ensure all existing rows have a value (if any exist without it, this will fail)
-- Then alter the column to be NOT NULL
ALTER TABLE "organizations" ALTER COLUMN "better_auth_org_id" SET NOT NULL;

-- Step 3: Add admin plugin fields to user table (Better Auth admin plugin)
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "role" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "banned" boolean DEFAULT false NOT NULL;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "banReason" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "banExpires" timestamp;

-- Step 4: Add missing Better Auth account table fields
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "idToken" text;
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "accessTokenExpiresAt" timestamp;
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "refreshTokenExpiresAt" timestamp;
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "scope" text;
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "password" text;
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp DEFAULT now() NOT NULL;

-- Step 5: Add updatedAt to session table
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp DEFAULT now() NOT NULL;

-- Step 6: Add updatedAt to verification table
ALTER TABLE "verification" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp DEFAULT now() NOT NULL;

-- Step 7: Create unique constraint on member table (org + user)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'member_organizationId_userId_unique'
    ) THEN
        ALTER TABLE "member" ADD CONSTRAINT "member_organizationId_userId_unique"
        UNIQUE("organizationId", "userId");
    END IF;
END
$$;

-- Step 8: Create indexes for Better Auth tables
CREATE INDEX IF NOT EXISTS "idx_session_user" ON "session"("userId");
CREATE INDEX IF NOT EXISTS "idx_session_expires_at" ON "session"("expiresAt");
CREATE INDEX IF NOT EXISTS "idx_account_user" ON "account"("userId");
CREATE INDEX IF NOT EXISTS "idx_account_provider" ON "account"("providerId", "accountId");
CREATE INDEX IF NOT EXISTS "idx_verification_identifier" ON "verification"("identifier");
CREATE INDEX IF NOT EXISTS "idx_verification_expires_at" ON "verification"("expiresAt");
CREATE INDEX IF NOT EXISTS "idx_member_org" ON "member"("organizationId");
CREATE INDEX IF NOT EXISTS "idx_member_user" ON "member"("userId");
CREATE INDEX IF NOT EXISTS "idx_invitation_org" ON "invitation"("organizationId");
CREATE INDEX IF NOT EXISTS "idx_invitation_email" ON "invitation"("email");
