import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "./db/schema";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.session,
      account: schema.account,
    },
    usePlural: false,
  }),
  emailAndPassword: {
    enabled: true,
    // CRITICAL: Custom password handling for plain-text storage
    password: {
      // Hash function: Since we store plain-text, just return the password
      hash: async (password: string) => {
        return password; // Store as plain-text
      },
      // Verify function: Direct comparison
      verify: async ({ password, hash }: { password: string; hash: string }) => {
        return password === hash; // Plain-text comparison
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  // User config removed - using schema defaults
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session.session & {
  user: typeof auth.$Infer.Session.user & {
    role: string;
    org_id: string | null;
  };
};
