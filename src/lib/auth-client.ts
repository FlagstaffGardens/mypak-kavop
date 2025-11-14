"use client";

import { createAuthClient } from "better-auth/react";
import { organizationClient, adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : "",
  plugins: [organizationClient(), adminClient()],
});

// Export hooks for easy use
export const {
  useSession,
  signIn,
  signOut,
  useActiveOrganization,
} = authClient;
