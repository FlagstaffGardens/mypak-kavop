#!/usr/bin/env tsx

import { readFileSync, writeFileSync } from 'fs';

const apiFiles = [
  'src/app/api/inventory/list/route.ts',
  'src/app/api/products/route.ts',
  'src/app/api/recommendations/route.ts',
  'src/app/api/inventory/save/route.ts',
];

for (const file of apiFiles) {
  try {
    let content = readFileSync(file, 'utf-8');

    // Add import for getCurrentOrgId if not present
    if (!content.includes('getCurrentOrgId')) {
      // Find where auth import is
      content = content.replace(
        /import { auth } from "@\/lib\/auth";/,
        `import { auth } from "@/lib/auth";\nimport { getCurrentOrgId } from "@/lib/utils/get-org";`
      );
    }

    // Replace user.orgId with orgId from getCurrentOrgId()
    // Pattern 1: Check if user has orgId
    content = content.replace(
      /if \(!user \|\| !user\.orgId\) {/g,
      `const orgId = await getCurrentOrgId();\n  if (!user || !orgId) {`
    );

    // Pattern 2: Using user.orgId directly
    content = content.replace(/user\.orgId/g, 'orgId');

    // Pattern 3: Already has orgId declaration, just need to await getCurrentOrgId
    if (content.includes('const orgId = orgId')) {
      content = content.replace(/const orgId = orgId/g, 'const orgId = await getCurrentOrgId()');
    }

    writeFileSync(file, content, 'utf-8');
    console.log(`✅ Fixed ${file}`);
  } catch (err) {
    console.error(`❌ Failed to fix ${file}:`, err);
  }
}

console.log('\n✨ All orgId usages fixed!');
