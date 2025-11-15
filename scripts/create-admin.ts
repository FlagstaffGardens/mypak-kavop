import { db } from "../src/lib/db";
import { user } from "../src/lib/db/schema";

async function createAdmin() {
  try {
    const [admin] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        email: "admin@mypak.com",
        name: "Platform Admin",
        emailVerified: true, // Skip email verification for admin
        role: "admin", // Platform admin role (matches Better Auth adminRoles)
        banned: false,
      })
      .returning()
      .onConflictDoNothing();

    if (admin) {
      console.log("✅ Platform admin created successfully!");
      console.log("Email: admin@mypak.com");
      console.log("Note: Sign in using Email OTP (6-digit code)");
    } else {
      console.log("ℹ️  Platform admin already exists");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin:", error);
    process.exit(1);
  }
}

createAdmin();
