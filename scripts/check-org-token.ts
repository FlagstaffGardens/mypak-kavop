import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function checkOrgToken() {
  console.log("\n=== Checking organization ERP tokens ===\n");

  const orgs = await db.select().from(organizations);

  if (orgs.length === 0) {
    console.log("❌ No organizations found!");
    process.exit(1);
  }

  orgs.forEach((org, i) => {
    console.log(`Organization ${i + 1}:`);
    console.log(`  Name: ${org.org_name}`);
    console.log(`  Better Auth Org ID: ${org.better_auth_org_id}`);
    console.log(`  MyPak Customer Name: ${org.mypak_customer_name}`);
    console.log(`  Kavop Token: ${org.kavop_token ? '✅ SET (' + org.kavop_token.substring(0, 20) + '...)' : '❌ MISSING OR EMPTY'}`);
    console.log(`  Token Length: ${org.kavop_token?.length || 0} chars`);
    console.log();
  });

  process.exit(0);
}

checkOrgToken();
