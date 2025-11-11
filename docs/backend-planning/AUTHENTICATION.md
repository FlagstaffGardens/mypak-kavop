# Authentication System

## Overview

MyPak Connect uses a **custom JWT-based authentication system** with plain-text password storage (per business requirement - admins must view user passwords for support).

### Key Technologies
- **jose** library for JWT signing and verification
- **httpOnly cookies** for secure token storage
- **Next.js middleware** for route protection
- **Drizzle ORM** for database queries

## Database Schema

### Users Table (`users`)
```sql
user_id         UUID PRIMARY KEY
org_id          UUID (nullable)             -- NULL for platform_admin
email           TEXT UNIQUE
name            TEXT
password        TEXT                        -- Plain-text (not hashed)
role            TEXT                        -- 'platform_admin' | 'org_user'
created_at      TIMESTAMP
updated_at      TIMESTAMP
last_login_at   TIMESTAMP (nullable)
```

**Schema Mapping (TypeScript ↔ Database):**
- `user_id` (column) ↔ `id` (Drizzle property)
- `org_id` ↔ `orgId`
- `created_at` ↔ `createdAt`
- `updated_at` ↔ `updatedAt`
- `last_login_at` ↔ `lastLoginAt`

### Removed Tables
The following tables from the previous BetterAuth implementation have been removed:
- ~~`account`~~ (no longer needed with custom JWT)
- ~~`session`~~ (sessions managed via JWT, not database)

## Architecture

### JWT Payload Structure
```typescript
interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  role: "platform_admin" | "org_user";
  orgId: string | null;
  iat: number;    // Issued at (Unix timestamp)
  exp: number;    // Expires at (Unix timestamp)
}
```

### Token Expiration
- **Default**: 7 days
- **"Remember Me"**: 365 days (1 year)
- Configured via environment variable: `BETTER_AUTH_SECRET`

### Cookie Configuration
```typescript
{
  httpOnly: true,                    // Not accessible via JavaScript
  secure: process.env.NODE_ENV === 'production',  // HTTPS only in production
  sameSite: 'lax',                   // CSRF protection
  path: '/',
  maxAge: 7 * 24 * 60 * 60           // 7 days (or 365 days with Remember Me)
}
```

## Authentication Flow

### Sign-In Process
1. User submits email/password at `/sign-in`
2. API endpoint (`/api/auth/sign-in`) validates credentials:
   - Queries `users` table for matching email
   - Compares password (plain-text comparison)
3. If valid:
   - Creates JWT with user data
   - Sets httpOnly cookie with token
   - Returns user object to client
4. User redirected to dashboard (or `/admin` for platform admins)

### Session Verification
1. Every request includes JWT cookie
2. Middleware extracts and verifies JWT
3. Decoded payload provides user identity and role
4. No database query required for session verification

### Sign-Out Process
1. User clicks "Log out"
2. Client calls `/api/auth/sign-out`
3. Server deletes auth cookie
4. User redirected to `/sign-in`

## Route Protection

### Middleware (`src/middleware.ts`)
**Protected Routes:**
- All routes except `/sign-in` require authentication
- `/admin/*` routes require `role === 'platform_admin'`

**Redirect Rules:**
- Unauthenticated users → `/sign-in`
- Platform admins accessing non-admin routes → `/admin`
- Regular users accessing admin routes → `/`

