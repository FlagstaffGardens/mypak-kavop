# Authentication System

## Overview

MyPak Connect uses **BetterAuth** for authentication with plain-text password storage (per business requirement - admins must view passwords).

## Database Schema

### Users Table (`users`)
```sql
user_id         UUID PRIMARY KEY            -- Database column
org_id          UUID (nullable)             -- NULL for platform_admin
email           TEXT UNIQUE
name            TEXT
password        TEXT                        -- Plain-text (not hashed)
role            TEXT                        -- 'platform_admin' | 'org_user'
created_at      TIMESTAMP
last_login_at   TIMESTAMP
```

**Schema Mapping (TypeScript ↔ Database):**
- `id` ↔ `user_id`
- `orgId` ↔ `org_id`
- `createdAt` ↔ `created_at`
- `lastLoginAt` ↔ `last_login_at`

### Account Table (`account`)
**Purpose:** BetterAuth stores authentication credentials here

```sql
id                          TEXT PRIMARY KEY
accountId                   TEXT                    -- Email for credential provider
providerId                  TEXT                    -- 'credential' for email/password
user_id                     UUID                    -- FK to users.user_id
password                    TEXT                    -- Plain-text (for auth)
accessToken                 TEXT                    -- NULL for credentials
refreshToken                TEXT                    -- NULL for credentials
idToken                     TEXT                    -- NULL for credentials
accessTokenExpiresAt        TIMESTAMP               -- NULL for credentials
refreshTokenExpiresAt       TIMESTAMP               -- NULL for credentials
scope                       TEXT                    -- NULL for credentials
createdAt                   TIMESTAMP
updatedAt                   TIMESTAMP
```

**Schema Mapping:**
- `userId` ↔ `user_id`

### Session Table (`session`)
**Purpose:** BetterAuth manages active sessions here

```sql
id              TEXT PRIMARY KEY
expiresAt       TIMESTAMP
token           TEXT UNIQUE
createdAt       TIMESTAMP
updatedAt       TIMESTAMP
ipAddress       TEXT
userAgent       TEXT
user_id         UUID                        -- FK to users.user_id
```

**Schema Mapping:**
- `userId` ↔ `user_id`

## Why Dual Password Storage?

**Both tables store passwords for different purposes:**

| Table | Purpose | Used By |
|-------|---------|---------|
| `users.password` | Admin viewing (password unhide feature) | Admin panel UI |
| `account.password` | Authentication | BetterAuth sign-in |

**When user changes password:** Update BOTH tables to keep them in sync.

## BetterAuth Configuration

### Custom Password Handling

```typescript
// src/lib/auth.ts
emailAndPassword: {
  enabled: true,
  password: {
    // Hash function: Return plain-text (no hashing)
    hash: async (password: string) => password,

    // Verify function: Direct comparison
    verify: async ({ password, hash }) => password === hash,
  },
}
```

### Session Settings

```typescript
session: {
  expiresIn: 60 * 60 * 24 * 7,    // 7 days
  updateAge: 60 * 60 * 24,         // Refresh after 1 day
}
```

## Critical Schema Mapping Fix

**Problem:** BetterAuth expects specific TypeScript property names, but our database uses snake_case.

**Solution:** Drizzle schema property names match BetterAuth expectations:

```typescript
export const users = pgTable("users", {
  id: uuid("user_id").primaryKey(),           // TS: id, DB: user_id ✅
  orgId: uuid("org_id"),                      // TS: orgId, DB: org_id ✅
  email: text("email"),
  // ...
});

export const account = pgTable("account", {
  userId: uuid("user_id").references(() => users.id),  // TS: userId ✅
  // ...
});
```

**Why this works:**
- TypeScript code uses: `users.id`, `users.orgId`, `account.userId`
- Database has: `user_id`, `org_id`, `user_id`
- Drizzle handles the mapping automatically

## Authentication Flow

