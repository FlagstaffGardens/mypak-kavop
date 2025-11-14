#!/usr/bin/env tsx

/**
 * Script to migrate from old JWT auth to Better Auth
 * Replaces getCurrentUser() with auth.api.getSession() across the codebase
 */

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

const files = [
  'src/app/orders/page.tsx',
  'src/app/api/inventory/save/route.ts',
  'src/app/api/recommendations/route.ts',
  'src/app/api/products/route.ts',
  'src/app/api/inventory/list/route.ts',
  'src/app/page.tsx',
  'src/app/api/admin/organizations/[org_id]/users/route.ts',
  'src/app/api/admin/organizations/route.ts',
  'src/app/api/admin/users/[user_id]/route.ts',
  'src/app/api/user/change-password/route.ts',
  'src/app/api/admin/organizations/validate-customer/route.ts',
  'src/app/admin/organizations/[org_id]/page.tsx',
  'src/app/admin/organizations/new/page.tsx',
  'src/app/admin/organizations/page.tsx',
  'src/app/settings/page.tsx',
];

for (const file of files) {
  try {
    let content = readFileSync(file, 'utf-8');

    // Replace import
    content = content.replace(
      /import { getCurrentUser } from "@\/lib\/auth\/jwt";?/g,
      'import { auth } from "@/lib/auth";\nimport { headers } from "next/headers";'
    );

    // Replace usage for pages (Server Components)
    content = content.replace(
      /const user = await getCurrentUser\(\);/g,
      'const session = await auth.api.getSession({ headers: await headers() });\n  const user = session?.user;'
    );

    // Replace role checks
    content = content.replace(
      /user\.role !== "platform_admin"/g,
      'user?.role !== "admin"'
    );
    content = content.replace(
      /user\.role === "platform_admin"/g,
      'user?.role === "admin"'
    );

    writeFileSync(file, content, 'utf-8');
    console.log(`✅ Updated ${file}`);
  } catch (err) {
    console.error(`❌ Failed to update ${file}:`, err);
  }
}

console.log('\n✨ Migration complete!');
