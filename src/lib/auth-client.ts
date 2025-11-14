"use client";

import { createAuthClient } from "better-auth/react";
import { organizationClient, adminClient, emailOTPClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : "",
  plugins: [
    organizationClient(),
    adminClient(),
    emailOTPClient(), // Add OTP client plugin
  ],
});

// Export hooks for easy use
export const {
  useSession,
  signIn,
  signOut,
  useActiveOrganization,
} = authClient;
