/**
 * Environment variable validation
 * Validates required environment variables at application startup
 */

const requiredEnvVars = [
  "DATABASE_URL",
  "BETTER_AUTH_SECRET",
  "RESEND_API_KEY", // Required for passwordless auth (Magic Link + Email OTP)
] as const;

export function validateEnv() {
  const missing: string[] = [];

  for (const key of requiredEnvVars) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `❌ Missing required environment variables:\n  ${missing.join("\n  ")}\n\n` +
        `Please ensure these are set in your .env.local file.`
    );
  }

  // Validate DATABASE_URL format
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith("postgresql://")) {
    throw new Error(
      `❌ DATABASE_URL must start with 'postgresql://'\n` +
        `  Current value: ${process.env.DATABASE_URL.substring(0, 20)}...`
    );
  }

  // Validate BETTER_AUTH_SECRET length
  if (process.env.BETTER_AUTH_SECRET && process.env.BETTER_AUTH_SECRET.length < 32) {
    console.warn(
      `⚠️  WARNING: BETTER_AUTH_SECRET should be at least 32 characters long for security.\n` +
        `  Current length: ${process.env.BETTER_AUTH_SECRET.length}`
    );
  }

  console.log("✅ Environment variables validated successfully");
}
