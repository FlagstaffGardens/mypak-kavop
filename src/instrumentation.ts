/**
 * Instrumentation file - runs once when the Next.js server starts
 * Perfect place for startup validation and initialization
 */

import { validateEnv } from "./lib/env";

export async function register() {
  // Only run on server, not in Edge runtime
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.log("🚀 Initializing application...");

    try {
      // Validate environment variables at startup
      validateEnv();
    } catch (error) {
      console.error("\n" + (error as Error).message + "\n");
      process.exit(1); // Exit with error code
    }
  }
}
