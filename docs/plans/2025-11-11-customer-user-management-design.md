# Customer & User Management Design

**Date:** 2025-11-11
**Status:** Approved

## Overview

Add MyPak customer (organization) and user management to the admin panel. Platform admins can create organizations by linking them to MyPak customers via the Kavop API, then bulk-create users with auto-generated passwords.

## Context

- **MyPak** = The privately deployed VMI product (mypak.kavop.com)
- **Kavop** = The backend ERP/VMI platform that MyPak integrates with
- **Kavop API** = External API for fetching customer tokens: `http://www.mypak.cn:8088/api/kavop/customer/token`

Each organization in MyPak corresponds to a customer in the Kavop system. The Kavop token is required for all inventory/order operations.

## Core Flow

1. Admin creates organization via wizard at `/admin/organizations/new`
2. **Step 1:** Enter org details → validate with Kavop API → fetch token
3. **Step 2:** Optionally create users (bulk email entry) → auto-generate passwords → show results
4. **Ongoing:** Manage users from org detail page, view passwords via unhide buttons

## Data Models

### Organization

```typescript
export interface Organization {
  org_id: string;
  org_name: string;                    // Editable by admin anytime
  mypak_customer_name: string;         // Used for Kavop API lookup
  kavop_token: string;                 // Fetched from Kavop API, stored
  created_at: string;
  updated_at: string;
}
```

**Key Rules:**
- `org_name` is editable anytime
- `mypak_customer_name` can only be changed if organization has 0 users
- `kavop_token` is fetched once during creation and stored

### User

```typescript
export interface User {
  user_id: string;
  org_id: string;
  email: string;
  name: string;                        // Auto-generated from email prefix
  password: string;                    // Plain text, 16+ chars strong random
  role: UserRole;                      // "org_user" | "platform_admin"
  created_at: string;
  last_login_at: string | null;
}
```

**Key Rules:**
- Name is auto-generated from email (e.g., `john@acme.com` → `"john"`)
- Passwords are 16+ characters with uppercase, lowercase, numbers, special characters
- Passwords stored in plain text for operational simplicity (admin can view anytime)
- All users in an org share the same data (tied to org's Kavop token)

## Kavop API Integration

### Endpoint

```
GET http://www.mypak.cn:8088/api/kavop/customer/token?customerName={name}
```

### Success Response

```json
{
  "status": 200,
  "message": "OK",
  "success": true,
  "response": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Store `response` value as `kavop_token`.

### Error Response

```json
{
  "status": 400,
  "message": "error",
  "success": false,
  "error": "Invalid customer name",
  "response": null
}
```

Show `error` message to admin inline.

## Page Designs

### Organizations Overview (`/admin/organizations`)

**Layout:** Card grid showing all organizations

**Each card displays:**
- Organization name (large, bold)
- MyPak Customer Name (reference)
- User count
- First 3-5 user emails (truncated if more)
- "View Details" button

**Actions:**
- "Create Organization" button (top right) → Opens wizard

### Create Organization Wizard (`/admin/organizations/new`)

**Step 1: Organization Details**

Form fields:
- **Organization Name** (text, required) - "e.g., Acme Farms"
- **MyPak Customer Name** (text, required) - "e.g., Aginbrook"
  - Helper text: "This name will be used to fetch the Kavop token"

Submit behavior:
1. Validate both fields filled
2. Call Kavop API with customer name
3. **On success:** Store token temporarily, auto-advance to Step 2
4. **On error:** Show error message above form (red alert), keep form populated

**Step 2: Create Users** (Auto-advances from Step 1)

Dynamic form:
- Start with 1 email field
- "+ Add Another Email" button adds more fields
- "× Remove" button on each field (except when only 1 remains)

Buttons:
- **"Skip for Now"** → Save org only, redirect to org detail page
- **"Create Organization & Users"** → Save org + create all users, show password results

### Password Results Page

Shown after creating users in wizard or from org detail page.

**Display:**
- Success message: "X users created successfully for {org_name}"
- Info text: "Copy these passwords and share them with your users. You can view passwords later from the users table."
- Table with columns: Name, Email, Password, [Copy button]
- Individual "Copy" button per password (copies to clipboard, shows toast)
- "Go to Organization" button at bottom

**Table example:**
```
Name    Email                    Password            [Copy]
john    john@acmefarms.com      Kj#9mL2$pQx7vNz!    [Copy]
sarah   sarah@acmefarms.com     Pm!4xK8#nVq2wRt@    [Copy]
```

### Organization Detail Page (`/admin/organizations/{org_id}`)

**Header:**
- Back link to organizations list
- Organization name with "Edit" button
- MyPak Customer Name (read-only reference)
- Created date

**Edit Organization:**
- Click "Edit" → Shows form with:
  - Organization Name (always editable)
  - MyPak Customer Name (editable only if user count = 0)
- If users exist and admin tries to edit MyPak Customer Name:
  - Show error: "Cannot change MyPak Customer Name. This organization has X users. You must delete all users before changing the MyPak Customer Name."

**Users Section:**
- Header: "Users (X)" with "+ Add Users" button
- Table columns: Name, Email, Password (hidden), Last Login, Actions
- Password column shows `•••••••` with eye icon button
  - Click eye → reveals password for 10 seconds (auto-hide after)
  - "Copy" button appears while password is visible
  - Click eye-off icon → hides immediately
- Actions column: "Delete" button per user
  - Shows confirmation modal: "Are you sure you want to delete {email}? This action cannot be undone."

**"+ Add Users" button:**
- Opens same dynamic email form as wizard Step 2
- After creation, shows password results page
- Returns to org detail page

## Technical Implementation Notes

### Password Generation

Use a strong random generator with:
- Length: 16-20 characters
- Character set: uppercase (A-Z), lowercase (a-z), numbers (0-9), special chars (!@#$%^&*)
- Ensure at least one of each character type

Example library: `crypto.randomBytes()` + custom character mapping

### Name Auto-Generation

```typescript
function generateNameFromEmail(email: string): string {
  const prefix = email.split('@')[0];
  return prefix.replace(/[^a-zA-Z0-9]/g, ''); // Remove special chars
}
```

### Password Unhide Timer

```typescript
// Client component state
const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());

