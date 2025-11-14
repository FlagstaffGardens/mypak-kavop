import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import {
  organization as organizationPlugin,
  admin as adminPlugin,
  magicLink as magicLinkPlugin
} from "better-auth/plugins";

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

  plugins: [
    // Magic Link authentication
    magicLinkPlugin({
      sendMagicLink: async ({ email, url, token }) => {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);

        await resend.emails.send({
          from: "MyPak Connect <noreply-mypak@kavop.com>",
          to: email,
          subject: "Sign in to MyPak Connect",
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1a1a1a;">Sign in to MyPak Connect</h2>
              <p style="color: #666; line-height: 1.5;">Click the button below to sign in:</p>
              <a href="${url}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Sign In</a>
              <p style="color: #999; font-size: 14px;">Or copy this link: ${url}</p>
              <p style="color: #999; font-size: 14px;">This link expires in 15 minutes.</p>
            </div>
          `,
        });
      },
      expiresIn: 60 * 15, // 15 minutes
      storeToken: "hashed", // Store tokens hashed for security
    }),

    // Multi-tenancy with organizations
    organizationPlugin({
      async sendInvitationEmail(data: any) {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);

        await resend.emails.send({
          from: "MyPak Connect <noreply-mypak@kavop.com>",
          to: data.email,
          subject: `Join ${data.organization.name} on MyPak Connect`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1a1a1a;">You've been invited!</h2>
              <p style="color: #666; line-height: 1.5;">
                ${data.inviter.user.name} invited you to join <strong>${data.organization.name}</strong> on MyPak Connect.
              </p>
              <a href="${data.invitation.link || '#'}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
                Accept Invitation
              </a>
            </div>
          `,
        });
      },
    }),

    // Admin impersonation
    adminPlugin({
      impersonationSessionDuration: 60 * 60, // 1 hour
      adminRoles: ["admin"], // Only users with role="admin" can impersonate
    }),
  ],

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update every 24 hours
  },
});