### Sign-In
1. User submits email/password at `/sign-in`
2. BetterAuth finds user by email in `users` table
3. BetterAuth looks up credentials in `account` table (where `providerId = 'credential'`)
4. BetterAuth verifies password using custom `verify()` function (plain-text comparison)
5. BetterAuth creates session in `session` table
6. Session cookie set (httpOnly, secure in production)
7. User redirected to dashboard

### Route Protection
Middleware at `src/middleware.ts`:
- All routes require authentication (except `/sign-in`)
- `/admin/*` routes check: `session.user.role === 'platform_admin'`
- Unauthorized users redirected appropriately

### Password Change
1. User goes to `/settings`
2. Submits current + new password
3. API verifies current password (plain-text comparison)
4. API updates `users.password` (for admin viewing)
5. API should also update `account.password` (for future logins)

## Admin Credentials

**Default platform admin:**
```
Email: admin@mypak.com
Password: admin123
```

Created via: `scripts/create-admin.ts`

## Security Considerations

### Plain-Text Passwords
- **Risk:** Database compromise exposes all passwords
- **Mitigation:**
  - Restrict database access to authorized personnel
  - Use VPN/firewall rules
  - Consider audit logging for password views
- **Business Decision:** Accepted trade-off for admin password viewing requirement

### Session Security
BetterAuth provides:
- HttpOnly cookies (not accessible via JavaScript)
- Secure flag in production (HTTPS only)
- CSRF protection
- Session expiration (7 days)
- Session refresh (1 day update age)

## Migration History

### Initial Setup (2025-11-11)
1. Installed BetterAuth + Drizzle adapter
2. Created `account` and `session` tables
3. Migrated passwords from `users` to `account` table
4. Fixed schema field mapping (`user_id` → `id`, `org_id` → `orgId`)
5. Configured custom plain-text password handlers

**Migration script:** `scripts/create-admin.ts` (creates platform admin + populates account table)

## Files Reference

### Core Auth Files
- `/src/lib/auth.ts` - BetterAuth server config
- `/src/lib/auth-client.ts` - Client-side auth hooks
- `/src/middleware.ts` - Route protection
- `/src/app/api/auth/[...all]/route.ts` - BetterAuth API handler

### Auth UI
- `/src/app/sign-in/page.tsx` - Sign-in form
- `/src/app/settings/page.tsx` - User settings (password change)
- `/src/components/shared/Sidebar.tsx` - Shows auth state, sign-out

### Auth APIs
- `/src/app/api/user/change-password/route.ts` - Password change endpoint

### Database
- `/src/lib/db/schema.ts` - Drizzle schema (users, account, session tables)
- `/src/lib/db/index.ts` - Database client

## Troubleshooting

### "userId does not exist in schema" Error
**Cause:** Schema property name doesn't match BetterAuth expectation
**Fix:** Ensure Drizzle schema uses correct TypeScript property names:
- Users: `id`, `orgId`, `createdAt`
- Account: `userId`
- Session: `userId`

### Sign-in fails with 500 error
**Check:**
1. Account table populated? (Run migration script)
2. Password exists in account table?
3. Schema field mappings correct?
4. Database connection working?

### Can't view password in admin panel
**Check:**
1. `users.password` field still exists?
2. UsersTable component not modified?
3. Password exists for that user?

## Future Enhancements

### Potential Improvements
1. **Password reset flow** (email-based)
2. **2FA/MFA** (optional for high-security accounts)
3. **Audit logging** (track who viewed which passwords)
4. **Encrypted storage** (reversible encryption instead of plain-text)
5. **Session management UI** (view/revoke active sessions)
6. **Role permissions** (granular permissions beyond admin/user)

### Adding New Roles
1. Update `users` table role column (add new role)
2. Update middleware role checks
3. Add UI conditional rendering based on role
4. Update API auth checks

## Notes

- **BetterAuth Version:** Uses Drizzle adapter with Postgres
- **Next.js Version:** 16.0.1 (App Router)
- **Drizzle Version:** Latest (check package.json)
- **Database:** PostgreSQL (remote staging instance)
