#!/usr/bin/env ts-node

import { readFileSync, writeFileSync } from 'fs';

const files = [
  'src/app/api/inventory/list/route.ts',
  'src/app/api/products/route.ts',
  'src/app/api/recommendations/route.ts',
  'src/app/page.tsx',
  'src/app/api/inventory/save/route.ts',
  'src/app/orders/page.tsx',
];

for (const file of files) {
  try {
    let content = readFileSync(file, 'utf-8');

    // Remove the old import line entirely
    content = content.replace(/import { getCurrentUser } from '@\/lib\/auth\/jwt';?\n?/g, '');
    content = content.replace(/import { getCurrentUser } from "@\/lib\/auth\/jwt";?\n?/g, '');

    // Add the Better Auth imports at the top (after other imports)
    if (!content.includes('import { auth }')) {
      // Find the last import statement
      const importLines = content.split('\n');
      let lastImportIndex = -1;
      for (let i = 0; i < importLines.length; i++) {
        if (importLines[i].trim().startsWith('import ')) {
          lastImportIndex = i;
        }
      }

      if (lastImportIndex >= 0) {
        importLines.splice(lastImportIndex + 1, 0, 'import { auth } from "@/lib/auth";');
        importLines.splice(lastImportIndex + 2, 0, 'import { headers } from "next/headers";');
        content = importLines.join('\n');
      }
    }

    writeFileSync(file, content, 'utf-8');
    console.log(`✅ Fixed ${file}`);
  } catch (err) {
    console.error(`❌ Failed to fix ${file}:`, err);
  }
}

console.log('\n✨ All imports fixed!');