### API Route Protection
All admin API routes verify authentication:
```typescript
const user = await getCurrentUser();
if (!user || user.role !== "platform_admin") {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

## Core Files

### Authentication Library
**`src/lib/auth/jwt.ts`**
Core JWT utilities:
- `signJWT()` - Create JWT token
- `verifyJWT()` - Validate and decode JWT
- `setAuthCookie()` - Set httpOnly cookie
- `getAuthCookie()` - Read cookie value
- `deleteAuthCookie()` - Remove cookie (sign out)
- `getCurrentUser()` - Get current user from cookie

**`src/lib/auth/password.ts`**
Password verification:
- `verifyPassword()` - Plain-text password comparison

### API Endpoints
**`/api/auth/sign-in`** (POST)
- Body: `{ email, password, rememberMe? }`
- Response: `{ user: { id, email, name, role, orgId } }`
- Sets auth cookie

**`/api/auth/sign-out`** (POST)
- No body required
- Deletes auth cookie
- Response: `{ success: true }`

**`/api/auth/me`** (GET)
- Returns current user from JWT
- Response: `{ user: JWTPayload }` or `{ user: null }`

**`/api/user/change-password`** (POST)
- Body: `{ currentPassword, newPassword, confirmPassword }`
- Verifies current password, updates `users.password`

**`/api/admin/users/[user_id]`** (DELETE)
- Admin only
- Deletes user from database

### React Hooks
**`src/hooks/useAuth.ts`**
Client-side authentication hook:
```typescript
const { user, loading, signOut } = useAuth();
```
- Fetches current user on mount
- Provides sign-out function
- Updates state reactively

### UI Components
- `/src/app/sign-in/page.tsx` - Sign-in form
- `/src/app/settings/page.tsx` - Password change form
- `/src/components/shared/Sidebar.tsx` - User dropdown menu
- `/src/app/admin/layout.tsx` - Admin sidebar

### Middleware
**`src/middleware.ts`**
- Runs on every request
- Verifies JWT from cookie
- Enforces role-based access control
- Handles redirects

## Admin Credentials

**Default platform admin:**
```
Email: admin@mypak.com
Password: admin123
```

Created via: `scripts/create-admin.ts`

## Security Considerations

### Plain-Text Password Storage
**Risk:** Database compromise exposes all passwords

**Mitigations:**
- Restrict database access (VPN, firewall rules)
- Use secure connection strings (SSL)
- Monitor database access logs
- Consider audit logging for password views in admin panel

**Business Decision:** Accepted trade-off for admin password viewing requirement (customer support needs)

### JWT Security
**Protections:**
- HttpOnly cookies (prevents XSS attacks)
- Secure flag in production (HTTPS only)
- SameSite=lax (CSRF protection)
- Short expiration times (7 days default)
- Secret key stored in environment variable

**Vulnerabilities:**
- JWT cannot be revoked (until expiration)
- Stolen token grants full access until expiry
- No session revocation mechanism

**Future Enhancement:** Add token revocation list (database) for critical operations

### Password Change Security
- Requires current password verification
- Client-side confirmation matching
- Server-side validation
- Updates stored password immediately

## Migration from BetterAuth

### What Was Removed
1. **BetterAuth package** (36 dependencies)
2. **Database tables:** `account`, `session`
3. **Database columns:** `users.emailVerified`, `users.image`
4. **Files:**
   - `src/lib/auth.ts` (BetterAuth config)
   - `src/lib/auth-client.ts` (BetterAuth React client)
   - `src/app/api/auth/[...all]/route.ts` (BetterAuth API handler)
   - Debug scripts: `check-account.ts`, `check-session-table.ts`, `cleanup-auth-tables.ts`
   - Documentation: `BETTERAUTH_FIX.md`, `migrate-betterauth.ts.bak`

### What Was Added
1. **Custom JWT implementation** (`src/lib/auth/jwt.ts`)
2. **Password utilities** (`src/lib/auth/password.ts`)
3. **Auth API endpoints:**
   - `/api/auth/sign-in`
   - `/api/auth/sign-out`
   - `/api/auth/me`
4. **React hook** (`src/hooks/useAuth.ts`)
5. **Updated middleware** (JWT-based instead of database sessions)

### Benefits of Custom JWT
- **Faster:** No database queries for session verification
- **Simpler:** ~200 lines of code vs 36 packages
- **Full control:** Customize token payload and expiration
- **Cleaner database:** No session/account tables to manage
- **Easier debugging:** Transparent token structure

## Troubleshooting

### "Unauthorized" errors on protected routes
**Check:**
1. Cookie present? (DevTools → Application → Cookies)
2. JWT valid? (Not expired)
3. User role correct for admin routes?
4. Environment variable `BETTER_AUTH_SECRET` set?

### Sign-in returns 401
**Check:**
1. User exists in database?
2. Email/password match exactly?
3. Database connection working?

### Can't access admin panel
**Check:**
1. User role is `platform_admin`?
2. Middleware redirecting correctly?
3. JWT payload contains correct role?

### Password not visible in admin panel
**Check:**
1. `users.password` column exists?
2. Password field populated for user?
3. UsersTable component rendering correctly?

## Future Enhancements

### Recommended Improvements
1. **Token Revocation** - Database table to invalidate JWTs before expiration
2. **Refresh Tokens** - Separate long-lived tokens for session renewal
3. **Password Reset Flow** - Email-based password recovery
4. **2FA/MFA** - Optional two-factor authentication
5. **Audit Logging** - Track who viewed which passwords
6. **Rate Limiting** - Prevent brute-force attacks
7. **Password Policy** - Enforce minimum complexity requirements
8. **Session Management UI** - View and revoke active sessions

### Adding New Roles
1. Update `users` table role column enum
2. Update `JWTPayload` interface
3. Add middleware checks for new role
4. Update UI conditional rendering
5. Add API authorization checks

## Environment Variables

```bash
# Required
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=your-secret-key-here  # Used for JWT signing

# Optional (defaults shown)
NODE_ENV=development  # 'production' enables secure cookies
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Testing

### Manual Testing
```bash
# Sign in
curl -X POST http://localhost:3000/api/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mypak.com","password":"admin123"}' \
  -c cookies.txt

# Get current user
curl http://localhost:3000/api/auth/me -b cookies.txt

# Sign out
curl -X POST http://localhost:3000/api/auth/sign-out -b cookies.txt
```

### Common Test Scenarios
1. ✅ Platform admin can access `/admin/organizations`
2. ✅ Regular user redirected from `/admin/*` to `/`
3. ✅ Unauthenticated user redirected to `/sign-in`
4. ✅ Password change updates database
5. ✅ Sign out clears cookie and session
6. ✅ JWT expires after configured time
7. ✅ "Remember Me" extends JWT to 1 year

## Notes

- **Next.js Version:** 16.0.1 (App Router)
- **JWT Library:** jose (lightweight, modern)
- **Database:** PostgreSQL (remote staging instance)
- **Drizzle ORM:** Latest (check package.json)
- **Migration Date:** 2025-11-11 (removed BetterAuth)
