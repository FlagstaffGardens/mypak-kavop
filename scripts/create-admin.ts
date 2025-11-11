import { db } from "../src/lib/db";
import { users } from "../src/lib/db/schema";
import postgres from "postgres";

async function createAdmin() {
  try {
    const [admin] = await db
      .insert(users)
      .values({
        org_id: null,
        email: "admin@mypak.com",
        name: "Platform Admin",
        password: "admin123",
        role: "platform_admin",
      })
      .returning()
      .onConflictDoNothing();

    if (admin) {
      console.log("✅ Platform admin user created successfully!");
      console.log("Email: admin@mypak.com");
      console.log("Password: admin123");
    } else {
      console.log("ℹ️  Platform admin user already exists");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    process.exit(1);
  }
}

createAdmin();
