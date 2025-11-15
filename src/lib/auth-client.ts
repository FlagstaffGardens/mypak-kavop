"use client";

import { createAuthClient } from "better-auth/react";
import {
  organizationClient,
  adminClient,
  emailOTPClient,
  // magicLinkClient, // TODO: Enable in future if needed
} from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : "",
  plugins: [
    organizationClient(),
    adminClient(),
    emailOTPClient(),
    // magicLinkClient(), // TODO: Disabled for now, may enable in future
  ],
});

// Export hooks for easy use
export const {
  useSession,
  signIn,
  signOut,
  useActiveOrganization,
} = authClient;