function togglePassword(userId: string) {
  setVisiblePasswords(prev => {
    const next = new Set(prev);
    if (next.has(userId)) {
      next.delete(userId);
    } else {
      next.add(userId);
      // Auto-hide after 10 seconds
      setTimeout(() => {
        setVisiblePasswords(current => {
          const updated = new Set(current);
          updated.delete(userId);
          return updated;
        });
      }, 10000);
    }
    return next;
  });
}
```

### API Routes Needed

1. **POST /api/admin/organizations**
   - Body: `{ org_name, mypak_customer_name }`
   - Calls Kavop API to fetch token
   - Creates organization with token
   - Returns org_id

2. **POST /api/admin/organizations/{org_id}/users**
   - Body: `{ emails: string[] }`
   - Generates passwords for each email
   - Auto-generates names from emails
   - Creates all users
   - Returns: `{ users: Array<{ email, password, name }> }`

3. **PUT /api/admin/organizations/{org_id}**
   - Body: `{ org_name?, mypak_customer_name? }`
   - Validates user count = 0 if changing mypak_customer_name
   - Updates organization

4. **DELETE /api/admin/users/{user_id}**
   - Deletes user
   - Returns success

## Security Considerations

**Plain Text Passwords:**
- Trade-off: Operational simplicity vs security
- Accepted risk: Passwords stored in plain text
- Mitigation: Restrict admin panel access to trusted platform admins only
- Future: Consider encrypted storage with admin-level decryption key

**Kavop Token Storage:**
- Store in database (encrypted if DB supports it)
- Never expose in client-side code
- Only use server-side for API calls to Kavop

**Admin Access:**
- Only users with `role: platform_admin` can access `/admin/*` routes
- Implement middleware to check role on all admin routes

## Future Enhancements (Out of Scope)

- Email notifications when users are created
- Password reset functionality for users
- User self-service password change
- Bulk user import via CSV
- Audit log for admin actions
- Two-factor authentication for admin panel
- Encrypted password storage
- User profile editing (name, etc.)
- Organization archiving/soft delete
