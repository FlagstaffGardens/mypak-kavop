import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import {
  organization as organizationPlugin,
  admin as adminPlugin
} from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { member } from "@/lib/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    camelCase: true, // Match our camelCase schema
  }),

  // Base URL for generating magic links and verification URLs
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",

  // Disable password auth - passwordless only
  emailAndPassword: {
    enabled: false,
  },

  // Email config with Resend (we'll add plugins next)
  plugins: [],

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update every 24 hours
  },
});
